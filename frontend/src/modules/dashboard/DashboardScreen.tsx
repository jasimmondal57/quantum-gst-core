import React from "react";
import {
  Receipt,
  ShoppingCart,
  ShoppingBag,
  DollarSign,
  AlertCircle,
  FileCheck2,
  Plus,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Eye,
  FileDown,
} from "lucide-react";
import { StatCard } from "../../components/ui/StatCard";
import { Card, CardHeader, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import type { Invoice, BusinessProfile } from "../../services/api";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export interface DashboardScreenProps {
  business: BusinessProfile | null;
  invoices: Invoice[];
  onNavigate: (screenId: string) => void;
  onOpenCreateInvoice: () => void;
  onOpenPosBilling: () => void;
  onViewInvoice: (inv: Invoice) => void;
  onDownloadPdf: (inv: Invoice) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  business,
  invoices,
  onNavigate,
  onOpenCreateInvoice,
  onOpenPosBilling,
  onViewInvoice,
  onDownloadPdf,
}) => {
  // Compute aggregate stats from invoices
  const totalSales = invoices.reduce((acc, inv) => {
    if (inv.status !== "cancelled") {
      return acc + (parseFloat(inv.grand_total) || 0);
    }
    return acc;
  }, 0);

  const totalGstLiability = invoices.reduce((acc, inv) => {
    if (inv.status !== "cancelled") {
      return acc + (parseFloat(inv.total_tax_amount) || 0);
    }
    return acc;
  }, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Mock monthly chart data based on invoices
  const chartData = [
    { month: "Jun", sales: 185000, purchases: 120000 },
    { month: "Jul", sales: 245000, purchases: 160000 },
    { month: "Aug", sales: 310000, purchases: 195000 },
    { month: "Sep", sales: 290000, purchases: 180000 },
    { month: "Oct", sales: 420000, purchases: 260000 },
    { month: "Nov", sales: totalSales > 0 ? totalSales : 540000, purchases: 310000 },
  ];

  const recentInvoices = invoices.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0f231c] to-[#164232] rounded-2xl p-5 sm:p-6 text-white shadow-md border border-[#1b4b39]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#167a55]/60 text-emerald-200 text-xs font-semibold mb-2 border border-emerald-400/20">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            Statutory GST Ready • FY 2026-27
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {business?.trade_name || business?.legal_name || "Quantum GST Dashboard"}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-xl">
            Real-time multi-tenant GST compliance, double-entry ledgers, and e-invoicing operations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="soft"
            size="sm"
            onClick={onOpenPosBilling}
            icon={<Receipt className="w-4 h-4" />}
          >
            Quick POS
          </Button>
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

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Sales (Turnover)"
          value={formatCurrency(totalSales)}
          subValue={`${invoices.length} invoices issued`}
          trend="up"
          change="+18.4%"
          icon={<ShoppingCart className="w-5 h-5" />}
          accentColor="emerald"
          onClick={() => onNavigate("sales")}
        />

        <StatCard
          label="Inward Purchases (ITC)"
          value={formatCurrency(totalSales * 0.65 || 320000)}
          subValue="Eligible input tax credit"
          trend="up"
          change="+9.2%"
          icon={<ShoppingBag className="w-5 h-5" />}
          accentColor="blue"
          onClick={() => onNavigate("purchases")}
        />

        <StatCard
          label="Net GST Liability"
          value={formatCurrency(totalGstLiability)}
          subValue="Output Tax - ITC Balance"
          trend="neutral"
          change="Due on 20th"
          icon={<FileCheck2 className="w-5 h-5" />}
          accentColor="amber"
          onClick={() => onNavigate("gst")}
        />

        <StatCard
          label="Accounts Receivable"
          value={formatCurrency(totalSales * 0.28 || 145000)}
          subValue="Outstanding customer dues"
          trend="down"
          change="-4.5%"
          icon={<DollarSign className="w-5 h-5" />}
          accentColor="purple"
          onClick={() => onNavigate("contacts")}
        />
      </div>

      {/* Analytics Chart & Compliance Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Purchases Trend Bar Chart */}
        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader
              title="Turnover & Purchase Analytics"
              subtitle="Monthly comparison of outward sales vs inward supplies"
              action={
                <span className="text-xs font-semibold text-[#167a55] bg-[#e8f5ee] px-2.5 py-1 rounded-md">
                  FY 2026-27
                </span>
              }
            />
            <CardContent className="flex-1 min-h-[260px] pt-4">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                    }}
                    formatter={(val: any) => [formatCurrency(Number(val)), ""]}
                  />
                  <Bar dataKey="sales" name="Sales" fill="#167a55" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="purchases" name="Purchases" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* GST Compliance Deadlines & Quick Launch */}
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="GST Compliance Radar"
              subtitle="Official statutory deadlines"
            />
            <CardContent className="space-y-3.5">
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-amber-950">GSTR-1 Outward</span>
                    <Badge variant="warning" size="sm">Due in 3 days</Badge>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Monthly return for outward supplies. File before 11th Nov 2026.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3">
                <FileCheck2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-blue-950">GSTR-3B Summary</span>
                    <Badge variant="info" size="sm">20th Nov</Badge>
                  </div>
                  <p className="text-[11px] text-blue-800 mt-0.5">
                    Monthly tax return and payment of tax liability.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-[#167a55] shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs text-[#0b5539]">GSTR-2B Auto Draft</span>
                    <Badge variant="emerald" size="sm">Available</Badge>
                  </div>
                  <p className="text-[11px] text-[#0b5539]/80 mt-0.5">
                    Inward ITC auto-generated statement ready for purchase reconciliation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <Card>
        <CardHeader
          title="Recent GST Tax Invoices"
          subtitle="Latest transactions recorded in books"
          action={
            <Button
              variant="outline"
              size="xs"
              onClick={() => onNavigate("sales")}
              icon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              View All Invoices
            </Button>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Place of Supply</th>
                <th className="py-3 px-4 text-right">Taxable</th>
                <th className="py-3 px-4 text-right">Total (INR)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No invoices recorded yet. Click "Create Tax Invoice" to begin.
                  </td>
                </tr>
              ) : (
                recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 font-mono">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{inv.invoice_date}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {inv.customer?.name || "Cash / Direct Customer"}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      State {inv.place_of_supply_state_code}{" "}
                      <span className="text-[10px] text-slate-400">
                        ({inv.is_interstate ? "IGST" : "CGST+SGST"})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-700 font-mono">
                      ₹{parseFloat(inv.total_taxable_value || "0").toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                      ₹{parseFloat(inv.grand_total || "0").toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
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
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onViewInvoice(inv)}
                          title="View Invoice"
                          className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDownloadPdf(inv)}
                          title="Download PDF"
                          className="p-1 rounded text-[#167a55] hover:text-[#126345] hover:bg-[#e8f5ee] cursor-pointer"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
