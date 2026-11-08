import React, { useState } from "react";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { api } from "../../../services/api";
import type { Party } from "../types/party";
import { INDIAN_STATES } from "./DocumentDetails";

export interface PartyQuickCreateProps {
  isOpen: boolean;
  businessId: string;
  partyType?: "customer" | "supplier" | "both";
  onClose: () => void;
  onSaved: (party: Party) => void;
}

export const PartyQuickCreate: React.FC<PartyQuickCreateProps> = ({
  isOpen,
  businessId,
  partyType = "customer",
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [gstin, setGstin] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [stateCode, setStateCode] = useState("27");
  const [stateName, setStateName] = useState("Maharashtra");
  const [pincode, setPincode] = useState("");
  const [registrationType, setRegistrationType] = useState<Party["registration_type"]>(
    partyType === "supplier" ? "unregistered" : "regular"
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Sync initial state and defaults when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      if (!gstin) {
        setRegistrationType(partyType === "supplier" ? "unregistered" : "regular");
      }
    }
  }, [isOpen, partyType]);

  const handleRegistrationTypeChange = (newType: Party["registration_type"]) => {
    setRegistrationType(newType);
    if (newType === "overseas") {
      setStateCode("99");
      setStateName("Other Territory / Overseas");
    } else if (stateCode === "99") {
      setStateCode("27");
      setStateName("Maharashtra");
    }
  };

  const handleStateChange = (code: string) => {
    setStateCode(code);
    const found = INDIAN_STATES.find((s) => s.code === code);
    if (found) {
      // Remove code prefix e.g. "27 - Maharashtra" -> "Maharashtra"
      const cleanName = found.name.replace(/^\d+\s*-\s*/, "").replace(/\s*\(UT\)/, "").trim();
      setStateName(cleanName);
    }
  };

  const handleGstinChange = (val: string) => {
    const upper = val.toUpperCase().trim();
    setGstin(upper);
    if (upper.length >= 2) {
      const code = upper.substring(0, 2);
      const found = INDIAN_STATES.find((s) => s.code === code);
      if (found) {
        setStateCode(code);
        const cleanName = found.name.replace(/^\d+\s*-\s*/, "").replace(/\s*\(UT\)/, "").trim();
        setStateName(cleanName);
        setRegistrationType("regular");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Please enter party / business legal name");
      return;
    }

    const cleanGstin = gstin.trim().toUpperCase();
    const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (cleanGstin) {
      if (!GSTIN_REGEX.test(cleanGstin)) {
        setErrorMsg("Invalid GSTIN structure. Expected: 2-digit State code + 10-char PAN + 1-char Entity + 'Z' + 1 Check digit (e.g. 27AABCU9603R1ZM)");
        return;
      }

      const gstinState = cleanGstin.substring(0, 2);
      if (gstinState !== stateCode && registrationType !== "overseas") {
        setErrorMsg(`GSTIN state prefix (${gstinState}) does not match the selected State (${stateCode} - ${stateName}). Please select matching state.`);
        return;
      }

      if (registrationType === "unregistered" || registrationType === "consumer") {
        setErrorMsg("Unregistered parties/consumers cannot hold a GSTIN. Please change Registration Category to 'Regular' or clear the GSTIN.");
        return;
      }
    } else {
      // No GSTIN provided
      if (registrationType === "regular" || registrationType === "composition" || registrationType === "sez") {
        setErrorMsg(`GSTIN is mandatory for ${registrationType.toUpperCase()} registered entities. For unregistered suppliers/buyers, select 'Unregistered Business' or 'Overseas Export'.`);
        return;
      }
    }

    if (pincode.trim() && pincode.trim().length !== 6 && registrationType !== "overseas") {
      setErrorMsg("PIN code must be exactly 6 digits (or leave blank for overseas parties)");
      return;
    }

    if (phone.trim() && phone.trim().replace(/\D/g, "").length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile / phone number");
      return;
    }

    setLoading(true);
    try {
      // Statutory party classification mapping
      let custType = "b2c";
      if (partyType === "supplier") {
        custType = "supplier";
      } else if (registrationType === "overseas") {
        custType = "export";
      } else if (registrationType === "sez") {
        custType = "sez";
      } else if (cleanGstin) {
        custType = "b2b";
      } else {
        custType = "b2c";
      }

      const payload = {
        business_id: businessId,
        customer_type: custType,
        name: name.trim(),
        company_name: companyName.trim() || undefined,
        gstin: gstin.trim() ? gstin.trim().toUpperCase() : undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        state_code: stateCode,
        state_name: stateName,
        billing_address: address.trim() || undefined,
        billing_pincode: pincode.trim() || undefined,
      };

      const saved = await api.createCustomer(payload);

      const newParty: Party = {
        id: saved.id,
        business_id: saved.business_id,
        name: saved.name,
        trade_name: saved.company_name,
        party_type: partyType,
        gstin: saved.gstin,
        registration_type: saved.gstin ? registrationType : "unregistered",
        phone: saved.phone,
        email: saved.email,
        billing_address: saved.billing_address,
        billing_state: saved.state_name,
        billing_state_code: saved.state_code,
        billing_pincode: saved.billing_pincode,
        shipping_address: saved.billing_address,
        shipping_state_code: saved.state_code,
      };

      onSaved(newParty);
      onClose();
    } catch (err: unknown) {
      console.error("Failed to create customer in backend:", err);
      setErrorMsg((err as Error).message || "Failed to save customer to database.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add New ${partyType === "supplier" ? "Supplier" : "Customer"}`}
      subtitle="Creates and persists party directly in your database for this and future invoices"
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="quick-add-party-form"
            variant="primary"
            size="sm"
            loading={loading}
          >
            Save & Select Party
          </Button>
        </div>
      }
    >
      <form id="quick-add-party-form" onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="md:col-span-2">
            <Input
              label="Party / Legal Name *"
              placeholder="e.g. Reliance Retail Limited"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <Input
              label="Trade / Brand Name (Optional)"
              placeholder="e.g. Reliance Fresh"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div>
            <Input
              label="GSTIN (15 Alphanumeric Characters)"
              placeholder="27AABCU9603R1ZM"
              value={gstin}
              onChange={(e) => handleGstinChange(e.target.value)}
              maxLength={15}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172b25] mb-1.5">
              GST Registration Category
            </label>
            <select
              value={registrationType}
              onChange={(e) => handleRegistrationTypeChange(e.target.value as Party["registration_type"])}
              className="w-full text-xs rounded-lg border border-[#e2ebe5] px-3 py-2 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
            >
              <option value="regular">Regular GST Registered (B2B)</option>
              <option value="consumer">Consumer (B2C - Direct Customer)</option>
              <option value="composition">Composition Scheme Dealer</option>
              <option value="unregistered">Unregistered Business</option>
              <option value="sez">Special Economic Zone (SEZ)</option>
              <option value="overseas">Overseas Export / Non-Resident</option>
            </select>
          </div>

          <div>
            <Input
              label="Contact Phone / Mobile"
              placeholder="9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={12}
            />
          </div>

          <div>
            <Input
              label="Email Address (For Tax Invoices)"
              placeholder="accounts@relianceretail.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172b25] mb-1.5">
              Place of Supply / State *
            </label>
            <select
              value={stateCode}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#e2ebe5] px-3 py-2 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
            >
              {INDIAN_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Input
              label="PIN Code (6 digits)"
              placeholder="400001"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
              maxLength={6}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#172b25] mb-1.5">
              Complete Billing Address
            </label>
            <textarea
              rows={2}
              placeholder="Plot No 42, Maker Chambers IV, Nariman Point, Mumbai"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#e2ebe5] p-2.5 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
