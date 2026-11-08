import React, { useState } from "react";
import { Tag, ChevronDown, ChevronUp } from "lucide-react";

export interface DiscountSectionProps {
  discountType: "percentage" | "fixed";
  discountValue: number;
  onTypeChange: (type: "percentage" | "fixed") => void;
  onValueChange: (val: number) => void;
  calculatedDiscountAmount: number;
}

export const DiscountSection: React.FC<DiscountSectionProps> = ({
  discountType,
  discountValue,
  onTypeChange,
  onValueChange,
  calculatedDiscountAmount,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white border border-[#e2ebe5] rounded-xl overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-[#172b25] bg-[#f5f8f6]/50 hover:bg-[#eaf6ef] transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-[#167a55]" />
          Invoice-Level Discount & Promotions
          {calculatedDiscountAmount > 0 && (
            <span className="text-[11px] font-bold text-[#167a55]">
              (-₹{calculatedDiscountAmount.toFixed(2)})
            </span>
          )}
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-[#71817a]" /> : <ChevronDown className="w-4 h-4 text-[#71817a]" />}
      </button>

      {isOpen && (
        <div className="p-4 border-t border-[#e2ebe5] space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-[#71817a] mb-1">
                Discount Value
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={discountValue || ""}
                  onChange={(e) => onValueChange(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full text-xs rounded-l border border-[#e2ebe5] p-2 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
                />
                <div className="flex border border-l-0 border-[#e2ebe5] rounded-r overflow-hidden">
                  <button
                    type="button"
                    onClick={() => onTypeChange("percentage")}
                    className={`px-3 py-2 text-xs font-bold transition-colors ${
                      discountType === "percentage"
                        ? "bg-[#167a55] text-white"
                        : "bg-[#f5f8f6] text-[#71817a] hover:bg-[#eaf6ef]"
                    }`}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => onTypeChange("fixed")}
                    className={`px-3 py-2 text-xs font-bold transition-colors ${
                      discountType === "fixed"
                        ? "bg-[#167a55] text-white"
                        : "bg-[#f5f8f6] text-[#71817a] hover:bg-[#eaf6ef]"
                    }`}
                  >
                    ₹
                  </button>
                </div>
              </div>
            </div>

            <div className="text-right pt-4">
              <span className="text-xs text-[#71817a]">Total Discount:</span>
              <p className="text-sm font-bold text-[#167a55]">
                -₹{calculatedDiscountAmount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
