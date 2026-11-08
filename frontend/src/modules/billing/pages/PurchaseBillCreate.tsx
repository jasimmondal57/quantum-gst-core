import React, { useState } from "react";
import type { BusinessProfile, Customer, Product } from "../../../services/api";
import { api } from "../../../services/api";
import type { DocumentType } from "../types/invoice";
import { useInvoiceForm } from "../hooks/useInvoiceForm";
import { useInvoiceTotals } from "../hooks/useInvoiceTotals";
import { DocumentHeader } from "../components/DocumentHeader";
import { DocumentTypeSelector } from "../components/DocumentTypeSelector";
import { PartySelector } from "../components/PartySelector";
import { AddressEditor } from "../components/AddressEditor";
import { InvoiceItemsTable } from "../components/InvoiceItemsTable";
import { GSTSummary } from "../components/GSTSummary";
import { PaymentSection } from "../components/PaymentSection";
import { InvoiceNotes } from "../components/InvoiceNotes";
import { InvoiceTotals } from "../components/InvoiceTotals";
import { InvoiceActionBar } from "../components/InvoiceActionBar";
import { InvoicePreview } from "./InvoicePreview";

export interface PurchaseBillCreateProps {
  business: BusinessProfile | null;
  suppliers: Customer[];
  products: Product[];
  onPurchaseCreated: () => void;
  onNavigate: (route: string) => void;
}

