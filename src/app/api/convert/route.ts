import { NextRequest, NextResponse } from "next/server";
import { extractInvoiceData } from "@/lib/mindee";
import { mapToPeppol } from "@/lib/peppol-mapper";
import { generatePeppolXml } from "@/lib/xml-generator";
import { checkRateLimit, incrementRateLimit } from "@/lib/rate-limiter";
import { ConvertResponse } from "@/lib/types";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  // Get client IP
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "127.0.0.1";

  // Check rate limit
  const rateResult = await checkRateLimit(ip);
  if (!rateResult.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: "Dienas limits sasniegts (3 konvertācijas dienā). Mēģiniet rīt!",
        remaining: 0,
        xml: "",
        extractedData: null,
        confidenceScore: 0,
      } as unknown as ConvertResponse,
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "Nav augšupielādēts fails",
          remaining: rateResult.remaining,
          xml: "",
          extractedData: null,
          confidenceScore: 0,
        } as unknown as ConvertResponse,
        { status: 400 }
      );
    }

    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Neatbalstīts formāts. Atbalstīti: PDF, PNG, JPG, WEBP, GIF",
          remaining: rateResult.remaining,
          xml: "",
          extractedData: null,
          confidenceScore: 0,
        } as unknown as ConvertResponse,
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract data with Anthropic Claude vision
    const { extractedData, confidenceScore } = await extractInvoiceData(
      buffer,
      file.type
    );

    // Map to Peppol fields
    const peppolData = mapToPeppol(extractedData);

    // Generate XML
    const xml = generatePeppolXml(peppolData);

    // Increment rate limit after successful conversion
    const remaining = await incrementRateLimit(ip);

    const response: ConvertResponse = {
      success: true,
      xml,
      extractedData: peppolData,
      confidenceScore,
      remaining,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Conversion error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Kļūda apstrādājot rēķinu. Pārbaudiet, vai PDF ir derīgs rēķins.",
        remaining: rateResult.remaining,
        xml: "",
        extractedData: null,
        confidenceScore: 0,
      } as unknown as ConvertResponse,
      { status: 500 }
    );
  }
}
