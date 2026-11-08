import React, { useState } from "react";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import type { Party } from "../types/party";

export interface PartyQuickCreateProps {
  isOpen: boolean;
  partyType?: "customer" | "supplier" | "both";
  onClose: () => void;
  onSave: (party: Party) => void;
}

export const PartyQuickCreate: React.FC<PartyQuickCreateProps> = ({
  isOpen,
  partyType = "customer",
  onClose,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [gstin, setGstin] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [stateCode, setStateCode] = useState("27");
  const [state, setState] = useState("Maharashtra");
  const [pincode, setPincode] = useState("");
  const [registrationType, setRegistrationType] = useState<Party["registration_type"]>("regular");

  const handleGstinChange = (val: string) => {
    const upper = val.toUpperCase().trim();
    setGstin(upper);
    if (upper.length >= 2) {
      const code = upper.substring(0, 2);
      setStateCode(code);
      setRegistrationType("regular");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Please enter party name");
      return;
    }

    const newParty: Party = {
      name: name.trim(),
      party_type: partyType,
      gstin: gstin.trim() || undefined,
      registration_type: gstin.trim() ? registrationType : "unregistered",
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      billing_address: address.trim() || undefined,
      billing_state: state,
      billing_state_code: stateCode,
      billing_pincode: pincode.trim() || undefined,
      shipping_address: address.trim() || undefined,
      shipping_state_code: stateCode,
    };

    onSave(newParty);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Quick Add ${partyType === "supplier" ? "Supplier" : "Customer"}`}
      subtitle="Add a new party without leaving your active invoice workspace"
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit}>
            Save & Select Party
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <Input
              label="Party / Business Legal Name *"
              placeholder="e.g. Acme Technologies Pvt Ltd"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <Input
              label="GSTIN (Optional for Unregistered)"
              placeholder="27AABCU9603R1ZM"
              value={gstin}
              onChange={(e) => handleGstinChange(e.target.value)}
              maxLength={15}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172b25] mb-1.5">
              Registration Type
            </label>
            <select
              value={registrationType}
              onChange={(e) => setRegistrationType(e.target.value as Party["registration_type"])}
              className="w-full text-xs rounded-lg border border-[#e2ebe5] px-3 py-2 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
            >
              <option value="regular">Regular GST Registered</option>
              <option value="composition">Composition Scheme</option>
              <option value="unregistered">Unregistered Business</option>
              <option value="consumer">Consumer (B2C)</option>
              <option value="sez">Special Economic Zone (SEZ)</option>
              <option value="overseas">Overseas Export / Non-Resident</option>
            </select>
          </div>

          <div>
            <Input
              label="Contact Phone / Mobile"
              placeholder="+91 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <Input
              label="Email Address (For Invoice PDF dispatch)"
              placeholder="billing@acme.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <Input
              label="Billing Address"
              placeholder="Plot No 42, MIDC Industrial Area, Andheri East"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div>
            <Input
              label="State & State Code"
              placeholder="State Name"
              value={`${state} (${stateCode})`}
              onChange={(e) => setState(e.target.value)}
            />
          </div>

          <div>
            <Input
              label="PIN Code"
              placeholder="400093"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              maxLength={6}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
