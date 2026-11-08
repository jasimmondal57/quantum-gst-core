import React from "react";
import { ArrowLeft, Save, Eye, CheckCircle2 } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import type { DocumentType, InvoiceStatus } from "../types/invoice";

export interface DocumentHeaderProps {
  documentType: DocumentType;
  documentNumber?: string;
  financialYear: string;
  status: InvoiceStatus;
  isSaving: boolean;
  onBack: () => void;
  onSaveDraft: () => void;
  onFinalize: () => void;
  onPreview: () => void;
}

const DOCUMENT_TITLES: Record<DocumentType, string> = {
  sales_invoice: "Sales Invoice",
  purchase_bill: "Purchase Bill",
  pos_bill: "POS Quick Bill",
  quotation: "Quotation / Estimate",
  proforma: "Proforma Invoice",
  credit_note: "Credit Note",
  debit_note: "Debit Note",
  delivery_challan: "Delivery Challan",
};

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({
  documentType,
  documentNumber,
  financialYear,
  status,
  isSaving,
  onBack,
  onSaveDraft,
  onFinalize,
  onPreview,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#e2ebe5]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-lg text-[#71817a] hover:text-[#172b25] hover:bg-[#eaf6ef] transition-colors"
          title="Back to Invoices"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#172b25] tracking-tight">
              Create {DOCUMENT_TITLES[documentType]}
            </h1>
            <Badge variant={status === "finalized" ? "success" : "neutral"} size="sm">
              {status === "finalized" ? "Finalized" : "Draft"}
            </Badge>
          </div>
          <p className="text-xs text-[#71817a] mt-0.5">
            {documentNumber ? `No: ${documentNumber} · ` : "Auto-sequenced · "}
            FY {financialYear} · Statutory GST Compliance
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPreview}
          icon={<Eye className="w-4 h-4" />}
        >
          Preview <span className="hidden lg:inline ml-1 text-[10px] text-[#71817a]">(Ctrl+P)</span>
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onSaveDraft}
          disabled={isSaving}
          icon={<Save className="w-4 h-4" />}
        >
          Save Draft <span className="hidden lg:inline ml-1 text-[10px] text-[#71817a]">(F8)</span>
        </Button>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onFinalize}
          loading={isSaving}
          icon={<CheckCircle2 className="w-4 h-4" />}
        >
          Finalize & Save <span className="hidden lg:inline ml-1 text-[10px] text-white/80">(F9)</span>
        </Button>
      </div>
    </div>
  );
};
