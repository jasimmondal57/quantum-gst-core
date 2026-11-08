import React from "react";
import type { InvoiceItemDraft } from "../types/invoiceItem";

export interface ItemAdvancedDetailsProps {
  item: InvoiceItemDraft;
  onUpdate: (updates: Partial<InvoiceItemDraft>) => void;
}

export const ItemAdvancedDetails: React.FC<ItemAdvancedDetailsProps> = ({ item, onUpdate }) => {
  return (
    <div className="p-3 bg-[#f5f8f6]/80 border-t border-[#e2ebe5] grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 text-xs">
      <div>
        <label className="block text-[11px] font-semibold text-[#71817a] mb-1">Batch Number</label>
        <input
          type="text"
          value={item.batch_number || ""}
          onChange={(e) => onUpdate({ batch_number: e.target.value })}
          placeholder="e.g. B-2026-X"
          className="w-full text-xs rounded border border-[#e2ebe5] px-2 py-1 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
        />
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-[#71817a] mb-1">Serial Number</label>
        <input
          type="text"
          value={item.serial_number || ""}
          onChange={(e) => onUpdate({ serial_number: e.target.value })}
          placeholder="e.g. SN-889021"
          className="w-full text-xs rounded border border-[#e2ebe5] px-2 py-1 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
        />
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-[#71817a] mb-1">Expiry Date</label>
        <input
          type="date"
          value={item.expiry_date || ""}
          onChange={(e) => onUpdate({ expiry_date: e.target.value })}
          className="w-full text-xs rounded border border-[#e2ebe5] px-2 py-1 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
        />
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-[#71817a] mb-1">Specific Cess (₹/unit)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.cess_specific || ""}
          onChange={(e) => onUpdate({ cess_specific: parseFloat(e.target.value) || 0 })}
          placeholder="0.00"
          className="w-full text-xs rounded border border-[#e2ebe5] px-2 py-1 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
        />
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-[#71817a] mb-1">Ad-Valorem Cess (%)</label>
        <input
          type="number"
          min="0"
          step="0.1"
          value={item.cess_rate || ""}
          onChange={(e) => onUpdate({ cess_rate: parseFloat(e.target.value) || 0 })}
          placeholder="0%"
          className="w-full text-xs rounded border border-[#e2ebe5] px-2 py-1 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
        />
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-[#71817a] mb-1">Warehouse / Godown</label>
        <input
          type="text"
          value={item.godown_name || ""}
          onChange={(e) => onUpdate({ godown_name: e.target.value })}
          placeholder="Main Godown"
          className="w-full text-xs rounded border border-[#e2ebe5] px-2 py-1 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
        />
      </div>
    </div>
  );
};

