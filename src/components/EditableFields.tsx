"use client";

import { ExtractedInvoice, InvoiceLineItem } from "@/lib/types";

interface EditableFieldsProps {
  data: ExtractedInvoice;
  onChange: (data: ExtractedInvoice) => void;
}

function Field({
  label,
  value,
  field,
  onChange,
}: {
  label: string;
  value: string | number;
  field: string;
  onChange: (field: string, value: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white"
      />
    </div>
  );
}

export default function EditableFields({
  data,
  onChange,
}: EditableFieldsProps) {
  const handleFieldChange = (field: string, value: string) => {
    const numericFields = [
      "totalNet",
      "totalTax",
      "totalGross",
    ];
    const updated = {
      ...data,
      [field]: numericFields.includes(field) ? parseFloat(value) || 0 : value,
    };
    onChange(updated);
  };

  const handleLineItemChange = (
    index: number,
    field: keyof InvoiceLineItem,
    value: string
  ) => {
    const numericFields = ["quantity", "unitPrice", "lineTotal", "vatRate"];
    const updatedItems = [...data.lineItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: numericFields.includes(field) ? parseFloat(value) || 0 : value,
    };
    onChange({ ...data, lineItems: updatedItems });
  };

  return (
    <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-14rem)] pr-2">
      {/* Invoice info */}
      <section>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Rēķina informācija
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Rēķina Nr."
            value={data.invoiceNumber}
            field="invoiceNumber"
            onChange={handleFieldChange}
          />
          <Field
            label="Valūta"
            value={data.currency}
            field="currency"
            onChange={handleFieldChange}
          />
          <Field
            label="Izrakstīšanas datums"
            value={data.issueDate}
            field="issueDate"
            onChange={handleFieldChange}
          />
          <Field
            label="Apmaksas termiņš"
            value={data.dueDate}
            field="dueDate"
            onChange={handleFieldChange}
          />
        </div>
      </section>

      {/* Seller */}
      <section>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Pārdevējs
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Field
              label="Nosaukums"
              value={data.sellerName}
              field="sellerName"
              onChange={handleFieldChange}
            />
          </div>
          <Field
            label="PVN Nr."
            value={data.sellerVatNumber}
            field="sellerVatNumber"
            onChange={handleFieldChange}
          />
          <Field
            label="Reģ. Nr."
            value={data.sellerRegNumber}
            field="sellerRegNumber"
            onChange={handleFieldChange}
          />
          <Field
            label="Adrese"
            value={data.sellerAddress}
            field="sellerAddress"
            onChange={handleFieldChange}
          />
          <Field
            label="Pilsēta"
            value={data.sellerCity}
            field="sellerCity"
            onChange={handleFieldChange}
          />
          <Field
            label="Pasta indekss"
            value={data.sellerPostalCode}
            field="sellerPostalCode"
            onChange={handleFieldChange}
          />
          <Field
            label="Valsts kods"
            value={data.sellerCountryCode}
            field="sellerCountryCode"
            onChange={handleFieldChange}
          />
        </div>
      </section>

      {/* Buyer */}
      <section>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Pircējs
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Field
              label="Nosaukums"
              value={data.buyerName}
              field="buyerName"
              onChange={handleFieldChange}
            />
          </div>
          <Field
            label="PVN Nr."
            value={data.buyerVatNumber}
            field="buyerVatNumber"
            onChange={handleFieldChange}
          />
          <Field
            label="Reģ. Nr."
            value={data.buyerRegNumber}
            field="buyerRegNumber"
            onChange={handleFieldChange}
          />
          <Field
            label="Adrese"
            value={data.buyerAddress}
            field="buyerAddress"
            onChange={handleFieldChange}
          />
          <Field
            label="Pilsēta"
            value={data.buyerCity}
            field="buyerCity"
            onChange={handleFieldChange}
          />
          <Field
            label="Pasta indekss"
            value={data.buyerPostalCode}
            field="buyerPostalCode"
            onChange={handleFieldChange}
          />
          <Field
            label="Valsts kods"
            value={data.buyerCountryCode}
            field="buyerCountryCode"
            onChange={handleFieldChange}
          />
        </div>
      </section>

      {/* Amounts */}
      <section>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Summas
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <Field
            label="Neto summa"
            value={data.totalNet}
            field="totalNet"
            onChange={handleFieldChange}
          />
          <Field
            label="PVN summa"
            value={data.totalTax}
            field="totalTax"
            onChange={handleFieldChange}
          />
          <Field
            label="Kopā"
            value={data.totalGross}
            field="totalGross"
            onChange={handleFieldChange}
          />
        </div>
      </section>

      {/* Payment */}
      <section>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Maksājums
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Maksājuma veids (kods)"
            value={data.paymentMethod}
            field="paymentMethod"
            onChange={handleFieldChange}
          />
          <Field
            label="Bankas konts (IBAN)"
            value={data.bankAccount}
            field="bankAccount"
            onChange={handleFieldChange}
          />
        </div>
      </section>

      {/* Line items */}
      <section>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Rēķina rindas ({data.lineItems.length})
        </h3>
        <div className="space-y-3">
          {data.lineItems.map((item, index) => (
            <div
              key={item.id}
              className="bg-slate-50 rounded-xl p-3 space-y-2"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-indigo-600">
                  #{item.id}
                </span>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Apraksts
                </label>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) =>
                    handleLineItemChange(index, "description", e.target.value)
                  }
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Daudzums
                  </label>
                  <input
                    type="text"
                    value={item.quantity}
                    onChange={(e) =>
                      handleLineItemChange(index, "quantity", e.target.value)
                    }
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Cena
                  </label>
                  <input
                    type="text"
                    value={item.unitPrice}
                    onChange={(e) =>
                      handleLineItemChange(index, "unitPrice", e.target.value)
                    }
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Summa
                  </label>
                  <input
                    type="text"
                    value={item.lineTotal}
                    onChange={(e) =>
                      handleLineItemChange(index, "lineTotal", e.target.value)
                    }
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    PVN %
                  </label>
                  <input
                    type="text"
                    value={item.vatRate}
                    onChange={(e) =>
                      handleLineItemChange(index, "vatRate", e.target.value)
                    }
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
