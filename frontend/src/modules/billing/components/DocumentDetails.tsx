import React, { useState } from "react";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";
import type { SupplyType } from "../types/invoice";

export const INDIAN_STATES: { code: string; name: string }[] = [
  { code: "01", name: "01 - Jammu & Kashmir" },
  { code: "02", name: "02 - Himachal Pradesh" },
  { code: "03", name: "03 - Punjab" },
  { code: "04", name: "04 - Chandigarh (UT)" },
  { code: "05", name: "05 - Uttarakhand" },
  { code: "06", name: "06 - Haryana" },
  { code: "07", name: "07 - Delhi" },
  { code: "08", name: "08 - Rajasthan" },
  { code: "09", name: "09 - Uttar Pradesh" },
  { code: "10", name: "10 - Bihar" },
  { code: "11", name: "11 - Sikkim" },
  { code: "12", name: "12 - Arunachal Pradesh" },
  { code: "13", name: "13 - Nagaland" },
  { code: "14", name: "14 - Manipur" },
  { code: "15", name: "15 - Mizoram" },
  { code: "16", name: "16 - Tripura" },
  { code: "17", name: "17 - Meghalaya" },
  { code: "18", name: "18 - Assam" },
  { code: "19", name: "19 - West Bengal" },
  { code: "20", name: "20 - Jharkhand" },
  { code: "21", name: "21 - Odisha" },
  { code: "22", name: "22 - Chhattisgarh" },
  { code: "23", name: "23 - Madhya Pradesh" },
  { code: "24", name: "24 - Gujarat" },
  { code: "26", name: "26 - Dadra & Nagar Haveli and Daman & Diu (UT)" },
  { code: "27", name: "27 - Maharashtra" },
  { code: "29", name: "29 - Karnataka" },
  { code: "30", name: "30 - Goa" },
  { code: "31", name: "31 - Lakshadweep (UT)" },
  { code: "32", name: "32 - Kerala" },
  { code: "33", name: "33 - Tamil Nadu" },
  { code: "34", name: "34 - Puducherry" },
  { code: "35", name: "35 - Andaman & Nicobar Islands (UT)" },
  { code: "36", name: "36 - Telangana" },
  { code: "37", name: "37 - Andhra Pradesh" },
  { code: "38", name: "38 - Ladakh (UT)" },
  { code: "97", name: "97 - Other Territory" },
];

export interface DocumentDetailsProps {
  documentDate: string;
  onDateChange: (date: string) => void;
  dueDate: string;
  onDueDateChange: (date: string) => void;
  placeOfSupply: string;
  onPlaceOfSupplyChange: (code: string) => void;
  supplyType: SupplyType;
  onSupplyTypeChange: (type: SupplyType) => void;
  reverseCharge: boolean;
  onReverseChargeChange: (rcm: boolean) => void;
  salesperson: string;
  onSalespersonChange: (name: string) => void;
  seriesPrefix: string;
  onSeriesPrefixChange: (prefix: string) => void;
}

export const DocumentDetails: React.FC<DocumentDetailsProps> = ({
  documentDate,
  onDateChange,
  dueDate,
  onDueDateChange,
  placeOfSupply,
  onPlaceOfSupplyChange,
  supplyType,
  onSupplyTypeChange,
  reverseCharge,
  onReverseChargeChange,
  salesperson,
  onSalespersonChange,
  seriesPrefix,
  onSeriesPrefixChange,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="bg-white border border-[#e2ebe5] rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[#172b25] flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#167a55]" />
          Document & Tax Parameters
        </label>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-[#167a55] font-semibold hover:underline flex items-center gap-1"
        >
          {showAdvanced ? "Hide More" : "More Details"}
          {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#71817a] mb-1">
            Invoice Date *
          </label>
          <input
            type="date"
            value={documentDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full text-xs rounded-lg border border-[#e2ebe5] px-2.5 py-1.5 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#71817a] mb-1">
            Payment Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
            className="w-full text-xs rounded-lg border border-[#e2ebe5] px-2.5 py-1.5 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#71817a] mb-1">
            Place of Supply (POS) *
          </label>
          <select
            value={placeOfSupply}
            onChange={(e) => onPlaceOfSupplyChange(e.target.value)}
            className="w-full text-xs rounded-lg border border-[#e2ebe5] px-2 py-1.5 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
          >
            {INDIAN_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#71817a] mb-1">
            Supply Classification
          </label>
          <select
            value={supplyType}
            onChange={(e) => onSupplyTypeChange(e.target.value as SupplyType)}
            className="w-full text-xs rounded-lg border border-[#e2ebe5] px-2 py-1.5 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
          >
            <option value="regular">Regular Taxable Supply</option>
            <option value="export_with_tax">Export (With IGST)</option>
            <option value="export_without_tax">Export (Under LUT / Bond)</option>
            <option value="sez_with_tax">SEZ Unit (With Tax)</option>
            <option value="sez_without_tax">SEZ Unit (Without Tax)</option>
            <option value="deemed_export">Deemed Export</option>
            <option value="nil_rated">Nil Rated (0%)</option>
            <option value="exempt">Exempt Supply</option>
            <option value="non_gst">Non-GST Supply</option>
          </select>
        </div>
      </div>

      {showAdvanced && (
        <div className="pt-3 border-t border-[#e2ebe5] grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#71817a] mb-1">
              Document Series Prefix
            </label>
            <input
              type="text"
              value={seriesPrefix}
              onChange={(e) => onSeriesPrefixChange(e.target.value)}
              placeholder="INV/"
              className="w-full text-xs rounded-lg border border-[#e2ebe5] px-2.5 py-1.5 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#71817a] mb-1">
              Salesperson / Executive
            </label>
            <input
              type="text"
              value={salesperson}
              onChange={(e) => onSalespersonChange(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full text-xs rounded-lg border border-[#e2ebe5] px-2.5 py-1.5 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#71817a] mb-1">
              Reverse Charge Mechanism (RCM)
            </label>
            <div className="flex items-center gap-4 mt-1.5">
              <label className="flex items-center gap-1.5 text-xs text-[#172b25] cursor-pointer">
                <input
                  type="radio"
                  name="rcm"
                  checked={!reverseCharge}
                  onChange={() => onReverseChargeChange(false)}
                  className="text-[#167a55] focus:ring-[#167a55]"
                />
                No (Standard)
              </label>
              <label className="flex items-center gap-1.5 text-xs text-[#172b25] cursor-pointer">
                <input
                  type="radio"
                  name="rcm"
                  checked={reverseCharge}
                  onChange={() => onReverseChargeChange(true)}
                  className="text-[#167a55] focus:ring-[#167a55]"
                />
                Yes (RCM Applicable)
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
