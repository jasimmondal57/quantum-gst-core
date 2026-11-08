import React, { useState } from "react";
import { FileText, ChevronDown, ChevronUp, Lock } from "lucide-react";

export interface InvoiceNotesProps {
  termsConditions: string;
  onTermsConditionsChange: (val: string) => void;
  customerNotes: string;
  onCustomerNotesChange: (val: string) => void;
  internalNotes?: string;
  onInternalNotesChange?: (val: string) => void;
}

export const InvoiceNotes: React.FC<InvoiceNotesProps> = ({
  termsConditions,
  onTermsConditionsChange,
  customerNotes,
  onCustomerNotesChange,
  internalNotes,
  onInternalNotesChange,
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
          <FileText className="w-3.5 h-3.5 text-[#167a55]" />
          Terms, Conditions & Invoice Remarks
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-[#71817a]" /> : <ChevronDown className="w-4 h-4 text-[#71817a]" />}
      </button>

      {isOpen && (
        <div className="p-4 border-t border-[#e2ebe5] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-[#172b25] mb-1">
              Terms & Conditions (Printed on Invoice PDF)
            </label>
            <textarea
              rows={3}
              value={termsConditions}
              onChange={(e) => onTermsConditionsChange(e.target.value)}
              placeholder="Enter payment terms, warranty details, interest on delayed payment..."
              className="w-full text-xs rounded-lg border border-[#e2ebe5] p-2 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172b25] mb-1">
              Customer Notes / Delivery Instructions
            </label>
            <textarea
              rows={3}
              value={customerNotes}
              onChange={(e) => onCustomerNotesChange(e.target.value)}
              placeholder="e.g. Please deliver to Gate No 3 before 5:00 PM."
              className="w-full text-xs rounded-lg border border-[#e2ebe5] p-2 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
            />
          </div>

          {onInternalNotesChange && (
            <div className="md:col-span-2 pt-2 border-t border-[#e2ebe5]">
              <label className="block text-xs font-bold text-[#71817a] mb-1 flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#71817a]" />
                Internal Private Remarks (Never printed or shown to customer)
              </label>
              <input
                type="text"
                value={internalNotes || ""}
                onChange={(e) => onInternalNotesChange(e.target.value)}
                placeholder="Internal audit notes, reference numbers, margins..."
                className="w-full text-xs rounded-lg border border-[#e2ebe5] p-2 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
