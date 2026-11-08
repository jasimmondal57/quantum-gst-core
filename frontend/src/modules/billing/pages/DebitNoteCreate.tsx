import React, { useState } from "react";
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

export interface DebitNoteCreateProps {
  business: BusinessProfile | null;
  suppliers: Customer[];
  products: Product[];
  onNavigate: (route: string) => void;
}

export const DebitNoteCreate: React.FC<DebitNoteCreateProps> = ({
  business,
  suppliers,
  products,
  onNavigate,
}) => {
  const [originalSupplierBill, setOriginalSupplierBill] = useState("");

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
    items,
    addItem,
    removeItem,
    updateItem,
    customerNotes,
    setCustomerNotes,
    currentFy,
  } = useInvoiceForm({
    initialDocumentType: "debit_note",
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

  const handleIssueDebitNote = () => {
    if (!originalSupplierBill.trim()) {
      alert("Please provide the original Supplier Bill Number.");
      return;
    }
    alert(`Success! Debit Note issued to supplier against bill ${originalSupplierBill}. Input tax credit (ITC) adjustment posted.`);
    onNavigate("/purchases");
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-8">
      <DocumentHeader
        documentType="debit_note"
        financialYear={currentFy}
        status="draft"
        isSaving={false}
        onBack={() => onNavigate("/purchases")}
        onSaveDraft={() => alert("Debit note draft saved")}
        onFinalize={handleIssueDebitNote}
        onPreview={() => {}}
      />

      <DocumentTypeSelector
        currentType={documentType}
        onSelectType={(t) => {
          setDocumentType(t);
          if (t === "purchase_bill") onNavigate("/purchases");
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-4">
          <PartySelector
            partyType="supplier"
            selectedParty={selectedParty}
            parties={suppliers.map((s) => ({
              id: s.id,
              name: s.name,
              party_type: "supplier",
              gstin: s.gstin || "",
              registration_type: s.gstin ? "regular" : "unregistered",
              phone: s.phone || "",
              email: s.email || "",
              billing_address: s.address || "",
              billing_state: s.state || "",
              billing_state_code: s.state_code || (s.gstin ? s.gstin.substring(0, 2) : "27"),
            }))}
            onSelectParty={handleSelectParty}
          />

          <div className="bg-white border border-[#e2ebe5] rounded-xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-medium text-[#71817a] mb-1">
                Original Supplier Bill No. *
              </label>
              <input
                type="text"
                value={originalSupplierBill}
                onChange={(e) => setOriginalSupplierBill(e.target.value)}
                placeholder="e.g. SUPP/BILL/0019"
                required
                className="w-full rounded-lg border border-[#e2ebe5] p-2 bg-white text-[#172b25]"
              />
            </div>
            <div>
              <label className="block font-medium text-[#71817a] mb-1">
                Debit Note Date
              </label>
              <input
                type="date"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
                className="w-full rounded-lg border border-[#e2ebe5] p-2 bg-white text-[#172b25]"
              />
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
            termsConditions="Debit note issued u/s 34 of CGST Act for purchase return / value adjustment."
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
            isSaving={false}
            onSaveDraft={() => alert("Draft saved")}
            onFinalize={handleIssueDebitNote}
            onPreview={() => {}}
          />
        </div>
      </div>
    </div>
  );
};
