import React, { useState } from "react";
import { Trash2, ChevronUp, MoreHorizontal } from "lucide-react";
import type { InvoiceItemDraft } from "../types/invoiceItem";
import type { Product } from "../../../services/api";
import { ItemSearch } from "./ItemSearch";
import { ItemAdvancedDetails } from "./ItemAdvancedDetails";

export interface InvoiceItemRowProps {
  index: number;
  item: InvoiceItemDraft;
  products: Product[];
  businessId?: string;
  onUpdate: (updates: Partial<InvoiceItemDraft>) => void;
  onRemove: () => void;
  canRemove: boolean;
  onProductCreated?: (product: Product) => void;
}

const COMMON_UNITS = ["NOS", "PCS", "KG", "MTR", "BOX", "SET", "LTR", "BAG", "ROLL", "SQM", "HRS"];
const GST_RATES = [0, 0.1, 0.25, 3, 5, 12, 18, 28];

export const InvoiceItemRow: React.FC<InvoiceItemRowProps> = ({
  index,
  item,
  products,
  businessId,
  onUpdate,
  onRemove,
  canRemove,
  onProductCreated,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Auto-calculated fields
  const gross = item.quantity * item.unit_price;
  let discountAmount = 0;
  if (item.discount_type === "percentage") {
    discountAmount = (gross * (item.discount_value || 0)) / 100;
  } else {
    discountAmount = item.discount_value || 0;
  }
  const taxable = Math.max(0, gross - discountAmount);
  const taxAmount = (taxable * (item.gst_rate || 0)) / 100;
  const rowTotal = taxable + taxAmount;

  return (
    <>
      <tr className="border-b border-[#e2ebe5] hover:bg-[#f1f7f4]/40 transition-colors group">
        <td className="p-2 text-center text-xs font-semibold text-[#71817a]">
          {index + 1}
        </td>

        {/* Product / Service Name */}
        <td className="p-2 min-w-[200px]">
          <ItemSearch
            products={products}
            businessId={businessId}
            currentName={item.item_name}
            onNameChange={(name) => onUpdate({ item_name: name })}
            onSelectProduct={(updates) => onUpdate(updates)}
            onProductCreated={onProductCreated}
          />
        </td>

        {/* HSN / SAC */}
        <td className="p-2 w-24">
          <input
            type="text"
            value={item.hsn_sac}
            onChange={(e) => onUpdate({ hsn_sac: e.target.value })}
            placeholder="HSN"
            maxLength={8}
            className="w-full text-xs rounded border border-[#e2ebe5] px-2 py-1.5 bg-white text-[#172b25] text-center font-mono focus:outline-none focus:border-[#167a55]"
          />
        </td>

        {/* Quantity */}
        <td className="p-2 w-20">
          <input
            type="number"
            min="0.001"
            step="any"
            value={item.quantity || ""}
            onChange={(e) => onUpdate({ quantity: parseFloat(e.target.value) || 0 })}
            className="w-full text-xs rounded border border-[#e2ebe5] px-2 py-1.5 bg-white text-[#172b25] text-right font-medium focus:outline-none focus:border-[#167a55]"
          />
        </td>

        {/* Unit */}
        <td className="p-2 w-20">
          <select
            value={item.unit}
            onChange={(e) => onUpdate({ unit: e.target.value })}
            className="w-full text-xs rounded border border-[#e2ebe5] px-1 py-1.5 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
          >
            {COMMON_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </td>

        {/* Rate (Unit Price) */}
        <td className="p-2 w-28">
          <input
            type="number"
            min="0"
            step="0.01"
            value={item.unit_price || ""}
            onChange={(e) => onUpdate({ unit_price: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            className="w-full text-xs rounded border border-[#e2ebe5] px-2 py-1.5 bg-white text-[#172b25] text-right font-medium focus:outline-none focus:border-[#167a55]"
          />
        </td>

        {/* Discount */}
        <td className="p-2 w-24">
          <div className="flex items-center">
            <input
              type="number"
              min="0"
              step="any"
              value={item.discount_value || ""}
              onChange={(e) => onUpdate({ discount_value: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              className="w-full text-xs rounded-l border border-[#e2ebe5] px-1.5 py-1.5 bg-white text-[#172b25] text-right focus:outline-none focus:border-[#167a55]"
            />
            <button
              type="button"
              onClick={() =>
                onUpdate({
                  discount_type: item.discount_type === "percentage" ? "fixed" : "percentage",
                })
              }
              className="px-1.5 py-1.5 text-[10px] font-bold bg-[#f5f8f6] border border-l-0 border-[#e2ebe5] rounded-r text-[#167a55] hover:bg-[#eaf6ef]"
            >
              {item.discount_type === "percentage" ? "%" : "₹"}
            </button>
          </div>
        </td>

        {/* Taxable Value */}
        <td className="p-2 text-right text-xs font-medium text-[#172b25] w-24">
          ₹{taxable.toFixed(2)}
        </td>

        {/* GST Rate */}
        <td className="p-2 w-24">
          <select
            value={item.gst_rate}
            onChange={(e) => onUpdate({ gst_rate: parseFloat(e.target.value) || 0 })}
            className="w-full text-xs rounded border border-[#e2ebe5] px-1 py-1.5 bg-white text-[#172b25] text-center font-medium focus:outline-none focus:border-[#167a55]"
          >
            {GST_RATES.map((r) => (
              <option key={r} value={r}>
                {r}%
              </option>
            ))}
          </select>
        </td>

        {/* Total Tax Amount */}
        <td className="p-2 text-right text-xs text-[#71817a] w-24">
          ₹{taxAmount.toFixed(2)}
        </td>

        {/* Row Total */}
        <td className="p-2 text-right text-xs font-bold text-[#167a55] w-28">
          ₹{rowTotal.toFixed(2)}
        </td>

        {/* Actions */}
        <td className="p-2 text-center w-16">
          <div className="flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              title="Batch, Serial No & Cess details"
              className={`p-1 rounded hover:bg-[#eaf6ef] transition-colors ${
                showAdvanced ? "text-[#167a55]" : "text-[#71817a]"
              }`}
            >
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <MoreHorizontal className="w-3.5 h-3.5" />}
            </button>

            {canRemove && (
              <button
                type="button"
                onClick={onRemove}
                title="Delete Row"
                className="p-1 rounded text-[#71817a] hover:text-[#991b1b] hover:bg-[#fef2f2] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Advanced Details Collapsible Row */}
      {showAdvanced && (
        <tr>
          <td colSpan={12} className="p-0">
            <ItemAdvancedDetails item={item} onUpdate={onUpdate} />
          </td>
        </tr>
      )}
    </>
  );
};
