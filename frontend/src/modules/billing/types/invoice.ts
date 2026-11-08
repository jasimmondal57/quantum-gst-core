import type { InvoiceItemDraft } from "./invoiceItem";
import type { Party } from "./party";

export type DocumentType =
  | "sales_invoice"
  | "purchase_bill"
  | "pos_bill"
  | "quotation"
  | "proforma"
  | "credit_note"
  | "debit_note"
  | "delivery_challan";

export type SupplyType =
  | "regular"
  | "export_with_tax"
  | "export_without_tax"
  | "sez_with_tax"
  | "sez_without_tax"
  | "deemed_export"
  | "nil_rated"
  | "exempt"
  | "non_gst";

export type InvoiceStatus = "draft" | "finalized" | "paid" | "partially_paid" | "cancelled";

export interface AdditionalCharge {
  id: string;
  name: string;
  amount: number;
  is_taxable: boolean;
  gst_rate: number;
  tax_amount?: number;
}

export interface PaymentEntry {
  id: string;
  mode: "cash" | "upi" | "bank_transfer" | "cheque" | "card" | "credit";
  amount: number;
  payment_date: string;
  reference?: string;
  bank_account_id?: string;
  notes?: string;
}

export interface TransportDetails {
  transporter_name?: string;
  transporter_id?: string;
  transporter_gstin?: string;
  vehicle_number?: string;
  transport_mode?: "road" | "rail" | "air" | "ship";
  distance_km?: number;
  lr_bilty_number?: string;
  lr_bilty_date?: string;
  dispatch_from_address?: string;
  dispatch_from_state_code?: string;
  ship_to_address?: string;
  ship_to_state_code?: string;
  eway_bill_number?: string;
  eway_bill_date?: string;
}

export interface InvoiceDraft {
  id?: string;
  document_type: DocumentType;
  organization_id: string;
  business_id: string;
  business_gstin_id?: string;
  series_prefix?: string;
  document_number?: string;
  document_date: string;
  due_date?: string;
  financial_year: string;
  status: InvoiceStatus;
  
  // Party / Customer or Supplier
  party_id?: string;
  party_snapshot?: Party;
  
  // Place of supply & GST rules
  place_of_supply_state_code: string;
  place_of_supply_state_name?: string;
  supply_type: SupplyType;
  reverse_charge: boolean;
  is_interstate: boolean;
  
  // Document linkage
  original_document_id?: string;
  original_document_number?: string;
  original_document_date?: string;
  reason_for_note?: string; // For Credit/Debit Notes
  
  // Purchase specific fields
  supplier_invoice_number?: string;
  supplier_invoice_date?: string;
  itc_eligibility?: "eligible" | "ineligible";
  
  // Delivery Challan specific fields
  challan_type?: "job_work" | "supply_on_approval" | "removal_for_exhibition" | "other";
  is_returnable?: boolean;
  
  // Line items
  items: InvoiceItemDraft[];
  
  // Adjustments
  discount_type: "percentage" | "fixed";
  discount_value: number;
  additional_charges: AdditionalCharge[];
  
  // Totals Breakdown
  subtotal: number;
  total_item_discount: number;
  invoice_discount_amount: number;
  taxable_amount: number;
  total_cgst: number;
  total_sgst: number;
  total_utgst: number;
  total_igst: number;
  total_cess: number;
  total_tax_amount: number;
  round_off: number;
  grand_total: number;
  
  // Payments
  payments: PaymentEntry[];
  amount_received: number;
  balance_due: number;
  
  // Transport & Logistics
  transport?: TransportDetails;
  
  // Notes & Meta
  salesperson?: string;
  terms_conditions?: string;
  customer_notes?: string;
  internal_notes?: string;
  bank_details_id?: string;
}

