import { XMLBuilder, type XmlBuilderOptions } from "fast-xml-parser";
import { ExtractedInvoice } from "./types";

const CUSTOMIZATION_ID =
  "urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0";
const PROFILE_ID =
  "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0";
const PEPPOL_SCHEME_ID = "9934"; // Latvia

export function generatePeppolXml(data: ExtractedInvoice): string {
  const currency = data.currency || "EUR";

  const invoiceObj = {
    "?xml": { "@_version": "1.0", "@_encoding": "UTF-8" },
    Invoice: {
      "@_xmlns":
        "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
      "@_xmlns:cac":
        "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
      "@_xmlns:cbc":
        "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",

      "cbc:CustomizationID": CUSTOMIZATION_ID,
      "cbc:ProfileID": PROFILE_ID,
      "cbc:ID": data.invoiceNumber || "N/A",
      "cbc:IssueDate": data.issueDate,
      ...(data.dueDate ? { "cbc:DueDate": data.dueDate } : {}),
      "cbc:InvoiceTypeCode": 380,
      "cbc:DocumentCurrencyCode": currency,

      // Supplier
      "cac:AccountingSupplierParty": {
        "cac:Party": {
          "cbc:EndpointID": {
            "#text": data.sellerVatNumber || data.sellerRegNumber,
            "@_schemeID": PEPPOL_SCHEME_ID,
          },
          "cac:PartyName": {
            "cbc:Name": data.sellerName,
          },
          "cac:PostalAddress": {
            "cbc:StreetName": data.sellerAddress || "",
            "cbc:CityName": data.sellerCity || "",
            "cbc:PostalZone": data.sellerPostalCode || "",
            "cac:Country": {
              "cbc:IdentificationCode": data.sellerCountryCode || "LV",
            },
          },
          "cac:PartyTaxScheme": {
            "cbc:CompanyID": data.sellerVatNumber,
            "cac:TaxScheme": {
              "cbc:ID": "VAT",
            },
          },
          "cac:PartyLegalEntity": {
            "cbc:RegistrationName": data.sellerName,
            ...(data.sellerRegNumber
              ? { "cbc:CompanyID": data.sellerRegNumber }
              : {}),
          },
        },
      },

      // Customer
      "cac:AccountingCustomerParty": {
        "cac:Party": {
          "cbc:EndpointID": {
            "#text": data.buyerVatNumber || data.buyerRegNumber,
            "@_schemeID": PEPPOL_SCHEME_ID,
          },
          "cac:PartyName": {
            "cbc:Name": data.buyerName,
          },
          "cac:PostalAddress": {
            "cbc:StreetName": data.buyerAddress || "",
            "cbc:CityName": data.buyerCity || "",
            "cbc:PostalZone": data.buyerPostalCode || "",
            "cac:Country": {
              "cbc:IdentificationCode": data.buyerCountryCode || "LV",
            },
          },
          "cac:PartyTaxScheme": {
            "cbc:CompanyID": data.buyerVatNumber,
            "cac:TaxScheme": {
              "cbc:ID": "VAT",
            },
          },
          "cac:PartyLegalEntity": {
            "cbc:RegistrationName": data.buyerName,
            ...(data.buyerRegNumber
              ? { "cbc:CompanyID": data.buyerRegNumber }
              : {}),
          },
        },
      },

      // Payment Means
      "cac:PaymentMeans": {
        "cbc:PaymentMeansCode": data.paymentMethod || "30",
        ...(data.bankAccount
          ? {
              "cac:PayeeFinancialAccount": {
                "cbc:ID": data.bankAccount,
              },
            }
          : {}),
      },

      // Tax Total
      "cac:TaxTotal": {
        "cbc:TaxAmount": {
          "#text": formatAmount(data.totalTax),
          "@_currencyID": currency,
        },
        "cac:TaxSubtotal": data.taxBreakdown.map((tax) => ({
          "cbc:TaxableAmount": {
            "#text": formatAmount(tax.taxableAmount),
            "@_currencyID": currency,
          },
          "cbc:TaxAmount": {
            "#text": formatAmount(tax.taxAmount),
            "@_currencyID": currency,
          },
          "cac:TaxCategory": {
            "cbc:ID": tax.vatCategoryCode,
            "cbc:Percent": tax.vatRate,
            "cac:TaxScheme": {
              "cbc:ID": "VAT",
            },
          },
        })),
      },

      // Legal Monetary Total
      "cac:LegalMonetaryTotal": {
        "cbc:LineExtensionAmount": {
          "#text": formatAmount(data.totalNet),
          "@_currencyID": currency,
        },
        "cbc:TaxExclusiveAmount": {
          "#text": formatAmount(data.totalNet),
          "@_currencyID": currency,
        },
        "cbc:TaxInclusiveAmount": {
          "#text": formatAmount(data.totalGross),
          "@_currencyID": currency,
        },
        "cbc:PayableAmount": {
          "#text": formatAmount(data.totalGross),
          "@_currencyID": currency,
        },
      },

      // Invoice Lines
      "cac:InvoiceLine": data.lineItems.map((item) => ({
        "cbc:ID": item.id,
        "cbc:InvoicedQuantity": {
          "#text": item.quantity,
          "@_unitCode": item.unitCode || "C62",
        },
        "cbc:LineExtensionAmount": {
          "#text": formatAmount(item.lineTotal),
          "@_currencyID": currency,
        },
        "cac:Item": {
          "cbc:Name": item.description,
          "cac:ClassifiedTaxCategory": {
            "cbc:ID": item.vatCategoryCode,
            "cbc:Percent": item.vatRate,
            "cac:TaxScheme": {
              "cbc:ID": "VAT",
            },
          },
        },
        "cac:Price": {
          "cbc:PriceAmount": {
            "#text": formatAmount(item.unitPrice),
            "@_currencyID": currency,
          },
        },
      })),
    },
  };

  const options: XmlBuilderOptions = {
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    format: true,
    indentBy: "  ",
    processEntities: true,
    suppressEmptyNode: false,
  };
  const builder = new XMLBuilder(options);

  const xmlString: string = builder.build(invoiceObj);

  // Ensure proper XML declaration
  if (!xmlString.startsWith("<?xml")) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlString}`;
  }

  return xmlString;
}

function formatAmount(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}
