import React, { useState } from "react";
import { ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import type { CalculatedTotals } from "../hooks/useInvoiceTotals";

export interface GSTSummaryProps {
  totals: CalculatedTotals;
}

export const GSTSummary: React.FC<GSTSummaryProps> = ({ totals }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Group items by HSN / SAC
  const hsnMap: Record<
    string,
    {
      hsn: string;
      taxable: number;
      cgst: number;
      sgst: number;
      utgst: number;
      igst: number;
      cess: number;
      totalTax: number;
    }
  > = {};

  totals.calculatedItems.forEach((item) => {
    const hsn = item.hsn_sac || "OTHER";
    if (!hsnMap[hsn]) {
      hsnMap[hsn] = {
        hsn,
        taxable: 0,
        cgst: 0,
        sgst: 0,
        utgst: 0,
        igst: 0,
        cess: 0,
        totalTax: 0,
      };
    }
    hsnMap[hsn].taxable += item.taxable_value || 0;
    hsnMap[hsn].cgst += item.cgst_amount || 0;
    hsnMap[hsn].sgst += totals.isUtgst ? 0 : (item.sgst_amount || 0);
    hsnMap[hsn].utgst += totals.isUtgst ? (item.sgst_amount || 0) : 0;
    hsnMap[hsn].igst += item.igst_amount || 0;
    hsnMap[hsn].cess += item.cess_amount || 0;
    hsnMap[hsn].totalTax += item.total_tax || 0;
  });

  const hsnRows = Object.values(hsnMap);

  return (
    <div className="bg-white border border-[#e2ebe5] rounded-xl overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-[#172b25] bg-[#f5f8f6]/50 hover:bg-[#eaf6ef] transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#167a55]" />
          Statutory GST Tax Breakup (HSN / SAC Summary)
          <span className="text-[11px] font-bold text-[#167a55]">
            (Total Tax: ₹{totals.totalTaxAmount.toFixed(2)})
          </span>
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-[#71817a]" /> : <ChevronDown className="w-4 h-4 text-[#71817a]" />}
      </button>

      {isOpen && (
        <div className="p-4 border-t border-[#e2ebe5] overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="billing-table-header border-b border-[#e2ebe5]">
                <th className="p-2">HSN / SAC</th>
                <th className="p-2 text-right">Taxable Value</th>
                {!totals.isInterstate && !totals.isUtgst && (
                  <>
                    <th className="p-2 text-right">CGST</th>
                    <th className="p-2 text-right">SGST</th>
                  </>
                )}
                {!totals.isInterstate && totals.isUtgst && (
                  <>
                    <th className="p-2 text-right">CGST</th>
                    <th className="p-2 text-right">UTGST</th>
                  </>
                )}
                {totals.isInterstate && <th className="p-2 text-right">IGST</th>}
                <th className="p-2 text-right">Cess</th>
                <th className="p-2 text-right font-bold text-[#167a55]">Total Tax</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2ebe5]">
              {hsnRows.map((row) => (
                <tr key={row.hsn} className="hover:bg-[#f5f8f6]">
                  <td className="p-2 font-mono font-medium text-[#172b25]">{row.hsn}</td>
                  <td className="p-2 text-right">₹{row.taxable.toFixed(2)}</td>
                  {!totals.isInterstate && !totals.isUtgst && (
                    <>
                      <td className="p-2 text-right">₹{row.cgst.toFixed(2)}</td>
                      <td className="p-2 text-right">₹{row.sgst.toFixed(2)}</td>
                    </>
                  )}
                  {!totals.isInterstate && totals.isUtgst && (
                    <>
                      <td className="p-2 text-right">₹{row.cgst.toFixed(2)}</td>
                      <td className="p-2 text-right">₹{row.utgst.toFixed(2)}</td>
                    </>
                  )}
                  {totals.isInterstate && <td className="p-2 text-right">₹{row.igst.toFixed(2)}</td>}
                  <td className="p-2 text-right">₹{row.cess.toFixed(2)}</td>
                  <td className="p-2 text-right font-bold text-[#167a55]">
                    ₹{row.totalTax.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#f0f6f3] font-bold text-[#172b25] border-t-2 border-[#b8e2cd]">
                <td className="p-2">Total</td>
                <td className="p-2 text-right">₹{totals.taxableAmount.toFixed(2)}</td>
                {!totals.isInterstate && !totals.isUtgst && (
                  <>
                    <td className="p-2 text-right">₹{totals.totalCgst.toFixed(2)}</td>
                    <td className="p-2 text-right">₹{totals.totalSgst.toFixed(2)}</td>
                  </>
                )}
                {!totals.isInterstate && totals.isUtgst && (
                  <>
                    <td className="p-2 text-right">₹{totals.totalCgst.toFixed(2)}</td>
                    <td className="p-2 text-right">₹{totals.totalUtgst.toFixed(2)}</td>
                  </>
                )}
                {totals.isInterstate && (
                  <td className="p-2 text-right">₹{totals.totalIgst.toFixed(2)}</td>
                )}
                <td className="p-2 text-right">₹{totals.totalCess.toFixed(2)}</td>
                <td className="p-2 text-right text-[#167a55]">
                  ₹{totals.totalTaxAmount.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

