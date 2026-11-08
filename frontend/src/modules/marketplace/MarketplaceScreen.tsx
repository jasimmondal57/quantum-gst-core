import React, { useState, useEffect } from "react";
import {
  Boxes,
  Upload,
  CheckCircle2,
  Download,
  TrendingUp,
  History,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, CardContent } from "../../components/ui/Card";
import { Tabs } from "../../components/ui/EmptyState";
import { api } from "../../services/api";
import type { BusinessProfile } from "../../services/api";

export interface MarketplaceScreenProps {
  business: BusinessProfile | null;
}

export const MarketplaceScreen: React.FC<MarketplaceScreenProps> = ({ business }) => {
  const [activeTab, setActiveTab] = useState("wizard");
  const [channel, setChannel] = useState<"amazon" | "flipkart" | "meesho">("amazon");
  const [fileContent, setFileContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // Ingested orders & reconciliation
  const [orders, setOrders] = useState<any[]>([]);
  const [reconciliation, setReconciliation] = useState<any>(null);

  const loadMarketplaceData = async () => {
    if (!business) return;
    try {
      const [ordRes, reconRes] = await Promise.all([
        api.fetchMarketplaceOrders(business.id),
        api.fetchMarketplaceReconciliation(business.id),
      ]);
      setOrders(ordRes.data || []);
      setReconciliation(reconRes);
    } catch (e) {
      console.error("Failed to load marketplace data:", e);
    }
  };

  useEffect(() => {
    loadMarketplaceData();
  }, [business, activeTab]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setFileContent(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleDownloadSample = () => {
    let sample = "";
    if (channel === "amazon") {
      sample = "order-id,order-date,sku,item-price,shipping-price,ship-to-state\nAMZ-9921,2026-11-01,SKU-1092,1200.00,0.00,MH\nAMZ-9922,2026-11-02,SKU-1093,850.00,40.00,DL";
    } else if (channel === "flipkart") {
      sample = "order_id,order_date,fsn,sale_amount,tcs_amount,state\nFLIP-4821,2026-11-01,FSN8471,2499.00,24.99,KA\nFLIP-4822,2026-11-02,FSN8472,1299.00,12.99,MH";
    } else {
      sample = "sub_order_id,order_date,product_name,total_amount,customer_state\nMEE-101,2026-11-01,T-Shirt Blue,499.00,UP\nMEE-102,2026-11-02,Headphones,799.00,MH";
    }
    const blob = new Blob([sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Sample_${channel.toUpperCase()}_Report.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImport = async () => {
    if (!business || !fileContent.trim()) {
      alert("Please upload a CSV or TSV report file first.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.importMarketplace({
        business_id: business.id,
        channel,
        file_content: fileContent,
      });
      setImportResult(res);
      alert(`Import Successful! Processed ${res.total_processed} orders (${res.imported_count} new).`);
      setFileContent("");
      setFileName("");
      await loadMarketplaceData();
    } catch (err: unknown) {
      alert("Import error: " + ((err as Error).message || "Failed to process marketplace report"));
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "wizard", label: "Import Wizard", icon: <Upload className="w-4 h-4" /> },
    { id: "orders", label: "Channel Orders", icon: <History className="w-4 h-4" /> },
    { id: "reconciliation", label: "Reconciliation Summary", icon: <TrendingUp className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          E-Commerce Marketplace Ingestion & Reconciliation
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Import settlement sheets from Amazon MTR, Flipkart Settlement, and Meesho Tax reports with Section 52 TCS automation.
        </p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* 1. Import Wizard */}
      {activeTab === "wizard" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader
                title="Upload Settlement / Order Report"
                subtitle="Automatically extracts order items, customer states, TCS deductions, and statutory taxes"
              />
              <CardContent className="space-y-4">
                {/* Channel Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select Sales Channel
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(["amazon", "flipkart", "meesho"] as const).map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => setChannel(ch)}
                        className={`p-3 rounded-xl border text-xs font-bold capitalize flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          channel === ch
                            ? "border-[#167a55] bg-[#e8f5ee] text-[#167a55] shadow-xs"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <Boxes className="w-4 h-4" />
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>

                {/* File Drop Area */}
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">
                    {fileName ? fileName : "Upload Marketplace CSV or TSV Report"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 mb-3">
                    Supports Amazon Merchant Tax Report (MTR), Flipkart Settlement CSV, Meesho Orders
                  </p>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer bg-white px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    Browse File
                    <input
                      type="file"
                      accept=".csv,.tsv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {fileContent && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-medium">
                    <span>✓ Ready to parse: {fileName} ({Math.round(fileContent.length / 1024)} KB)</span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleImport}
                      loading={loading}
                      icon={<CheckCircle2 className="w-4 h-4" />}
                    >
                      Process & Ingest Orders
                    </Button>
                  </div>
                )}

                {importResult && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <span className="font-bold text-slate-800">Last Import Result:</span>
                    <div className="grid grid-cols-2 gap-2 text-slate-600 font-mono">
                      <div>Total Rows Processed: {importResult.total_processed}</div>
                      <div>Newly Ingested Orders: {importResult.imported_count}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Help Box */}
          <div className="space-y-4">
            <Card>
              <CardHeader title="Report Specifications & Sample" />
              <CardContent className="space-y-3 text-xs text-slate-600">
                <p>
                  Upload your monthly or weekly settlement sheet directly from Seller Central.
                </p>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                  <p className="font-bold text-slate-800">Supported Formats:</p>
                  <p>• Amazon: Combined Transaction / MTR</p>
                  <p>• Flipkart: Settlement & Returns Report</p>
                  <p>• Meesho: Tax Invoices & Order Report</p>
                </div>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={handleDownloadSample}
                  icon={<Download className="w-3.5 h-3.5" />}
                  className="w-full"
                >
                  Download {channel.toUpperCase()} Sample CSV
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 2. Channel Orders */}
      {activeTab === "orders" && (
        <Card>
          <CardHeader
            title="Imported E-Commerce Orders"
            subtitle="Sync history of marketplace order items with automated Place of Supply tax determination"
          />
          <div className="divide-y divide-slate-100">
            {orders.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No marketplace orders imported yet. Use the Import Wizard to upload seller reports.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 font-semibold text-slate-500 uppercase text-[11px] border-b">
                      <th className="p-2.5">Channel</th>
                      <th className="p-2.5">Order ID</th>
                      <th className="p-2.5">Order Date</th>
                      <th className="p-2.5">Destination State</th>
                      <th className="p-2.5 text-right">Taxable Value (₹)</th>
                      <th className="p-2.5 text-right">TCS Deducted (₹)</th>
                      <th className="p-2.5 text-right">Settlement (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {orders.map((ord, idx) => (
                      <tr key={ord.id || idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-sans font-bold text-slate-900 capitalize">
                          {ord.channel || "Amazon"}
                        </td>
                        <td className="p-2.5 font-bold text-slate-800">{ord.order_id || ord.marketplace_order_id}</td>
                        <td className="p-2.5 text-slate-600">{ord.order_date}</td>
                        <td className="p-2.5 font-sans text-slate-700">{ord.place_of_supply || "27 - MH"}</td>
                        <td className="p-2.5 text-right">₹{parseFloat(ord.taxable_value || "0").toFixed(2)}</td>
                        <td className="p-2.5 text-right text-rose-600">₹{parseFloat(ord.tcs_amount || "0").toFixed(2)}</td>
                        <td className="p-2.5 text-right font-bold text-[#167a55]">
                          ₹{parseFloat(ord.settlement_amount || ord.taxable_value || "0").toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 3. Reconciliation Summary */}
      {activeTab === "reconciliation" && (
        <Card>
          <CardHeader
            title="Channel-Wise Reconciliation & TCS Audit"
            subtitle="GST Section 52 Tax Collected at Source verification across sales channels"
          />
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs text-emerald-800 font-bold uppercase">Total Marketplace Gross</span>
                <p className="text-2xl font-black text-[#167a55] font-mono mt-1">
                  ₹{parseFloat(reconciliation?.total_gross || "0").toFixed(2)}
                </p>
                <p className="text-[11px] text-emerald-600 mt-0.5">Aggregated turnover</p>
              </div>

              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                <span className="text-xs text-rose-800 font-bold uppercase">TCS Withheld (Sec 52)</span>
                <p className="text-2xl font-black text-rose-700 font-mono mt-1">
                  ₹{parseFloat(reconciliation?.total_tcs || "0").toFixed(2)}
                </p>
                <p className="text-[11px] text-rose-600 mt-0.5">Claimable in GSTR-2B Table 4</p>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-xs text-blue-800 font-bold uppercase">Net Bank Settlement</span>
                <p className="text-2xl font-black text-blue-700 font-mono mt-1">
                  ₹{parseFloat(reconciliation?.total_settlement || "0").toFixed(2)}
                </p>
                <p className="text-[11px] text-blue-600 mt-0.5">Disbursed to merchant accounts</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
