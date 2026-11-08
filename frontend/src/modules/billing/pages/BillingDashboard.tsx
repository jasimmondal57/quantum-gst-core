import React from "react";
import {
  FileText,
  ShoppingBag,
  Zap,
  FileCheck,
  RotateCcw,
  Truck,
  Plus,
  Receipt,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { StatCard } from "../../../components/ui/StatCard";
import type { BusinessProfile, Invoice } from "../../../services/api";

export interface BillingDashboardProps {
  business: BusinessProfile | null;
  invoices: Invoice[];
  onNavigate: (route: string) => void;
}

export const BillingDashboard: React.FC<BillingDashboardProps> = ({
  business,
  invoices,
  onNavigate,
}) => {
  const primaryGstin = business?.gstins?.[0];

  const totalSales = invoices.reduce((acc, inv) => {
    if (inv.status === "cancelled") return acc;
    return acc + (parseFloat(inv.grand_total || "0") || 0);
  }, 0);

  const pendingReceivables = invoices.reduce((acc, inv) => {
    if (inv.status === "finalized") {
      return acc + (parseFloat(inv.grand_total || "0") || 0);
    }
    return acc;
  }, 0);

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-[#167a55] text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full text-white inline-block">
            Billing & Invoicing Workspace · FY 2026–27
          </span>
          <h1 className="text-2xl font-bold tracking-tight">
            Fast, Statutory GST Billing & Accounting
          </h1>
          <p className="text-xs text-white/90 leading-relaxed">
            Create sales invoices, counter POS receipts, purchase bills, and e-way challans with instant BCMath GST calculations and automated double-entry ledger posting.
          </p>
          <div className="pt-2 flex items-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate("/billing/create")}
              icon={<Plus className="w-4 h-4 text-[#167a55]" />}
            >
              + Create Sales Invoice
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate("/pos")}
              className="bg-white/10 text-white border-white/30 hover:bg-white/20"
              icon={<Zap className="w-4 h-4" />}
            >
              POS Quick Counter
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Invoiced Sales"
          value={`₹${totalSales.toFixed(2)}`}
          trend="up"
          change={`${invoices.length} invoices`}
          accentColor="emerald"
          icon={<Receipt className="w-5 h-5" />}
        />
        <StatCard
          label="Outstanding Receivables"
          value={`₹${pendingReceivables.toFixed(2)}`}
          trend="down"
          change="Awaiting Settlement"
          accentColor="amber"
          icon={<Clock className="w-5 h-5" />}
        />
        <StatCard
          label="Active GSTIN"
          value={primaryGstin?.gstin || "27AAACB9999F1Z9"}
          trend="neutral"
          change={`State Code ${primaryGstin?.state_code || "27"}`}
          accentColor="blue"
          icon={<ShieldCheck className="w-5 h-5" />}
        />
        <StatCard
          label="Filing Frequency"
          value="Monthly GSTR-1"
          trend="neutral"
          change="Regular Scheme"
          accentColor="slate"
          icon={<FileText className="w-5 h-5" />}
        />
      </div>

      {/* Quick Launchpad Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-[#172b25] uppercase tracking-wider">
          Billing Documents Launchpad
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            type="button"
            onClick={() => onNavigate("/billing/create")}
            className="p-4 rounded-xl border border-[#e2ebe5] bg-white hover:border-[#167a55] hover:bg-[#eaf6ef]/30 transition-all text-left group space-y-2 shadow-xs"
          >
            <div className="p-2 rounded-lg bg-[#eaf6ef] text-[#167a55] w-fit group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#172b25] block">Sales Invoice</span>
              <span className="text-[10px] text-[#71817a]">B2B & B2C Invoices</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("/pos")}
            className="p-4 rounded-xl border border-[#e2ebe5] bg-white hover:border-[#167a55] hover:bg-[#eaf6ef]/30 transition-all text-left group space-y-2 shadow-xs"
          >
            <div className="p-2 rounded-lg bg-[#eaf6ef] text-[#167a55] w-fit group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#172b25] block">POS Counter</span>
              <span className="text-[10px] text-[#71817a]">Barcode & Cash/UPI</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("/purchases/create")}
            className="p-4 rounded-xl border border-[#e2ebe5] bg-white hover:border-[#167a55] hover:bg-[#eaf6ef]/30 transition-all text-left group space-y-2 shadow-xs"
          >
            <div className="p-2 rounded-lg bg-[#eaf6ef] text-[#167a55] w-fit group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#172b25] block">Purchase Bill</span>
              <span className="text-[10px] text-[#71817a]">Inward ITC Tracking</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("/quotations/create")}
            className="p-4 rounded-xl border border-[#e2ebe5] bg-white hover:border-[#167a55] hover:bg-[#eaf6ef]/30 transition-all text-left group space-y-2 shadow-xs"
          >
            <div className="p-2 rounded-lg bg-[#eaf6ef] text-[#167a55] w-fit group-hover:scale-105 transition-transform">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#172b25] block">Quotation</span>
              <span className="text-[10px] text-[#71817a]">Estimates & Offers</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("/credit-notes/create")}
            className="p-4 rounded-xl border border-[#e2ebe5] bg-white hover:border-[#167a55] hover:bg-[#eaf6ef]/30 transition-all text-left group space-y-2 shadow-xs"
          >
            <div className="p-2 rounded-lg bg-[#eaf6ef] text-[#167a55] w-fit group-hover:scale-105 transition-transform">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#172b25] block">Credit Note</span>
              <span className="text-[10px] text-[#71817a]">Sales Returns u/s 34</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("/delivery-challans/create")}
            className="p-4 rounded-xl border border-[#e2ebe5] bg-white hover:border-[#167a55] hover:bg-[#eaf6ef]/30 transition-all text-left group space-y-2 shadow-xs"
          >
            <div className="p-2 rounded-lg bg-[#eaf6ef] text-[#167a55] w-fit group-hover:scale-105 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-xs text-[#172b25] block">Delivery Challan</span>
              <span className="text-[10px] text-[#71817a]">Goods Movement u/r 55</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
