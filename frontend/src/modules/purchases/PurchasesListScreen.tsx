import React, { useState } from "react";
import {
  Plus,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Input, Select } from "../../components/ui/Input";
import { DataTable } from "../../components/tables/DataTable";
import type { Column } from "../../components/tables/DataTable";
import { api } from "../../services/api";
import type { PurchaseBill, BusinessProfile, Customer, Product } from "../../services/api";

export interface PurchasesListScreenProps {
  business: BusinessProfile | null;
  purchases: PurchaseBill[];
  suppliers: Customer[];
  products: Product[];
  onRefresh: () => void;
}

export const PurchasesListScreen: React.FC<PurchasesListScreenProps> = ({
  business,
  purchases,
  suppliers,
  onRefresh,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [supplierId, setSupplierId] = useState("");
  const [billNumber, setBillNumber] = useState("");
  const [billDate, setBillDate] = useState(new Date().toISOString().split("T")[0]);
  const [posStateCode, setPosStateCode] = useState(business?.gstins?.[0]?.state_code || "27");
  const [itcEligibility, setItcEligibility] = useState("inputs");
  const [items, setItems] = useState([
    {
      item_name: "Raw Material",
      hsn_sac: "84713010",
      quantity: 10,
      unit: "NOS",
      unit_price: 250,
      gst_rate: 18,
    },
  ]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        item_name: "Purchase Item",
        hsn_sac: "84713010",
        quantity: 1,
        unit: "NOS",
        unit_price: 100,
        gst_rate: 18,
      },
    ]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !supplierId || !billNumber.trim()) {
      alert("Please select a supplier and provide the bill number.");
      return;
    }

    setLoading(true);
    try {
      await api.createPurchase({
        business_id: business.id,
        business_gstin_id: business.gstins?.[0]?.id,
        supplier_id: supplierId,
        bill_number: billNumber,
        bill_date: billDate,
        place_of_supply_state_code: posStateCode,
        itc_eligibility: itcEligibility,
        items,
      });

      setShowAddModal(false);
      setBillNumber("");
      onRefresh();
    } catch (err: any) {
      alert("Error saving purchase bill: " + (err.message || "Failed"));
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<PurchaseBill>[] = [
    {
      key: "bill_number",
      header: "Bill #",
      sortable: true,
      render: (pb) => (
        <span className="font-semibold text-slate-900 font-mono">
          {pb.bill_number}
        </span>
      ),
    },
    {
      key: "bill_date",
      header: "Bill Date",
      sortable: true,
      render: (pb) => <span className="text-slate-600 font-medium">{pb.bill_date}</span>,
    },
    {
      key: "supplier",
      header: "Supplier / Vendor",
      render: (pb) => (
        <div>
          <p className="font-medium text-slate-800">{pb.supplier?.name || "Direct Vendor"}</p>
          {pb.supplier?.gstin && (
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">{pb.supplier.gstin}</p>
          )}
        </div>
      ),
    },
    {
      key: "itc_eligibility",
      header: "ITC Type",
      render: (pb) => (
        <Badge
          variant={
            pb.itc_eligibility === "ineligible"
              ? "danger"
              : pb.itc_eligibility === "capital_goods"
              ? "info"
              : "emerald"
          }
          size="sm"
        >
          {pb.itc_eligibility || "inputs"}
        </Badge>
      ),
    },
    {
      key: "total_taxable_value",
      header: "Taxable (₹)",
      align: "right",
      render: (pb) => (
        <span className="font-mono text-slate-700">
          ₹{parseFloat(pb.total_taxable_value || "0").toFixed(2)}
        </span>
      ),
    },
    {
      key: "total_tax_amount",
      header: "ITC Tax (₹)",
      align: "right",
      render: (pb) => (
        <span className="font-mono text-emerald-700 font-medium">
          ₹{parseFloat(pb.total_tax_amount || "0").toFixed(2)}
        </span>
      ),
    },
    {
      key: "grand_total",
      header: "Grand Total (₹)",
      align: "right",
      render: (pb) => (
        <span className="font-mono font-bold text-slate-900">
          ₹{parseFloat(pb.grand_total || "0").toFixed(2)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (pb) => (
        <Badge variant={pb.status === "received" ? "emerald" : "neutral"} size="sm">
          {pb.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Purchases & Inward Supplies
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record supplier bills, claim Input Tax Credit (ITC), and balance inventory.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAddModal(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Record Purchase Bill
        </Button>
      </div>

      {/* Purchases Data Table */}
      <DataTable
        columns={columns}
        data={purchases}
        searchPlaceholder="Search bill #, supplier name, GSTIN..."
        emptyTitle="No purchase bills recorded"
        emptyDescription="Record inward supplier bills to claim ITC in GSTR-3B."
        emptyAction={
          <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
            Record First Purchase Bill
          </Button>
        }
      />

      {/* Record Purchase Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Record Inward Purchase Bill"
        subtitle="Automatic ITC ledger credit and inventory stock update"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supplier / Vendor <span className="text-rose-500">*</span>
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                required
                className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
              >
                <option value="">Select Vendor</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.gstin ? `(${s.gstin})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Supplier Bill / Invoice #"
              value={billNumber}
              onChange={(e) => setBillNumber(e.target.value)}
              placeholder="e.g., INV-90412"
              required
            />

            <Input
              type="date"
              label="Bill Date"
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="ITC Eligibility (GSTR-3B Table 4)"
              value={itcEligibility}
              onChange={(e) => setItcEligibility(e.target.value)}
              options={[
                { label: "Inputs (General Inventory Goods)", value: "inputs" },
                { label: "Capital Goods (Machinery, Equipment)", value: "capital_goods" },
                { label: "Input Services (Freight, Audit, Legal)", value: "input_services" },
                { label: "Ineligible ITC (Blocked under Sec 17(5))", value: "ineligible" },
              ]}
            />

            <Input
              label="Place of Supply State Code"
              value={posStateCode}
              onChange={(e) => setPosStateCode(e.target.value)}
              maxLength={2}
              required
            />
          </div>

          {/* Line Items */}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Purchased Items & Stock</span>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handleAddItem}
                icon={<Plus className="w-3 h-3" />}
              >
                Add Item
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-200 text-xs">
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="Item name"
                      value={item.item_name}
                      onChange={(e) => updateItem(idx, "item_name", e.target.value)}
                      className="w-full border-b border-slate-200 pb-0.5 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="HSN"
                      value={item.hsn_sac}
                      onChange={(e) => updateItem(idx, "hsn_sac", e.target.value)}
                      className="w-full text-center border-b border-slate-200 pb-0.5 font-mono text-[11px] focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 1)}
                      className="w-full text-center border border-slate-200 rounded py-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Unit Price"
                      value={item.unit_price}
                      onChange={(e) => updateItem(idx, "unit_price", parseFloat(e.target.value) || 0)}
                      className="w-full text-right border border-slate-200 rounded py-1 font-mono"
                    />
                  </div>
                  <div className="col-span-1">
                    <select
                      value={item.gst_rate}
                      onChange={(e) => updateItem(idx, "gst_rate", parseFloat(e.target.value) || 0)}
                      className="w-full border border-slate-200 rounded py-1 text-[11px]"
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddModal(false)}
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
              Save Purchase Bill
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
