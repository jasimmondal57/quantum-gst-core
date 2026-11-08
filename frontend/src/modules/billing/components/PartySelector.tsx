import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, UserCheck, Plus, X, Building, Phone, MapPin, Wallet, ShieldCheck } from "lucide-react";
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
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const screenPadding = 8;
      const width = Math.min(Math.max(rect.width, 360), window.innerWidth - screenPadding * 2);
      let left = rect.left;
      if (left + width > window.innerWidth - screenPadding) {
        left = window.innerWidth - width - screenPadding;
      }
      if (left < screenPadding) {
        left = screenPadding;
      }

      const dropdownHeight = 260;
      let top = rect.bottom + 4;
      if (top + dropdownHeight > window.innerHeight && rect.top > dropdownHeight + 10) {
        top = rect.top - dropdownHeight - 4;
      }

      setCoords({ top, left, width });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScrollOrResize = () => updatePosition();
      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize);
      return () => {
        window.removeEventListener("scroll", handleScrollOrResize, true);
        window.removeEventListener("resize", handleScrollOrResize);
      };
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        inputRef.current &&
        !inputRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
            className="text-xs text-[#71817a] hover:text-[#991b1b] flex items-center gap-1 transition-colors cursor-pointer"
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
                ref={inputRef}
                id="party-search-input"
                type="text"
                placeholder={`Search ${partyType === "supplier" ? "supplier" : "customer"} by name, GSTIN, phone... (Press F2)`}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsOpen(true);
                  updatePosition();
                }}
                onFocus={() => {
                  setIsOpen(true);
                  updatePosition();
                }}
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

          {/* Render party dropdown via React Portal to document.body to prevent clipping */}
          {isOpen &&
            createPortal(
              <div
                ref={dropdownRef}
                style={{
                  position: "fixed",
                  top: `${coords.top}px`,
                  left: `${coords.left}px`,
                  width: `${coords.width}px`,
                  zIndex: 9999,
                }}
                className="bg-white border border-[#b8e2cd] rounded-xl shadow-2xl overflow-hidden divide-y divide-[#e2ebe5] animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="max-h-60 overflow-y-auto overscroll-contain divide-y divide-[#f0f4f2]">
                  {filtered.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-xs text-[#71817a]">No matching party found in catalog.</p>
                      <Button
                        type="button"
                        variant="soft"
                        size="sm"
                        className="mt-2.5"
                        onClick={() => {
                          setIsOpen(false);
                          setShowQuickCreate(true);
                        }}
                      >
                        + Create &quot;{searchTerm}&quot; as New Party
                      </Button>
                    </div>
                  ) : (
                    filtered.map((party) => (
                      <button
                        key={party.id || party.name}
                        type="button"
                        onClick={() => handleSelect(party)}
                        className="w-full text-left p-3 hover:bg-[#eaf6ef] transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#172b25]">{party.name}</span>
                            {party.gstin ? (
                              <Badge variant="emerald" size="sm">
                                {party.gstin}
                              </Badge>
                            ) : (
                              <Badge variant="neutral" size="sm">
                                Unregistered
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-[#71817a] mt-0.5">
                            {party.phone ? `Phone: ${party.phone} · ` : ""}
                            State: {party.billing_state || `State ${party.billing_state_code}`}
                          </p>
                        </div>
                        <UserCheck className="w-4 h-4 text-[#167a55] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))
                  )}
                </div>
              </div>,
              document.body
            )}
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-[#eaf6ef]/50 border border-[#b8e2cd] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-[#172b25]">{selectedParty.name}</span>
              {selectedParty.trade_name && selectedParty.trade_name !== selectedParty.name && (
                <span className="text-xs text-[#71817a]">({selectedParty.trade_name})</span>
              )}
              {selectedParty.gstin ? (
                <Badge variant="emerald" size="sm">
                  <ShieldCheck className="w-3 h-3 mr-1 inline" />
                  GSTIN: {selectedParty.gstin}
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm">
                  Unregistered (B2C)
                </Badge>
              )}
              <Badge variant="outline" size="sm">
                POS: State {selectedParty.billing_state_code || "27"} ({selectedParty.billing_state || "Home State"})
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-xs text-[#71817a] flex-wrap">
              {selectedParty.phone && (
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <Phone className="w-3 h-3 text-[#167a55]" />
                  {selectedParty.phone}
                </span>
              )}
              {selectedParty.billing_address && (
                <span className="flex items-center gap-1 truncate max-w-sm">
                  <MapPin className="w-3 h-3 text-[#167a55]" />
                  {selectedParty.billing_address}
                </span>
              )}
              <span className="flex items-center gap-1 font-semibold text-[#167a55] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <Wallet className="w-3 h-3" />
                Ledger Balance: ₹0.00 (Current)
              </span>
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

