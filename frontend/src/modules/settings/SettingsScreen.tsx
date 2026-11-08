import React, { useState } from "react";
import {
  Building,
  ShieldCheck,
  Plus,
  Key,
  CheckCircle2,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Card, CardHeader, CardContent } from "../../components/ui/Card";
import { Tabs } from "../../components/ui/EmptyState";
import type { BusinessProfile } from "../../services/api";
import { api } from "../../services/api";

export interface SettingsScreenProps {
  business: BusinessProfile | null;
  onRefresh: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ business, onRefresh }) => {
  const [activeTab, setActiveTab] = useState("business");
  const [showAddGstinModal, setShowAddGstinModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State for Add GSTIN
  const [gstin, setGstin] = useState("");
  const [stateCode, setStateCode] = useState("27");
  const [stateName, setStateName] = useState("Maharashtra");

  const handleAddGstin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !gstin.trim()) return;
    setLoading(true);

    try {
      await api.createGstin({
        business_id: business.id,
        gstin: gstin.toUpperCase(),
        state_code: stateCode,
        state_name: stateName,
        legal_name: business.legal_name,
        is_primary: false,
      });

      setShowAddGstinModal(false);
      setGstin("");
      onRefresh();
    } catch (err: any) {
      alert("Error adding GSTIN: " + (err.message || "Failed"));
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "business", label: "Business Profile", icon: <Building className="w-4 h-4" /> },
    { id: "gstin", label: "GSTIN Registrations", icon: <ShieldCheck className="w-4 h-4" /> },
    { id: "api_keys", label: "Developer & API", icon: <Key className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Settings & Registrations
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your organization profile, statutory multi-state GSTINs, and API credentials.
        </p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "business" && (
        <Card>
          <CardHeader title="Company & Legal Entity Information" />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Legal Entity Name"
                value={business?.legal_name || ""}
                disabled
              />
              <Input
                label="Trade / Brand Name"
                value={business?.trade_name || ""}
                disabled
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Permanent Account Number (PAN)"
                value={business?.pan || "N/A"}
                disabled
              />
              <Input
                label="Registered Email"
                value={business?.email || "N/A"}
                disabled
              />
              <Input
                label="Registered Phone"
                value={business?.phone || "N/A"}
                disabled
              />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "gstin" && (
        <Card>
          <CardHeader
            title="State GSTIN Registrations"
            subtitle="Manage multi-state registrations for branch operations"
            action={
              <Button
                variant="primary"
                size="xs"
                onClick={() => setShowAddGstinModal(true)}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add GSTIN
              </Button>
            }
          />
          <div className="divide-y divide-slate-100">
            {(!business?.gstins || business.gstins.length === 0) ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active GSTINs registered yet. Click "Add GSTIN" to register a branch.
              </div>
            ) : (
              business.gstins.map((g) => (
                <div key={g.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {g.gstin}
                      </span>
                      <Badge variant="emerald" size="sm">
                        State {g.state_code} - {g.state_name}
                      </Badge>
                    </div>
                    <p className="text-slate-500 mt-1">
                      {g.address_line1 ? `${g.address_line1}, ${g.city}` : "Primary Registered Office"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {activeTab === "api_keys" && (
        <Card>
          <CardHeader
            title="REST API & Secret Keys"
            subtitle="Bearer authentication tokens for ERP integrations"
          />
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">Production Token</span>
                <Badge variant="emerald" size="sm">Active (Sanctum)</Badge>
              </div>
              <code className="text-xs bg-white p-2.5 rounded-lg border border-slate-300 font-mono text-slate-800 block truncate">
                {localStorage.getItem("quantum_token") || "No token found"}
              </code>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add GSTIN Modal */}
      <Modal
        isOpen={showAddGstinModal}
        onClose={() => setShowAddGstinModal(false)}
        title="Register State GSTIN"
        subtitle="Adds an official GST registration number for billing in that state"
        size="sm"
      >
        <form onSubmit={handleAddGstin} className="space-y-4">
          <Input
            label="15-Digit GSTIN"
            value={gstin}
            onChange={(e) => {
              const val = e.target.value.toUpperCase();
              setGstin(val);
              if (val.length >= 2) {
                setStateCode(val.substring(0, 2));
              }
            }}
            placeholder="e.g., 29XXXXX0000X1Z5"
            maxLength={15}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="State Code"
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
              maxLength={2}
              required
            />
            <Input
              label="State Name"
              value={stateName}
              onChange={(e) => setStateName(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddGstinModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={loading}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Save GSTIN
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
