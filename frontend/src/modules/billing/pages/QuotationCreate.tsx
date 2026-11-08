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
import { InvoicePreview } from "./InvoicePreview";

export interface QuotationCreateProps {
  business: BusinessProfile | null;
  customers: Customer[];
  products: Product[];
  onNavigate: (route: string) => void;
}

export const QuotationCreate: React.FC<QuotationCreateProps> = ({
  business,
  customers,
  products,
  onNavigate,
}) => {
  const isSaving = false;
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [validUntil, setValidUntil] = useState<string>(
    new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0]
  );

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
    termsConditions,
    setTermsConditions,
    currentFy,
  } = useInvoiceForm({
    initialDocumentType: "quotation",
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

  const handleSaveQuotation = () => {
    alert("Quotation saved successfully! You can send it to your customer or convert it to a tax invoice upon confirmation.");
  };

  const handleConvertToInvoice = () => {
    onNavigate("/billing");
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-8">
      <DocumentHeader
        documentType="quotation"
        financialYear={currentFy}
        status="draft"
        isSaving={isSaving}
        onBack={() => onNavigate("/sales")}
        onSaveDraft={handleSaveQuotation}
        onFinalize={handleConvertToInvoice}
        onPreview={() => setShowPreviewModal(true)}
      />

      <DocumentTypeSelector
        currentType={documentType}
        onSelectType={(t) => {
          setDocumentType(t);
          if (t === "sales_invoice") onNavigate("/billing");
          if (t === "pos_bill") onNavigate("/pos");
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

          <div className="bg-white border border-[#e2ebe5] rounded-xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-xs font-medium text-[#71817a] mb-1">
                Quotation Date
              </label>
              <input
                type="date"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
                className="w-full text-xs rounded-lg border border-[#e2ebe5] p-2 bg-white text-[#172b25]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#71817a] mb-1">
                Validity Period (Valid Until)
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full text-xs rounded-lg border border-[#e2ebe5] p-2 bg-white text-[#172b25]"
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
            termsConditions={termsConditions}
            onTermsConditionsChange={setTermsConditions}
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
            onSaveDraft={handleSaveQuotation}
            onFinalize={handleConvertToInvoice}
            onPreview={() => setShowPreviewModal(true)}
          />
        </div>
      </div>

      {showPreviewModal && (
        <InvoicePreview
          business={business}
          party={selectedParty}
          items={totals.calculatedItems}
          totals={totals}
          documentDate={documentDate}
          documentNumber="QTN-2026-0001"
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </div>
  );
};
