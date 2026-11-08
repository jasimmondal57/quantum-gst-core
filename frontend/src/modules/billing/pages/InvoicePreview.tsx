import React, { useState } from "react";
import { Printer, X, FileText } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import type { BusinessProfile } from "../../../services/api";
import type { Party } from "../types/party";
import type { InvoiceItemDraft } from "../types/invoiceItem";
import type { CalculatedTotals } from "../hooks/useInvoiceTotals";

export interface InvoicePreviewProps {
  business: BusinessProfile | null;
  party: Party | null;
  items: InvoiceItemDraft[];
  totals: CalculatedTotals;
  documentDate: string;
  documentNumber: string;
  termsConditions?: string;
  onClose: () => void;
}

// Convert numbers to Indian rupee words format
function numberToWordsINR(amount: number): string {
  const words = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function numToWords(n: number): string {
    if (n === 0) return "";
    if (n < 20) return words[n] + " ";
    if (n < 100) return tens[Math.floor(n / 10)] + " " + words[n % 10] + " ";
    if (n < 1000) return words[Math.floor(n / 100)] + " Hundred " + numToWords(n % 100);
    if (n < 100000) return numToWords(Math.floor(n / 1000)) + " Thousand " + numToWords(n % 1000);
    if (n < 10000000) return numToWords(Math.floor(n / 100000)) + " Lakh " + numToWords(n % 100000);
    return numToWords(Math.floor(n / 10000000)) + " Crore " + numToWords(n % 10000000);
  }

  const rounded = Math.round(amount);
  if (rounded === 0) return "Zero Rupees Only";
  return numToWords(rounded).trim() + " Rupees Only";
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  business,
  party,
  items,
  totals,
  documentDate,
  documentNumber,
  termsConditions,
  onClose,
}) => {
  const [template, setTemplate] = useState<"a4" | "thermal">("a4");

  const primaryGstin = business?.gstins?.[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-[#e2ebe5]">
        {/* Preview Control Header */}
        <div className="p-4 bg-[#f5f8f6] border-b border-[#e2ebe5] flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-[#167a55]" />
            <div>
              <h2 className="text-sm font-bold text-[#172b25]">
                Invoice Live Print & PDF Preview
              </h2>
              <span className="text-xs text-[#71817a]">
                Document: {documentNumber} · Standard Statutory Tax Invoice
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-white rounded-lg border border-[#e2ebe5] p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTemplate("a4")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  template === "a4" ? "bg-[#167a55] text-white" : "text-[#71817a]"
                }`}
              >
                A4 Standard
              </button>
              <button
                type="button"
                onClick={() => setTemplate("thermal")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  template === "thermal" ? "bg-[#167a55] text-white" : "text-[#71817a]"
                }`}
              >
                80mm Thermal
              </button>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handlePrint}
              icon={<Printer className="w-4 h-4" />}
            >
              Print / Save PDF
            </Button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#71817a] hover:bg-[#e2ebe5] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Viewport */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100/50">
          {template === "a4" ? (
            /* A4 Portrait Template */
            <div className="a4-print-container bg-white p-8 border border-slate-200 shadow-sm mx-auto text-xs text-slate-800 space-y-5 rounded-lg max-w-[210mm]">
              {/* Header: Company & Tax Invoice */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h1 className="text-xl font-bold text-[#167a55] tracking-tight">
                    {business?.trade_name || business?.legal_name || "Quantum GST Solutions"}
                  </h1>
                  <p className="text-xs text-slate-600 mt-1 max-w-sm">
                    {business?.address || "Corporate Office, Business District"}
                  </p>
                  <p className="text-xs font-bold text-slate-900 mt-1">
                    GSTIN: {primaryGstin?.gstin || "27AAACB9999F1Z9"}
                  </p>
                  <p className="text-xs text-slate-600">
                    State: {primaryGstin?.state_code || "27"} · PAN: {business?.pan || "AAACB9999F"}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-lg font-black text-slate-900 tracking-wider uppercase block">
                    TAX INVOICE
                  </span>
                  <Badge variant="emerald" size="sm" className="mt-1">
                    Original for Recipient
                  </Badge>
                  <div className="mt-3 text-xs space-y-0.5">
                    <p>
                      <strong>Invoice No:</strong> {documentNumber}
                    </p>
                    <p>
                      <strong>Date:</strong> {documentDate}
                    </p>
                    <p>
                      <strong>Place of Supply:</strong> State Code {totals.isInterstate ? "Interstate" : primaryGstin?.state_code || "27"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Billed To / Shipped To */}
              <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Billed To (Customer Details)
                  </span>
                  <p className="text-xs font-bold text-slate-900">{party?.name || "Cash Customer"}</p>
                  <p className="text-xs text-slate-600">{party?.billing_address || "Over-the-counter"}</p>
                  <p className="text-xs font-semibold text-slate-800 mt-1">
                    GSTIN: {party?.gstin || "Unregistered (B2C)"}
                  </p>
                  <p className="text-xs text-slate-600">
                    State: {party?.billing_state || "State Code " + (party?.billing_state_code || "27")}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Shipped To (Delivery Address)
                  </span>
                  <p className="text-xs font-bold text-slate-900">{party?.name || "Cash Customer"}</p>
                  <p className="text-xs text-slate-600">
                    {party?.shipping_address || party?.billing_address || "Same as billing address"}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold text-[11px]">
                    <th className="p-2 border border-slate-200 text-center w-8">#</th>
                    <th className="p-2 border border-slate-200">Description of Goods / Services</th>
                    <th className="p-2 border border-slate-200 text-center w-20">HSN/SAC</th>
                    <th className="p-2 border border-slate-200 text-right w-14">Qty</th>
                    <th className="p-2 border border-slate-200 text-center w-14">Unit</th>
                    <th className="p-2 border border-slate-200 text-right w-20">Rate (₹)</th>
                    <th className="p-2 border border-slate-200 text-right w-20">Taxable (₹)</th>
                    <th className="p-2 border border-slate-200 text-center w-16">GST%</th>
                    <th className="p-2 border border-slate-200 text-right w-24">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((item, idx) => (
                    <tr key={idx} className="text-slate-800">
                      <td className="p-2 border border-slate-200 text-center text-[10px] text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="p-2 border border-slate-200 font-medium">
                        {item.item_name}
                        {item.description && (
                          <span className="block text-[10px] text-slate-500">{item.description}</span>
                        )}
                      </td>
                      <td className="p-2 border border-slate-200 text-center font-mono text-[11px]">
                        {item.hsn_sac || "—"}
                      </td>
                      <td className="p-2 border border-slate-200 text-right font-medium">
                        {item.quantity}
                      </td>
                      <td className="p-2 border border-slate-200 text-center text-[10px]">
                        {item.unit}
                      </td>
                      <td className="p-2 border border-slate-200 text-right">
                        {item.unit_price.toFixed(2)}
                      </td>
                      <td className="p-2 border border-slate-200 text-right">
                        {item.taxable_value.toFixed(2)}
                      </td>
                      <td className="p-2 border border-slate-200 text-center">
                        {item.gst_rate}%
                      </td>
                      <td className="p-2 border border-slate-200 text-right font-bold">
                        {item.total_amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Tax Summary & Totals */}
              <div className="grid grid-cols-2 gap-4 items-start">
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Total Invoice Amount in Words
                    </span>
                    <p className="font-bold text-slate-900 mt-0.5">
                      {numberToWordsINR(totals.grandTotal)}
                    </p>
                  </div>

                  <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                    <span className="font-bold text-slate-800 block">Bank Account & UPI Details</span>
                    <p>Bank: HDFC Bank Limited</p>
                    <p>A/C No: 50200098765432 · IFSC: HDFC0001234</p>
                    <p>UPI VPA: {primaryGstin?.gstin || "quantumgst"}@upi</p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded p-3 bg-slate-50/50 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Subtotal:</span>
                    <span>₹{totals.taxableAmount.toFixed(2)}</span>
                  </div>
                  {!totals.isInterstate && (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>CGST:</span>
                        <span>₹{totals.totalCgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>SGST / UTGST:</span>
                        <span>₹{(totals.totalSgst + totals.totalUtgst).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  {totals.isInterstate && (
                    <div className="flex justify-between text-slate-600">
                      <span>IGST:</span>
                      <span>₹{totals.totalIgst.toFixed(2)}</span>
                    </div>
                  )}
                  {totals.totalCess > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Cess:</span>
                      <span>₹{totals.totalCess.toFixed(2)}</span>
                    </div>
                  )}
                  {totals.roundOff !== 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Round Off:</span>
                      <span>₹{totals.roundOff.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t-2 border-slate-300 flex justify-between font-bold text-sm text-[#167a55]">
                    <span>Total Amount (INR):</span>
                    <span>₹{totals.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Terms and Signature */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 items-end">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Terms & Conditions
                  </span>
                  <p className="text-[10px] text-slate-600 whitespace-pre-line leading-relaxed">
                    {termsConditions || "1. Goods once sold will not be accepted back.\n2. Delayed payments subject to 18% annual interest."}
                  </p>
                </div>

                <div className="text-right space-y-8">
                  <span className="text-[11px] font-bold text-slate-800 block">
                    For {business?.trade_name || business?.legal_name || "Quantum GST Solutions"}
                  </span>
                  <div className="text-[10px] text-slate-500 border-t border-slate-300 pt-1 inline-block min-w-[140px]">
                    Authorized Signatory
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 80mm Thermal Receipt Template */
            <div className="thermal-80-container bg-white p-4 border border-slate-300 shadow-sm mx-auto text-xs font-mono text-slate-900 space-y-3 max-w-[80mm] rounded">
              <div className="text-center space-y-1">
                <h3 className="font-bold text-sm">
                  {business?.trade_name || business?.legal_name || "Quantum GST"}
                </h3>
                <p className="text-[10px] text-slate-600">GSTIN: {primaryGstin?.gstin || "27AAACB9999F1Z9"}</p>
                <p className="text-[10px] border-b border-dashed border-slate-400 pb-1">
                  *** TAX INVOICE ***
                </p>
              </div>

              <div className="text-[10px] space-y-0.5">
                <p>Inv No: {documentNumber}</p>
                <p>Date: {documentDate}</p>
                <p>Customer: {party?.name || "Cash Customer"}</p>
                {party?.gstin && <p>Cust GSTIN: {party.gstin}</p>}
              </div>

              <div className="border-t border-b border-dashed border-slate-400 py-1 space-y-1 text-[11px]">
                {items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <div>
                      <p className="font-bold">{it.item_name}</p>
                      <p className="text-[10px] text-slate-600">
                        {it.quantity} {it.unit} x ₹{it.unit_price.toFixed(2)}
                      </p>
                    </div>
                    <span className="font-bold">₹{it.total_amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="text-[11px] space-y-1 pt-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Tax:</span>
                  <span>₹{totals.totalTaxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-xs border-t border-dashed border-slate-400 pt-1">
                  <span>GRAND TOTAL:</span>
                  <span>₹{totals.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center text-[10px] pt-2 border-t border-dashed border-slate-400">
                <p>Thank you for your business!</p>
                <p>Powered by QuantumGST.in</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
