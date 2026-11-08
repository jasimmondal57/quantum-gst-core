import React from "react";
import { CreditCard, Banknote, QrCode, Building, Wallet, Check } from "lucide-react";

export interface PaymentSectionProps {
  grandTotal: number;
  amountReceived: number;
  onAmountReceivedChange: (amt: number) => void;
  paymentMode: "cash" | "upi" | "bank_transfer" | "cheque" | "card" | "credit";
  onPaymentModeChange: (mode: "cash" | "upi" | "bank_transfer" | "cheque" | "card" | "credit") => void;
}

const PAYMENT_MODES: {
  id: "cash" | "upi" | "bank_transfer" | "cheque" | "card" | "credit";
  label: string;
  icon: React.ReactNode;
}[] = [
  { id: "cash", label: "Cash", icon: <Banknote className="w-4 h-4" /> },
  { id: "upi", label: "UPI / QR", icon: <QrCode className="w-4 h-4" /> },
  { id: "bank_transfer", label: "Bank Transfer", icon: <Building className="w-4 h-4" /> },
  { id: "cheque", label: "Cheque", icon: <CreditCard className="w-4 h-4" /> },
  { id: "credit", label: "Credit (Unpaid)", icon: <Wallet className="w-4 h-4" /> },
];

export const PaymentSection: React.FC<PaymentSectionProps> = ({
  grandTotal,
  amountReceived,
  onAmountReceivedChange,
  paymentMode,
  onPaymentModeChange,
}) => {
  const balanceDue = Math.max(0, grandTotal - amountReceived);

  const handleSetFullPayment = () => {
    onAmountReceivedChange(grandTotal);
  };

  const handleSetZeroPayment = () => {
    onAmountReceivedChange(0);
    onPaymentModeChange("credit");
  };

  return (
    <div className="bg-white border border-[#e2ebe5] rounded-xl p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[#172b25] flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-[#167a55]" />
          Payment Settlement & Terms
          <span className="shortcut-kbd ml-1">F6</span>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSetFullPayment}
            className="text-[11px] font-bold text-[#167a55] hover:underline bg-[#eaf6ef] px-2 py-0.5 rounded"
          >
            Mark Paid (₹{grandTotal.toFixed(2)})
          </button>
          <button
            type="button"
            onClick={handleSetZeroPayment}
            className="text-[11px] font-bold text-[#71817a] hover:underline bg-[#f5f8f6] px-2 py-0.5 rounded"
          >
            Full Credit
          </button>
        </div>
      </div>

      {/* Payment Modes Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {PAYMENT_MODES.map((pm) => {
          const isSelected = paymentMode === pm.id;
          return (
            <button
              key={pm.id}
              type="button"
              onClick={() => {
                onPaymentModeChange(pm.id);
                if (pm.id === "credit") {
                  onAmountReceivedChange(0);
                } else if (amountReceived === 0) {
                  onAmountReceivedChange(grandTotal);
                }
              }}
              className={`flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-semibold border transition-all ${
                isSelected
                  ? "border-[#167a55] bg-[#eaf6ef] text-[#167a55] shadow-xs"
                  : "border-[#e2ebe5] bg-white text-[#71817a] hover:bg-[#f5f8f6]"
              }`}
            >
              {pm.icon}
              {pm.label}
              {isSelected && <Check className="w-3 h-3 text-[#167a55]" />}
            </button>
          );
        })}
      </div>

      {/* Amount Received & Balance Due */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#e2ebe5]">
        <div>
          <label className="block text-xs font-medium text-[#71817a] mb-1">
            Amount Received (₹)
          </label>
          <input
            id="payment-received-input"
            type="number"
            min="0"
            step="0.01"
            value={amountReceived || ""}
            onChange={(e) => onAmountReceivedChange(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="w-full text-xs font-bold rounded-lg border border-[#e2ebe5] px-3 py-2 bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#71817a] mb-1">
            Payment Status
          </label>
          <div className="h-[34px] flex items-center px-3 rounded-lg bg-[#f5f8f6] border border-[#e2ebe5] text-xs font-bold">
            {amountReceived >= grandTotal && grandTotal > 0 && (
              <span className="text-[#065f46]">Fully Paid</span>
            )}
            {amountReceived > 0 && amountReceived < grandTotal && (
              <span className="text-[#92400e]">Partially Paid</span>
            )}
            {amountReceived === 0 && (
              <span className="text-[#991b1b]">Unpaid (Credit Sale)</span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#71817a] mb-1">
            Balance Due (Receivable)
          </label>
          <div className="h-[34px] flex items-center justify-between px-3 rounded-lg bg-[#fef2f2] border border-[#fecaca] text-xs font-bold text-[#991b1b]">
            <span>Outstanding</span>
            <span>₹{balanceDue.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

