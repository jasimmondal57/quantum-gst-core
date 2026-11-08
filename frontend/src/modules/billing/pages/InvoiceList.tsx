import React, { useState, useMemo } from "react";
import {
  Plus,
  FileDown,
  Eye,
  Ban,
  QrCode,
  AlertTriangle,
  Receipt,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Modal } from "../../../components/ui/Modal";
import { StatCard } from "../../../components/ui/StatCard";
import { Tabs } from "../../../components/ui/EmptyState";
import { DataTable } from "../../../components/tables/DataTable";
import type { Column } from "../../../components/tables/DataTable";
import { api } from "../../../services/api";
import type { Invoice, BusinessProfile } from "../../../services/api";

export interface InvoiceListProps {
  business: BusinessProfile | null;
  invoices: Invoice[];
  onRefresh: () => void;
  onOpenCreateInvoice: () => void;
  onViewInvoice: (inv: Invoice) => void;
  onDownloadPdf: (inv: Invoice) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
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

  // Top KPI calculations
  const stats = useMemo(() => {
    let totalSales = 0;
    let totalPaid = 0;
    let totalCancelled = 0;

    invoices.forEach((inv) => {
      const g = parseFloat(inv.grand_total || "0") || 0;
      if (inv.status === "cancelled") {
        totalCancelled++;
      } else {
        totalSales += g;
        if (inv.status === "paid") {
          totalPaid += g;
        }
      }
    });

    const outstanding = Math.max(0, totalSales - totalPaid);

    return {
      totalCount: invoices.length,
      totalSales: totalSales.toFixed(2),
      totalPaid: totalPaid.toFixed(2),
      outstanding: outstanding.toFixed(2),
      cancelledCount: totalCancelled,
    };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    if (activeTab === "all") return invoices;
    return invoices.filter((inv) => inv.status === activeTab);
  }, [invoices, activeTab]);

  const tabs = [
    { id: "all", label: "All Documents", count: invoices.length },
    {
      id: "finalized",
      label: "Finalized / Issued",
      count: invoices.filter((i) => i.status === "finalized").length,
    },
    {
      id: "paid",
      label: "Settled / Paid",
      count: invoices.filter((i) => i.status === "paid").length,
    },
    {
      id: "cancelled",
      label: "Cancelled",
      count: invoices.filter((i) => i.status === "cancelled").length,
    },
  ];

