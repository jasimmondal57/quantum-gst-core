import React from "react";
import {
  FileText,
  ShoppingBag,
  Zap,
  FileCheck,
  FileClock,
  RotateCcw,
  RotateCw,
  Truck,
} from "lucide-react";
import type { DocumentType } from "../types/invoice";

export interface DocumentTypeSelectorProps {
  currentType: DocumentType;
  onSelectType: (type: DocumentType) => void;
}

const DOCUMENT_OPTIONS: { type: DocumentType; label: string; icon: React.ReactNode }[] = [
  { type: "sales_invoice", label: "Sales Invoice", icon: <FileText className="w-4 h-4" /> },
  { type: "purchase_bill", label: "Purchase Bill", icon: <ShoppingBag className="w-4 h-4" /> },
  { type: "pos_bill", label: "POS Billing", icon: <Zap className="w-4 h-4" /> },
  { type: "quotation", label: "Quotation", icon: <FileCheck className="w-4 h-4" /> },
  { type: "proforma", label: "Proforma", icon: <FileClock className="w-4 h-4" /> },
  { type: "credit_note", label: "Credit Note", icon: <RotateCcw className="w-4 h-4" /> },
  { type: "debit_note", label: "Debit Note", icon: <RotateCw className="w-4 h-4" /> },
  { type: "delivery_challan", label: "Delivery Challan", icon: <Truck className="w-4 h-4" /> },
];

export const DocumentTypeSelector: React.FC<DocumentTypeSelectorProps> = ({
  currentType,
  onSelectType,
}) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
      {DOCUMENT_OPTIONS.map((opt) => {
        const isActive = currentType === opt.type;
        return (
          <button
            key={opt.type}
            type="button"
            onClick={() => onSelectType(opt.type)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
              isActive
                ? "bg-[#167a55] text-white shadow-sm"
                : "bg-white text-[#71817a] hover:text-[#172b25] hover:bg-[#eaf6ef] border border-[#e2ebe5]"
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

