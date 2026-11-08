import React from "react";
import { CheckCircle2, Save, Eye } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import type { CalculatedTotals } from "../hooks/useInvoiceTotals";

export interface InvoiceTotalsProps {
  totals: CalculatedTotals;
  amountReceived: number;
  itemCount: number;
  isSaving: boolean;
  onSaveDraft: () => void;
  onFinalize: () => void;
  onPreview: () => void;
}

export const InvoiceTotals: React.FC<InvoiceTotalsProps> = ({
  totals,
  amountReceived,
  itemCount,
  isSaving,
  onSaveDraft,
  onFinalize,
  onPreview,
}) => {
  const balanceDue = Math.max(0, totals.grandTotal - amountReceived);

  return (
    <div className="bg-white border border-[#e2ebe5] rounded-xl p-4 shadow-sm space-y-4 sticky top-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#e2ebe5]">
        <h3 className="text-xs font-bold text-[#172b25] uppercase tracking-wider">
          Summary & Total
        </h3>
        <span className="text-xs font-semibold text-[#71817a]">
          {itemCount} {itemCount === 1 ? "Item" : "Items"}
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between text-[#71817a]">
          <span>Subtotal</span>
          <span className="font-medium text-[#172b25]">₹{totals.subtotal.toFixed(2)}</span>
        </div>

        {totals.totalItemDiscount > 0 && (
          <div className="flex justify-between text-[#71817a]">
            <span>Item Discounts</span>
            <span className="font-medium text-[#167a55]">
              -₹{totals.totalItemDiscount.toFixed(2)}
            </span>
          </div>
        )}

        {totals.invoiceDiscountAmount > 0 && (
          <div className="flex justify-between text-[#71817a]">
            <span>Invoice Discount</span>
            <span className="font-medium text-[#167a55]">
              -₹{totals.invoiceDiscountAmount.toFixed(2)}
            </span>
          </div>
        )}

        <div className="flex justify-between text-[#172b25] font-semibold pt-1 border-t border-[#f5f8f6]">
          <span>Taxable Amount</span>
          <span>₹{totals.taxableAmount.toFixed(2)}</span>
        </div>

        {/* GST Tax Breakdown */}
        {!totals.isInterstate && !totals.isUtgst && (
          <>
            <div className="flex justify-between text-[#71817a] text-[11px] pl-2">
              <span>CGST</span>
              <span>₹{totals.totalCgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#71817a] text-[11px] pl-2">
              <span>SGST</span>
              <span>₹{totals.totalSgst.toFixed(2)}</span>
            </div>
          </>
        )}

        {!totals.isInterstate && totals.isUtgst && (
          <>
            <div className="flex justify-between text-[#71817a] text-[11px] pl-2">
              <span>CGST</span>
              <span>₹{totals.totalCgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#71817a] text-[11px] pl-2">
              <span>UTGST</span>
              <span>₹{totals.totalUtgst.toFixed(2)}</span>
            </div>
          </>
        )}

        {totals.isInterstate && (
          <div className="flex justify-between text-[#71817a] text-[11px] pl-2">
            <span>IGST</span>
            <span>₹{totals.totalIgst.toFixed(2)}</span>
          </div>
        )}

        {totals.totalCess > 0 && (
          <div className="flex justify-between text-[#71817a] text-[11px] pl-2">
            <span>Cess</span>
            <span>₹{totals.totalCess.toFixed(2)}</span>
          </div>
        )}

        {totals.chargesTotal > 0 && (
          <div className="flex justify-between text-[#71817a]">
            <span>Additional Charges</span>
            <span>+₹{totals.chargesTotal.toFixed(2)}</span>
          </div>
        )}

        {totals.roundOff !== 0 && (
          <div className="flex justify-between text-[#71817a] text-[11px]">
            <span>Round Off</span>
            <span>{totals.roundOff > 0 ? `+₹${totals.roundOff.toFixed(2)}` : `-₹${Math.abs(totals.roundOff).toFixed(2)}`}</span>
          </div>
        )}

        {/* Grand Total */}
        <div className="pt-3 border-t-2 border-[#b8e2cd] flex items-baseline justify-between">
          <span className="text-sm font-bold text-[#172b25]">Grand Total</span>
          <span className="text-xl font-extrabold text-[#167a55]">
            ₹{totals.grandTotal.toFixed(2)}
          </span>
        </div>

        {/* Payment & Balance */}
        <div className="pt-2 border-t border-[#e2ebe5] space-y-1.5">
          <div className="flex justify-between text-xs text-[#71817a]">
            <span>Amount Received</span>
            <span className="font-semibold text-[#172b25]">₹{amountReceived.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs font-bold">
            <span className={balanceDue > 0 ? "text-[#991b1b]" : "text-[#065f46]"}>
              Balance Due
            </span>
            <span className={balanceDue > 0 ? "text-[#991b1b]" : "text-[#065f46]"}>
              ₹{balanceDue.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-[#e2ebe5] space-y-2">
        <Button
          type="button"
          variant="primary"
          size="md"
          className="w-full justify-center shadow-sm"
          onClick={onFinalize}
          loading={isSaving}
          icon={<CheckCircle2 className="w-4 h-4" />}
        >
          Finalize & Save Invoice <span className="text-xs text-white/80 ml-1">(F9)</span>
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-center"
            onClick={onPreview}
            icon={<Eye className="w-3.5 h-3.5" />}
          >
            Preview
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full justify-center"
            onClick={onSaveDraft}
            disabled={isSaving}
            icon={<Save className="w-3.5 h-3.5" />}
          >
            Save Draft <span className="text-[10px] text-[#71817a] ml-1">(F8)</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
