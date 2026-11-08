import React, { useState, useEffect } from "react";
import {
  Package,
  Warehouse,
  ArrowRightLeft,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Building2,
  MapPin,
  Send,
  Boxes,
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
  onNavigate?: (screen: string) => void;
}

interface GodownItem {
  id: string;
  business_id: string;
  code: string;
  name: string;
  address?: string;
  state_code?: string;
  state_name?: string;
  pincode?: string;
  is_primary: boolean;
  status: string;
  stock_balances_count?: number;
}

interface StockTransferItem {
  id: string;
  transfer_number: string;
  transfer_date: string;
  source_godown_id: string;
  destination_godown_id: string;
  status: string;
  notes?: string;
  source_godown?: { name: string; code: string };
  destination_godown?: { name: string; code: string };
  items?: Array<{
    id: string;
    product_id: string;
    quantity: number | string;
    unit?: string;
    product?: { name: string; sku?: string };
  }>;
}

export const InventoryScreen: React.FC<InventoryScreenProps> = ({
  business,
  products,
  onRefresh,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState("products");
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddGodownModal, setShowAddGodownModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [inspectingGodown, setInspectingGodown] = useState<GodownItem | null>(null);
  const [godownStockItems, setGodownStockItems] = useState<any[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [loading, setLoading] = useState(false);

  // Godown & Transfer Data
  const [godowns, setGodowns] = useState<GodownItem[]>([]);
  const [transfers, setTransfers] = useState<StockTransferItem[]>([]);

  // Add Product Form State
  const [name, setName] = useState("");
  const [type, setType] = useState("goods");
  const [sku, setSku] = useState("");
  const [hsnSac, setHsnSac] = useState("84713010");
  const [unit, setUnit] = useState("NOS");
  const [salePrice, setSalePrice] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");

  // Add Godown Form State
  const [gdnCode, setGdnCode] = useState("");
  const [gdnName, setGdnName] = useState("");
  const [gdnAddress, setGdnAddress] = useState("");
  const [gdnStateCode, setGdnStateCode] = useState("27");
  const [gdnPincode, setGdnPincode] = useState("");
  const [gdnIsPrimary, setGdnIsPrimary] = useState(false);

  // Stock Transfer Form State
  const [fromGodownId, setFromGodownId] = useState("");
  const [toGodownId, setToGodownId] = useState("");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split("T")[0]);
  const [transferProductId, setTransferProductId] = useState("");
  const [transferQty, setTransferQty] = useState("");
  const [transferNotes, setTransferNotes] = useState("");

  // Load Godowns & Transfers
  const loadGodownsAndTransfers = async () => {
    if (!business) return;
    try {
      const [gList, tList] = await Promise.all([
        api.getGodowns(business.id),
        api.getStockTransfers(business.id),
      ]);
      setGodowns(Array.isArray(gList) ? gList : []);
      setTransfers(Array.isArray(tList?.data) ? tList.data : (Array.isArray(tList) ? tList : []));
    } catch (err) {
      console.error("Failed to load godowns/transfers:", err);
    }
  };

  useEffect(() => {
    loadGodownsAndTransfers();
  }, [business]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !name.trim() || !salePrice) return;
    setLoading(true);

    try {
      await api.createProduct({
        business_id: business.id,
        name: name.trim(),
        type,
        sku: sku.trim() || undefined,
        hsn_sac: hsnSac.trim(),
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
    } catch (err: unknown) {
      alert("Error adding product: " + ((err as Error).message || "Failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGodown = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !gdnCode.trim() || !gdnName.trim()) return;
    setLoading(true);

    try {
      await api.createGodown({
        business_id: business.id,
        code: gdnCode.trim().toUpperCase(),
        name: gdnName.trim(),
        address: gdnAddress.trim() || undefined,
        state_code: gdnStateCode,
        pincode: gdnPincode.trim() || undefined,
        is_primary: gdnIsPrimary,
      });

      setShowAddGodownModal(false);
      setGdnCode("");
      setGdnName("");
      setGdnAddress("");
      setGdnPincode("");
      setGdnIsPrimary(false);
      await loadGodownsAndTransfers();
    } catch (err: unknown) {
      alert("Error creating godown: " + ((err as Error).message || "Failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !fromGodownId || !toGodownId || !transferProductId || !transferQty) {
      alert("Please specify source godown, destination godown, product, and transfer quantity.");
      return;
    }
    if (fromGodownId === toGodownId) {
      alert("Source and destination godowns must be different.");
      return;
    }

    setLoading(true);
    try {
      const selectedProd = products.find((p) => p.id === transferProductId);
      await api.createStockTransfer({
        business_id: business.id,
        source_godown_id: fromGodownId,
        destination_godown_id: toGodownId,
        transfer_date: transferDate,
        items: [
          {
            product_id: transferProductId,
            quantity: parseFloat(transferQty),
            unit: selectedProd?.unit || "NOS",
          },
        ],
        notes: transferNotes.trim() || undefined,
      });

      setShowTransferModal(false);
      setTransferProductId("");
      setTransferQty("");
      setTransferNotes("");
      await loadGodownsAndTransfers();
      alert("Stock Transfer executed successfully with GST Rule 55 Delivery Challan entry!");
    } catch (err: unknown) {
      alert("Error executing stock transfer: " + ((err as Error).message || "Failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleInspectGodown = async (gdn: GodownItem) => {
    setInspectingGodown(gdn);
    setLoadingStock(true);
    try {
      const res = await api.fetchGodownStock(gdn.id);
      setGodownStockItems(res.inventory || []);
    } catch (err) {
      console.error("Failed to inspect godown stock:", err);
      setGodownStockItems([]);
    } finally {
      setLoadingStock(false);
    }
  };

  // Low stock calculation: products with current_stock <= 10
  const lowStockProducts = products.filter((p) => {
    const stock = Number(p.current_stock || 0);
    return stock <= 10;
  });

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
      count: godowns.length,
      icon: <Warehouse className="w-4 h-4" />,
    },
    {
      id: "transfers",
      label: "Stock Transfers",
      count: transfers.length,
      icon: <ArrowRightLeft className="w-4 h-4" />,
    },
    {
      id: "low_stock",
      label: "Low Stock Alerts",
      count: lowStockProducts.length,
      icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
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
      render: (p) => <span className="font-mono text-slate-600">{p.hsn_sac || p.hsn_code || "—"}</span>,
    },
    {
      key: "current_stock",
      header: "Stock On Hand",
      align: "center",
      sortable: true,
      render: (p) => {
        const stock = Number(p.current_stock || 0);
        return (
          <span
            className={`font-mono font-bold px-2 py-0.5 rounded-full text-xs ${
              stock <= 0
                ? "bg-red-50 text-red-700 border border-red-200"
                : stock <= 10
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            {stock} {p.unit || "NOS"}
          </span>
        );
      },
    },
    {
      key: "sale_price",
      header: "Sale Price (₹)",
      align: "right",
      sortable: true,
      render: (p) => (
        <span className="font-mono font-bold text-slate-900">
          ₹{parseFloat(String(p.sale_price ?? p.selling_price ?? 0)).toFixed(2)}
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
          ₹{parseFloat(String(p.purchase_price || 0)).toFixed(2)}
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

  const lowStockColumns: Column<Product>[] = [
    {
      key: "name",
      header: "Product / Item",
      render: (p) => (
        <div>
          <span className="font-semibold text-slate-900">{p.name}</span>
          {p.sku && <p className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</p>}
        </div>
      ),
    },
    {
      key: "current_stock",
      header: "Current On-Hand",
      align: "center",
      render: (p) => (
        <span className="font-mono font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
          {p.current_stock || 0} {p.unit || "NOS"}
        </span>
      ),
    },
    {
      key: "reorder_threshold",
      header: "Reorder Trigger Level",
      align: "center",
      render: () => <span className="font-mono text-slate-500 font-medium">10 units</span>,
    },
    {
      key: "shortfall",
      header: "Deficit to Par",
      align: "center",
      render: (p) => {
        const deficit = Math.max(0, 10 - Number(p.current_stock || 0));
        return (
          <span className="font-mono text-amber-700 font-bold">
            -{deficit} {p.unit || "NOS"}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Quick Replenishment",
      align: "right",
      render: () => (
        <Button
          variant="outline"
          size="xs"
          onClick={() => {
            if (onNavigate) onNavigate("purchases");
          }}
          icon={<Plus className="w-3.5 h-3.5" />}
        >
          Create Purchase Bill
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Inventory & Multi-Godown Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-warehouse stock balances, Rule 55 batch transfers, and automatic reorder alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "godowns" ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddGodownModal(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Godown / Warehouse
            </Button>
          ) : activeTab === "transfers" ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowTransferModal(true)}
              icon={<Send className="w-4 h-4" />}
            >
              Initiate Stock Transfer
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddProductModal(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Product / Service
            </Button>
          )}
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* 1. Products Catalog Tab */}
      {activeTab === "products" && (
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
      )}

      {/* 2. Godowns & Warehouses Tab */}
      {activeTab === "godowns" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              Registered Locations ({godowns.length} Facilities)
            </span>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setShowAddGodownModal(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              New Warehouse
            </Button>
          </div>

          {godowns.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
              <Warehouse className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">No Godowns Registered</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Set up your central warehouse, factory storage, or retail storefronts to manage segregated inventory.
              </p>
              <Button variant="primary" size="sm" onClick={() => setShowAddGodownModal(true)}>
                Add Primary Godown
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {godowns.map((gdn) => (
                <div
                  key={gdn.id}
                  className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs space-y-3 hover:border-[#167a55]/40 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          gdn.is_primary
                            ? "bg-[#e8f5ee] text-[#167a55] border border-[#b8e2cd]"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {gdn.is_primary ? "★ Primary Godown" : "Storage Depot"}
                      </span>
                      <Warehouse className="w-4 h-4 text-slate-400" />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{gdn.name}</h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">Code: {gdn.code}</p>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-[#167a55] shrink-0" />
                      <span className="truncate">{gdn.address || "State Code: " + (gdn.state_code || "27")}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {gdn.stock_balances_count ?? 0} Stock Lines
                    </span>
                    <Button
                      variant="soft"
                      size="xs"
                      onClick={() => handleInspectGodown(gdn)}
                      icon={<Eye className="w-3 h-3" />}
                    >
                      Inspect Stock
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Inter-Godown Stock Transfers Tab */}
      {activeTab === "transfers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">
              Inter-Godown Movements ({transfers.length} Transfers Logged)
            </span>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setShowTransferModal(true)}
              icon={<Send className="w-3.5 h-3.5" />}
            >
              New Transfer
            </Button>
          </div>

          {transfers.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
              <ArrowRightLeft className="w-10 h-10 text-[#167a55] mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">No Stock Transfers Executed</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Transfer finished goods or raw materials between godowns with automated GST Rule 55 Delivery Challan compliance.
              </p>
              <Button variant="primary" size="sm" onClick={() => setShowTransferModal(true)}>
                Initiate First Transfer
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                      <th className="py-2.5 px-3">Transfer #</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Source Godown</th>
                      <th className="py-2.5 px-3">Destination Godown</th>
                      <th className="py-2.5 px-3">Items Transferred</th>
                      <th className="py-2.5 px-3">Challan Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transfers.map((tr) => (
                      <tr key={tr.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          #{tr.transfer_number}
                        </td>
                        <td className="py-3 px-3 text-slate-600">{tr.transfer_date}</td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {tr.source_godown?.name || "Source Warehouse"}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {tr.destination_godown?.name || "Destination Depot"}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {tr.items?.length || 1} Products
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant="emerald" size="sm">
                            ✓ Rule 55 Compliant
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Low Stock Alerts Tab */}
      {activeTab === "low_stock" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <h3 className="text-xs font-bold text-amber-900">
                  {lowStockProducts.length} Items Below Safe Inventory Level
                </h3>
                <p className="text-[11px] text-amber-700">
                  Stock levels are at or below 10 units. Create supplier purchase bills to replenish buffers and avoid stock-outs.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (onNavigate) onNavigate("purchases");
              }}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Open Purchase Bill Entry
            </Button>
          </div>

          <DataTable
            columns={lowStockColumns}
            data={lowStockProducts}
            searchPlaceholder="Search low stock items..."
            emptyTitle="All Stock Levels Healthy"
            emptyDescription="No items are currently below the safety reorder threshold."
          />
        </div>
      )}

      {/* Modal: Add Product */}
      <Modal
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        title="Add Product / Service Master"
        subtitle="Saved items will auto-populate taxes in invoices & POS"
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddProductModal(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-inventory-product-form"
              variant="primary"
              size="sm"
              loading={loading}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Save Item
            </Button>
          </div>
        }
      >
        <form id="add-inventory-product-form" onSubmit={handleCreateProduct} className="space-y-4">
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
        </form>
      </Modal>

      {/* Modal: Add Godown */}
      <Modal
        isOpen={showAddGodownModal}
        onClose={() => setShowAddGodownModal(false)}
        title="Add Godown / Warehouse Facility"
        subtitle="Register physical locations for stock custody and Delivery Challans"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddGodownModal(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-godown-form"
              variant="primary"
              size="sm"
              loading={loading}
              icon={<Building2 className="w-4 h-4" />}
            >
              Save Godown
            </Button>
          </div>
        }
      >
        <form id="add-godown-form" onSubmit={handleCreateGodown} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Godown Code *"
              value={gdnCode}
              onChange={(e) => setGdnCode(e.target.value)}
              placeholder="e.g., GDN-CENTRAL"
              required
            />
            <Input
              label="Warehouse / Facility Name *"
              value={gdnName}
              onChange={(e) => setGdnName(e.target.value)}
              placeholder="e.g., Bhiwandi Logistics Hub"
              required
            />
          </div>

          <Input
            label="Address"
            value={gdnAddress}
            onChange={(e) => setGdnAddress(e.target.value)}
            placeholder="Plot 42, Industrial Area, Sector 5"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="State Code (2 Digits)"
              value={gdnStateCode}
              onChange={(e) => setGdnStateCode(e.target.value)}
              maxLength={2}
            />
            <Input
              label="PIN Code"
              value={gdnPincode}
              onChange={(e) => setGdnPincode(e.target.value.replace(/\D/g, ""))}
              maxLength={6}
              placeholder="421302"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              id="gdn-primary-check"
              type="checkbox"
              checked={gdnIsPrimary}
              onChange={(e) => setGdnIsPrimary(e.target.checked)}
              className="rounded border-slate-300 text-[#167a55] focus:ring-[#167a55]"
            />
            <label htmlFor="gdn-primary-check" className="text-xs text-slate-800 select-none cursor-pointer">
              Set as Primary Default Warehouse for incoming purchases
            </label>
          </div>
        </form>
      </Modal>

      {/* Modal: Inter-Godown Stock Transfer */}
      <Modal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        title="Initiate Inter-Godown Stock Transfer"
        subtitle="Generates statutory GST Rule 55 Delivery Challan between warehouses"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowTransferModal(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="stock-transfer-form"
              variant="primary"
              size="sm"
              loading={loading}
              icon={<Send className="w-4 h-4" />}
            >
              Execute Transfer
            </Button>
          </div>
        }
      >
        <form id="stock-transfer-form" onSubmit={handleCreateTransfer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Source Warehouse *
              </label>
              <select
                value={fromGodownId}
                onChange={(e) => setFromGodownId(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:border-[#167a55]"
                required
              >
                <option value="">Select Source Godown</option>
                {godowns.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Destination Warehouse *
              </label>
              <select
                value={toGodownId}
                onChange={(e) => setToGodownId(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:border-[#167a55]"
                required
              >
                <option value="">Select Destination Godown</option>
                {godowns.map((g) => (
                  <option key={g.id} value={g.id} disabled={g.id === fromGodownId}>
                    {g.name} ({g.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Product to Transfer *
              </label>
              <select
                value={transferProductId}
                onChange={(e) => setTransferProductId(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:border-[#167a55]"
                required
              >
                <option value="">Choose item from catalog...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.sku ? `(${p.sku})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Input
                type="number"
                min="0.001"
                step="any"
                label="Transfer Qty *"
                placeholder="1"
                value={transferQty}
                onChange={(e) => setTransferQty(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              type="date"
              label="Transfer Date *"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              required
            />
            <Input
              label="Notes / Dispatch Ref"
              placeholder="e.g. Batch #B-2026-99"
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Modal: Inspect Godown Stock */}
      <Modal
        isOpen={!!inspectingGodown}
        onClose={() => setInspectingGodown(null)}
        title={`Stock Inventory: ${inspectingGodown?.name || ""}`}
        subtitle={`Facility Code: ${inspectingGodown?.code || ""} • Real-time warehouse balance`}
        size="lg"
        footer={
          <div className="flex items-center justify-end w-full">
            <Button variant="outline" size="sm" onClick={() => setInspectingGodown(null)}>
              Close
            </Button>
          </div>
        }
      >
        {loadingStock ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading godown inventory...</div>
        ) : godownStockItems.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <Boxes className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No inventory currently recorded in this godown.</p>
          </div>
        ) : (
          <div className="overflow-x-auto divide-y divide-slate-100">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 font-semibold text-slate-500 uppercase text-[11px]">
                  <th className="p-2.5">Product</th>
                  <th className="p-2.5">SKU / Barcode</th>
                  <th className="p-2.5 text-center">Batch Number</th>
                  <th className="p-2.5 text-right">Available Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {godownStockItems.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="p-2.5 font-sans font-semibold text-slate-900">
                      {item.product?.name || "Product"}
                    </td>
                    <td className="p-2.5 text-slate-600">{item.product?.sku || "—"}</td>
                    <td className="p-2.5 text-center text-slate-600">{item.batch_number || "Standard"}</td>
                    <td className="p-2.5 text-right font-bold text-[#167a55]">
                      {item.quantity} {item.product?.unit || "NOS"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
};
