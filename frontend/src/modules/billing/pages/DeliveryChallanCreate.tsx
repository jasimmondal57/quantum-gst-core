import React, { useState } from "react";
import type { BusinessProfile, Customer, Product } from "../../../services/api";
import { useInvoiceForm } from "../hooks/useInvoiceForm";
import { DocumentHeader } from "../components/DocumentHeader";
import { DocumentTypeSelector } from "../components/DocumentTypeSelector";
import { PartySelector } from "../components/PartySelector";
import { InvoiceItemsTable } from "../components/InvoiceItemsTable";
import { TransportDetails } from "../components/TransportDetails";
import { InvoiceNotes } from "../components/InvoiceNotes";

export interface DeliveryChallanCreateProps {
  business: BusinessProfile | null;
  customers: Customer[];
  products: Product[];
  onNavigate: (route: string) => void;
}

export const DeliveryChallanCreate: React.FC<DeliveryChallanCreateProps> = ({
  business,
  customers,
  products,
  onNavigate,
}) => {
  const [challanType, setChallanType] = useState<string>("job_work");
  const [isReturnable, setIsReturnable] = useState(true);

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
    items,
    addItem,
    removeItem,
    updateItem,
    customerNotes,
    setCustomerNotes,
    invoiceDraft,
    currentFy,
  } = useInvoiceForm({
    initialDocumentType: "delivery_challan",
    businessId: bizId,
    organizationId: orgId,
    businessGstinId: primaryGstin?.id,
    businessStateCode: bizStateCode,
  });

  const handleIssueChallan = () => {
    alert("Success! Delivery Challan issued u/r 55 of CGST Rules for goods movement without tax liability.");
    onNavigate("/sales");
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-8">
      <DocumentHeader
        documentType="delivery_challan"
        financialYear={currentFy}
        status="draft"
        isSaving={false}
        onBack={() => onNavigate("/sales")}
        onSaveDraft={() => alert("Challan draft saved")}
        onFinalize={handleIssueChallan}
        onPreview={() => {}}
      />

      <DocumentTypeSelector
        currentType={documentType}
        onSelectType={(t) => {
          setDocumentType(t);
          if (t === "sales_invoice") onNavigate("/billing");
        }}
      />

      <div className="space-y-4 max-w-5xl">
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

        <div className="bg-white border border-[#e2ebe5] rounded-xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-medium text-[#71817a] mb-1">
              Challan Date
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
              Movement Purpose (Rule 55)
            </label>
            <select
              value={challanType}
              onChange={(e) => setChallanType(e.target.value)}
              className="w-full rounded-lg border border-[#e2ebe5] p-2 bg-white text-[#172b25]"
            >
              <option value="job_work">Supply for Job Work</option>
              <option value="approval">Supply on Approval / Return</option>
              <option value="exhibition">Removal for Exhibition / Demonstration</option>
              <option value="other">Other Goods Movement</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-[#71817a] mb-1">
              Goods Nature
            </label>
            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-1.5 text-xs text-[#172b25] cursor-pointer">
                <input
                  type="radio"
                  name="returnable"
                  checked={isReturnable}
                  onChange={() => setIsReturnable(true)}
                  className="text-[#167a55]"
                />
                Returnable
              </label>
              <label className="flex items-center gap-1.5 text-xs text-[#172b25] cursor-pointer">
                <input
                  type="radio"
                  name="returnable"
                  checked={!isReturnable}
                  onChange={() => setIsReturnable(false)}
                  className="text-[#167a55]"
                />
                Non-Returnable
              </label>
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

        <TransportDetails
          transport={invoiceDraft.transport}
          onChange={(updates) => {
            invoiceDraft.transport = { ...invoiceDraft.transport, ...updates };
          }}
        />

        <InvoiceNotes
          termsConditions="Delivery Challan issued under Rule 55 of CGST Rules, 2017. Not a Tax Invoice."
          onTermsConditionsChange={() => {}}
          customerNotes={customerNotes}
          onCustomerNotesChange={setCustomerNotes}
        />

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleIssueChallan}
            className="px-6 py-2.5 bg-[#167a55] text-white text-xs font-bold rounded-lg hover:bg-[#136949] shadow-sm transition-all"
          >
            Issue Delivery Challan
          </button>
        </div>
      </div>
    </div>
  );
};
