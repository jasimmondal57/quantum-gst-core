import React from "react";
import { Plus, Barcode, PackagePlus, Layers } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import type { InvoiceItemDraft } from "../types/invoiceItem";
import type { Product } from "../../../services/api";
import { InvoiceItemRow } from "./InvoiceItemRow";

export interface InvoiceItemsTableProps {
  items: InvoiceItemDraft[];
  products: Product[];
  onAddItem: (item?: Partial<InvoiceItemDraft>) => void;
  onUpdateItem: (index: number, updates: Partial<InvoiceItemDraft>) => void;
  onRemoveItem: (index: number) => void;
}

export const InvoiceItemsTable: React.FC<InvoiceItemsTableProps> = ({
  items,
  products,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
}) => {
  return (
    <div className="bg-white border border-[#e2ebe5] rounded-xl overflow-hidden shadow-sm space-y-0">
      <div className="p-3 bg-[#f5f8f6] border-b border-[#e2ebe5] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#167a55]" />
          <h3 className="text-xs font-bold text-[#172b25] uppercase tracking-wider">
            Items & Services
          </h3>
          <span className="text-[11px] font-medium text-[#71817a]">
            ({items.length} {items.length === 1 ? "Line Item" : "Line Items"})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const barcode = prompt("Scan or enter product barcode:");
              if (barcode) {
                const match = products.find((p) => p.sku === barcode || p.barcode === barcode);
                if (match) {
                  onAddItem({
                    product_id: match.id,
                    item_name: match.name,
                    sku: match.sku || "",
                    hsn_sac: match.hsn_code || "9983",
                    unit_price: typeof match.selling_price === "string" ? parseFloat(match.selling_price) : (match.selling_price || 0),
                    gst_rate: typeof match.gst_rate === "string" ? parseFloat(match.gst_rate) : (match.gst_rate ?? 18),
                  });
                } else {
                  alert(`No product found with barcode: ${barcode}`);
                }
              }
            }}
            icon={<Barcode className="w-3.5 h-3.5" />}
          >
            Scan Barcode
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => onAddItem({ item_type: "goods" })}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Item <span className="ml-1 text-[10px] text-white/80">(F3)</span>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="billing-table-header border-b border-[#e2ebe5]">
              <th className="p-2 text-center w-10">#</th>
              <th className="p-2 min-w-[200px]">Product / Service Description</th>
              <th className="p-2 w-24 text-center">HSN/SAC</th>
              <th className="p-2 w-20 text-right">Qty</th>
              <th className="p-2 w-20 text-center">Unit</th>
              <th className="p-2 w-28 text-right">Rate (₹)</th>
              <th className="p-2 w-24 text-right">Discount</th>
              <th className="p-2 w-24 text-right">Taxable (₹)</th>
              <th className="p-2 w-24 text-center">GST Rate</th>
              <th className="p-2 w-24 text-right">Tax (₹)</th>
              <th className="p-2 w-28 text-right">Total (₹)</th>
              <th className="p-2 w-16 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <InvoiceItemRow
                key={item.id || idx}
                index={idx}
                item={item}
                products={products}
                onUpdate={(updates) => onUpdateItem(idx, updates)}
                onRemove={() => onRemoveItem(idx)}
                canRemove={items.length > 1}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-[#f5f8f6]/50 border-t border-[#e2ebe5] flex items-center justify-between">
        <Button
          type="button"
          variant="soft"
          size="sm"
          onClick={() => onAddItem({ item_type: "service", unit: "HRS", hsn_sac: "9983" })}
          icon={<PackagePlus className="w-3.5 h-3.5" />}
        >
          + Add Service Line
        </Button>

        <span className="text-[11px] text-[#71817a]">
          Pro-tip: Press <kbd className="shortcut-kbd">F3</kbd> anytime to append a new item row.
        </span>
      </div>
    </div>
  );
};
