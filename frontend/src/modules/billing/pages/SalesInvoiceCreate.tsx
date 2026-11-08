import React, { useState, useEffect } from "react";
import type { BusinessProfile, Customer, Product } from "../../../services/api";
import { api } from "../../../services/api";
import type { DocumentType } from "../types/invoice";
import type { Party } from "../types/party";
import { useInvoiceForm } from "../hooks/useInvoiceForm";
import { useInvoiceTotals } from "../hooks/useInvoiceTotals";
import { DocumentHeader } from "../components/DocumentHeader";
import { DocumentTypeSelector } from "../components/DocumentTypeSelector";
import { PartySelector } from "../components/PartySelector";
import { AddressEditor } from "../components/AddressEditor";
import { DocumentDetails } from "../components/DocumentDetails";
import { InvoiceItemsTable } from "../components/InvoiceItemsTable";
import { DiscountSection } from "../components/DiscountSection";
import { AdditionalCharges } from "../components/AdditionalCharges";
import { GSTSummary } from "../components/GSTSummary";
import { PaymentSection } from "../components/PaymentSection";
import { TransportDetails } from "../components/TransportDetails";
import { InvoiceNotes } from "../components/InvoiceNotes";
import { InvoiceTotals } from "../components/InvoiceTotals";
import { InvoiceActionBar } from "../components/InvoiceActionBar";
import { InvoicePreview } from "./InvoicePreview";

export interface SalesInvoiceCreateProps {
  business: BusinessProfile | null;
  customers: Customer[];
  products: Product[];
  onInvoiceCreated: () => void;
  onNavigate: (route: string) => void;
  onCustomerCreated?: (customer: Customer) => void;
  onProductCreated?: (product: Product) => void;
}

