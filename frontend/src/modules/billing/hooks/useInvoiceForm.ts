import { useState, useEffect, useCallback } from "react";
import type { InvoiceDraft, DocumentType, SupplyType } from "../types/invoice";
import type { InvoiceItemDraft } from "../types/invoiceItem";
import type { Party } from "../types/party";

const DEFAULT_ITEM: InvoiceItemDraft = {
  item_type: "goods",
  item_name: "",
  hsn_sac: "",
  quantity: 1,
  unit: "NOS",
  unit_price: 0,
  discount_type: "percentage",
  discount_value: 0,
  taxable_value: 0,
  gst_rate: 18,
  total_amount: 0,
};

export interface UseInvoiceFormProps {
  initialDocumentType?: DocumentType;
  businessId: string;
  organizationId: string;
  businessGstinId?: string;
  businessStateCode?: string;
}

export function useInvoiceForm({
  initialDocumentType = "sales_invoice",
  businessId,
  organizationId,
  businessGstinId,
  businessStateCode = "27",
}: UseInvoiceFormProps) {
  const currentFy = (() => {
    const d = new Date();
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const fyStart = m >= 4 ? y : y - 1;
    return `${fyStart}-${String(fyStart + 1).slice(-2)}`;
  })();

  const [documentType, setDocumentType] = useState<DocumentType>(initialDocumentType);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [documentDate, setDocumentDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState<string>("");
  const [seriesPrefix, setSeriesPrefix] = useState<string>("INV/");
  const [placeOfSupply, setPlaceOfSupply] = useState<string>(businessStateCode);
  const [supplyType, setSupplyType] = useState<SupplyType>("regular");
  const [reverseCharge, setReverseCharge] = useState<boolean>(false);
  const [salesperson, setSalesperson] = useState<string>("");
  const [items, setItems] = useState<InvoiceItemDraft[]>([{ ...DEFAULT_ITEM }]);
  const [invoiceDiscountType, setInvoiceDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [invoiceDiscountValue, setInvoiceDiscountValue] = useState<number>(0);
  const [customerNotes, setCustomerNotes] = useState<string>("");
  const [termsConditions, setTermsConditions] = useState<string>(
    "1. Goods once sold will not be taken back.\n2. Payment due within 15 days of invoice date."
  );
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi" | "bank_transfer" | "cheque" | "card" | "credit">("cash");

  // Purchase specific fields
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState<string>("");
  const [supplierInvoiceDate, setSupplierInvoiceDate] = useState<string>("");
  const [itcEligibility, setItcEligibility] = useState<"eligible" | "ineligible">("eligible");

  // Credit/Debit note specific fields
  const [originalDocumentNumber, setOriginalDocumentNumber] = useState<string>("");
  const [reasonForNote, setReasonForNote] = useState<string>("Sales Return");

  // Update place of supply automatically when party changes
  const handleSelectParty = useCallback((party: Party | null) => {
    setSelectedParty(party);
    if (party?.billing_state_code) {
      setPlaceOfSupply(party.billing_state_code);
    }
  }, []);

  const addItem = useCallback((item?: Partial<InvoiceItemDraft>) => {
    setItems((prev) => [...prev, { ...DEFAULT_ITEM, ...item }]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => {
      if (prev.length <= 1) return [{ ...DEFAULT_ITEM }];
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const updateItem = useCallback((index: number, updates: Partial<InvoiceItemDraft>) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  }, []);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid if user is currently inside an input or textarea
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (isInput && !["F2", "F3", "F8", "F9"].includes(e.key)) {
        return;
      }

      if (e.key === "F2") {
        e.preventDefault();
        const partyBtn = document.getElementById("party-search-input");
        partyBtn?.focus();
      } else if (e.key === "F3") {
        e.preventDefault();
        addItem();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [addItem]);

  const invoiceDraft: InvoiceDraft = {
    document_type: documentType,
    organization_id: organizationId,
    business_id: businessId,
    business_gstin_id: businessGstinId,
    series_prefix: seriesPrefix,
    document_date: documentDate,
    due_date: dueDate || undefined,
    financial_year: currentFy,
    status: "draft",
    party_id: selectedParty?.id,
    party_snapshot: selectedParty || undefined,
    place_of_supply_state_code: placeOfSupply,
    supply_type: supplyType,
    reverse_charge: reverseCharge,
    is_interstate: placeOfSupply !== businessStateCode,
    supplier_invoice_number: supplierInvoiceNumber,
    supplier_invoice_date: supplierInvoiceDate,
    itc_eligibility: itcEligibility,
    original_document_number: originalDocumentNumber,
    reason_for_note: reasonForNote,
    items,
    discount_type: invoiceDiscountType,
    discount_value: invoiceDiscountValue,
    additional_charges: [],
    subtotal: 0,
    total_item_discount: 0,
    invoice_discount_amount: 0,
    taxable_amount: 0,
    total_cgst: 0,
    total_sgst: 0,
    total_utgst: 0,
    total_igst: 0,
    total_cess: 0,
    total_tax_amount: 0,
    round_off: 0,
    grand_total: 0,
    payments: amountReceived > 0 ? [{
      id: "p1",
      mode: paymentMode,
      amount: amountReceived,
      payment_date: documentDate,
    }] : [],
    amount_received: amountReceived,
    balance_due: 0,
    salesperson,
    terms_conditions: termsConditions,
    customer_notes: customerNotes,
  };

  return {
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
    setItems,
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
    supplierInvoiceNumber,
    setSupplierInvoiceNumber,
    supplierInvoiceDate,
    setSupplierInvoiceDate,
    itcEligibility,
    setItcEligibility,
    originalDocumentNumber,
    setOriginalDocumentNumber,
    reasonForNote,
    setReasonForNote,
    invoiceDraft,
    currentFy,
  };
}
