import { ExtractedInvoice } from "./types";

/**
 * Validates and normalizes extracted invoice data for Peppol BIS 3.0 compliance.
 * Ensures all required fields are present and properly formatted.
 */
export function mapToPeppol(data: ExtractedInvoice): ExtractedInvoice {
  return {
    ...data,
    // Ensure EUR default
    currency: data.currency || "EUR",
    // Normalize VAT numbers for Latvia
    sellerVatNumber: normalizeLatvianVat(data.sellerVatNumber),
    buyerVatNumber: normalizeLatvianVat(data.buyerVatNumber),
    // Default country to LV
    sellerCountryCode: data.sellerCountryCode || "LV",
    buyerCountryCode: data.buyerCountryCode || "LV",
    // Ensure payment method code
    paymentMethod: data.paymentMethod || "30",
    // Normalize line items
    lineItems: data.lineItems.map((item, index) => ({
      ...item,
      id: item.id || String(index + 1),
      unitCode: item.unitCode || "C62",
      vatCategoryCode: item.vatCategoryCode || resolveVatCategory(item.vatRate),
      quantity: item.quantity || 1,
    })),
    // Recalculate tax breakdown if needed
    taxBreakdown:
      data.taxBreakdown.length > 0
        ? data.taxBreakdown
        : calculateTaxBreakdown(data),
    // Ensure totals
    totalNet: data.totalNet || sumLineItems(data),
    totalTax:
      data.totalTax || calculateTotalTax(data),
    totalGross:
      data.totalGross ||
      (data.totalNet || sumLineItems(data)) +
        (data.totalTax || calculateTotalTax(data)),
  };
}

function normalizeLatvianVat(vat: string): string {
  if (!vat) return "";
  const cleaned = vat.replace(/[^A-Za-z0-9]/g, "");
  if (/^LV\d{11}$/i.test(cleaned)) return cleaned.toUpperCase();
  if (/^\d{11}$/.test(cleaned)) return `LV${cleaned}`;
  return cleaned.toUpperCase();
}

function resolveVatCategory(rate: number): string {
  if (rate === 21) return "S";
  if (rate === 12 || rate === 5) return "AA";
  if (rate === 0) return "Z";
  return "S";
}

function sumLineItems(data: ExtractedInvoice): number {
  return round2(data.lineItems.reduce((sum, item) => sum + item.lineTotal, 0));
}

function calculateTotalTax(data: ExtractedInvoice): number {
  return round2(
    data.lineItems.reduce(
      (sum, item) => sum + item.lineTotal * (item.vatRate / 100),
      0
    )
  );
}

function calculateTaxBreakdown(data: ExtractedInvoice) {
  const map = new Map<
    number,
    { taxableAmount: number; taxAmount: number; vatRate: number; vatCategoryCode: string }
  >();

  for (const item of data.lineItems) {
    const existing = map.get(item.vatRate);
    if (existing) {
      existing.taxableAmount += item.lineTotal;
      existing.taxAmount += item.lineTotal * (item.vatRate / 100);
    } else {
      map.set(item.vatRate, {
        taxableAmount: item.lineTotal,
        taxAmount: item.lineTotal * (item.vatRate / 100),
        vatRate: item.vatRate,
        vatCategoryCode: resolveVatCategory(item.vatRate),
      });
    }
  }

  return Array.from(map.values()).map((t) => ({
    ...t,
    taxableAmount: round2(t.taxableAmount),
    taxAmount: round2(t.taxAmount),
  }));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
