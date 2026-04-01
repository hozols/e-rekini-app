import Anthropic from "@anthropic-ai/sdk";
import { ExtractedInvoice, InvoiceLineItem, TaxBreakdownItem } from "./types";

const SUPPORTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

type ImageMediaType = (typeof SUPPORTED_IMAGE_TYPES)[number];

interface MindeeExtractionResult {
  extractedData: ExtractedInvoice;
  confidenceScore: number;
}

function getVatCategoryCode(rate: number): string {
  if (rate === 21) return "S";
  if (rate === 12 || rate === 5) return "AA";
  if (rate === 0) return "Z";
  return "S";
}

function normalizeVatNumber(raw: string): string {
  if (!raw) return "";
  const cleaned = raw.replace(/[^A-Za-z0-9]/g, "");
  if (/^LV\d{11}$/.test(cleaned)) return cleaned;
  if (/^\d{11}$/.test(cleaned)) return `LV${cleaned}`;
  return cleaned;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const EXTRACTION_PROMPT = `You are an invoice data extraction system. Extract all structured data from this invoice document.

Return a JSON object with exactly this structure (no markdown, no code fences, just raw JSON):

{
  "invoiceNumber": "string",
  "issueDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD or empty string",
  "currency": "EUR or other ISO 4217 code",
  "sellerName": "string",
  "sellerVatNumber": "string (e.g. LV12345678901)",
  "sellerRegNumber": "string (company registration number, if separate from VAT)",
  "sellerAddress": "street address",
  "sellerCity": "string",
  "sellerPostalCode": "string",
  "sellerCountryCode": "two-letter ISO code, default LV",
  "buyerName": "string",
  "buyerVatNumber": "string",
  "buyerRegNumber": "string",
  "buyerAddress": "street address",
  "buyerCity": "string",
  "buyerPostalCode": "string",
  "buyerCountryCode": "two-letter ISO code, default LV",
  "totalNet": 0.00,
  "totalTax": 0.00,
  "totalGross": 0.00,
  "bankAccount": "IBAN string or empty",
  "lineItems": [
    {
      "description": "string",
      "quantity": 1,
      "unitCode": "C62 for pieces, HUR for hours, KGM for kg, MTR for meters, LTR for liters",
      "unitPrice": 0.00,
      "lineTotal": 0.00,
      "vatRate": 21
    }
  ]
}

Rules:
- Extract ALL line items from the invoice
- Dates must be in YYYY-MM-DD format
- VAT numbers for Latvia should be prefixed with "LV" if not already
- If a field is not found, use an empty string for text or 0 for numbers
- For vatRate, use the numeric percentage (e.g. 21 for 21%)
- unitCode should follow UN/CECE Recommendation 20 codes
- Return ONLY valid JSON, no explanation or markdown`;

export async function extractInvoiceData(
  fileBuffer: Buffer,
  mimeType: string
): Promise<MindeeExtractionResult> {
  const client = new Anthropic();
  const base64Data = fileBuffer.toString("base64");

  const isPdf = mimeType === "application/pdf";
  const isImage = (SUPPORTED_IMAGE_TYPES as readonly string[]).includes(mimeType);

  if (!isPdf && !isImage) {
    throw new Error("Neatbalstīts faila formāts. Atbalstīti: PDF, PNG, JPG, WEBP, GIF");
  }

  const content: Anthropic.MessageCreateParams["messages"][0]["content"] = isPdf
    ? [
        {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: base64Data },
        },
        { type: "text", text: EXTRACTION_PROMPT },
      ]
    : [
        {
          type: "image",
          source: { type: "base64", media_type: mimeType as ImageMediaType, data: base64Data },
        },
        { type: "text", text: EXTRACTION_PROMPT },
      ];

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Neizdevās iegūt atbildi no AI modeļa");
  }

  let raw: string = textBlock.text.trim();
  // Strip markdown code fences if present
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error("Failed to parse AI response:", raw.substring(0, 500));
    throw new Error("Neizdevās apstrādāt AI modeļa atbildi");
  }

  // Build line items
  const lineItems: InvoiceLineItem[] = (parsed.lineItems || []).map(
    (item: any, index: number) => {
      const vatRate = item.vatRate ?? 21;
      return {
        id: String(index + 1),
        description: item.description || `Pozīcija ${index + 1}`,
        quantity: item.quantity ?? 1,
        unitCode: item.unitCode || "C62",
        unitPrice: item.unitPrice ?? 0,
        lineTotal: item.lineTotal ?? 0,
        vatRate,
        vatCategoryCode: getVatCategoryCode(vatRate),
      };
    }
  );

  // Build tax breakdown from line items
  const taxMap = new Map<number, TaxBreakdownItem>();
  for (const item of lineItems) {
    const existing = taxMap.get(item.vatRate);
    if (existing) {
      existing.taxableAmount += item.lineTotal;
      existing.taxAmount += item.lineTotal * (item.vatRate / 100);
    } else {
      taxMap.set(item.vatRate, {
        taxableAmount: item.lineTotal,
        taxAmount: item.lineTotal * (item.vatRate / 100),
        vatRate: item.vatRate,
        vatCategoryCode: item.vatCategoryCode,
      });
    }
  }
  const taxBreakdown = Array.from(taxMap.values()).map((t) => ({
    ...t,
    taxableAmount: round2(t.taxableAmount),
    taxAmount: round2(t.taxAmount),
  }));

  const extractedData: ExtractedInvoice = {
    invoiceNumber: parsed.invoiceNumber || "",
    issueDate: parsed.issueDate || new Date().toISOString().split("T")[0],
    dueDate: parsed.dueDate || "",
    currency: parsed.currency || "EUR",
    sellerName: parsed.sellerName || "",
    sellerVatNumber: normalizeVatNumber(parsed.sellerVatNumber || ""),
    sellerRegNumber: parsed.sellerRegNumber || "",
    sellerAddress: parsed.sellerAddress || "",
    sellerCity: parsed.sellerCity || "",
    sellerPostalCode: parsed.sellerPostalCode || "",
    sellerCountryCode: parsed.sellerCountryCode || "LV",
    buyerName: parsed.buyerName || "",
    buyerVatNumber: normalizeVatNumber(parsed.buyerVatNumber || ""),
    buyerRegNumber: parsed.buyerRegNumber || "",
    buyerAddress: parsed.buyerAddress || "",
    buyerCity: parsed.buyerCity || "",
    buyerPostalCode: parsed.buyerPostalCode || "",
    buyerCountryCode: parsed.buyerCountryCode || "LV",
    totalNet: parsed.totalNet || 0,
    totalTax: parsed.totalTax || 0,
    totalGross: parsed.totalGross || 0,
    paymentMethod: "30",
    bankAccount: parsed.bankAccount || "",
    lineItems,
    taxBreakdown,
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */

  // Confidence based on how many key fields were extracted
  const keyFields = [
    extractedData.invoiceNumber,
    extractedData.sellerName,
    extractedData.buyerName,
    extractedData.totalGross,
  ];
  const filledCount = keyFields.filter((f) => f && f !== "" && f !== 0).length;
  const confidenceScore = Math.round((filledCount / keyFields.length) * 100);

  return { extractedData, confidenceScore };
}
