import React, { useState } from "react";
import { Truck, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import type { AdditionalCharge } from "../types/invoice";

export interface AdditionalChargesProps {
  charges: AdditionalCharge[];
  onChange: (charges: AdditionalCharge[]) => void;
}

export const AdditionalCharges: React.FC<AdditionalChargesProps> = ({
  charges,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAddCharge = (name: string, defaultGst = 18) => {
    const newCharge: AdditionalCharge = {
      id: "ch_" + Date.now(),
      name,
      amount: 0,
      is_taxable: true,
      gst_rate: defaultGst,
    };
    onChange([...charges, newCharge]);
    setIsOpen(true);
  };

  const handleUpdate = (idx: number, updates: Partial<AdditionalCharge>) => {
    const updated = [...charges];
    updated[idx] = { ...updated[idx], ...updates };
    onChange(updated);
  };

  const handleRemove = (idx: number) => {
    onChange(charges.filter((_, i) => i !== idx));
  };

  const totalCharges = charges.reduce((acc, c) => acc + (c.amount || 0), 0);

  return (
    <div className="bg-white border border-[#e2ebe5] rounded-xl overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-[#172b25] bg-[#f5f8f6]/50 hover:bg-[#eaf6ef] transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5 text-[#167a55]" />
          Additional Charges (Shipping, Packaging, Labour)
          {totalCharges > 0 && (
            <span className="text-[11px] font-bold text-[#167a55]">
              (+₹{totalCharges.toFixed(2)})
            </span>
          )}
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-[#71817a]" /> : <ChevronDown className="w-4 h-4 text-[#71817a]" />}
      </button>

      {isOpen && (
        <div className="p-4 border-t border-[#e2ebe5] space-y-3">
          {charges.length === 0 ? (
            <p className="text-xs text-[#71817a]">
              No extra charges added. Add shipping, packaging, or handling below.
            </p>
          ) : (
            <div className="space-y-2">
              {charges.map((charge, idx) => (
                <div
                  key={charge.id}
                  className="grid grid-cols-12 gap-2 items-center bg-[#f5f8f6]/60 p-2 rounded-lg text-xs"
                >
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={charge.name}
                      onChange={(e) => handleUpdate(idx, { name: e.target.value })}
                      className="w-full text-xs rounded border border-[#e2ebe5] p-1.5 bg-white text-[#172b25]"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={charge.amount || ""}
                      onChange={(e) =>
                        handleUpdate(idx, { amount: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="₹ Amount"
                      className="w-full text-xs rounded border border-[#e2ebe5] p-1.5 bg-white text-right text-[#172b25]"
                    />
                  </div>
                  <div className="col-span-3 flex items-center gap-1.5">
                    <label className="text-[11px] text-[#71817a]">GST%</label>
                    <input
                      type="number"
                      min="0"
                      value={charge.gst_rate}
                      onChange={(e) =>
                        handleUpdate(idx, { gst_rate: parseFloat(e.target.value) || 0 })
                      }
                      className="w-14 text-xs rounded border border-[#e2ebe5] p-1.5 bg-white text-center text-[#172b25]"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      className="p-1 text-[#71817a] hover:text-[#991b1b]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddCharge("Shipping & Freight", 18)}
            >
              + Shipping
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddCharge("Packaging & Handling", 18)}
            >
              + Packaging
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddCharge("Installation & Labour", 18)}
            >
              + Installation
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
