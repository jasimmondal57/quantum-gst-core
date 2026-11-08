import React, { useState } from "react";
import {
  Package,
  Warehouse,
  ArrowRightLeft,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Input, Select } from "../../components/ui/Input";
import { Tabs } from "../../components/ui/EmptyState";
import { DataTable } from "../../components/tables/DataTable";
import type { Column } from "../../components/tables/DataTable";
import { api } from "../../services/api";
import type { Product, BusinessProfile } from "../../services/api";

export interface InventoryScreenProps {
  business: BusinessProfile | null;
  products: Product[];
  onRefresh: () => void;
}

export const InventoryScreen: React.FC<InventoryScreenProps> = ({
  business,
  products,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState("products");
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [type, setType] = useState("goods");
  const [sku, setSku] = useState("");
  const [hsnSac, setHsnSac] = useState("84713010");
  const [unit, setUnit] = useState("NOS");
  const [salePrice, setSalePrice] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !name.trim() || !salePrice) return;
    setLoading(true);

    try {
      await api.createProduct({
        business_id: business.id,
        name,
        type,
        sku: sku || undefined,
        hsn_sac: hsnSac,
        unit,
        sale_price: parseFloat(salePrice),
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : undefined,
      });

      setShowAddProductModal(false);
      setName("");
      setSku("");
      setSalePrice("");
      setPurchasePrice("");
      onRefresh();
    } catch (err: any) {
      alert("Error adding product: " + (err.message || "Failed"));
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    {
      id: "products",
      label: "Product Catalog",
      count: products.length,
      icon: <Package className="w-4 h-4" />,
    },
    {
      id: "godowns",
      label: "Godowns & Warehouses",
      count: 2,
      icon: <Warehouse className="w-4 h-4" />,
    },
    {
      id: "transfers",
      label: "Stock Transfers",
      icon: <ArrowRightLeft className="w-4 h-4" />,
    },
  ];

  const productColumns: Column<Product>[] = [
    {
      key: "name",
      header: "Product / Service Name",
      sortable: true,
      render: (p) => (
        <div>
          <p className="font-semibold text-slate-900">{p.name}</p>
          {p.sku && <p className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</p>}
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (p) => (
        <Badge variant={p.type === "service" ? "info" : "neutral"} size="sm">
          {p.type || "goods"}
        </Badge>
      ),
    },
    {
      key: "hsn_sac",
      header: "HSN / SAC",
      sortable: true,
      render: (p) => <span className="font-mono text-slate-600">{p.hsn_sac}</span>,
    },
    {
      key: "unit",
      header: "Unit",
      render: (p) => <span className="text-slate-500 font-medium">{p.unit || "NOS"}</span>,
    },
    {
      key: "sale_price",
      header: "Sale Price (₹)",
      align: "right",
      sortable: true,
      render: (p) => (
        <span className="font-mono font-bold text-slate-900">
          ₹{parseFloat(p.sale_price || "0").toFixed(2)}
        </span>
      ),
    },
    {
      key: "purchase_price",
      header: "Cost Price (₹)",
      align: "right",
      sortable: true,
      render: (p) => (
        <span className="font-mono text-slate-600">
          ₹{parseFloat(p.purchase_price || "0").toFixed(2)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: () => <Badge variant="emerald" size="sm">Active</Badge>,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Inventory & Warehouse Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain item master, HSN codes, multiple godowns, and stock valuation.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAddProductModal(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Add Product / Service
        </Button>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "products" ? (
        <DataTable
          columns={productColumns}
          data={products}
          searchPlaceholder="Search product name, SKU, HSN..."
          emptyTitle="No products found"
          emptyDescription="Add items to catalog to enable fast barcode billing and auto-GST rates."
          emptyAction={
            <Button variant="primary" size="sm" onClick={() => setShowAddProductModal(true)}>
              Add First Item
            </Button>
          }
        />
      ) : activeTab === "godowns" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#167a55] bg-[#e8f5ee] px-2.5 py-0.5 rounded-full">
                Primary Godown
              </span>
              <Warehouse className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Central Main Warehouse</h3>
              <p className="text-xs text-slate-500 mt-0.5">Code: GDN-MAIN • State: 27</p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Catalog Stock</span>
              <span className="font-bold text-slate-900">{products.length} distinct items</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                Secondary Unit
              </span>
              <Warehouse className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Retail Outlet Store</h3>
              <p className="text-xs text-slate-500 mt-0.5">Code: GDN-RETAIL • State: 27</p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Catalog Stock</span>
              <span className="font-bold text-slate-900">Active</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-xl border border-slate-200/80 text-center space-y-3">
          <ArrowRightLeft className="w-8 h-8 text-[#167a55] mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Inter-Godown Stock Transfers</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Transfer materials between warehouses with automated GST Rule 55 Delivery Challans.
          </p>
          <Button variant="outline" size="sm">
            Create Delivery Challan
          </Button>
        </div>
      )}

      {/* Add Product Modal */}
      <Modal
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        title="Add Product / Service Master"
        subtitle="Saved items will auto-populate taxes in invoices & POS"
        size="md"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Item / Service Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Wireless Mouse"
              required
            />

            <Select
              label="Supply Classification"
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={[
                { label: "Goods (Tangible Product)", value: "goods" },
                { label: "Service (SAC Code)", value: "service" },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="SKU / Barcode"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g., SKU-1092"
            />

            <Input
              label="HSN / SAC Code"
              value={hsnSac}
              onChange={(e) => setHsnSac(e.target.value)}
              placeholder="e.g., 84713010"
              required
            />

            <Select
              label="Unit (UQC)"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              options={[
                { label: "NOS (Numbers)", value: "NOS" },
                { label: "PCS (Pieces)", value: "PCS" },
                { label: "KGS (Kilograms)", value: "KGS" },
                { label: "MTR (Meters)", value: "MTR" },
                { label: "BOX (Boxes)", value: "BOX" },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              type="number"
              min="0"
              step="any"
              label="Selling Price (₹)"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              placeholder="0.00"
              required
            />

            <Input
              type="number"
              min="0"
              step="any"
              label="Purchase / Cost Price (₹)"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddProductModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={loading}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Save Item
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
