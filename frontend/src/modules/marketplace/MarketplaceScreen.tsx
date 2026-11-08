import React, { useState } from "react";
import { Boxes, Upload, CheckCircle2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Card, CardHeader, CardContent } from "../../components/ui/Card";
import { api } from "../../services/api";
import type { BusinessProfile } from "../../services/api";

export interface MarketplaceScreenProps {
  business: BusinessProfile | null;
}

export const MarketplaceScreen: React.FC<MarketplaceScreenProps> = ({ business }) => {
  const [channel, setChannel] = useState<"amazon" | "flipkart" | "meesho">("amazon");
  const [fileContent, setFileContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleImport = async () => {
    if (!business || !fileContent.trim()) return;
    setLoading(true);
    try {
      const res = await api.importMarketplace({
        business_id: business.id,
        channel,
        file_content: fileContent,
      });
      alert(`Import Successful! Processed ${res.total_processed} orders (${res.imported_count} new).`);
    } catch (err: any) {
      alert("Import error: " + (err.message || "Failed to process marketplace report"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          E-Commerce Marketplace Ingestion & Reconciliation
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Import settlement sheets from Amazon MTR, Flipkart Settlement, and Meesho Tax reports.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Ingestion Wizard */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader
              title="Upload Settlement / Order Report"
              subtitle="Automatically extracts order items, customer states, TCS deductions, and taxes"
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
                <label className="inline-flex">
                  <input
                    type="file"
                    accept=".csv,.txt,.tsv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer">
                    Browse File
                  </span>
                </label>
              </div>

              {fileContent && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-[#0b5539]">
                  <span className="font-medium">File loaded: {fileName}</span>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={loading}
                    onClick={handleImport}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Process & Ingest
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Overview Cards */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Channel Ingestion Health" />
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-800">Amazon MTR</span>
                <Badge variant="emerald" size="sm">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-800">Flipkart Settlement</span>
                <Badge variant="emerald" size="sm">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-semibold text-slate-800">Meesho Report</span>
                <Badge variant="emerald" size="sm">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
