import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Scale,
  FileSpreadsheet,
  TrendingUp,
  Lock,
  Plus,
  Landmark,
  CheckCircle2,
  Trash2,
  PieChart,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader } from "../../components/ui/Card";
import { Tabs } from "../../components/ui/EmptyState";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { DataTable } from "../../components/tables/DataTable";
import type { Column } from "../../components/tables/DataTable";
import { api } from "../../services/api";
import type { BusinessProfile } from "../../services/api";

export interface AccountingScreenProps {
  business: BusinessProfile | null;
}

interface JVLine {
  account_id: string;
  debit: string;
  credit: string;
  description: string;
}

export const AccountingScreen: React.FC<AccountingScreenProps> = ({ business }) => {
  const [activeTab, setActiveTab] = useState("accounts");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [trialBalance, setTrialBalance] = useState<any>(null);
  const [profitLoss, setProfitLoss] = useState<any>(null);
  const [balanceSheet, setBalanceSheet] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showPostJVModal, setShowPostJVModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // New Account Form
  const [newAccCode, setNewAccCode] = useState("");
  const [newAccName, setNewAccName] = useState("");
  const [newAccType, setNewAccType] = useState<"asset" | "liability" | "equity" | "revenue" | "expense">("asset");
  const [newAccSubType, setNewAccSubType] = useState("current_asset");

  // Post JV Form
  const [jvDate, setJvDate] = useState(new Date().toISOString().split("T")[0]);
  const [jvNarration, setJvNarration] = useState("");
  const [jvLines, setJvLines] = useState<JVLine[]>([
    { account_id: "", debit: "", credit: "", description: "" },
    { account_id: "", debit: "", credit: "", description: "" },
  ]);

  const loadData = async () => {
    if (!business) return;
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
      } else if (activeTab === "balance_sheet") {
        const bs = await api.getBalanceSheet(business.id);
        setBalanceSheet(bs);
      }
    } catch (e) {
      console.error("Accounting data load failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business, activeTab]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !newAccCode.trim() || !newAccName.trim()) return;
    setActionLoading(true);
    try {
      await api.createAccount({
        business_id: business.id,
        code: newAccCode.trim(),
        name: newAccName.trim(),
        type: newAccType,
        sub_type: newAccSubType,
      });
      setShowAddAccountModal(false);
      setNewAccCode("");
      setNewAccName("");
      await loadData();
    } catch (err: unknown) {
      alert("Error adding account: " + ((err as Error).message || "Failed"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddJVLine = () => {
    setJvLines([...jvLines, { account_id: "", debit: "", credit: "", description: "" }]);
  };

  const handleRemoveJVLine = (idx: number) => {
    if (jvLines.length <= 2) return;
    setJvLines(jvLines.filter((_, i) => i !== idx));
  };

  const updateJVLine = (idx: number, updates: Partial<JVLine>) => {
    setJvLines(jvLines.map((line, i) => (i === idx ? { ...line, ...updates } : line)));
  };

  // JV Totals
  const jvTotalDebit = jvLines.reduce((acc, l) => acc + (parseFloat(l.debit) || 0), 0);
  const jvTotalCredit = jvLines.reduce((acc, l) => acc + (parseFloat(l.credit) || 0), 0);
  const jvDiff = Math.abs(jvTotalDebit - jvTotalCredit);
  const jvIsBalanced = jvDiff < 0.01 && jvTotalDebit > 0;

  const handlePostJV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    if (!jvIsBalanced) {
      alert(`Journal entry is not balanced! Total Debits: ₹${jvTotalDebit.toFixed(2)}, Total Credits: ₹${jvTotalCredit.toFixed(2)}.`);
      return;
    }

    setActionLoading(true);
    try {
      await api.postJournalEntry({
        business_id: business.id,
        entry_date: jvDate,
        narration: jvNarration.trim(),
        lines: jvLines.map((l) => ({
          account_id: l.account_id,
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0,
          description: l.description.trim() || undefined,
        })),
      });

      setShowPostJVModal(false);
      setJvNarration("");
      setJvLines([
        { account_id: "", debit: "", credit: "", description: "" },
        { account_id: "", debit: "", credit: "", description: "" },
      ]);
      await loadData();
      alert("Journal Voucher posted successfully to General Ledger!");
    } catch (err: unknown) {
      alert("Error posting JV: " + ((err as Error).message || "Failed"));
    } finally {
      setActionLoading(false);
    }
  };

  const tabs = [
    { id: "accounts", label: "Chart of Accounts", icon: <BookOpen className="w-4 h-4" /> },
    { id: "journal", label: "General Ledger & JVs", icon: <Scale className="w-4 h-4" /> },
    { id: "trial_balance", label: "Trial Balance", icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: "pl", label: "Profit & Loss", icon: <TrendingUp className="w-4 h-4" /> },
    { id: "balance_sheet", label: "Balance Sheet", icon: <Landmark className="w-4 h-4" /> },
  ];

  // Visual Chart of Accounts Count by Category
  const assetCount = accounts.filter((a) => a.type === "asset").length;
  const liabilityCount = accounts.filter((a) => a.type === "liability").length;
  const equityCount = accounts.filter((a) => a.type === "equity").length;
  const revenueCount = accounts.filter((a) => a.type === "revenue").length;
  const expenseCount = accounts.filter((a) => a.type === "expense").length;

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
          <p className="text-[10px] text-slate-400 capitalize">{a.sub_type?.replace(/_/g, " ")}</p>
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
      header: "Nature",
      render: (a) => (
        <span className="text-slate-500 text-xs">
          {a.is_system ? "Statutory System" : "Custom Ledger"}
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
            Strict debit-credit balance, automated sales/purchase posting, and statutory financial statements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "accounts" && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddAccountModal(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Ledger Account
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPostJVModal(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Post Journal Voucher (JV)
          </Button>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* 1. Visual Chart of Accounts */}
      {activeTab === "accounts" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-800 uppercase">Assets (1000s)</span>
              <p className="text-xl font-bold text-[#167a55] mt-1">{assetCount} Accounts</p>
              <p className="text-[10px] text-emerald-600 mt-0.5">Bank, Receivables, Stock</p>
            </div>
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-[11px] font-bold text-rose-800 uppercase">Liabilities (2000s)</span>
              <p className="text-xl font-bold text-rose-700 mt-1">{liabilityCount} Accounts</p>
              <p className="text-[10px] text-rose-600 mt-0.5">Creditors, Tax Payable</p>
            </div>
            <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200">
              <span className="text-[11px] font-bold text-purple-800 uppercase">Equity (3000s)</span>
              <p className="text-xl font-bold text-purple-700 mt-1">{equityCount} Accounts</p>
              <p className="text-[10px] text-purple-600 mt-0.5">Owner Capital, Reserves</p>
            </div>
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-[11px] font-bold text-blue-800 uppercase">Revenue (4000s)</span>
              <p className="text-xl font-bold text-blue-700 mt-1">{revenueCount} Accounts</p>
              <p className="text-[10px] text-blue-600 mt-0.5">Sales, Service Incomes</p>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-amber-800 uppercase">Expenses (5000s)</span>
              <p className="text-xl font-bold text-amber-700 mt-1">{expenseCount} Accounts</p>
              <p className="text-[10px] text-amber-600 mt-0.5">COGS, Overheads, Taxes</p>
            </div>
          </div>

          <DataTable
            columns={accountColumns}
            data={accounts}
            loading={loading}
            searchPlaceholder="Search account name, code, category..."
            emptyTitle="Loading Chart of Accounts..."
          />
        </div>
      )}

      {/* 2. General Ledger & JVs */}
      {activeTab === "journal" && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs divide-y divide-slate-100">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800">Posted Journal Vouchers</span>
              <span className="text-xs text-slate-500 ml-2">({journalEntries.length} immutable entries)</span>
            </div>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setShowPostJVModal(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Post Manual JV
            </Button>
          </div>

          {journalEntries.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No journal entries posted yet. Creating an invoice, purchase bill, or manual JV will post entries here.
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
                      {jv.reference_type || "manual"}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-500">{jv.entry_date}</span>
                </div>
                <p className="text-xs text-slate-600 font-medium">{jv.narration}</p>

                {/* Lines breakdown if present */}
                {jv.lines && jv.lines.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-2 text-[11px] font-mono space-y-1">
                    {jv.lines.map((l: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-slate-600">
                        <span>
                          {l.account?.name || "Account"} ({l.account?.code || ""})
                        </span>
                        <span>
                          {parseFloat(l.debit) > 0 ? `Dr ₹${parseFloat(l.debit).toFixed(2)}` : ""}
                          {parseFloat(l.credit) > 0 ? `Cr ₹${parseFloat(l.credit).toFixed(2)}` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 text-slate-500 font-mono">
                  <span>Total Debits: ₹{parseFloat(jv.total_debit || "0").toFixed(2)}</span>
                  <span>Total Credits: ₹{parseFloat(jv.total_credit || "0").toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. Trial Balance */}
      {activeTab === "trial_balance" && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Trial Balance Summary"
              subtitle="Verification that the sum of all debit balances equals total credit balances"
            />
            <div className="p-5">
              {trialBalance ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                      <span className="text-xs text-emerald-800 font-semibold uppercase">Total Debits</span>
                      <p className="text-2xl font-black text-[#167a55] font-mono mt-1">
                        ₹{parseFloat(trialBalance.total_debit || trialBalance.total_debits || "0").toFixed(2)}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                      <span className="text-xs text-blue-800 font-semibold uppercase">Total Credits</span>
                      <p className="text-2xl font-black text-blue-700 font-mono mt-1">
                        ₹{parseFloat(trialBalance.total_credit || trialBalance.total_credits || "0").toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">Accounting Equilibrium Status</span>
                    <Badge variant={trialBalance.is_balanced ? "success" : "danger"} size="sm">
                      {trialBalance.is_balanced ? "✓ Perfectly Balanced (₹0.00 Difference)" : "Out of Balance"}
                    </Badge>
                  </div>

                  {/* Line by line accounts breakdown */}
                  {trialBalance.accounts && trialBalance.accounts.length > 0 && (
                    <div className="overflow-x-auto pt-2">
                      <table className="w-full text-xs text-left border-collapse font-mono">
                        <thead>
                          <tr className="bg-slate-100 font-semibold text-slate-700 uppercase text-[11px] border-b">
                            <th className="p-2.5">Code</th>
                            <th className="p-2.5">Account Title</th>
                            <th className="p-2.5">Category</th>
                            <th className="p-2.5 text-right">Debit (₹)</th>
                            <th className="p-2.5 text-right">Credit (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {trialBalance.accounts.map((row: any) => (
                            <tr key={row.account_id} className="hover:bg-slate-50">
                              <td className="p-2.5 font-bold text-slate-900">{row.code}</td>
                              <td className="p-2.5 font-sans font-medium text-slate-800">{row.name}</td>
                              <td className="p-2.5 font-sans text-slate-500 capitalize">{row.type}</td>
                              <td className="p-2.5 text-right text-emerald-700 font-bold">
                                {parseFloat(row.debit) > 0 ? `₹${parseFloat(row.debit).toFixed(2)}` : "—"}
                              </td>
                              <td className="p-2.5 text-right text-blue-700 font-bold">
                                {parseFloat(row.credit) > 0 ? `₹${parseFloat(row.credit).toFixed(2)}` : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-8">Loading trial balance...</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* 4. Profit & Loss Statement */}
      {activeTab === "pl" && (
        <Card>
          <CardHeader
            title="Profit & Loss Statement"
            subtitle="Operating revenues, cost of goods sold, and statutory net margin"
          />
          <div className="p-5">
            {profitLoss ? (
              <div className="space-y-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between font-bold text-sm text-[#0f553b]">
                    <span>Operating Turnover (Revenue)</span>
                    <span>₹{parseFloat(profitLoss.total_revenue || "0").toFixed(2)}</span>
                  </div>
                  {profitLoss.revenue_items && profitLoss.revenue_items.length > 0 && (
                    <div className="divide-y divide-emerald-100 pt-1 text-[11px]">
                      {profitLoss.revenue_items.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between py-1 text-emerald-900">
                          <span className="font-sans">{item.name} ({item.code})</span>
                          <span>₹{parseFloat(item.amount).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between font-bold text-sm text-amber-900">
                    <span>Direct Expenses & COGS</span>
                    <span>₹{parseFloat(profitLoss.total_expenses || profitLoss.total_cogs || "0").toFixed(2)}</span>
                  </div>
                  {profitLoss.expense_items && profitLoss.expense_items.length > 0 && (
                    <div className="divide-y divide-amber-100 pt-1 text-[11px]">
                      {profitLoss.expense_items.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between py-1 text-amber-900">
                          <span className="font-sans">{item.name} ({item.code})</span>
                          <span>₹{parseFloat(item.amount).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 text-white font-bold text-base mt-4 shadow-sm">
                  <span className="font-sans">Net Operating Margin (P&L)</span>
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

      {/* 5. Balance Sheet */}
      {activeTab === "balance_sheet" && (
        <Card>
          <CardHeader
            title="Balance Sheet (Statement of Financial Position)"
            subtitle="Assets = Liabilities + Owner Equity equilibrium audit"
          />
          <div className="p-5">
            {balanceSheet ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Left: Assets */}
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-200 font-bold text-sm text-[#0f553b]">
                      <span>Assets (Application of Funds)</span>
                      <span className="font-mono">₹{parseFloat(balanceSheet.total_assets || "0").toFixed(2)}</span>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      {balanceSheet.assets && balanceSheet.assets.length > 0 ? (
                        balanceSheet.assets.map((item: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-slate-700 py-1 border-b border-emerald-100/60">
                            <span className="font-sans">{item.name} ({item.code})</span>
                            <span className="font-bold text-[#167a55]">₹{parseFloat(item.amount).toFixed(2)}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400 text-xs py-2">No asset balances recorded yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Right: Liabilities & Equity */}
                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-blue-200 font-bold text-sm text-blue-900">
                      <span>Liabilities & Equity (Source of Funds)</span>
                      <span className="font-mono">₹{parseFloat(balanceSheet.total_liabilities_and_equity || "0").toFixed(2)}</span>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Liabilities</div>
                      {balanceSheet.liabilities && balanceSheet.liabilities.length > 0 ? (
                        balanceSheet.liabilities.map((item: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-slate-700 py-1 border-b border-blue-100/60">
                            <span className="font-sans">{item.name} ({item.code})</span>
                            <span className="font-bold text-rose-700">₹{parseFloat(item.amount).toFixed(2)}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-400 text-xs">No liability balances recorded.</p>
                      )}

                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pt-2">Equity & Reserves</div>
                      {balanceSheet.equity && balanceSheet.equity.length > 0 && (
                        balanceSheet.equity.map((item: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-slate-700 py-1 border-b border-blue-100/60">
                            <span className="font-sans">{item.name} ({item.code})</span>
                            <span className="font-bold text-purple-700">₹{parseFloat(item.amount).toFixed(2)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-emerald-400" />
                    <span>Balance Sheet Equilibrium Audit</span>
                  </div>
                  <Badge variant={balanceSheet.is_balanced ? "success" : "danger"} size="sm">
                    {balanceSheet.is_balanced ? "✓ Assets = Liabilities + Equity Balanced" : "Imbalance Detected"}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">Loading Balance Sheet statement...</p>
            )}
          </div>
        </Card>
      )}

      {/* Modal: Add Ledger Account */}
      <Modal
        isOpen={showAddAccountModal}
        onClose={() => setShowAddAccountModal(false)}
        title="Add Chart of Accounts Ledger"
        subtitle="Create custom accounts for general ledger & double-entry posting"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddAccountModal(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-account-form"
              variant="primary"
              size="sm"
              loading={actionLoading}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Save Account
            </Button>
          </div>
        }
      >
        <form id="add-account-form" onSubmit={handleCreateAccount} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Account Code *"
              value={newAccCode}
              onChange={(e) => setNewAccCode(e.target.value)}
              placeholder="e.g., 1080 or 5030"
              required
            />
            <Input
              label="Account Title *"
              value={newAccName}
              onChange={(e) => setNewAccName(e.target.value)}
              placeholder="e.g., Office Rent Expense"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Classification Type *
              </label>
              <select
                value={newAccType}
                onChange={(e) => {
                  const t = e.target.value as any;
                  setNewAccType(t);
                  if (t === "asset") setNewAccSubType("current_asset");
                  if (t === "liability") setNewAccSubType("current_liability");
                  if (t === "equity") setNewAccSubType("capital");
                  if (t === "revenue") setNewAccSubType("operating_revenue");
                  if (t === "expense") setNewAccSubType("operating_expense");
                }}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:border-[#167a55]"
              >
                <option value="asset">Asset (1000s)</option>
                <option value="liability">Liability (2000s)</option>
                <option value="equity">Equity (3000s)</option>
                <option value="revenue">Revenue (4000s)</option>
                <option value="expense">Expense (5000s)</option>
              </select>
            </div>

            <Input
              label="Sub-Classification"
              value={newAccSubType}
              onChange={(e) => setNewAccSubType(e.target.value)}
              placeholder="e.g. current_asset, operating_expense"
              required
            />
          </div>
        </form>
      </Modal>

      {/* Modal: Post Manual Journal Voucher (JV) */}
      <Modal
        isOpen={showPostJVModal}
        onClose={() => setShowPostJVModal(false)}
        title="Post Manual Journal Voucher (JV)"
        subtitle="Record general journal adjustments with strict debit-credit equilibrium"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs font-mono">
              <span className="text-slate-600">Debits: ₹{jvTotalDebit.toFixed(2)} | Credits: ₹{jvTotalCredit.toFixed(2)}</span>
              {jvIsBalanced ? (
                <span className="text-[#167a55] font-bold ml-2">✓ Balanced</span>
              ) : (
                <span className="text-rose-600 font-bold ml-2">Difference: ₹{jvDiff.toFixed(2)}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPostJVModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="post-jv-form"
                variant="primary"
                size="sm"
                loading={actionLoading}
                disabled={!jvIsBalanced}
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                Post Entry
              </Button>
            </div>
          </div>
        }
      >
        <form id="post-jv-form" onSubmit={handlePostJV} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              type="date"
              label="Voucher Date *"
              value={jvDate}
              onChange={(e) => setJvDate(e.target.value)}
              required
            />
            <div className="sm:col-span-2">
              <Input
                label="Narration / Purpose *"
                value={jvNarration}
                onChange={(e) => setJvNarration(e.target.value)}
                placeholder="e.g., Monthly office depreciation entry / Bank charges adjustment"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase">Debit / Credit Line Allocations</span>
              <Button
                type="button"
                variant="soft"
                size="xs"
                onClick={handleAddJVLine}
                icon={<Plus className="w-3 h-3" />}
              >
                Add Row
              </Button>
            </div>

            <div className="space-y-2">
              {jvLines.map((line, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex-1 min-w-[180px]">
                    <select
                      value={line.account_id}
                      onChange={(e) => updateJVLine(idx, { account_id: e.target.value })}
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white text-slate-900 focus:outline-none focus:border-[#167a55]"
                      required
                    >
                      <option value="">Select Account...</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} - {a.name} ({a.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-28">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="Debit ₹"
                      value={line.debit}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateJVLine(idx, { debit: val, credit: val ? "0.00" : line.credit });
                      }}
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white text-slate-900 font-mono text-right focus:outline-none focus:border-[#167a55]"
                    />
                  </div>

                  <div className="w-28">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="Credit ₹"
                      value={line.credit}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateJVLine(idx, { credit: val, debit: val ? "0.00" : line.debit });
                      }}
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white text-slate-900 font-mono text-right focus:outline-none focus:border-[#167a55]"
                    />
                  </div>

                  <div className="flex-1 min-w-[120px]">
                    <input
                      type="text"
                      placeholder="Line remark (optional)"
                      value={line.description}
                      onChange={(e) => updateJVLine(idx, { description: e.target.value })}
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white text-slate-900 focus:outline-none focus:border-[#167a55]"
                    />
                  </div>

                  {jvLines.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveJVLine(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
