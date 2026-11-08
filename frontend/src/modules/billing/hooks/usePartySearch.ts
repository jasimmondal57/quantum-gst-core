import { useState, useMemo } from "react";
import type { Customer } from "../../../services/api";
import type { Party } from "../types/party";

export function usePartySearch(customers: Customer[], initialPartyType: "customer" | "supplier" | "both" = "customer") {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);

  // Map Customer API format to Billing Party format
  const parties: Party[] = useMemo(() => {
    return customers.map((c) => ({
      id: c.id,
      name: c.name,
      party_type: initialPartyType,
      gstin: c.gstin || "",
      registration_type: c.gstin ? "regular" : "unregistered",
      email: c.email || "",
      phone: c.phone || "",
      billing_address: c.address || "",
      billing_city: c.city || "",
      billing_state: c.state || "",
      billing_state_code: c.state_code || (c.gstin ? c.gstin.substring(0, 2) : "27"),
      billing_pincode: c.pincode || "",
      shipping_address: c.address || "",
      shipping_state_code: c.state_code || (c.gstin ? c.gstin.substring(0, 2) : "27"),
    }));
  }, [customers, initialPartyType]);

  const filteredParties = useMemo(() => {
    if (!searchTerm.trim()) return parties;
    const term = searchTerm.toLowerCase();
    return parties.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.gstin && p.gstin.toLowerCase().includes(term)) ||
        (p.phone && p.phone.includes(term))
    );
  }, [parties, searchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    selectedParty,
    setSelectedParty,
    filteredParties,
    allParties: parties,
  };
}
