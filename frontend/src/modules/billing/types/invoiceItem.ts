export interface InvoiceItemDraft {
  id?: string;
  product_id?: string;
  item_type: "goods" | "service";
  item_name: string;
  sku?: string;
  barcode?: string;
  hsn_sac: string;
  description?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  taxable_value: number;
  gst_rate: number; // e.g. 18 for 18%
  cgst_rate?: number;
  cgst_amount?: number;
  sgst_rate?: number;
  sgst_amount?: number;
  igst_rate?: number;
  igst_amount?: number;
  cess_rate?: number;
  cess_amount?: number;
  cess_specific?: number; // specific cess per unit (e.g. tobacco, coal)
  total_tax?: number;
  total_amount: number;
  
  // Advanced inventory tracking fields
  batch_number?: string;
  serial_number?: string;
  expiry_date?: string;
  godown_id?: string;
  godown_name?: string;
}