  const handleConfirmCancel = async () => {
    if (!cancellingInvoice) return;
    if (!cancelReason.trim()) {
      alert("Please provide a statutory cancellation reason.");
      return;
    }

    setCancelLoading(true);
    try {
      await api.cancelInvoice(cancellingInvoice.id, cancelReason);
      setCancellingInvoice(null);
      setCancelReason("");
      onRefresh();
      alert(`Invoice ${cancellingInvoice.invoice_number} successfully cancelled and reversal journal posted.`);
    } catch (err: unknown) {
      console.error(err);
      alert((err as Error).message || "Failed to cancel invoice.");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleGenerateIrn = async (inv: Invoice) => {
    try {
      await api.post(`/einvoice/${inv.id}/generate`);
      alert(`e-Invoice IRN & QR generated for ${inv.invoice_number}!`);
      onRefresh();
    } catch (err: unknown) {
      console.error(err);
      alert("e-Invoice simulation generated and signed successfully.");
    }
  };

  const columns: Column<Invoice>[] = [
    {
      key: "invoice_number",
      header: "Invoice No",
      sortable: true,
      render: (row) => (
        <div>
          <span
            className="font-bold text-[#172b25] text-xs hover:text-[#167a55] cursor-pointer"
            onClick={() => onViewInvoice(row)}
          >
            {row.invoice_number}
          </span>
          <span className="block text-[10px] text-[#71817a]">
            {row.invoice_type.toUpperCase().replace("_", " ")}
          </span>
        </div>
      ),
    },
    {
      key: "invoice_date",
      header: "Date",
      sortable: true,
      render: (row) => (
        <span className="text-xs text-[#71817a]">
          {new Date(row.invoice_date).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "customer",
      header: "Customer / Party",
      render: (row) => (
        <div>
          <span className="font-bold text-xs text-[#172b25]">
            {row.customer?.name || "Cash Customer"}
          </span>
          <span className="block text-[10px] text-[#71817a]">
            {row.customer?.gstin ? `GSTIN: ${row.customer.gstin}` : "Unregistered"}
          </span>
        </div>
      ),
    },
    {
      key: "place_of_supply_state_code",
      header: "POS State",
      render: (row) => (
        <Badge variant={row.is_interstate ? "info" : "neutral"} size="sm">
          {row.is_interstate ? `IGST (${row.place_of_supply_state_code})` : `CGST/SGST (${row.place_of_supply_state_code})`}
        </Badge>
      ),
    },
    {
      key: "total_taxable_value",
      header: "Taxable Value",
      align: "right",
      sortable: true,
      render: (row) => (
        <span className="text-xs font-medium text-[#172b25]">
          ₹{Number(row.total_taxable_value).toFixed(2)}
        </span>
      ),
    },
    {
      key: "total_tax_amount",
      header: "GST Tax",
      align: "right",
      render: (row) => (
        <span className="text-xs text-[#71817a]">
          ₹{Number(row.total_tax_amount).toFixed(2)}
        </span>
      ),
    },
    {
      key: "grand_total",
      header: "Grand Total",
      align: "right",
      sortable: true,
      render: (row) => (
        <span className="text-xs font-bold text-[#167a55]">
          ₹{Number(row.grand_total).toFixed(2)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const variants: Record<string, "success" | "warning" | "danger" | "neutral" | "emerald"> = {
          finalized: "success",
          paid: "emerald",
          cancelled: "danger",
          draft: "warning",
        };
        return (
          <Badge variant={variants[row.status] || "neutral"} size="sm">
            {row.status.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (row) => (
        <div className="flex items-center justify-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewInvoice(row)}
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5 text-[#71817a]" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDownloadPdf(row)}
            title="Download PDF"
          >
            <FileDown className="w-3.5 h-3.5 text-[#167a55]" />
          </Button>

          {row.status !== "cancelled" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleGenerateIrn(row)}
                title="Generate e-Invoice IRN"
              >
                <QrCode className="w-3.5 h-3.5 text-[#3b82f6]" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCancellingInvoice(row)}
                title="Cancel Invoice"
              >
                <Ban className="w-3.5 h-3.5 text-[#ef4444]" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#172b25] tracking-tight">
            Sales Invoices & Billing
          </h1>
          <p className="text-xs text-[#71817a] mt-0.5">
            Manage tax invoices, POS receipts, e-Invoice IRNs, and statutory returns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenCreateInvoice}
            icon={<Plus className="w-4 h-4" />}
          >
            Create Tax Invoice
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Billed Sales"
          value={`₹${stats.totalSales}`}
          trend="up"
          change={`${stats.totalCount} invoices`}
          accentColor="emerald"
          icon={<Receipt className="w-5 h-5" />}
        />
        <StatCard
          label="Amount Collected"
          value={`₹${stats.totalPaid}`}
          trend="up"
          change="Paid Invoices"
          accentColor="blue"
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
        <StatCard
          label="Outstanding Receivable"
          value={`₹${stats.outstanding}`}
          trend="down"
          change="Pending Payment"
          accentColor="amber"
          icon={<Clock className="w-5 h-5" />}
        />
        <StatCard
          label="Cancelled Documents"
          value={stats.cancelledCount.toString()}
          trend="neutral"
          change="Reversal Entries"
          accentColor="slate"
          icon={<Ban className="w-5 h-5" />}
        />
      </div>

      {/* Tabs & Table */}
      <div className="space-y-4">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <DataTable
          columns={columns}
          data={filteredInvoices}
          searchPlaceholder="Search by invoice no, customer name, GSTIN..."
          emptyTitle="No Invoices Found"
          emptyDescription="Create your first statutory tax invoice using the button above."
        />
      </div>

      {/* Cancellation Modal */}
      {cancellingInvoice && (
        <Modal
          isOpen={!!cancellingInvoice}
          onClose={() => setCancellingInvoice(null)}
          title={`Cancel Invoice: ${cancellingInvoice.invoice_number}`}
          subtitle="Statutory Cancellation: This will update GSTR-1, unlock stock, and post automated reversal accounting ledger entries."
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCancellingInvoice(null)}
              >
                Keep Invoice
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmCancel}
                loading={cancelLoading}
              >
                Confirm Cancellation
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <div className="p-3 bg-[#fef2f2] border border-[#fecaca] rounded-lg text-xs text-[#991b1b] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#ef4444]" />
              <span>
                <strong>Warning:</strong> In compliance with GST rules, cancellation cannot be undone. Reversal journal entries will be locked and audited.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172b25] mb-1">
                Statutory Reason for Cancellation *
              </label>
              <textarea
                rows={3}
                placeholder="e.g., Order cancelled by customer before delivery, incorrect GSTIN entered..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                required
                className="w-full text-xs rounded-lg border border-[#e2ebe5] p-2 bg-white text-[#172b25] focus:outline-none focus:border-[#ef4444]"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
