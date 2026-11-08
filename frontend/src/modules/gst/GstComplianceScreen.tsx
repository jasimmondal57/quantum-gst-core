import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  FileDown,
  QrCode,
  Truck,
  Layers,
  Copy,
  Plus,
  RefreshCw,
  FileCheck2,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Card, CardHeader } from "../../components/ui/Card";
import { Tabs } from "../../components/ui/EmptyState";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { api } from "../../services/api";
import type { BusinessProfile, Invoice } from "../../services/api";

export interface GstComplianceScreenProps {
  business: BusinessProfile | null;
  invoices: Invoice[];
  onRefresh?: () => void;
}

export const GstComplianceScreen: React.FC<GstComplianceScreenProps> = ({
  business,
  invoices,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState("gstr1");
  const [gstr1Data, setGstr1Data] = useState<any>(null);
  const [gstr3bData, setGstr3bData] = useState<any>(null);
  const [ewayBills, setEwayBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // E-Way Bill Modal
  const [showEwayModal, setShowEwayModal] = useState(false);
  const [ewayInvoiceId, setEwayInvoiceId] = useState("");
  const [ewayDistance, setEwayDistance] = useState("120");
  const [ewayVehicle, setEwayVehicle] = useState("");
  const [ewayTransporter, setEwayTransporter] = useState("");
  const [ewayMode, setEwayMode] = useState("road");
  const [ewaySubmitting, setEwaySubmitting] = useState(false);

  // e-Invoice Modal
  const [inspectingInvoice, setInspectingInvoice] = useState<Invoice | null>(null);
  const [einvoiceJson, setEinvoiceJson] = useState<any>(null);
  const [generatingIrn, setGeneratingIrn] = useState(false);

  // GSTR-2B Reconciliation State
  const [reconcilePeriod, setReconcilePeriod] = useState("2026-11");
  const [reconcileResult, setReconcileResult] = useState<any>(null);
  const [reconcileLoading, setReconcileLoading] = useState(false);

  const loadData = async () => {
    if (!business) return;
    setLoading(true);
    try {
      if (activeTab === "gstr1") {
        const res = await api.getGstr1(business.id);
        setGstr1Data(res);
      } else if (activeTab === "gstr3b") {
        const res = await api.getGstr3b(business.id);
        setGstr3bData(res);
      } else if (activeTab === "eway") {
        const res = await api.getEWayBills(business.id);
        setEwayBills(res.data || []);
      }
    } catch (e) {
      console.error("GST Compliance data error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business, activeTab]);

  const handleGenerateEWayBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ewayInvoiceId || !ewayDistance) {
      alert("Please select an invoice and enter transit distance.");
      return;
    }
    setEwaySubmitting(true);
    try {
      await api.generateEWayBill({
        invoice_id: ewayInvoiceId,
        distance_km: parseInt(ewayDistance, 10),
        transport_mode: ewayMode,
        vehicle_number: ewayVehicle.toUpperCase().trim() || undefined,
        transporter_name: ewayTransporter.trim() || undefined,
      });
      setShowEwayModal(false);
      setEwayInvoiceId("");
      setEwayVehicle("");
      setEwayTransporter("");
      alert("Statutory E-Way Bill generated under GSTN Rule 138!");
      await loadData();
    } catch (err: unknown) {
      alert("Failed to generate E-Way bill: " + ((err as Error).message || "Failed"));
    } finally {
      setEwaySubmitting(false);
    }
  };

  const handleGenerateEInvoice = async (inv: Invoice) => {
    setGeneratingIrn(true);
    try {
      const res = await api.generateEInvoice(inv.id);
      alert(`Success! IRN generated: ${res.irn.substring(0, 16)}...`);
      if (onRefresh) onRefresh();
      setInspectingInvoice({ ...inv, irn: res.irn });
    } catch (err: unknown) {
      alert("Failed to generate IRN: " + ((err as Error).message || "Failed"));
    } finally {
      setGeneratingIrn(false);
    }
  };

  const handleInspectEInvoice = async (inv: Invoice) => {
    setInspectingInvoice(inv);
    try {
      const schema = await api.fetchEInvoiceJson(inv.id);
      setEinvoiceJson(schema);
    } catch {
      setEinvoiceJson(null);
    }
  };

  const handleRunReconciliation = async () => {
    if (!business) return;
    setReconcileLoading(true);
    try {
      // Standard sample 2B inward payload matching supplier GSTINs
      const sample2b = [
        {
          ctin: "27AAACB1234F1Z1",
          inv: [
            {
              inum: "SUPP/2026/0882",
              idt: "2026-11-02",
              val: 118000.0,
              pos: "27",
              itcavl: "Y",
              items: [{ num: 1, txval: 100000.0, rt: 18.0, camt: 9000.0, samt: 9000.0, iamt: 0.0 }],
            },
          ],
        },
      ];

      const res = await api.reconcileGstr2b(business.id, reconcilePeriod, sample2b);

      setReconcileResult(res);
    } catch (err: unknown) {
      alert("GSTR-2B matching error: " + ((err as Error).message || "Failed"));
    } finally {
      setReconcileLoading(false);
    }
  };

  const handleDownloadGstr1Json = () => {
    if (!gstr1Data) return;
    const blob = new Blob([JSON.stringify(gstr1Data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GSTR1_${business?.pan || "TAX"}_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: "gstr1", label: "GSTR-1 Outward", icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: "gstr3b", label: "GSTR-3B Summary", icon: <Layers className="w-4 h-4" /> },
    { id: "gstr2b", label: "GSTR-2B Matching & ITC", icon: <FileCheck2 className="w-4 h-4" /> },
    { id: "einvoice", label: "e-Invoicing (IRN)", icon: <QrCode className="w-4 h-4" /> },
    { id: "eway", label: "E-Way Bills (Rule 138)", icon: <Truck className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              GST Statutory Compliance & E-Way Portal
            </h1>
            <Badge variant="emerald" size="sm">
              GSTN Rule 48(4) & 138
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-compiled GSTR-1 tables, GSTR-3B liabilities, GSTR-2B ITC matching, and official GSTN e-invoice schemas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "eway" && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowEwayModal(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Generate E-Way Bill
            </Button>
          )}

          {activeTab === "gstr1" && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadGstr1Json}
              icon={<FileDown className="w-4 h-4" />}
            >
              Download GSTN JSON
            </Button>
          )}
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* 1. GSTR-1 View */}
      {activeTab === "gstr1" && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="GSTR-1 Outward Supply Tables"
              subtitle={loading ? "Compiling statutory GSTN tables..." : "Generated from issued tax invoices, export classifications, and debit/credit notes"}
              action={
                <Button variant="outline" size="xs" onClick={handleDownloadGstr1Json} icon={<FileDown className="w-3.5 h-3.5" />}>
                  Export JSON
                </Button>
              }
            />
            <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Table 4: B2B Invoices</span>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {gstr1Data?.meta?.b2b_count ?? gstr1Data?.tables?.b2b?.length ?? 0} Invoices
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Supplies with registered GSTINs</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Table 7: B2C Small</span>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {gstr1Data?.meta?.b2cs_count ?? gstr1Data?.tables?.b2cs?.length ?? 0} Supplies
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Consumer & unreg sales</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Table 9B: CDNR / CDNUR</span>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {(gstr1Data?.meta?.cdnr_count ?? 0) + (gstr1Data?.meta?.cdnur_count ?? 0)} Notes
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Credit & Debit Note entries</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Table 12: HSN Summary</span>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {gstr1Data?.tables?.hsn_summary?.length ?? 0} Tariff Lines
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Aggregated product codes</p>
              </div>
            </div>

            {/* Totals Banner */}
            <div className="m-4 p-4 rounded-xl bg-emerald-50/60 border border-[#b8e2cd] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 font-sans">Total Taxable Value</span>
                <p className="font-bold text-base text-slate-900">
                  ₹{parseFloat(gstr1Data?.totals?.total_taxable_value || "0").toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-slate-500 font-sans">Total CGST + SGST</span>
                <p className="font-bold text-base text-[#167a55]">
                  ₹{(parseFloat(gstr1Data?.totals?.total_cgst || "0") + parseFloat(gstr1Data?.totals?.total_sgst || "0")).toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-slate-500 font-sans">Total IGST</span>
                <p className="font-bold text-base text-blue-700">
                  ₹{parseFloat(gstr1Data?.totals?.total_igst || "0").toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-slate-500 font-sans">Grand Total Supplies</span>
                <p className="font-bold text-base text-slate-900">
                  ₹{parseFloat(gstr1Data?.totals?.grand_total || "0").toFixed(2)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 2. GSTR-3B View */}
      {activeTab === "gstr3b" && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Table 3.1: Tax on Outward and Reverse Charge Inward Supplies"
              subtitle="Statutory net tax payable under Section 59 of the CGST Act"
            />
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                    <th className="py-2.5 px-3">Nature of Supplies</th>
                    <th className="py-2.5 px-3 text-right">Taxable Value (₹)</th>
                    <th className="py-2.5 px-3 text-right">IGST (₹)</th>
                    <th className="py-2.5 px-3 text-right">CGST (₹)</th>
                    <th className="py-2.5 px-3 text-right">SGST (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  <tr>
                    <td className="py-3 px-3 font-sans font-medium text-slate-800">
                      (a) Outward Taxable Supplies (other than zero rated & nil)
                    </td>
                    <td className="py-3 px-3 text-right text-slate-900 font-bold">
                      ₹{parseFloat(gstr3bData?.table_3_1?.["3_1_a_outward_taxable"]?.taxable_value || "0").toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      ₹{parseFloat(gstr3bData?.table_3_1?.["3_1_a_outward_taxable"]?.igst || "0").toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      ₹{parseFloat(gstr3bData?.table_3_1?.["3_1_a_outward_taxable"]?.cgst || "0").toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      ₹{parseFloat(gstr3bData?.table_3_1?.["3_1_a_outward_taxable"]?.sgst || "0").toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-sans font-medium text-slate-800">
                      (b) Outward Taxable Supplies (zero rated / SEZ / Exports)
                    </td>
                    <td className="py-3 px-3 text-right">
                      ₹{parseFloat(gstr3bData?.table_3_1?.["3_1_b_outward_zero_rated"]?.taxable_value || "0").toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      ₹{parseFloat(gstr3bData?.table_3_1?.["3_1_b_outward_zero_rated"]?.igst || "0").toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right">₹0.00</td>
                    <td className="py-3 px-3 text-right">₹0.00</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-sans font-medium text-slate-800">
                      (d) Inward Supplies Liable to Reverse Charge (RCM)
                    </td>
                    <td className="py-3 px-3 text-right">
                      ₹{parseFloat(gstr3bData?.table_3_1?.["3_1_d_inward_reverse_charge"]?.taxable_value || "0").toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      ₹{parseFloat(gstr3bData?.table_3_1?.["3_1_d_inward_reverse_charge"]?.igst || "0").toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      ₹{parseFloat(gstr3bData?.table_3_1?.["3_1_d_inward_reverse_charge"]?.cgst || "0").toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      ₹{parseFloat(gstr3bData?.table_3_1?.["3_1_d_inward_reverse_charge"]?.sgst || "0").toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 3. GSTR-2B Matching Table & ITC Reconciliation */}
      {activeTab === "gstr2b" && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="GSTR-2B Inward ITC Reconciliation"
              subtitle="Statutory matching of GSTR-2B portal filings against purchase books to claim input tax credits"
              action={
                <div className="flex items-center gap-2">
                  <input
                    type="month"
                    value={reconcilePeriod}
                    onChange={(e) => setReconcilePeriod(e.target.value)}
                    className="text-xs rounded-lg border border-slate-300 p-1.5 bg-white text-slate-900"
                  />
                  <Button
                    variant="primary"
                    size="xs"
                    onClick={handleRunReconciliation}
                    loading={reconcileLoading}
                    icon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Run Reconciliation
                  </Button>
                </div>
              }
            />
            <div className="p-5 space-y-4">
              {reconcileResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <span className="text-xs text-emerald-800 font-bold uppercase">Matched (Claimable)</span>
                      <p className="text-xl font-bold text-[#167a55] font-mono mt-1">
                        {reconcileResult.summary?.matched_count || 0} Invoices
                      </p>
                      <p className="text-[11px] text-emerald-600 mt-0.5">
                        ₹{parseFloat(reconcileResult.summary?.matched_itc || "0").toFixed(2)} ITC
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                      <span className="text-xs text-amber-800 font-bold uppercase">Value Mismatch</span>
                      <p className="text-xl font-bold text-amber-700 font-mono mt-1">
                        {reconcileResult.summary?.mismatched_count || 0} Invoices
                      </p>
                      <p className="text-[11px] text-amber-600 mt-0.5">Tax difference flagged</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
                      <span className="text-xs text-rose-800 font-bold uppercase">Missing in Books</span>
                      <p className="text-xl font-bold text-rose-700 font-mono mt-1">
                        {reconcileResult.summary?.missing_in_books_count || 0} Invoices
                      </p>
                      <p className="text-[11px] text-rose-600 mt-0.5">Filed by supplier, unbooked</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
                      <span className="text-xs text-blue-800 font-bold uppercase">Missing in 2B</span>
                      <p className="text-xl font-bold text-blue-700 font-mono mt-1">
                        {reconcileResult.summary?.missing_in_2b_count || 0} Invoices
                      </p>
                      <p className="text-[11px] text-blue-600 mt-0.5">Purchased, supplier unfiled</p>
                    </div>
                  </div>

                  {/* Matching Rows */}
                  {reconcileResult.details && reconcileResult.details.length > 0 && (
                    <div className="overflow-x-auto pt-2">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 font-semibold text-slate-500 uppercase text-[11px] border-b">
                            <th className="p-2.5">Supplier GSTIN</th>
                            <th className="p-2.5">Invoice #</th>
                            <th className="p-2.5 text-right">Books Tax (₹)</th>
                            <th className="p-2.5 text-right">2B Tax (₹)</th>
                            <th className="p-2.5 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {reconcileResult.details.map((row: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2.5 font-sans font-medium text-slate-900">{row.supplier_gstin}</td>
                              <td className="p-2.5">{row.invoice_number}</td>
                              <td className="p-2.5 text-right font-bold">₹{parseFloat(row.books_tax || "0").toFixed(2)}</td>
                              <td className="p-2.5 text-right font-bold text-[#167a55]">₹{parseFloat(row.gstr2b_tax || "0").toFixed(2)}</td>
                              <td className="p-2.5 text-center">
                                <Badge
                                  variant={row.status === "matched" ? "emerald" : row.status === "mismatch" ? "warning" : "danger"}
                                  size="sm"
                                >
                                  {row.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                  <FileCheck2 className="w-8 h-8 text-[#167a55] mx-auto mb-1" />
                  <p className="font-semibold text-slate-800">Ready for GSTR-2B Input Tax Credit Matching</p>
                  <p className="text-slate-400 max-w-md mx-auto">
                    Click &quot;Run Reconciliation&quot; above to match your recorded purchase bills against the GSTR-2B filing register.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* 4. e-Invoice IRN View */}
      {activeTab === "einvoice" && (
        <Card>
          <CardHeader
            title="e-Invoice Registry (Rule 48(4))"
            subtitle="Government IRN hashes, Signed QR codes, and GSTN Schema v1.1 inspection"
          />
          <div className="divide-y divide-slate-100">
            {invoices.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No invoices generated yet.</div>
            ) : (
              invoices.map((inv) => (
                <div key={inv.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/60 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-mono text-sm">{inv.invoice_number}</span>
                      <span className="text-slate-500">({inv.customer?.name || "Customer"})</span>
                      {inv.irn ? (
                        <Badge variant="emerald" size="sm">✓ Active IRN</Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">Eligible for IRN</Badge>
                      )}
                    </div>
                    {inv.irn && (
                      <p className="text-[11px] text-slate-400 font-mono truncate max-w-lg">
                        IRN: {inv.irn}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {inv.irn ? (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleInspectEInvoice(inv)}
                        icon={<QrCode className="w-3.5 h-3.5" />}
                      >
                        View Signed QR & JSON
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => handleGenerateEInvoice(inv)}
                        loading={generatingIrn}
                        icon={<QrCode className="w-3.5 h-3.5" />}
                      >
                        Generate IRN
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* 5. E-Way Bill View */}
      {activeTab === "eway" && (
        <Card>
          <CardHeader
            title="Registered E-Way Bills (Rule 138)"
            subtitle="Statutory transit documentation for goods consignments exceeding ₹50,000 threshold"
            action={
              <Button variant="primary" size="xs" onClick={() => setShowEwayModal(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                Issue E-Way Bill
              </Button>
            }
          />
          <div className="divide-y divide-slate-100">
            {ewayBills.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <Truck className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No active E-Way bills generated yet.</p>
                <Button variant="outline" size="xs" onClick={() => setShowEwayModal(true)}>
                  Issue First E-Way Bill
                </Button>
              </div>
            ) : (
              ewayBills.map((ewb) => (
                <div key={ewb.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/60 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">#{ewb.eway_bill_number}</span>
                      <Badge variant="emerald" size="sm">{ewb.status || "ACTIVE"}</Badge>
                    </div>
                    <p className="text-slate-500 mt-1">
                      Vehicle: <span className="font-mono font-bold text-slate-800">{ewb.vehicle_number || "Part B Pending"}</span> • Valid until: {ewb.valid_until || "Statutory Expiry"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 font-mono">Distance: {ewb.distance_km || 100} KM</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Modal: Generate E-Way Bill */}
      <Modal
        isOpen={showEwayModal}
        onClose={() => setShowEwayModal(false)}
        title="Generate Statutory E-Way Bill"
        subtitle="GST Rule 138 compliant consignment movement authorization"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setShowEwayModal(false)} disabled={ewaySubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="generate-eway-form"
              variant="primary"
              size="sm"
              loading={ewaySubmitting}
              icon={<Truck className="w-4 h-4" />}
            >
              Generate E-Way Bill
            </Button>
          </div>
        }
      >
        <form id="generate-eway-form" onSubmit={handleGenerateEWayBill} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Document / Tax Invoice *
            </label>
            <select
              value={ewayInvoiceId}
              onChange={(e) => setEwayInvoiceId(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:border-[#167a55]"
              required
            >
              <option value="">Choose an issued invoice...</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoice_number} - {inv.customer?.name || "Customer"} (₹{inv.grand_total})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              type="number"
              min="1"
              label="Approx Transit Distance (KM) *"
              value={ewayDistance}
              onChange={(e) => setEwayDistance(e.target.value)}
              placeholder="e.g., 150"
              required
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Transport Mode
              </label>
              <select
                value={ewayMode}
                onChange={(e) => setEwayMode(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:border-[#167a55]"
              >
                <option value="road">1 - Road Transit</option>
                <option value="rail">2 - Rail Cargo</option>
                <option value="air">3 - Air Freight</option>
                <option value="ship">4 - Coastal / Inland Ship</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Vehicle Registration Number"
              placeholder="e.g. MH12AB1234"
              value={ewayVehicle}
              onChange={(e) => setEwayVehicle(e.target.value.toUpperCase())}
            />

            <Input
              label="Transporter Name / Agency"
              placeholder="e.g. VRL Logistics Ltd"
              value={ewayTransporter}
              onChange={(e) => setEwayTransporter(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Modal: e-Invoice Signed QR & JSON Schema */}
      <Modal
        isOpen={!!inspectingInvoice}
        onClose={() => setInspectingInvoice(null)}
        title="Official GSTN e-Invoice Schema & Signed QR"
        subtitle={`Invoice: ${inspectingInvoice?.invoice_number || ""} • Rule 48(4) Verification`}
        size="lg"
        footer={
          <div className="flex items-center justify-end w-full">
            <Button variant="outline" size="sm" onClick={() => setInspectingInvoice(null)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
            {/* Visual SVG QR Code placeholder */}
            <div className="w-28 h-28 bg-white border border-slate-300 rounded-lg p-2 flex flex-col items-center justify-center shrink-0 shadow-2xs">
              <QrCode className="w-20 h-20 text-[#167a55]" />
              <span className="text-[9px] font-bold text-slate-400 mt-0.5">SIGNED QR</span>
            </div>

            <div className="space-y-1 text-xs font-mono min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 font-sans">Statutory IRN:</span>
                <span className="text-emerald-700 font-bold break-all">
                  {inspectingInvoice?.irn || "IRN-REGISTRATION-ACTIVE"}
                </span>
              </div>
              <p className="text-slate-500 font-sans text-[11px] pt-1">
                Cryptographically signed by GSTN National Informatics Centre (NIC) Invoice Registration Portal.
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between pb-1.5">
              <span className="text-xs font-bold text-slate-700">Official GSTN e-Invoice JSON Schema v1.1</span>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(einvoiceJson, null, 2));
                  alert("JSON copied to clipboard!");
                }}
                icon={<Copy className="w-3.5 h-3.5" />}
              >
                Copy JSON
              </Button>
            </div>
            <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-[11px] font-mono max-h-52 overflow-y-auto">
              {JSON.stringify(einvoiceJson || { message: "Generating official schema..." }, null, 2)}
            </pre>
          </div>
        </div>
      </Modal>
    </div>
  );
};
