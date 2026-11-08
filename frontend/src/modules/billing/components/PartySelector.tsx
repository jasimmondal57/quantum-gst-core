import React, { useState } from "react";
import { Search, UserCheck, Plus, X, Building, Phone, MapPin } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import type { Party } from "../types/party";
import { PartyQuickCreate } from "./PartyQuickCreate";

export interface PartySelectorProps {
  partyType?: "customer" | "supplier" | "both";
  selectedParty: Party | null;
  parties: Party[];
  businessId?: string;
  onSelectParty: (party: Party | null) => void;
  onPartyCreated?: (party: Party) => void;
}

export const PartySelector: React.FC<PartySelectorProps> = ({
  partyType = "customer",
  selectedParty,
  parties,
  businessId = "",
  onSelectParty,
  onPartyCreated,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  const filtered = parties.filter((p) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.gstin && p.gstin.toLowerCase().includes(term)) ||
      (p.phone && p.phone.includes(term))
    );
  });

  const handleSelect = (p: Party) => {
    onSelectParty(p);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleQuickCreated = (p: Party) => {
    onSelectParty(p);
    onPartyCreated?.(p);
    setShowQuickCreate(false);
  };

  return (
    <div className="bg-white border border-[#e2ebe5] rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[#172b25] flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5 text-[#167a55]" />
          {partyType === "supplier" ? "Supplier / Vendor Details" : "Customer / Party Details"}
          <span className="shortcut-kbd ml-1">F2</span>
        </label>
        {selectedParty && (
          <button
            type="button"
            onClick={() => onSelectParty(null)}
            className="text-xs text-[#71817a] hover:text-[#991b1b] flex items-center gap-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Change Party
          </button>
        )}
      </div>

      {!selectedParty ? (
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#71817a]" />
              <input
                id="party-search-input"
                type="text"
                placeholder={`Search ${partyType === "supplier" ? "supplier" : "customer"} by name, GSTIN, phone...`}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#e2ebe5] bg-white text-[#172b25] focus:outline-none focus:border-[#167a55] focus:ring-2 focus:ring-[#167a55]/10"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowQuickCreate(true)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add New
            </Button>
          </div>

          {isOpen && (
            <div className="absolute z-30 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-[#e2ebe5] rounded-xl shadow-lg divide-y divide-[#e2ebe5]">
              {filtered.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-xs text-[#71817a]">No matching party found.</p>
                  <Button
                    type="button"
                    variant="soft"
                    size="sm"
                    className="mt-2"
                    onClick={() => setShowQuickCreate(true)}
                  >
                    + Create &quot;{searchTerm}&quot;
                  </Button>
                </div>
              ) : (
                filtered.map((party) => (
                  <button
                    key={party.id || party.name}
                    type="button"
                    onClick={() => handleSelect(party)}
                    className="w-full text-left p-3 hover:bg-[#eaf6ef] transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#172b25]">{party.name}</span>
                        {party.gstin && (
                          <Badge variant="emerald" size="sm">
                            {party.gstin}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-[#71817a] mt-0.5">
                        {party.phone ? `Phone: ${party.phone} · ` : ""}
                        State: {party.billing_state || "State Code " + party.billing_state_code}
                      </p>
                    </div>
                    <UserCheck className="w-4 h-4 text-[#167a55] opacity-0 group-hover:opacity-100" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-[#eaf6ef]/60 border border-[#b8e2cd] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-[#172b25]">{selectedParty.name}</span>
              {selectedParty.gstin ? (
                <Badge variant="emerald" size="sm">
                  GSTIN: {selectedParty.gstin}
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm">
                  Unregistered (B2C)
                </Badge>
              )}
              <Badge variant="outline" size="sm">
                POS: {selectedParty.billing_state_code || "27"}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#71817a] mt-1.5 flex-wrap">
              {selectedParty.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#167a55]" />
                  {selectedParty.phone}
                </span>
              )}
              {selectedParty.billing_address && (
                <span className="flex items-center gap-1 truncate max-w-xs">
                  <MapPin className="w-3 h-3 text-[#167a55]" />
                  {selectedParty.billing_address}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <PartyQuickCreate
        isOpen={showQuickCreate}
        businessId={businessId}
        partyType={partyType}
        onClose={() => setShowQuickCreate(false)}
        onSaved={handleQuickCreated}
      />
    </div>
  );
};

