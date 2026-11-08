import React from "react";
import { CheckCircle2, Eye } from "lucide-react";
import { Button } from "../../../components/ui/Button";

export interface InvoiceActionBarProps {
  grandTotal: number;
  balanceDue: number;
  isSaving: boolean;
  onSaveDraft: () => void;
  onFinalize: () => void;
  onPreview: () => void;
}

export const InvoiceActionBar: React.FC<InvoiceActionBarProps> = ({
  grandTotal,
  balanceDue,
  isSaving,
  onSaveDraft: _onSaveDraft,
  onFinalize,
  onPreview,
}) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e2ebe5] p-3 shadow-lg z-30 flex items-center justify-between gap-3">
      <div>
        <span className="text-[10px] text-[#71817a] block uppercase tracking-wider font-bold">
          Total Payable
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-extrabold text-[#167a55]">
            ₹{grandTotal.toFixed(2)}
          </span>
          {balanceDue > 0 && (
            <span className="text-[10px] font-bold text-[#991b1b]">
              (Due: ₹{balanceDue.toFixed(2)})
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPreview}
          icon={<Eye className="w-4 h-4" />}
        >
          Preview
        </Button>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onFinalize}
          loading={isSaving}
          icon={<CheckCircle2 className="w-4 h-4" />}
        >
          Save
        </Button>
      </div>
    </div>
  );
};