export const SalesInvoiceCreate: React.FC<SalesInvoiceCreateProps> = ({
  business,
  customers,
  products,
  onInvoiceCreated,
  onNavigate,
  onCustomerCreated,
  onProductCreated,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [localCustomers, setLocalCustomers] = useState<Customer[]>(customers);
  const [localProducts, setLocalProducts] = useState<Product[]>(products);

  useEffect(() => {
    setLocalCustomers(customers);
  }, [customers]);

  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  // Derive business organization and GSTIN
  const orgId = business?.organization_id || "00000000-0000-0000-0000-000000000000";
  const bizId = business?.id || "";
  const primaryGstin = business?.gstins?.[0];
  const bizStateCode = primaryGstin?.state_code || "27";

  const handlePartyCreated = (newParty: Party) => {
    const newCust: Customer = {
      id: newParty.id || "",
      business_id: bizId,
      name: newParty.name,
      gstin: newParty.gstin,
      phone: newParty.phone,
      email: newParty.email,
      address: newParty.billing_address,
      state: newParty.billing_state,
      state_code: newParty.billing_state_code || "27",
    };
    setLocalCustomers((prev) => [newCust, ...prev]);
    onCustomerCreated?.(newCust);
  };

  const handleProductCreated = (newProd: Product) => {
    setLocalProducts((prev) => [newProd, ...prev]);
    onProductCreated?.(newProd);
  };

  const {
    documentType,
    setDocumentType,
    selectedParty,
    handleSelectParty,
    documentDate,
    setDocumentDate,
    dueDate,
    setDueDate,
    seriesPrefix,
    setSeriesPrefix,
    placeOfSupply,
    setPlaceOfSupply,
    supplyType,
    setSupplyType,
    reverseCharge,
    setReverseCharge,
    salesperson,
    setSalesperson,
    items,
    addItem,
    removeItem,
    updateItem,
    invoiceDiscountType,
    setInvoiceDiscountType,
    invoiceDiscountValue,
    setInvoiceDiscountValue,
    amountReceived,
    setAmountReceived,
    paymentMode,
    setPaymentMode,
    customerNotes,
    setCustomerNotes,
    termsConditions,
    setTermsConditions,
    invoiceDraft,
    currentFy,
  } = useInvoiceForm({
    initialDocumentType: "sales_invoice",
    businessId: bizId,
    organizationId: orgId,
    businessGstinId: primaryGstin?.id,
    businessStateCode: bizStateCode,
  });

  const totals = useInvoiceTotals({
    items,
    businessStateCode: bizStateCode,
    placeOfSupplyStateCode: placeOfSupply,
    supplyType,
    reverseCharge,
    invoiceDiscountType,
    invoiceDiscountValue,
    additionalCharges: invoiceDraft.additional_charges,
  });

  const handleDocumentTypeChange = (newType: DocumentType) => {
    setDocumentType(newType);
    if (newType === "purchase_bill") {
      onNavigate("/purchases");
    } else if (newType === "pos_bill") {
      onNavigate("/pos");
    }
  };

  const handleFinalize = async () => {
    if (!business) {
      alert("Please configure a business profile first.");
      return;
    }

    if (!items || items.length === 0 || !items[0].item_name.trim()) {
      alert("Please add at least one line item to this invoice.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        organization_id: orgId,
        business_id: bizId,
        business_gstin_id: primaryGstin?.id,
        customer_id: selectedParty?.id,
        invoice_date: documentDate,
        due_date: dueDate || null,
        invoice_type: "tax_invoice",
        supply_type: supplyType,
        place_of_supply_state_code: placeOfSupply,
        reverse_charge: reverseCharge,
        items: totals.calculatedItems.map((item) => ({
          product_id: item.product_id,
          item_name: item.item_name,
          hsn_sac: item.hsn_sac || "9983",
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          gst_rate: item.gst_rate,
          cess_rate: item.cess_rate || 0,
          cess_specific: item.cess_specific || 0,
        })),
      };

      const res = await api.post("/invoices", payload);
      alert(`Success! Invoice ${res.data.invoice_number || ""} has been issued & accounting ledger posted.`);
      onInvoiceCreated();
      onNavigate("/sales");
    } catch (err: unknown) {
      console.error("Failed to finalize invoice:", err);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to finalize statutory invoice. Please verify GST parameters.";
      alert(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = () => {
    localStorage.setItem(`quantum_draft_${bizId}`, JSON.stringify(invoiceDraft));
    alert("Draft saved locally. You can recover it anytime.");
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-8">
      {/* 1. Header */}
      <DocumentHeader
        documentType={documentType}
        financialYear={currentFy}
        status={invoiceDraft.status}
        isSaving={isSaving}
        onBack={() => onNavigate("/sales")}
        onSaveDraft={handleSaveDraft}
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
        {/* Left Column: Form Sections (8 of 12 cols on desktop) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Party Selection & Address */}
          <PartySelector
            partyType="customer"
            businessId={bizId}
            selectedParty={selectedParty}
            parties={localCustomers.map((c) => ({
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
            onPartyCreated={handlePartyCreated}
          />

          <AddressEditor
            party={selectedParty}
            onUpdateParty={(updates) => {
              if (selectedParty) {
                handleSelectParty({ ...selectedParty, ...updates });
              }
            }}
          />

          {/* Document & Tax Parameters */}
          <DocumentDetails
            documentDate={documentDate}
            onDateChange={setDocumentDate}
            dueDate={dueDate}
            onDueDateChange={setDueDate}
            placeOfSupply={placeOfSupply}
            onPlaceOfSupplyChange={setPlaceOfSupply}
            supplyType={supplyType}
            onSupplyTypeChange={setSupplyType}
            reverseCharge={reverseCharge}
            onReverseChargeChange={setReverseCharge}
            salesperson={salesperson}
            onSalespersonChange={setSalesperson}
            seriesPrefix={seriesPrefix}
            onSeriesPrefixChange={setSeriesPrefix}
          />

          {/* Line Items Table */}
          <InvoiceItemsTable
            businessId={bizId}
            items={items}
            products={localProducts}
            onAddItem={addItem}
            onUpdateItem={updateItem}
            onRemoveItem={removeItem}
            onProductCreated={handleProductCreated}
          />

          {/* Collapsible Adjustments: Discounts, Additional Charges, Tax Summary */}
          <div className="space-y-3">
            <DiscountSection
              discountType={invoiceDiscountType}
              discountValue={invoiceDiscountValue}
              onTypeChange={setInvoiceDiscountType}
              onValueChange={setInvoiceDiscountValue}
              calculatedDiscountAmount={totals.invoiceDiscountAmount}
            />

            <AdditionalCharges
              charges={invoiceDraft.additional_charges}
              onChange={(updatedCharges) => {
                invoiceDraft.additional_charges = updatedCharges;
              }}
            />

            <GSTSummary totals={totals} />
          </div>

          {/* Payment, Logistics & Notes */}
          <PaymentSection
            grandTotal={totals.grandTotal}
            amountReceived={amountReceived}
            onAmountReceivedChange={setAmountReceived}
            paymentMode={paymentMode}
            onPaymentModeChange={setPaymentMode}
          />

          <TransportDetails
            transport={invoiceDraft.transport}
            onChange={(updates) => {
              invoiceDraft.transport = { ...invoiceDraft.transport, ...updates };
            }}
          />

          <InvoiceNotes
            termsConditions={termsConditions}
            onTermsConditionsChange={setTermsConditions}
            customerNotes={customerNotes}
            onCustomerNotesChange={setCustomerNotes}
          />
        </div>

        {/* Right Sticky Column: Summary & Final Actions (4 of 12 cols on desktop) */}
        <div className="lg:col-span-4 sticky top-4">
          <InvoiceTotals
            totals={totals}
            amountReceived={amountReceived}
            itemCount={items.length}
            isSaving={isSaving}
            onSaveDraft={handleSaveDraft}
            onFinalize={handleFinalize}
            onPreview={() => setShowPreviewModal(true)}
          />
        </div>
      </div>

      {/* Floating Bottom Bar for Mobile Viewports */}
      <InvoiceActionBar
        grandTotal={totals.grandTotal}
        balanceDue={Math.max(0, totals.grandTotal - amountReceived)}
        isSaving={isSaving}
        onSaveDraft={handleSaveDraft}
        onFinalize={handleFinalize}
        onPreview={() => setShowPreviewModal(true)}
      />

      {/* Live Invoice Preview Modal */}
      {showPreviewModal && (
        <InvoicePreview
          business={business}
          party={selectedParty}
          items={totals.calculatedItems}
          totals={totals}
          documentDate={documentDate}
          documentNumber={invoiceDraft.document_number || "INV-2026-DRAFT"}
          termsConditions={termsConditions}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </div>
  );
};

