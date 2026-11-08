import React, { useState } from "react";
import { Truck, ChevronDown, ChevronUp } from "lucide-react";
import type { TransportDetails as TransportType } from "../types/invoice";

export interface TransportDetailsProps {
  transport?: TransportType;
  onChange: (updates: Partial<TransportType>) => void;
}

export const TransportDetails: React.FC<TransportDetailsProps> = ({
  transport,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white border border-[#e2ebe5] rounded-xl overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-[#172b25] bg-[#f5f8f6]/50 hover:bg-[#eaf6ef] transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5 text-[#167a55]" />
          Transport, Logistics & E-Way Bill Details
          {transport?.vehicle_number && (
            <span className="text-[11px] font-bold text-[#167a55]">
              (Vehicle: {transport.vehicle_number})
            </span>
          )}
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-[#71817a]" /> : <ChevronDown className="w-4 h-4 text-[#71817a]" />}
      </button>

      {isOpen && (
        <div className="p-4 border-t border-[#e2ebe5] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-[#71817a] mb-1">
              Transporter Name
            </label>
            <input
              type="text"
              value={transport?.transporter_name || ""}
              onChange={(e) => onChange({ transporter_name: e.target.value })}
              placeholder="e.g. VRL Logistics"
              className="w-full text-xs rounded-lg border border-[#e2ebe5] p-2 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#71817a] mb-1">
              Transporter GSTIN / ID
            </label>
            <input
              type="text"
              value={transport?.transporter_gstin || ""}
              onChange={(e) => onChange({ transporter_gstin: e.target.value })}
              placeholder="27AAACT2727Q1ZG"
              className="w-full text-xs rounded-lg border border-[#e2ebe5] p-2 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#71817a] mb-1">
              Vehicle Number
            </label>
            <input
              type="text"
              value={transport?.vehicle_number || ""}
              onChange={(e) => onChange({ vehicle_number: e.target.value })}
              placeholder="MH 12 AB 1234"
              className="w-full text-xs rounded-lg border border-[#e2ebe5] p-2 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#71817a] mb-1">
              Transport Mode
            </label>
            <select
              value={transport?.transport_mode || "road"}
              onChange={(e) => onChange({ transport_mode: e.target.value as TransportType["transport_mode"] })}
              className="w-full text-xs rounded-lg border border-[#e2ebe5] p-2 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
            >
              <option value="road">Road</option>
              <option value="rail">Rail</option>
              <option value="air">Air</option>
              <option value="ship">Ship</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#71817a] mb-1">
              Distance (in Kilometers)
            </label>
            <input
              type="number"
              min="1"
              value={transport?.distance_km || ""}
              onChange={(e) => onChange({ distance_km: parseInt(e.target.value, 10) || 0 })}
              placeholder="e.g. 150"
              className="w-full text-xs rounded-lg border border-[#e2ebe5] p-2 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#71817a] mb-1">
              LR / Bilty Number
            </label>
            <input
              type="text"
              value={transport?.lr_bilty_number || ""}
              onChange={(e) => onChange({ lr_bilty_number: e.target.value })}
              placeholder="LR-9988"
              className="w-full text-xs rounded-lg border border-[#e2ebe5] p-2 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#71817a] mb-1">
              LR Date
            </label>
            <input
              type="date"
              value={transport?.lr_bilty_date || ""}
              onChange={(e) => onChange({ lr_bilty_date: e.target.value })}
              className="w-full text-xs rounded-lg border border-[#e2ebe5] p-2 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#71817a] mb-1">
              E-Way Bill Number (if generated)
            </label>
            <input
              type="text"
              value={transport?.eway_bill_number || ""}
              onChange={(e) => onChange({ eway_bill_number: e.target.value })}
              placeholder="12-digit EWB No"
              className="w-full text-xs rounded-lg border border-[#e2ebe5] p-2 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
            />
          </div>
        </div>
      )}
    </div>
  );
};

