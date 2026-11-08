import React, { useState, useRef, useEffect } from "react";
import { Plus, Barcode, PackagePlus, Layers, ListPlus, Search, CheckSquare, Square, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { Badge } from "../../../components/ui/Badge";
import type { InvoiceItemDraft } from "../types/invoiceItem";
import type { Product } from "../../../services/api";
import { InvoiceItemRow } from "./InvoiceItemRow";

export interface InvoiceItemsTableProps {
  businessId?: string;
  items: InvoiceItemDraft[];
  products: Product[];
  onAddItem: (item?: Partial<InvoiceItemDraft>) => void;
  onUpdateItem: (index: number, updates: Partial<InvoiceItemDraft>) => void;
  onRemoveItem: (index: number) => void;
  onProductCreated?: (product: Product) => void;
}

export const InvoiceItemsTable: React.FC<InvoiceItemsTableProps> = ({
  businessId,
  items,
  products,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onProductCreated,
}) => {
  const [showBulkPicker, setShowBulkPicker] = useState(false);
  const [bulkSearch, setBulkSearch] = useState("");
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scannedCode, setScannedCode] = useState("");
  const [scannerFeedback, setScannerFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showBarcodeScanner && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [showBarcodeScanner]);

  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const code = scannedCode.trim();
    if (!code) return;

    const match = products.find(
      (p) =>
        (p.sku && p.sku.toLowerCase() === code.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase() === code.toLowerCase()) ||
        p.id === code
    );

    if (match) {
      const rate = typeof match.selling_price === "string"
        ? parseFloat(match.selling_price)
        : (match.selling_price ?? (typeof match.sale_price === "string" ? parseFloat(match.sale_price) : 0));
      const gst = typeof match.gst_rate === "number"
        ? match.gst_rate
        : (typeof match.gst_rate === "string" && !isNaN(parseFloat(match.gst_rate)) ? parseFloat(match.gst_rate) : 0);

      onAddItem({
        product_id: match.id,
        item_name: match.name,
        sku: match.sku || "",
        hsn_sac: match.hsn_code || match.hsn_sac || "",
        unit: match.unit || "NOS",
        unit_price: rate,
        gst_rate: gst,
        tax_inclusive: !!match.tax_inclusive,
      });

      setScannerFeedback({
        type: "success",
        message: `✓ Added "${match.name}" (Rate: ₹${rate.toFixed(2)})`,
      });
      setScannedCode("");
    } else {
      setScannerFeedback({
        type: "error",
        message: `✕ No catalog item matches barcode / SKU "${code}"`,
      });
    }

    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  const toggleSelectProduct = (productId: string) => {
    setSelectedQuantities((prev) => {
      const next = { ...prev };
      if (next[productId]) {
        delete next[productId];
      } else {
        next[productId] = 1;
      }
      return next;
    });
  };

  const updateQuantity = (productId: string, qty: number) => {
    setSelectedQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, qty),
    }));
  };

  const handleConfirmBulkAdd = () => {
    const selectedIds = Object.keys(selectedQuantities);
    if (selectedIds.length === 0) return;

    selectedIds.forEach((id) => {
      const match = products.find((p) => p.id === id);
      if (match) {
        const rate = typeof match.selling_price === "string"
          ? parseFloat(match.selling_price)
          : (match.selling_price ?? (typeof match.sale_price === "string" ? parseFloat(match.sale_price) : 0));
        const gst = typeof match.gst_rate === "number"
          ? match.gst_rate
          : (typeof match.gst_rate === "string" && !isNaN(parseFloat(match.gst_rate)) ? parseFloat(match.gst_rate) : 0);

        onAddItem({
          product_id: match.id,
          item_name: match.name,
          sku: match.sku || "",
          hsn_sac: match.hsn_code || match.hsn_sac || "",
          unit: match.unit || "NOS",
          quantity: selectedQuantities[id] || 1,
          unit_price: rate,
          gst_rate: gst,
          tax_inclusive: !!match.tax_inclusive,
        });
      }
    });

    setSelectedQuantities({});
    setShowBulkPicker(false);
  };

  const filteredCatalog = products.filter((p) => {
    if (!bulkSearch.trim()) return true;
    const term = bulkSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.sku && p.sku.toLowerCase().includes(term)) ||
      (p.hsn_sac && p.hsn_sac.includes(term))
    );
  });

  const selectedCount = Object.keys(selectedQuantities).length;

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
          {products.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowBulkPicker(true)}
              icon={<ListPlus className="w-3.5 h-3.5" />}
            >
              Bulk Add Items
            </Button>
          )}

          <Button
            type="button"
            variant={showBarcodeScanner ? "primary" : "outline"}
            size="sm"
            onClick={() => {
              setShowBarcodeScanner(!showBarcodeScanner);
              setScannerFeedback(null);
            }}
            icon={<Barcode className="w-3.5 h-3.5" />}
          >
            {showBarcodeScanner ? "Close Scanner" : "Scan Barcode"}
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

      {/* USB / Laser Barcode Scanner Interface */}
      {showBarcodeScanner && (
        <div className="p-3 bg-emerald-50/80 border-b border-emerald-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 animate-in slide-in-from-top-2 duration-150">
          <form onSubmit={handleBarcodeSubmit} className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Barcode className="w-4 h-4 absolute left-3 top-2.5 text-emerald-700" />
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Scan barcode with USB reader or type SKU & press Enter..."
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-emerald-300 bg-white font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <Button type="submit" variant="primary" size="sm">
              Add
            </Button>
          </form>

          {scannerFeedback && (
            <div
              className={`text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5 ${
                scannerFeedback.type === "success"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-red-100 text-red-800 border border-red-300"
              }`}
            >
              {scannerFeedback.type === "success" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
              )}
              <span>{scannerFeedback.message}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowBarcodeScanner(false)}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="billing-table-header border-b border-[#e2ebe5]">
              <th className="p-2 text-center w-10">#</th>
              <th className="p-2 min-w-[200px]">Product / Service Description</th>
              <th className="p-2 w-24 text-center">HSN/SAC</th>
              <th className="p-2 w-20 text-right">Qty</th>
              <th className="p-2 w-20 text-center">Unit</th>
              <th className="p-2 w-32 text-right">Rate (₹)</th>
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
                businessId={businessId}
                onUpdate={(updates) => onUpdateItem(idx, updates)}
                onRemove={() => onRemoveItem(idx)}
                canRemove={items.length > 1}
                onProductCreated={onProductCreated}
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
          onClick={() => onAddItem({ item_type: "service", unit: "HRS", hsn_sac: "" })}
          icon={<PackagePlus className="w-3.5 h-3.5" />}
        >
          + Add Service Line
        </Button>

        <span className="text-[11px] text-[#71817a]">
          Pro-tip: Press <kbd className="shortcut-kbd">F3</kbd> anytime to append a new item row.
        </span>
      </div>

      {/* Bulk Item Selection Modal (Zoho Books Style) */}
      <Modal
        isOpen={showBulkPicker}
        onClose={() => setShowBulkPicker(false)}
        title="Bulk Add Items from Catalog"
        subtitle={`Select multiple catalog items to append to invoice (${products.length} products available)`}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-medium text-slate-600">
              {selectedCount} item{selectedCount === 1 ? "" : "s"} selected
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowBulkPicker(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={selectedCount === 0}
                onClick={handleConfirmBulkAdd}
              >
                Add {selectedCount} Item{selectedCount === 1 ? "" : "s"} to Invoice
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter products by name, SKU, or HSN code..."
              value={bulkSearch}
              onChange={(e) => setBulkSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-[#167a55]"
            />
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-100">
            {filteredCatalog.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No catalog items match your search.
              </div>
            ) : (
              filteredCatalog.map((prod) => {
                const isSelected = !!selectedQuantities[prod.id];
                const qty = selectedQuantities[prod.id] || 1;
                const price = typeof prod.selling_price === "string"
                  ? parseFloat(prod.selling_price)
                  : (prod.selling_price ?? (typeof prod.sale_price === "string" ? parseFloat(prod.sale_price) : 0));
                const gst = typeof prod.gst_rate === "number"
                  ? prod.gst_rate
                  : (typeof prod.gst_rate === "string" && !isNaN(parseFloat(prod.gst_rate)) ? parseFloat(prod.gst_rate) : null);

                return (
                  <div
                    key={prod.id}
                    className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                      isSelected ? "bg-emerald-50/60" : "hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                      onClick={() => toggleSelectProduct(prod.id)}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-[#167a55] shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 truncate">{prod.name}</span>
                          {prod.sku && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              SKU: {prod.sku}
                            </span>
                          )}
                          <Badge variant="outline" size="sm">
                            HSN: {prod.hsn_code || prod.hsn_sac || "Unspecified"}
                          </Badge>
                          {gst !== null ? (
                            <Badge variant="emerald" size="sm">
                              GST: {gst}%
                            </Badge>
                          ) : (
                            <Badge variant="warning" size="sm">
                              GST: Not Set
                            </Badge>
                          )}
                          {prod.tax_inclusive && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded font-bold">
                              Tax-Inclusive
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Rate: ₹{price.toFixed(2)} / {prod.unit || "NOS"}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[11px] text-slate-500 font-medium">Qty:</span>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={qty}
                          onChange={(e) => updateQuantity(prod.id, parseFloat(e.target.value) || 1)}
                          className="w-16 text-xs text-center border border-slate-300 rounded px-1.5 py-1 bg-white focus:outline-none focus:border-[#167a55]"
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

