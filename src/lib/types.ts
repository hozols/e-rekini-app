export interface ExtractedInvoice {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  // Seller
  sellerName: string;
  sellerVatNumber: string;
  sellerRegNumber: string;
  sellerAddress: string;
  sellerCity: string;
  sellerPostalCode: string;
  sellerCountryCode: string;
  // Buyer
  buyerName: string;
  buyerVatNumber: string;
  buyerRegNumber: string;
  buyerAddress: string;
  buyerCity: string;
  buyerPostalCode: string;
  buyerCountryCode: string;
  // Amounts
  totalNet: number;
  totalTax: number;
  totalGross: number;
  // Payment
  paymentMethod: string;
  bankAccount: string;
  // Line items
  lineItems: InvoiceLineItem[];
  // Tax breakdown
  taxBreakdown: TaxBreakdownItem[];
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitCode: string;
  unitPrice: number;
  lineTotal: number;
  vatRate: number;
  vatCategoryCode: string;
}

export interface TaxBreakdownItem {
  taxableAmount: number;
  taxAmount: number;
  vatRate: number;
  vatCategoryCode: string;
}

export interface ConvertResponse {
  success: boolean;
  xml: string;
  extractedData: ExtractedInvoice;
  confidenceScore: number;
  remaining: number;
  error?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
}
