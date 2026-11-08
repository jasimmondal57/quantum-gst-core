import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  FileDown,
  QrCode,
  Truck,
  Layers,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Card, CardHeader } from "../../components/ui/Card";
import { Tabs } from "../../components/ui/EmptyState";
import { api } from "../../services/api";
import type { BusinessProfile, Invoice } from "../../services/api";

export interface GstComplianceScreenProps {
  business: BusinessProfile | null;
  invoices: Invoice[];
}

export const GstComplianceScreen: React.FC<GstComplianceScreenProps> = ({
  business,
  invoices,
}) => {
  const [activeTab, setActiveTab] = useState("gstr1");
  const [gstr1Data, setGstr1Data] = useState<any>(null);
  const [gstr3bData, setGstr3bData] = useState<any>(null);
  const [ewayBills, setEwayBills] = useState<any[]>([]);

  useEffect(() => {
    if (!business) return;
    const loadReturns = async () => {
      try {
        if (activeTab === "gstr1") {
          const res = await api.getGstr1(business.id);
          setGstr1Data(res.data);
        } else if (activeTab === "gstr3b") {
          const res = await api.getGstr3b(business.id);
          setGstr3bData(res);
        } else if (activeTab === "eway") {
          const res = await api.getEWayBills(business.id);
          setEwayBills(res.data || []);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadReturns();
  }, [business, activeTab]);

  const tabs = [
    { id: "gstr1", label: "GSTR-1 Outward", icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: "gstr3b", label: "GSTR-3B Summary", icon: <Layers className="w-4 h-4" /> },
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
            Auto-compiled GSTR-1 tables, GSTR-3B liabilities, and official GSTN e-invoice schemas.
          </p>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* GSTR-1 View */}
      {activeTab === "gstr1" && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="GSTR-1 Outward Supply Tables"
              subtitle="Generated from issued tax invoices and debit/credit notes"
              action={
                <Button variant="outline" size="xs" icon={<FileDown className="w-3.5 h-3.5" />}>
                  Download GSTN JSON
                </Button>
              }
            />
            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Table 4: B2B Invoices</span>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {gstr1Data?.b2b?.length || 0} Invoices
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Supplies with registered GSTINs</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Table 7: B2C Small</span>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {gstr1Data?.b2cs?.length || 0} Records
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Intra-state consumer sales</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Table 12: HSN Summary</span>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {gstr1Data?.hsn_summary?.length || 0} Tariff Lines
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">HSN codes aggregated</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* GSTR-3B View */}
      {activeTab === "gstr3b" && (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Table 3.1: Tax on Outward Supplies"
              subtitle="Summary of taxable sales, integrated tax, central tax, and state tax"
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
                      ₹{gstr3bData?.table_3_1?.["3_1_a_outward_taxable"]?.taxable_value || "0.00"}
                    </td>
                    <td className="py-3 px-3 text-right">
                      ₹{gstr3bData?.table_3_1?.["3_1_a_outward_taxable"]?.igst || "0.00"}
                    </td>
                    <td className="py-3 px-3 text-right">
                      ₹{gstr3bData?.table_3_1?.["3_1_a_outward_taxable"]?.cgst || "0.00"}
                    </td>
                    <td className="py-3 px-3 text-right">
                      ₹{gstr3bData?.table_3_1?.["3_1_a_outward_taxable"]?.sgst || "0.00"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* e-Invoice IRN View */}
      {activeTab === "einvoice" && (
        <Card>
          <CardHeader
            title="e-Invoice Registry (Rule 48(4))"
            subtitle="Government IRN hashes and Signed QR codes"
          />
          <div className="divide-y divide-slate-100">
            {invoices.filter((i) => i.irn).length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No invoices registered for e-Invoicing yet. Click the e-Invoice icon on any sales invoice to generate an official IRN.
              </div>
            ) : (
              invoices
                .filter((i) => i.irn)
                .map((inv) => (
                  <div key={inv.id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900 font-mono">{inv.invoice_number}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-md">
                        IRN: {inv.irn}
                      </p>
                    </div>
                    <Badge variant="emerald" size="sm">Active IRN</Badge>
                  </div>
                ))
            )}
          </div>
        </Card>
      )}

      {/* E-Way Bill View */}
      {activeTab === "eway" && (
        <Card>
          <CardHeader
            title="Registered E-Way Bills (Rule 138)"
            subtitle="Statutory transit documentation for goods consignments"
          />
          <div className="divide-y divide-slate-100">
            {ewayBills.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active E-Way bills generated. You can issue E-Way bills directly for invoices or inter-godown transfers exceeding ₹50,000 threshold.
              </div>
            ) : (
              ewayBills.map((ewb) => (
                <div key={ewb.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-slate-900">#{ewb.eway_bill_number}</span>
                    <p className="text-slate-500 mt-0.5">
                      Vehicle: {ewb.vehicle_number || "Pending Part B"} • Valid until: {ewb.valid_until}
                    </p>
                  </div>
                  <Badge variant="emerald" size="sm">{ewb.status}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
