import React, { useState } from "react";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { Input, Select } from "../../../components/ui/Input";
import { api, type Product } from "../../../services/api";

export interface ProductQuickCreateProps {
  isOpen: boolean;
  businessId: string;
  initialName?: string;
  onClose: () => void;
  onSaved: (product: Product) => void;
}

const COMMON_UNITS = [
  { label: "NOS - Numbers", value: "NOS" },
  { label: "PCS - Pieces", value: "PCS" },
  { label: "KGS - Kilograms", value: "KGS" },
  { label: "MTR - Meters", value: "MTR" },
  { label: "BOX - Boxes", value: "BOX" },
  { label: "SET - Sets", value: "SET" },
  { label: "LTR - Litres", value: "LTR" },
  { label: "BAG - Bags", value: "BAG" },
  { label: "ROLL - Rolls", value: "ROLL" },
  { label: "SQM - Square Meters", value: "SQM" },
  { label: "HRS - Hours", value: "HRS" },
];

const GST_RATES = [
  { label: "18% (Standard GST)", value: "18" },
  { label: "12% (Merchandise GST)", value: "12" },
  { label: "5% (Essential Goods)", value: "5" },
  { label: "28% (Luxury / De-merit)", value: "28" },
  { label: "0% (Exempted / Nil)", value: "0" },
  { label: "3% (Gold & Precious Metals)", value: "3" },
  { label: "0.25% (Precious Stones)", value: "0.25" },
  { label: "0.1% (Export Merchant)", value: "0.1" },
];

export const ProductQuickCreate: React.FC<ProductQuickCreateProps> = ({
  isOpen,
  businessId,
  initialName = "",
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState(initialName);
  const [type, setType] = useState<"goods" | "service">("goods");
  const [hsnSac, setHsnSac] = useState("");
  const [unit, setUnit] = useState("NOS");
  const [salePrice, setSalePrice] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [gstRate, setGstRate] = useState("18");
  const [sku, setSku] = useState("");
  const [taxInclusive, setTaxInclusive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Sync initialName when opening modal
  React.useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setErrorMsg("");
      if (!hsnSac) {
        setHsnSac(type === "service" ? "9983" : "");
      }
    }
  }, [isOpen, initialName, type]);

  const handleTypeChange = (newType: "goods" | "service") => {
    setType(newType);
    if (newType === "service") {
      setHsnSac("9983");
      setUnit("HRS");
    } else {
      setHsnSac("");
      setUnit("NOS");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Please enter product or service name.");
      return;
    }

    if (!hsnSac.trim()) {
      setErrorMsg("Please provide statutory HSN or SAC code (e.g. 84713010 or 9983).");
      return;
    }

    if (!salePrice || isNaN(Number(salePrice)) || Number(salePrice) < 0) {
      setErrorMsg("Please enter a valid selling rate / price greater than or equal to 0.");
      return;
    }

    if (!businessId) {
      setErrorMsg("No active business selected. Please select a business profile first.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        business_id: businessId,
        type,
        name: name.trim(),
        hsn_sac: hsnSac.trim(),
        unit: unit.trim(),
        sale_price: parseFloat(salePrice),
        purchase_price: purchasePrice && !isNaN(Number(purchasePrice)) ? parseFloat(purchasePrice) : undefined,
        sku: sku.trim() || undefined,
        tax_inclusive: taxInclusive,
        gst_rate: parseFloat(gstRate) || 0,
      };

      const saved = await api.createProduct(payload);

      // Confirm GST rate directly from the saved backend record (taxCategory relationship or appended field)
      const confirmedGstRate = typeof saved.gst_rate === "number"
        ? saved.gst_rate
        : (saved.tax_category ? parseFloat(saved.tax_category.igst_rate) : (parseFloat(gstRate) || 18));

      const createdProd: Product = {
        id: saved.id,
        business_id: saved.business_id,
        type: saved.type,
        name: saved.name,
        sku: saved.sku || "",
        barcode: saved.sku || "",
        hsn_sac: saved.hsn_sac,
        hsn_code: saved.hsn_sac,
        unit: saved.unit || unit,
        sale_price: String(saved.sale_price),
        selling_price: parseFloat(saved.sale_price),
        purchase_price: saved.purchase_price ? String(saved.purchase_price) : undefined,
        tax_inclusive: !!saved.tax_inclusive,
        gst_rate: confirmedGstRate,
        current_stock: 0,
      };

      onSaved(createdProd);
      onClose();
    } catch (err: unknown) {
      console.error("Failed to persist product in backend:", err);
      setErrorMsg((err as Error).message || "Failed to save product to catalog.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Product / Service"
      subtitle="Creates and persists product in your catalog with statutory GST & HSN codes"
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="quick-add-product-form"
            variant="primary"
            size="sm"
            loading={loading}
          >
            Save & Add to Invoice
          </Button>
        </div>
      }
    >
      <form id="quick-add-product-form" onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {errorMsg}
          </div>
        )}

        {/* Item Classification */}
        <div className="flex items-center gap-4 p-2.5 rounded-lg bg-[#f5f8f6] border border-[#e2ebe5]">
          <span className="text-xs font-bold text-[#172b25]">Item Type:</span>
          <label className="flex items-center gap-1.5 text-xs text-[#172b25] cursor-pointer">
            <input
              type="radio"
              name="itemType"
              value="goods"
              checked={type === "goods"}
              onChange={() => handleTypeChange("goods")}
              className="text-[#167a55] focus:ring-[#167a55]"
            />
            Goods / Physical Product
          </label>
          <label className="flex items-center gap-1.5 text-xs text-[#172b25] cursor-pointer">
            <input
              type="radio"
              name="itemType"
              value="service"
              checked={type === "service"}
              onChange={() => handleTypeChange("service")}
              className="text-[#167a55] focus:ring-[#167a55]"
            />
            Service / Professional Charges
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="md:col-span-2">
            <Input
              label="Product or Service Name *"
              placeholder="e.g. Basmati Rice / Industrial Machinery / Legal Consulting"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <Input
              label={`${type === "goods" ? "HSN" : "SAC"} Code (Up to 8 digits) *`}
              placeholder={type === "goods" ? "e.g. 1006, 8471" : "e.g. 9983"}
              value={hsnSac}
              onChange={(e) => setHsnSac(e.target.value.replace(/\s+/g, ""))}
              maxLength={8}
              required
            />
          </div>

          <div>
            <Select
              label="Standard Unit (UQC)"
              value={unit}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setUnit(e.target.value)}
              options={COMMON_UNITS}
            />
          </div>

          <div>
            <Input
              type="number"
              min="0"
              step="any"
              label="Selling Price (₹) *"
              placeholder="0.00"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              type="number"
              min="0"
              step="any"
              label="Purchase / Cost Price (₹, Optional)"
              placeholder="0.00"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
            />
          </div>

          <div>
            <Select
              label="GST Tax Rate (%)"
              value={gstRate}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setGstRate(e.target.value)}
              options={GST_RATES}
            />
          </div>

          <div>
            <Input
              label="SKU / Barcode (Optional)"
              placeholder="e.g. DELL-LAT-7420"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              maxLength={50}
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-2 pt-1">
            <input
              id="product-tax-inclusive"
              type="checkbox"
              checked={taxInclusive}
              onChange={(e) => setTaxInclusive(e.target.checked)}
              className="rounded border-[#e2ebe5] text-[#167a55] focus:ring-[#167a55]"
            />
            <label htmlFor="product-tax-inclusive" className="text-xs text-[#172b25] select-none cursor-pointer">
              Rate is inclusive of GST (Tax included in selling price)
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
};
