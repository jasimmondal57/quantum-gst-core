import React from "react";
import { ShieldCheck, Copy } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Card, CardHeader, CardContent } from "../../components/ui/Card";
import type { BusinessProfile } from "../../services/api";

export interface ShopifyScreenProps {
  business: BusinessProfile | null;
}

export const ShopifyScreen: React.FC<ShopifyScreenProps> = ({ business: _business }) => {
  const webhookUrl = "https://quantumgst.in/api/v1/webhooks/shopify/orders-create";

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    alert("Webhook URL copied to clipboard!");
  };

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
                  <Badge variant="emerald" size="sm">HMAC Verified</Badge>
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
                  <li>HMAC-SHA256 cryptographic signature verification.</li>
                  <li>Order ID idempotency lock prevents duplicate invoices on webhook retries.</li>
                  <li>Automatic Place of Supply state resolution and CGST/SGST/IGST computation.</li>
                </ul>
              </div>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
