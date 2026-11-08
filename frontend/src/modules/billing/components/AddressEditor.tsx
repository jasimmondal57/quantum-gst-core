import React, { useState } from "react";
import { Copy, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import type { Party } from "../types/party";

export interface AddressEditorProps {
  party: Party | null;
  onUpdateParty?: (updated: Partial<Party>) => void;
}

export const AddressEditor: React.FC<AddressEditorProps> = ({ party, onUpdateParty }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [billingAddr, setBillingAddr] = useState(party?.billing_address || "");
  const [shippingAddr, setShippingAddr] = useState(party?.shipping_address || party?.billing_address || "");

  if (!party) return null;

  const handleCopyBillingToShipping = () => {
    setShippingAddr(billingAddr);
    onUpdateParty?.({
      shipping_address: billingAddr,
      shipping_state_code: party.billing_state_code,
    });
  };

  return (
    <div className="bg-white border border-[#e2ebe5] rounded-xl overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-[#172b25] bg-[#f5f8f6]/50 hover:bg-[#eaf6ef] transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#167a55]" />
          Billing & Shipping Addresses
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-[#71817a]" /> : <ChevronDown className="w-4 h-4 text-[#71817a]" />}
      </button>

      {isOpen && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#e2ebe5]">
          <div>
            <label className="block text-xs font-bold text-[#172b25] mb-1">
              Billing Address
            </label>
            <textarea
              rows={2}
              value={billingAddr}
              onChange={(e) => {
                setBillingAddr(e.target.value);
                onUpdateParty?.({ billing_address: e.target.value });
              }}
              placeholder="Enter complete billing address"
              className="w-full text-xs rounded-lg border border-[#e2ebe5] p-2 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-[#172b25]">
                Shipping Address
              </label>
              <button
                type="button"
                onClick={handleCopyBillingToShipping}
                className="text-[11px] font-semibold text-[#167a55] hover:underline flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                Same as Billing
              </button>
            </div>
            <textarea
              rows={2}
              value={shippingAddr}
              onChange={(e) => {
                setShippingAddr(e.target.value);
                onUpdateParty?.({ shipping_address: e.target.value });
              }}
              placeholder="Enter shipping address if different"
              className="w-full text-xs rounded-lg border border-[#e2ebe5] p-2 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