export const PurchaseBillCreate: React.FC<PurchaseBillCreateProps> = ({
  business,
  suppliers,
  products,
  onPurchaseCreated,
  onNavigate,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

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
    dueDate,
    setDueDate,
    placeOfSupply,
    reverseCharge,
    setReverseCharge,
    items,
    addItem,
    removeItem,
    updateItem,
    amountReceived,
    setAmountReceived,
    paymentMode,
    setPaymentMode,
    customerNotes,
    setCustomerNotes,
    supplierInvoiceNumber,
    setSupplierInvoiceNumber,
    supplierInvoiceDate,
    setSupplierInvoiceDate,
    itcEligibility,
    setItcEligibility,
    currentFy,
  } = useInvoiceForm({
    initialDocumentType: "purchase_bill",
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
    reverseCharge,
    invoiceDiscountType: "percentage",
    invoiceDiscountValue: 0,
    additionalCharges: [],
  });

  const handleDocumentTypeChange = (newType: DocumentType) => {
    setDocumentType(newType);
    if (newType === "sales_invoice") {
      onNavigate("/billing");
    } else if (newType === "pos_bill") {
      onNavigate("/pos");
    }
  };

  const handleFinalize = async () => {
    if (!business) {
      alert("Please select an active business profile.");
      return;
    }

    if (!supplierInvoiceNumber.trim()) {
      alert("Please enter the Supplier's Original Bill / Invoice Number.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        organization_id: orgId,
        business_id: bizId,
        supplier_id: selectedParty?.id,
        supplier_invoice_number: supplierInvoiceNumber.trim(),
        supplier_invoice_date: supplierInvoiceDate || documentDate,
        bill_date: documentDate,
        due_date: dueDate || null,
        itc_eligibility: itcEligibility,
        reverse_charge: reverseCharge,
        taxable_amount: totals.taxableAmount,
        cgst_amount: totals.totalCgst,
        sgst_amount: totals.totalSgst + totals.totalUtgst,
        igst_amount: totals.totalIgst,
        cess_amount: totals.totalCess,
        total_tax: totals.totalTaxAmount,
        total_amount: totals.grandTotal,
        amount_paid: amountReceived,
        payment_status: amountReceived >= totals.grandTotal ? "paid" : amountReceived > 0 ? "partial" : "unpaid",
        notes: customerNotes,
        items: totals.calculatedItems.map((item) => ({
          product_id: item.product_id,
          item_name: item.item_name,
          hsn_sac: item.hsn_sac || "9983",
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          gst_rate: item.gst_rate,
          taxable_amount: item.taxable_value,
          total_amount: item.total_amount,
        })),
      };

      await api.createPurchase(payload);
      alert(`Success! Purchase bill ${supplierInvoiceNumber} recorded and Input Tax Credit (ITC) registered.`);
      onPurchaseCreated();
      onNavigate("/purchases");
    } catch (err: unknown) {
      console.error("Failed to record purchase bill:", err);
      const msg = (err as Error)?.message || "Failed to record purchase bill";
      alert(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-8">
      {/* 1. Header */}
      <DocumentHeader
        documentType="purchase_bill"
        financialYear={currentFy}
        status="draft"
        isSaving={isSaving}
        onBack={() => onNavigate("/purchases")}
        onSaveDraft={() => alert("Purchase bill draft saved")}
        onFinalize={handleFinalize}
        onPreview={() => setShowPreviewModal(true)}
      />

      {/* 2. Document Type Switcher */}
      <DocumentTypeSelector
        currentType={documentType}
        onSelectType={handleDocumentTypeChange}
      />

      {/* 3. Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-4">
          {/* Supplier Selector */}
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

          <AddressEditor
            party={selectedParty}
            onUpdateParty={(updates) => {
              if (selectedParty) {
                handleSelectParty({ ...selectedParty, ...updates });
              }
            }}
          />

          {/* Supplier Bill Reference & ITC Eligibility */}
          <div className="bg-white border border-[#e2ebe5] rounded-xl p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-[#172b25] uppercase tracking-wider">
              Supplier Bill Reference & ITC Classification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-xs font-medium text-[#71817a] mb-1">
                  Supplier Invoice No. *
                </label>
                <input
                  type="text"
                  value={supplierInvoiceNumber}
                  onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                  placeholder="e.g. SUPP/2026/0882"
                  required
                  className="w-full text-xs rounded-lg border border-[#e2ebe5] p-2 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#71817a] mb-1">
                  Supplier Bill Date
                </label>
                <input
                  type="date"
                  value={supplierInvoiceDate}
                  onChange={(e) => setSupplierInvoiceDate(e.target.value)}
                  className="w-full text-xs rounded-lg border border-[#e2ebe5] p-2 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#71817a] mb-1">
                  Accounting / Bill Date
                </label>
                <input
                  type="date"
                  value={documentDate}
                  onChange={(e) => setDocumentDate(e.target.value)}
                  className="w-full text-xs rounded-lg border border-[#e2ebe5] p-2 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#71817a] mb-1">
                  Payment Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-xs rounded-lg border border-[#e2ebe5] p-2 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#71817a] mb-1">
                  ITC Eligibility
                </label>
                <select
                  value={itcEligibility}
                  onChange={(e) => setItcEligibility(e.target.value as "eligible" | "ineligible")}
                  className="w-full text-xs rounded-lg border border-[#e2ebe5] p-2 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
                >
                  <option value="eligible">Eligible for ITC (All Other ITC)</option>
                  <option value="ineligible">Ineligible (Blocked Credits u/s 17(5))</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#71817a] mb-1">
                  Reverse Charge Applicable
                </label>
                <select
                  value={reverseCharge ? "yes" : "no"}
                  onChange={(e) => setReverseCharge(e.target.value === "yes")}
                  className="w-full text-xs rounded-lg border border-[#e2ebe5] p-2 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
                >
                  <option value="no">No (Standard ITC)</option>
                  <option value="yes">Yes (RCM Tax Payable by Us)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <InvoiceItemsTable
            items={items}
            products={products}
            onAddItem={addItem}
            onUpdateItem={updateItem}
            onRemoveItem={removeItem}
          />

          <GSTSummary totals={totals} />

          {/* Payment to Supplier */}
          <PaymentSection
            grandTotal={totals.grandTotal}
            amountReceived={amountReceived}
            onAmountReceivedChange={setAmountReceived}
            paymentMode={paymentMode}
            onPaymentModeChange={setPaymentMode}
          />

          <InvoiceNotes
            termsConditions="Supplier bill verified and stock physically received into warehouse."
            onTermsConditionsChange={() => {}}
            customerNotes={customerNotes}
            onCustomerNotesChange={setCustomerNotes}
          />
        </div>

        {/* Right Sticky Summary */}
        <div className="lg:col-span-4 sticky top-4">
          <InvoiceTotals
            totals={totals}
            amountReceived={amountReceived}
            itemCount={items.length}
            isSaving={isSaving}
            onSaveDraft={() => alert("Draft saved")}
            onFinalize={handleFinalize}
            onPreview={() => setShowPreviewModal(true)}
          />
        </div>
      </div>

      <InvoiceActionBar
        grandTotal={totals.grandTotal}
        balanceDue={Math.max(0, totals.grandTotal - amountReceived)}
        isSaving={isSaving}
        onSaveDraft={() => alert("Draft saved")}
        onFinalize={handleFinalize}
        onPreview={() => setShowPreviewModal(true)}
      />

      {showPreviewModal && (
        <InvoicePreview
          business={business}
          party={selectedParty}
          items={totals.calculatedItems}
          totals={totals}
          documentDate={documentDate}
          documentNumber={supplierInvoiceNumber || "BILL-DRAFT"}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </div>
  );
};
