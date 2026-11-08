import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Scale,
  FileSpreadsheet,
  TrendingUp,
  Lock,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Card, CardHeader } from "../../components/ui/Card";
import { Tabs } from "../../components/ui/EmptyState";
import { DataTable } from "../../components/tables/DataTable";
import type { Column } from "../../components/tables/DataTable";
import { api } from "../../services/api";
import type { BusinessProfile } from "../../services/api";

export interface AccountingScreenProps {
  business: BusinessProfile | null;
}

export const AccountingScreen: React.FC<AccountingScreenProps> = ({ business }) => {
  const [activeTab, setActiveTab] = useState("accounts");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [trialBalance, setTrialBalance] = useState<any>(null);
  const [profitLoss, setProfitLoss] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!business) return;
    const loadData = async () => {
      setLoading(true);
      try {
        if (activeTab === "accounts") {
          const accs = await api.getAccounts(business.id);
          setAccounts(accs);
        } else if (activeTab === "journal") {
          const res = await api.getJournalEntries(business.id);
          setJournalEntries(res.data || []);
        } else if (activeTab === "trial_balance") {
          const tb = await api.getTrialBalance(business.id);
          setTrialBalance(tb);
        } else if (activeTab === "pl") {
          const pl = await api.getProfitLoss(business.id);
          setProfitLoss(pl);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [business, activeTab]);

  const tabs = [
    { id: "accounts", label: "Chart of Accounts", icon: <BookOpen className="w-4 h-4" /> },
    { id: "journal", label: "General Ledger & JVs", icon: <Scale className="w-4 h-4" /> },
    { id: "trial_balance", label: "Trial Balance", icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: "pl", label: "Profit & Loss", icon: <TrendingUp className="w-4 h-4" /> },
  ];

  const accountColumns: Column<any>[] = [
    {
      key: "code",
      header: "Account Code",
      sortable: true,
      render: (a) => <span className="font-mono font-bold text-slate-800">{a.code}</span>,
    },
    {
      key: "name",
      header: "Account Name",
      sortable: true,
      render: (a) => (
        <div>
          <span className="font-semibold text-slate-900">{a.name}</span>
          <p className="text-[10px] text-slate-400 capitalize">{a.sub_type}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Classification",
      render: (a) => {
        const variant =
          a.type === "asset"
            ? "emerald"
            : a.type === "liability"
            ? "danger"
            : a.type === "revenue"
            ? "info"
            : "warning";
        return (
          <Badge variant={variant} size="sm">
            {a.type}
          </Badge>
        );
      },
    },
    {
      key: "is_system",
      header: "Type",
      render: (a) => (
        <span className="text-slate-500 text-xs">
          {a.is_system ? "Statutory System" : "Custom"}
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
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Double-Entry Accounting Engine
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#167a55] bg-[#e8f5ee] px-2 py-0.5 rounded-full border border-[#b8e2cd]">
              <Lock className="w-3 h-3" />
              Statutory Immutability Triggers
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict debit-credit balance, automated sales/purchase posting, and financial statements.
          </p>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "accounts" && (
        <DataTable
          columns={accountColumns}
          data={accounts}
          loading={loading}
          searchPlaceholder="Search account name, code, category..."
          emptyTitle="Loading Chart of Accounts..."
        />
      )}

      {activeTab === "journal" && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs divide-y divide-slate-100">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Posted Journal Vouchers</span>
            <span className="text-xs text-slate-500">Immutable Audit Trail</span>
          </div>
          {journalEntries.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No journal entries posted yet. Creating an invoice or purchase will automatically post entries.
            </div>
          ) : (
            journalEntries.map((jv) => (
              <div key={jv.id} className="p-4 hover:bg-slate-50/60 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      #{jv.entry_number}
                    </span>
                    <Badge variant="emerald" size="sm">
                      {jv.reference_type || "journal"}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-500">{jv.entry_date}</span>
                </div>
                <p className="text-xs text-slate-600 font-medium">{jv.narration}</p>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 text-slate-500 font-mono">
                  <span>Debits: ₹{parseFloat(jv.total_debit || "0").toFixed(2)}</span>
                  <span>Credits: ₹{parseFloat(jv.total_credit || "0").toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "trial_balance" && (
        <Card>
          <CardHeader
            title="Trial Balance Summary"
            subtitle="Verification that sum of all debit balances equals credit balances"
          />
          <div className="p-5">
            {trialBalance ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-xs text-emerald-700 font-semibold uppercase">Total Debits</span>
                    <p className="text-2xl font-black text-[#167a55] font-mono mt-1">
                      ₹{parseFloat(trialBalance.total_debits || "0").toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <span className="text-xs text-blue-700 font-semibold uppercase">Total Credits</span>
                    <p className="text-2xl font-black text-blue-700 font-mono mt-1">
                      ₹{parseFloat(trialBalance.total_credits || "0").toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">Accounting Equilibrium Status</span>
                  <Badge variant={trialBalance.is_balanced ? "success" : "danger"} size="sm">
                    {trialBalance.is_balanced ? "✓ Perfectly Balanced" : "Out of Balance"}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">Loading trial balance...</p>
            )}
          </div>
        </Card>
      )}

      {activeTab === "pl" && (
        <Card>
          <CardHeader
            title="Profit & Loss Statement"
            subtitle="Operating revenues, cost of goods sold, and statutory net margin"
          />
          <div className="p-5">
            {profitLoss ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100">
                  <span className="font-semibold text-emerald-950">Operating Revenue (Sales)</span>
                  <span className="font-bold text-[#167a55]">
                    ₹{parseFloat(profitLoss.total_revenue || "0").toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/70 border border-amber-100">
                  <span className="font-semibold text-amber-950">Cost of Goods Sold (COGS)</span>
                  <span className="font-bold text-amber-800">
                    ₹{parseFloat(profitLoss.total_cogs || "0").toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 text-white font-bold text-sm mt-3">
                  <span>Net Operating Margin</span>
                  <span className="text-emerald-400">
                    ₹{parseFloat(profitLoss.net_profit || "0").toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">Loading financial report...</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
