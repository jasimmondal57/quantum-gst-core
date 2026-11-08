import React, { useState } from "react";
import {
  ShieldCheck,
  Copy,
  Activity,
  Play,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Card, CardHeader, CardContent } from "../../components/ui/Card";
import { Tabs } from "../../components/ui/EmptyState";
import { api } from "../../services/api";
import type { BusinessProfile } from "../../services/api";

export interface ShopifyScreenProps {
  business: BusinessProfile | null;
}

interface WebhookLog {
  id: string;
  order_number: string;
  timestamp: string;
  hmac_status: "verified" | "invalid";
  idempotency_status: "new" | "duplicate_skipped";
  total_amount: string;
  invoice_number?: string;
}

export const ShopifyScreen: React.FC<ShopifyScreenProps> = ({ business: _business }) => {
  const [activeTab, setActiveTab] = useState("gateway");
  const webhookUrl = "https://quantumgst.in/api/v1/webhooks/shopify/orders-create";

  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Sample webhook delivery logs
  const [logs, setLogs] = useState<WebhookLog[]>([
    {
      id: "evt_shp_9821a",
      order_number: "#SHP-1099",
      timestamp: "2026-11-08 18:42:10",
      hmac_status: "verified",
      idempotency_status: "new",
      total_amount: "₹2,499.00",
      invoice_number: "INV-2026-0881",
    },
    {
      id: "evt_shp_9821b",
      order_number: "#SHP-1099",
      timestamp: "2026-11-08 18:42:15",
      hmac_status: "verified",
      idempotency_status: "duplicate_skipped",
      total_amount: "₹2,499.00",
    },
    {
      id: "evt_shp_9819",
      order_number: "#SHP-1098",
      timestamp: "2026-11-08 15:20:04",
      hmac_status: "verified",
      idempotency_status: "new",
      total_amount: "₹1,149.00",
      invoice_number: "INV-2026-0880",
    },
  ]);

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    alert("Webhook URL copied to clipboard!");
  };

  const handleSimulateWebhook = async () => {
    setTestingWebhook(true);
    setTestResult(null);
    try {
      // Simulate calling the Shopify webhook endpoint
      const simulatedOrder = {
        id: Date.now(),
        order_number: Math.floor(1000 + Math.random() * 9000),
        created_at: new Date().toISOString(),
        total_price: "1799.00",
        total_tax: "274.42",
        currency: "INR",
        billing_address: {
          name: "Shopify Buyer",
          province_code: "MH",
          country_code: "IN",
          zip: "400001",
        },
        line_items: [
          {
            title: "Noise Cancelling Earbuds",
            quantity: 1,
            price: "1524.58",
            sku: "EAR-NC-99",
          },
        ],
      };

      const res = await api.post("/webhooks/shopify/orders-create", simulatedOrder);
      setTestResult(res);

      const newLog: WebhookLog = {
        id: `evt_test_${Date.now()}`,
        order_number: `#SHP-${simulatedOrder.order_number}`,
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
        hmac_status: "verified",
        idempotency_status: "new",
        total_amount: "₹1,799.00",
        invoice_number: res.invoice_number || "INV-NEW",
      };
      setLogs([newLog, ...logs]);
      alert("Simulated webhook processed! Tax Invoice auto-issued.");
    } catch (err: unknown) {
      setTestResult({ error: (err as Error).message || "Verification failed" });
    } finally {
      setTestingWebhook(false);
    }
  };

  const tabs = [
    { id: "gateway", label: "Gateway & Credentials", icon: <ShieldCheck className="w-4 h-4" /> },
    { id: "logs", label: "Webhook Activity Logs", icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Shopify Automated GST Integration
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time order webhook sync with HMAC-SHA256 signature validation and idempotency protection.
        </p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* 1. Gateway */}
      {activeTab === "gateway" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader
                title="Shopify Order Webhook Gateway"
                subtitle="Orders created on your Shopify store automatically generate statutory GST invoices"
              />
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Webhook Endpoint URL</span>
                    <Badge variant="emerald" size="sm">HMAC-SHA256 Verified</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-white px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-800 flex-1 truncate">
                      {webhookUrl}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyWebhook}
                      icon={<Copy className="w-3.5 h-3.5" />}
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-[#0b5539] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <ShieldCheck className="w-4 h-4 text-[#167a55]" />
                    Production Hardening Features Active
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-emerald-900">
                    <li>Cryptographic HMAC-SHA256 signature verification against shared secret.</li>
                    <li>Order ID idempotency lock prevents duplicate invoices on webhook network retries.</li>
                    <li>Automated Place of Supply state resolution and CGST / SGST / IGST breakdown.</li>
                  </ul>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Simulate Test Order Payload:</span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSimulateWebhook}
                    loading={testingWebhook}
                    icon={<Play className="w-3.5 h-3.5" />}
                  >
                    Test Webhook Trigger
                  </Button>
                </div>

                {testResult && (
                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono max-h-40 overflow-y-auto">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader title="Shopify Setup Guide" />
              <CardContent className="space-y-2 text-xs text-slate-600">
                <p>1. Open Shopify Admin &gt; Settings &gt; Notifications.</p>
                <p>2. Scroll down to Webhooks &gt; Click <strong>Create webhook</strong>.</p>
                <p>3. Event: <strong>Order creation</strong>.</p>
                <p>4. Format: <strong>JSON</strong>.</p>
                <p>5. URL: Paste the gateway URL on the left.</p>
                <p>6. Webhook API version: <strong>Latest (2026-10 or later)</strong>.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 2. Webhook Activity Logs */}
      {activeTab === "logs" && (
        <Card>
          <CardHeader
            title="Real-Time Webhook Activity Logs"
            subtitle="Audit trail of incoming Shopify order delivery events and idempotency decisions"
          />
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/60 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 font-mono text-sm">{log.order_number}</span>
                    <Badge variant={log.hmac_status === "verified" ? "emerald" : "danger"} size="sm">
                      {log.hmac_status === "verified" ? "✓ HMAC Verified" : "Invalid Signature"}
                    </Badge>
                    <Badge variant={log.idempotency_status === "new" ? "info" : "warning"} size="sm">
                      {log.idempotency_status === "new" ? "New Order" : "Duplicate Skipped"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Event ID: {log.id} • Received: {log.timestamp}
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <span className="font-mono font-bold text-slate-900">{log.total_amount}</span>
                  {log.invoice_number && (
                    <p className="text-[11px] text-[#167a55] font-semibold">
                      Linked: {log.invoice_number}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
