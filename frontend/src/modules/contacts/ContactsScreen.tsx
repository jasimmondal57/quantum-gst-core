import React, { useState } from "react";
import { Users, Plus, Building2, Phone, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Input, Select } from "../../components/ui/Input";
import { Tabs } from "../../components/ui/EmptyState";
import { DataTable } from "../../components/tables/DataTable";
import type { Column } from "../../components/tables/DataTable";
import { api } from "../../services/api";
import type { Customer, BusinessProfile } from "../../services/api";

export interface ContactsScreenProps {
  business: BusinessProfile | null;
  customers: Customer[];
  suppliers: Customer[];
  onRefresh: () => void;
}

export const ContactsScreen: React.FC<ContactsScreenProps> = ({
  business,
  customers,
  suppliers,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState("customers");
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [partyType, setPartyType] = useState<"b2b" | "b2c" | "supplier">("b2b");
  const [gstin, setGstin] = useState("");
  const [stateCode, setStateCode] = useState(business?.gstins?.[0]?.state_code || "27");
  const [stateName, setStateName] = useState("Maharashtra");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState("");

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !name.trim()) return;
    setLoading(true);

    try {
      await api.createCustomer({
        business_id: business.id,
        name,
        company_name: companyName || undefined,
        customer_type: partyType,
        gstin: gstin.toUpperCase() || undefined,
        state_code: stateCode,
        state_name: stateName,
        email: email || undefined,
        phone: phone || undefined,
        billing_address: billingAddress || undefined,
      });

      setShowAddModal(false);
      setName("");
      setCompanyName("");
      setGstin("");
      setEmail("");
      setPhone("");
      setBillingAddress("");
      onRefresh();
    } catch (err: any) {
      alert("Error adding contact: " + (err.message || "Failed"));
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    {
      id: "customers",
      label: "Customers (Receivables)",
      count: customers.length,
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: "suppliers",
      label: "Suppliers & Vendors (Payables)",
      count: suppliers.length,
      icon: <Building2 className="w-4 h-4" />,
    },
  ];

  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: "Contact Name",
      sortable: true,
      render: (c) => (
        <div>
          <p className="font-semibold text-slate-900">{c.name}</p>
          {c.company_name && <p className="text-[10px] text-slate-400">{c.company_name}</p>}
        </div>
      ),
    },
    {
      key: "gstin",
      header: "GSTIN Registration",
      sortable: true,
      render: (c) =>
        c.gstin ? (
          <span className="font-mono text-slate-800 font-semibold">{c.gstin}</span>
        ) : (
          <span className="text-slate-400 italic">Unregistered (B2C)</span>
        ),
    },
    {
      key: "state_name",
      header: "State & Code",
      render: (c) => (
        <span className="text-slate-600">
          {c.state_name} ({c.state_code})
        </span>
      ),
    },
    {
      key: "phone",
      header: "Contact Details",
      render: (c) => (
        <div className="space-y-0.5 text-slate-600">
          {c.phone && (
            <p className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" />
              {c.phone}
            </p>
          )}
          {c.email && (
            <p className="flex items-center gap-1 text-[11px] text-slate-400 truncate max-w-xs">
              <Mail className="w-3 h-3 text-slate-400" />
              {c.email}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "customer_type",
      header: "Type",
      render: (c) => (
        <Badge
          variant={c.customer_type === "b2b" ? "emerald" : "neutral"}
          size="sm"
        >
          {c.customer_type || "party"}
        </Badge>
      ),
    },
  ];

  const currentData = activeTab === "customers" ? customers : suppliers;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Parties & Contacts Master
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your customer database, vendor GSTINs, and running accounts.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setPartyType(activeTab === "suppliers" ? "supplier" : "b2b");
            setShowAddModal(true);
          }}
          icon={<Plus className="w-4 h-4" />}
        >
          {activeTab === "suppliers" ? "Add Vendor" : "Add Customer"}
        </Button>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <DataTable
        columns={columns}
        data={currentData}
        searchPlaceholder="Search party name, company, GSTIN, phone..."
        emptyTitle={`No ${activeTab} registered yet`}
        emptyDescription="Add contacts to easily select them during billing and invoicing."
        emptyAction={
          <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
            Add First Contact
          </Button>
        }
      />

      {/* Add Contact Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={partyType === "supplier" ? "Add Supplier / Vendor" : "Add Customer Party"}
        subtitle="Saved parties will automatically populate in invoices & bills"
        size="md"
      >
        <form onSubmit={handleCreateContact} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Contact / Trade Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Rajesh Sharma"
              required
            />

            <Input
              label="Company Name (Optional)"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g., Sharma Traders Pvt Ltd"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Party Type"
              value={partyType}
              onChange={(e) => setPartyType(e.target.value as any)}
              options={[
                { label: "B2B (Registered with GSTIN)", value: "b2b" },
                { label: "B2C (Unregistered Consumer)", value: "b2c" },
                { label: "Supplier / Inward Vendor", value: "supplier" },
              ]}
            />

            <Input
              label="GSTIN (15 Digits)"
              value={gstin}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setGstin(val);
                if (val.length >= 2) {
                  setStateCode(val.substring(0, 2));
                }
              }}
              placeholder="e.g., 27AAAAA0000A1Z5"
              maxLength={15}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />

            <Input
              type="email"
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@company.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <Input
            label="Billing Address"
            value={billingAddress}
            onChange={(e) => setBillingAddress(e.target.value)}
            placeholder="Street address, city, pincode..."
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddModal(false)}
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
              Save Contact
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
