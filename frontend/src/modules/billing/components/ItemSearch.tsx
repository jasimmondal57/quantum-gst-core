import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Plus, Package } from "lucide-react";
import type { Product } from "../../../services/api";
import type { InvoiceItemDraft } from "../types/invoiceItem";
import { ProductQuickCreate } from "./ProductQuickCreate";

export interface ItemSearchProps {
  products: Product[];
  onSelectProduct: (item: Partial<InvoiceItemDraft>) => void;
  currentName: string;
  onNameChange: (val: string) => void;
  businessId?: string;
  onProductCreated?: (product: Product) => void;
}

export const ItemSearch: React.FC<ItemSearchProps> = ({
  products,
  onSelectProduct,
  currentName,
  onNameChange,
  businessId = "",
  onProductCreated,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 340,
  });

  const filtered = products.filter((p) => {
    if (!currentName.trim()) return true;
    const term = currentName.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.sku && p.sku.toLowerCase().includes(term)) ||
      (p.hsn_code && p.hsn_code.includes(term)) ||
      (p.hsn_sac && p.hsn_sac.includes(term))
    );
  });

  // Option count: items in filtered list + 1 quick-add action
  const totalOptions = filtered.length + 1;
  const isCreateHighlighted = highlightedIndex === filtered.length;

  const updatePosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;

      // Calculate top/bottom placement if too close to screen bottom
      let top = rect.bottom + 4;
      if (spaceBelow < 220 && rect.top > 220) {
        top = Math.max(10, rect.top - 240);
      }

      const screenPadding = 8;
      const width = Math.min(Math.max(rect.width, 340), window.innerWidth - screenPadding * 2);
      let left = rect.left;
      if (left + width > window.innerWidth - screenPadding) {
        left = window.innerWidth - width - screenPadding;
      }
      if (left < screenPadding) {
        left = screenPadding;
      }

      setCoords({
        top,
        left,
        width,
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScrollOrResize = () => updatePosition();
      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize);
      return () => {
        window.removeEventListener("scroll", handleScrollOrResize, true);
        window.removeEventListener("resize", handleScrollOrResize);
      };
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        inputRef.current &&
        !inputRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (p: Product) => {
    const rate = typeof p.selling_price === "string"
      ? parseFloat(p.selling_price)
      : (p.selling_price ?? (typeof p.sale_price === "string" ? parseFloat(p.sale_price) : 0));

    const gst = typeof p.gst_rate === "string" ? parseFloat(p.gst_rate) : (p.gst_rate ?? 18);

    onSelectProduct({
      product_id: p.id,
      item_name: p.name,
      sku: p.sku || "",
      hsn_sac: p.hsn_code || p.hsn_sac || "9983",
      unit: p.unit || "NOS",
      unit_price: rate,
      gst_rate: gst,
      tax_inclusive: !!p.tax_inclusive,
    });
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setIsOpen(true);
        updatePosition();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < totalOptions - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : totalOptions - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
        handleSelect(filtered[highlightedIndex]);
      } else if (isCreateHighlighted || filtered.length === 0) {
        setShowQuickCreate(true);
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const handleProductSaved = (newProd: Product) => {
    onProductCreated?.(newProd);
    handleSelect(newProd);
    setShowQuickCreate(false);
  };

  return (
    <>
      <div className="relative w-full">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search product or enter name..."
          value={currentName}
          onChange={(e) => {
            onNameChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => {
            setIsOpen(true);
            updatePosition();
          }}
          onKeyDown={handleKeyDown}
          className="w-full text-xs rounded border border-[#e2ebe5] px-2.5 py-1.5 bg-white text-[#172b25] font-medium focus:outline-none focus:border-[#167a55] focus:ring-1 focus:ring-[#167a55]"
        />
      </div>

      {/* Render overlay dropdown via React Portal to document.body to avoid table overflow-x-auto clipping */}
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 9999,
            }}
            className="bg-white border border-[#b8e2cd] rounded-xl shadow-2xl overflow-hidden divide-y divide-[#e2ebe5] animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="max-h-56 overflow-y-auto overscroll-contain divide-y divide-[#f0f4f2]">
              {filtered.length === 0 ? (
                <div className="p-3 text-center">
                  <Package className="w-5 h-5 mx-auto text-[#71817a]/50 mb-1" />
                  <p className="text-xs text-[#71817a]">No catalog item matching &quot;{currentName}&quot;</p>
                </div>
              ) : (
                filtered.map((prod, idx) => {
                  const isHighlighted = idx === highlightedIndex;
                  const price = prod.selling_price ?? prod.sale_price ?? 0;
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleSelect(prod)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`w-full text-left p-2.5 transition-colors flex items-center justify-between ${
                        isHighlighted ? "bg-[#eaf6ef] text-[#167a55]" : "hover:bg-[#f5f8f6] text-[#172b25]"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold truncate">{prod.name}</span>
                          {prod.sku && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-[#71817a]">
                              {prod.sku}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#71817a] mt-0.5">
                          HSN: {prod.hsn_code || prod.hsn_sac || "9983"} · GST: {prod.gst_rate ?? 18}%
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-[#167a55]">
                          ₹{Number(price).toFixed(2)}
                        </span>
                        <div className="text-[10px] text-[#71817a]">
                          {prod.unit || "NOS"}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Quick Add Product Action Row */}
            <div className="p-1.5 bg-[#f5f8f6]">
              <button
                type="button"
                onClick={() => {
                  setShowQuickCreate(true);
                  setIsOpen(false);
                }}
                onMouseEnter={() => setHighlightedIndex(filtered.length)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                  isCreateHighlighted
                    ? "bg-[#167a55] text-white shadow-sm"
                    : "text-[#167a55] hover:bg-[#eaf6ef]"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  {currentName.trim()
                    ? `+ Add "${currentName.trim()}" to Catalog`
                    : "+ Add New Product / Service"}
                </span>
                <span className={`text-[10px] ${isCreateHighlighted ? "text-white/80" : "text-[#71817a]"}`}>
                  Enter ↵
                </span>
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* Quick Add Product Modal */}
      <ProductQuickCreate
        isOpen={showQuickCreate}
        businessId={businessId}
        initialName={currentName}
        onClose={() => setShowQuickCreate(false)}
        onSaved={handleProductSaved}
      />
    </>
  );
};
