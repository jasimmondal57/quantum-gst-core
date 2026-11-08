import React, { useState, useMemo } from "react";
import {
  Plus,
  FileDown,
  Eye,
  Ban,
  QrCode,
  AlertTriangle,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Tabs } from "../../components/ui/EmptyState";
import { DataTable } from "../../components/tables/DataTable";
import type { Column } from "../../components/tables/DataTable";
import { api } from "../../services/api";
import type { Invoice, BusinessProfile } from "../../services/api";

export interface SalesListScreenProps {
  business: BusinessProfile | null;
  invoices: Invoice[];
  onRefresh: () => void;
  onOpenCreateInvoice: () => void;
  onViewInvoice: (inv: Invoice) => void;
  onDownloadPdf: (inv: Invoice) => void;
}

export const SalesListScreen: React.FC<SalesListScreenProps> = ({
  invoices,
  onRefresh,
  onOpenCreateInvoice,
  onViewInvoice,
  onDownloadPdf,
}) => {
  const [activeTab, setActiveTab] = useState("all");
  const [cancellingInvoice, setCancellingInvoice] = useState<Invoice | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  // Tab Filtering
  const filteredInvoices = useMemo(() => {
    if (activeTab === "all") return invoices;
    return invoices.filter((inv) => inv.status === activeTab);
  }, [invoices, activeTab]);

  const tabs = [
    { id: "all", label: "All Invoices", count: invoices.length },
    {
      id: "finalized",
      label: "Finalized",
      count: invoices.filter((i) => i.status === "finalized").length,
    },
    {
      id: "paid",
      label: "Paid",
      count: invoices.filter((i) => i.status === "paid").length,
    },
    {
      id: "cancelled",
      label: "Cancelled",
      count: invoices.filter((i) => i.status === "cancelled").length,
    },
  ];

  const handleCancelSubmit = async () => {
    if (!cancellingInvoice || !cancelReason.trim()) return;
    setCancelLoading(true);
    try {
      await api.cancelInvoice(cancellingInvoice.id, cancelReason);
      setCancellingInvoice(null);
      setCancelReason("");
      onRefresh();
    } catch (err: any) {
      alert("Cancellation error: " + (err.message || "Failed to cancel invoice"));
    } finally {
      setCancelLoading(false);
    }
  };

  const handleGenerateEinvoice = async (inv: Invoice) => {
    try {
      const res = await api.generateEInvoice(inv.id);
      alert(`e-Invoice Generated!\nIRN: ${res.irn}\nAck No: ${res.ack_no}`);
      onRefresh();
    } catch (e: any) {
      alert("e-Invoice Generation Error: " + (e.message || "Failed to register IRN"));
    }
  };

  const columns: Column<Invoice>[] = [
    {
      key: "invoice_number",
      header: "Invoice #",
      sortable: true,
      render: (inv) => (
        <div>
          <span className="font-semibold text-slate-900 font-mono hover:text-[#167a55] cursor-pointer" onClick={() => onViewInvoice(inv)}>
            {inv.invoice_number}
          </span>
          <p className="text-[10px] text-slate-400 capitalize">{inv.invoice_type?.replace(/_/g, " ")}</p>
        </div>
      ),
    },
    {
      key: "invoice_date",
      header: "Date",
      sortable: true,
      render: (inv) => <span className="text-slate-600 font-medium">{inv.invoice_date}</span>,
    },
    {
      key: "customer",
      header: "Customer Party",
      render: (inv) => (
        <div>
          <p className="font-medium text-slate-800">{inv.customer?.name || "Direct Cash Sale"}</p>
          {inv.customer?.gstin && (
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">{inv.customer.gstin}</p>
          )}
        </div>
      ),
    },
    {
      key: "place_of_supply_state_code",
      header: "Place of Supply",
      render: (inv) => (
        <span className="text-slate-600">
          State {inv.place_of_supply_state_code}{" "}
          <span className="text-[10px] text-slate-400 font-medium">
            ({inv.is_interstate ? "IGST" : "CGST+SGST"})
          </span>
        </span>
      ),
    },
    {
      key: "total_taxable_value",
      header: "Taxable (₹)",
      align: "right",
      sortable: true,
      render: (inv) => (
        <span className="font-mono text-slate-700">
          ₹{parseFloat(inv.total_taxable_value || "0").toFixed(2)}
        </span>
      ),
    },
    {
      key: "grand_total",
      header: "Grand Total (₹)",
      align: "right",
      sortable: true,
      render: (inv) => (
        <span className="font-mono font-bold text-slate-900">
          ₹{parseFloat(inv.grand_total || "0").toFixed(2)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (inv) => (
        <Badge
          variant={
            inv.status === "paid"
              ? "success"
              : inv.status === "cancelled"
              ? "danger"
              : inv.status === "finalized"
              ? "emerald"
              : "warning"
          }
          size="sm"
        >
          {inv.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (inv) => (
        <div className="inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onViewInvoice(inv)}
            title="View Details"
            className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDownloadPdf(inv)}
            title="Download PDF"
            className="p-1 rounded text-[#167a55] hover:text-[#126345] hover:bg-[#e8f5ee] transition-colors cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
          </button>
          {inv.status !== "cancelled" && (
            <>
              <button
                type="button"
                onClick={() => handleGenerateEinvoice(inv)}
                title="Generate e-Invoice IRN"
                className="p-1 rounded text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCancellingInvoice(inv)}
                title="Cancel Invoice"
                className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Ban className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Sales & Tax Invoices
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage, print, and track all outward tax invoices and debit/credit notes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenCreateInvoice}
            icon={<Plus className="w-4 h-4" />}
          >
            New Tax Invoice
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Invoices Table */}
      <DataTable
        columns={columns}
        data={filteredInvoices}
        searchPlaceholder="Search invoice #, customer name, GSTIN..."
        emptyTitle="No invoices found"
        emptyDescription="No invoices matching the current filter."
        emptyAction={
          <Button variant="primary" size="sm" onClick={onOpenCreateInvoice}>
            Create First Invoice
          </Button>
        }
      />

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={!!cancellingInvoice}
        onClose={() => setCancellingInvoice(null)}
        title="Cancel Tax Invoice"
        subtitle={`Invoice: #${cancellingInvoice?.invoice_number}`}
        size="sm"
        footer={
          <div className="w-full flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancellingInvoice(null)}
            >
              Back
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={cancelLoading}
              disabled={!cancelReason.trim()}
              onClick={handleCancelSubmit}
              icon={<Ban className="w-4 h-4" />}
            >
              Confirm Cancellation
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <p>
              Cancelling will lock the invoice, reverse output GST liabilities, and post an immutable double-entry reversal voucher in the General Ledger.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cancellation Statutory Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g., Order cancelled by customer, data entry mistake..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
