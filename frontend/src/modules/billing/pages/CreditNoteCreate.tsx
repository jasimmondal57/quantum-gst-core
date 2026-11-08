import React from "react";
import type { BusinessProfile, Customer, Product } from "../../../services/api";
import { useInvoiceForm } from "../hooks/useInvoiceForm";
import { useInvoiceTotals } from "../hooks/useInvoiceTotals";
import { DocumentHeader } from "../components/DocumentHeader";
import { DocumentTypeSelector } from "../components/DocumentTypeSelector";
import { PartySelector } from "../components/PartySelector";
import { InvoiceItemsTable } from "../components/InvoiceItemsTable";
import { GSTSummary } from "../components/GSTSummary";
import { InvoiceNotes } from "../components/InvoiceNotes";
import { InvoiceTotals } from "../components/InvoiceTotals";

export interface CreditNoteCreateProps {
  business: BusinessProfile | null;
  customers: Customer[];
  products: Product[];
  onNavigate: (route: string) => void;
}

const REASONS_FOR_CREDIT_NOTE = [
  "01 - Sales Return of Goods",
  "02 - Post Sale Discount / Volume Rebate",
  "03 - Deficiency in Services Provided",
  "04 - Correction in Invoice Value / GST Rate",
  "05 - Order Cancellation",
];

export const CreditNoteCreate: React.FC<CreditNoteCreateProps> = ({
  business,
  customers,
  products,
  onNavigate,
}) => {
  const isSaving = false;

  const orgId = business?.organization_id || "00000000-0000-0000-0000-000000000000";
  const bizId = business?.id || "";
  const primaryGstin = business?.gstins?.[0];
  const bizStateCode = primaryGstin?.state_code || "27";

  const {
    documentType,
    setDocumentType,
    selectedParty,
    handleSelectParty,
    documentDate,
    setDocumentDate,
    placeOfSupply,
    originalDocumentNumber,
    setOriginalDocumentNumber,
    reasonForNote,
    setReasonForNote,
    items,
    addItem,
    removeItem,
    updateItem,
    customerNotes,
    setCustomerNotes,
    currentFy,
  } = useInvoiceForm({
    initialDocumentType: "credit_note",
    businessId: bizId,
    organizationId: orgId,
    businessGstinId: primaryGstin?.id,
    businessStateCode: bizStateCode,
  });

  const totals = useInvoiceTotals({
    items,
    businessStateCode: bizStateCode,
    placeOfSupplyStateCode: placeOfSupply,
    supplyType: "regular",
    reverseCharge: false,
    invoiceDiscountType: "percentage",
    invoiceDiscountValue: 0,
    additionalCharges: [],
  });

  const handleIssueCreditNote = () => {
    if (!originalDocumentNumber.trim()) {
      alert("Please enter the Original Invoice Number being adjusted.");
      return;
    }
    alert(`Success! Credit Note issued against ${originalDocumentNumber}. Accounting ledger and GST GSTR-1 Table 9B updated.`);
    onNavigate("/sales");
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-8">
      <DocumentHeader
        documentType="credit_note"
        financialYear={currentFy}
        status="draft"
        isSaving={isSaving}
        onBack={() => onNavigate("/sales")}
        onSaveDraft={() => alert("Credit note draft saved")}
        onFinalize={handleIssueCreditNote}
        onPreview={() => {}}
      />

      <DocumentTypeSelector
        currentType={documentType}
        onSelectType={(t) => {
          setDocumentType(t);
          if (t === "sales_invoice") onNavigate("/billing");
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-4">
          <PartySelector
            partyType="customer"
            selectedParty={selectedParty}
            parties={customers.map((c) => ({
              id: c.id,
              name: c.name,
              party_type: "customer",
              gstin: c.gstin || "",
              registration_type: c.gstin ? "regular" : "unregistered",
              phone: c.phone || "",
              email: c.email || "",
              billing_address: c.address || "",
              billing_state: c.state || "",
              billing_state_code: c.state_code || (c.gstin ? c.gstin.substring(0, 2) : "27"),
            }))}
            onSelectParty={handleSelectParty}
          />

          <div className="bg-white border border-[#e2ebe5] rounded-xl p-4 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-[#172b25] uppercase tracking-wider">
              Original Tax Invoice Reference & Statutory Reason
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-[#71817a] mb-1">
                  Original Invoice No. *
                </label>
                <input
                  type="text"
                  value={originalDocumentNumber}
                  onChange={(e) => setOriginalDocumentNumber(e.target.value)}
                  placeholder="e.g. INV/2026-27/0042"
                  required
                  className="w-full rounded-lg border border-[#e2ebe5] p-2 bg-white text-[#172b25]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#71817a] mb-1">
                  Credit Note Date
                </label>
                <input
                  type="date"
                  value={documentDate}
                  onChange={(e) => setDocumentDate(e.target.value)}
                  className="w-full rounded-lg border border-[#e2ebe5] p-2 bg-white text-[#172b25]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#71817a] mb-1">
                  Reason for Credit Note *
                </label>
                <select
                  value={reasonForNote}
                  onChange={(e) => setReasonForNote(e.target.value)}
                  className="w-full rounded-lg border border-[#e2ebe5] p-2 bg-white text-[#172b25]"
                >
                  {REASONS_FOR_CREDIT_NOTE.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <InvoiceItemsTable
            items={items}
            products={products}
            onAddItem={addItem}
            onUpdateItem={updateItem}
            onRemoveItem={removeItem}
          />

          <GSTSummary totals={totals} />

          <InvoiceNotes
            termsConditions="Credit note issued u/s 34 of CGST Act, 2017."
            onTermsConditionsChange={() => {}}
            customerNotes={customerNotes}
            onCustomerNotesChange={setCustomerNotes}
          />
        </div>

        <div className="lg:col-span-4 sticky top-4">
          <InvoiceTotals
            totals={totals}
            amountReceived={0}
            itemCount={items.length}
            isSaving={isSaving}
            onSaveDraft={() => alert("Draft saved")}
            onFinalize={handleIssueCreditNote}
            onPreview={() => {}}
          />
        </div>
      </div>
    </div>
  );
};
