import React, { useState } from "react";
import type { Product } from "../../../services/api";
import type { InvoiceItemDraft } from "../types/invoiceItem";

export interface ItemSearchProps {
  products: Product[];
  onSelectProduct: (item: Partial<InvoiceItemDraft>) => void;
  currentName: string;
  onNameChange: (val: string) => void;
}

export const ItemSearch: React.FC<ItemSearchProps> = ({
  products,
  onSelectProduct,
  currentName,
  onNameChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const filtered = products.filter((p) => {
    if (!currentName.trim()) return true;
    const term = currentName.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.sku && p.sku.toLowerCase().includes(term)) ||
      (p.hsn_code && p.hsn_code.includes(term))
    );
  });

  const handleSelect = (p: Product) => {
    onSelectProduct({
      product_id: p.id,
      item_name: p.name,
      sku: p.sku || "",
      hsn_sac: p.hsn_code || "9983",
      unit: p.unit || "NOS",
      unit_price: typeof p.selling_price === "string" ? parseFloat(p.selling_price) : (p.selling_price || 0),
      gst_rate: typeof p.gst_rate === "string" ? parseFloat(p.gst_rate) : (p.gst_rate ?? 18),
    });
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        placeholder="Search product or type name..."
        value={currentName}
        onChange={(e) => {
          onNameChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        className="w-full text-xs rounded border border-[#e2ebe5] px-2 py-1.5 bg-white text-[#172b25] font-medium focus:outline-none focus:border-[#167a55]"
      />

      {isOpen && currentName.length > 0 && (
        <div className="absolute z-40 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white border border-[#e2ebe5] rounded-lg shadow-lg divide-y divide-[#e2ebe5]">
          {filtered.length === 0 ? (
            <div className="p-2 text-center text-xs text-[#71817a]">
              No catalog match. Continuing with custom item.
            </div>
          ) : (
            filtered.map((prod) => (
              <button
                key={prod.id}
                type="button"
                onClick={() => handleSelect(prod)}
                className="w-full text-left p-2 hover:bg-[#eaf6ef] transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#172b25]">{prod.name}</span>
                    {prod.sku && <span className="text-[10px] text-[#71817a]">SKU: {prod.sku}</span>}
                  </div>
                  <div className="text-[11px] text-[#71817a]">
                    HSN: {prod.hsn_code || "9983"} · GST: {prod.gst_rate}%
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-[#167a55]">
                    ₹{Number(prod.selling_price || 0).toFixed(2)}
                  </span>
                  <div className="text-[10px] text-[#71817a]">
                    Stock: {prod.current_stock ?? "—"}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
