import { ExtractedInvoice, InvoiceLineItem, TaxBreakdownItem } from "./types";

const MINDEE_BASE = "https://api-v2.mindee.net";
const ENQUEUE_URL = `${MINDEE_BASE}/v2/products/extraction/enqueue`;
const POLL_INTERVAL = 2000;
const MAX_POLL_TIME = 25000;

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

interface MindeeExtractionResult {
  extractedData: ExtractedInvoice;
  confidenceScore: number;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function extractInvoiceData(
  pdfBuffer: Buffer
): Promise<MindeeExtractionResult> {
  const apiKey = process.env.MINDEE_API_KEY!;
  const modelId = process.env.MINDEE_MODEL_ID!;

  // Step 1: Enqueue
  const formData = new FormData();
  const uint8 = new Uint8Array(pdfBuffer);
  const blob = new Blob([uint8], { type: "application/pdf" });
  formData.append("file", blob, "invoice.pdf");
  formData.append("model_id", modelId);

  const enqueueRes = await fetch(ENQUEUE_URL, {
    method: "POST",
    headers: { Authorization: apiKey },
    body: formData,
  });

  if (!enqueueRes.ok) {
    const errBody = await enqueueRes.text();
    console.error("Mindee enqueue error:", enqueueRes.status, errBody);
    throw new Error(`Mindee API kļūda (${enqueueRes.status}): ${enqueueRes.statusText}`);
  }

  const enqueueJson = await enqueueRes.json();
  const pollingUrl = enqueueJson.job?.polling_url;
  if (!pollingUrl) {
    throw new Error("Mindee neatgrieza polling URL");
  }

  console.log("Mindee job enqueued:", enqueueJson.job?.id);

  // Step 2: Poll until Processed
  let resultUrl: string | null = null;
  let inlineResult: any = null;
  const startTime = Date.now();

  while (Date.now() - startTime < MAX_POLL_TIME) {
    await sleep(POLL_INTERVAL);

    const pollRes = await fetch(pollingUrl, {
      headers: { Authorization: apiKey },
    });

    if (!pollRes.ok) {
      // Job might have been cleaned up after completion — try fetching results directly
      if (pollRes.status === 404) {
        console.log("Mindee job 404 — trying results URL directly");
        const jobId = enqueueJson.job?.id;
        resultUrl = `${MINDEE_BASE}/v2/products/extraction/results/${jobId}`;
        break;
      }
      const errBody = await pollRes.text();
      console.error("Mindee poll error:", pollRes.status, errBody);
      if (pollRes.status >= 500) continue;
      throw new Error(`Mindee polling kļūda (${pollRes.status})`);
    }

    const pollJson = await pollRes.json();
    const status = pollJson.job?.status;
    console.log("Mindee poll status:", status, JSON.stringify(pollJson).substring(0, 200));

    if (status === "Processed") {
      resultUrl = pollJson.job?.result_url;
      break;
    }

    // If inference data is already included in the poll response
    if (pollJson.inference?.result) {
      inlineResult = pollJson;
      break;
    }

    if (status === "Failed") {
      const error = pollJson.job?.error;
      throw new Error(`Mindee apstrāde neizdevās: ${error || "nezināma kļūda"}`);
    }

    // If status is undefined/missing, the job might have transitioned — check for result_url
    if (!status && pollJson.job?.result_url) {
      resultUrl = pollJson.job.result_url;
      break;
    }
  }

  // Step 3: Fetch results
  if (inlineResult) {
    return parseV2Response(inlineResult);
  }

  if (!resultUrl) {
    throw new Error("Dokumenta apstrāde aizņem pārāk ilgu laiku. Mēģiniet vēlreiz.");
  }

  console.log("Fetching results from:", resultUrl);
  const resultRes = await fetch(resultUrl, {
    headers: { Authorization: apiKey },
  });

  if (!resultRes.ok) {
    const errBody = await resultRes.text();
    console.error("Mindee results error:", resultRes.status, errBody);
    throw new Error(`Mindee rezultātu kļūda (${resultRes.status})`);
  }

  const resultJson = await resultRes.json();
  return parseV2Response(resultJson);
}

function parseV2Response(json: any): MindeeExtractionResult {
  const fields = json.inference?.result?.fields || {};

  // Helper to get simple field value
  const fv = (name: string): string => {
    const f = fields[name];
    if (!f) return "";
    if (f.value !== undefined && f.value !== null) return String(f.value);
    return "";
  };

  const fn = (name: string): number => {
    const f = fields[name];
    if (!f) return 0;
    if (f.value !== undefined && f.value !== null) return Number(f.value) || 0;
    return 0;
  };

  // V2 addresses are nested: fields.supplier_address.fields.{city, postal_code, ...}
  const getAddress = (name: string) => {
    const addr = fields[name]?.fields || {};
    return {
      street: addr.street_name?.value || addr.address?.value || "",
      city: addr.city?.value || "",
      postalCode: addr.postal_code?.value || "",
      countryCode: addr.country?.value || "LV",
    };
  };

  const supplierAddr = getAddress("supplier_address");
  const customerAddr = getAddress("customer_address");

  // Company registrations are in items arrays
  const supplierRegs: any[] = fields.supplier_company_registration?.items || [];
  const customerRegs: any[] = fields.customer_company_registration?.items || [];

  const findRegValue = (regs: any[], type: string): string => {
    for (const r of regs) {
      const rf = r.fields || r;
      if (rf.type?.value === type || rf.register_type?.value === type) {
        return rf.value?.value || rf.registration_number?.value || "";
      }
    }
    return "";
  };

  const findAnyRegValue = (regs: any[]): string => {
    if (regs.length === 0) return "";
    const r = regs[0];
    const rf = r.fields || r;
    return rf.value?.value || rf.registration_number?.value || "";
  };

  const supplierVat = findRegValue(supplierRegs, "VAT NUMBER") ||
    findRegValue(supplierRegs, "TAX ID") || findAnyRegValue(supplierRegs);
  const customerVat = findRegValue(customerRegs, "VAT NUMBER") ||
    findRegValue(customerRegs, "TAX ID") || findAnyRegValue(customerRegs);

  // Line items: items[].fields.{description, quantity, unit_price, total_price, tax_rate}
  const rawItems: any[] = fields.line_items?.items || [];
  const lineItems: InvoiceLineItem[] = rawItems.map((item: any, index: number) => {
    const f = item.fields || item;
    const vatRate = f.tax_rate?.value ?? 21;
    return {
      id: String(index + 1),
      description: f.description?.value ?? `Pozīcija ${index + 1}`,
      quantity: f.quantity?.value ?? 1,
      unitCode: f.unit_measure?.value || "C62",
      unitPrice: f.unit_price?.value ?? 0,
      lineTotal: f.total_price?.value ?? f.total_amount?.value ?? 0,
      vatRate,
      vatCategoryCode: getVatCategoryCode(vatRate),
    };
  });

  // Tax breakdown
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

  // Currency from locale
  const currency = fields.locale?.fields?.currency?.value || "EUR";

  // Payment details
  const paymentItems: any[] = fields.supplier_payment_details?.items || [];
  const iban = paymentItems.length > 0
    ? (paymentItems[0].fields?.iban?.value || paymentItems[0].fields?.account_number?.value || "")
    : "";

  // Confidence: v2 returns null for most confidence, default to 50
  const avgConfidence = 50;

  const extractedData: ExtractedInvoice = {
    invoiceNumber: fv("invoice_number"),
    issueDate: fv("date") || new Date().toISOString().split("T")[0],
    dueDate: fv("due_date"),
    currency,
    sellerName: fv("supplier_name"),
    sellerVatNumber: normalizeVatNumber(supplierVat),
    sellerRegNumber: supplierVat ? "" : findAnyRegValue(supplierRegs),
    sellerAddress: supplierAddr.street,
    sellerCity: supplierAddr.city,
    sellerPostalCode: supplierAddr.postalCode,
    sellerCountryCode: supplierAddr.countryCode || "LV",
    buyerName: fv("customer_name"),
    buyerVatNumber: normalizeVatNumber(customerVat),
    buyerRegNumber: customerVat ? "" : findAnyRegValue(customerRegs),
    buyerAddress: customerAddr.street,
    buyerCity: customerAddr.city,
    buyerPostalCode: customerAddr.postalCode,
    buyerCountryCode: customerAddr.countryCode || "LV",
    totalNet: fn("total_net"),
    totalTax: fn("total_tax"),
    totalGross: fn("total_amount"),
    paymentMethod: "30",
    bankAccount: iban,
    lineItems,
    taxBreakdown,
  };

  return { extractedData, confidenceScore: avgConfidence };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
