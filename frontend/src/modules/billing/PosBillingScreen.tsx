import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Trash2,
  QrCode,
  CreditCard,
  Banknote,
  Printer,
  CheckCircle2,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { api } from "../../services/api";
import type { BusinessProfile, Customer, Product } from "../../services/api";
import { generateUpiQrCode } from "../../utils/upiQr";

export interface PosBillingScreenProps {
  business: BusinessProfile | null;
  customers: Customer[];
  products: Product[];
  onInvoiceCreated: () => void;
}

interface PosCartItem {
  product_id?: string;
  item_name: string;
  hsn_sac: string;
  quantity: number;
  unit: string;
  unit_price: number;
  gst_rate: number;
  discount_percent: number;
}

export const PosBillingScreen: React.FC<PosBillingScreenProps> = ({
  business,
  customers,
  products,
  onInvoiceCreated,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [placeOfSupply, setPlaceOfSupply] = useState<string>(
    business?.gstins?.[0]?.state_code || "27"
  );
  const [itemSearch, setItemSearch] = useState("");
  const [cart, setCart] = useState<PosCartItem[]>([
    {
      item_name: "Quick Sale Item",
      hsn_sac: "84713010",
      quantity: 1,
      unit: "NOS",
      unit_price: 500,
      gst_rate: 18,
      discount_percent: 0,
    },
  ]);

  const [paymentMode, setPaymentMode] = useState<"cash" | "upi" | "card">("cash");
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastInvoiceNumber, setLastInvoiceNumber] = useState<string | null>(null);
  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string | null>(null);

  // Filtered products for quick picker
  const filteredProducts = useMemo(() => {
    if (!itemSearch.trim()) return products.slice(0, 6);
    const q = itemSearch.toLowerCase();
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)))
      .slice(0, 6);
  }, [products, itemSearch]);

  const isInterstate = useMemo(() => {
    const originState = business?.gstins?.[0]?.state_code || "27";
    return originState !== placeOfSupply;
  }, [business, placeOfSupply]);

  // Real-time tax math
  const totals = useMemo(() => {
    let taxable = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    cart.forEach((item) => {
      const gross = item.quantity * item.unit_price;
      const discount = (gross * item.discount_percent) / 100;
      const itemTaxable = gross - discount;
      taxable += itemTaxable;

      const taxAmount = (itemTaxable * item.gst_rate) / 100;
      if (isInterstate) {
        igst += taxAmount;
      } else {
        cgst += taxAmount / 2;
        sgst += taxAmount / 2;
      }
    });

    const subTotal = taxable + cgst + sgst + igst;
    const rounded = Math.round(subTotal);
    const roundOff = rounded - subTotal;

    return {
      taxable: taxable.toFixed(2),
      cgst: cgst.toFixed(2),
      sgst: sgst.toFixed(2),
      igst: igst.toFixed(2),
      taxAmount: (cgst + sgst + igst).toFixed(2),
      roundOff: roundOff.toFixed(2),
      grandTotal: rounded.toFixed(2),
    };
  }, [cart, isInterstate]);

  const addItemToCart = (prod: Product) => {
    setCart((prev) => [
      ...prev,
      {
        product_id: prod.id,
        item_name: prod.name,
        hsn_sac: prod.hsn_sac || "84713010",
        quantity: 1,
        unit: prod.unit || "NOS",
        unit_price: parseFloat(prod.sale_price) || 100,
        gst_rate: 18,
        discount_percent: 0,
      },
    ]);
  };

  const updateCartItem = (index: number, field: keyof PosCartItem, val: any) => {
    setCart((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const removeCartItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerateUpiQr = async () => {
    if (!business) return;
    try {
      const gstin = business.gstins?.[0]?.gstin || "27AAACB9999F1Z9";
      const qrUrl = await generateUpiQrCode({
        payeeVpa: "quantumgst@upi",
        payeeName: business.trade_name || business.legal_name,
        amount: totals.grandTotal,
        transactionRef: `POS-${Date.now()}`,
        gstin,
      });
      setUpiQrDataUrl(qrUrl);
    } catch (e) {
      console.error("UPI QR Generation Error:", e);
    }
  };

  const handleCheckout = async () => {
    if (!business || cart.length === 0) return;
    setLoading(true);

    try {
      const invoicePayload = {
        organization_id: business.organization_id,
        business_id: business.id,
        business_gstin_id: business.gstins?.[0]?.id,
        customer_id: selectedCustomerId || undefined,
        invoice_date: new Date().toISOString().split("T")[0],
        invoice_type: "tax_invoice",
        place_of_supply_state_code: placeOfSupply,
        reverse_charge: false,
        items: cart.map((item) => ({
          product_id: item.product_id,
          item_name: item.item_name,
          hsn_sac: item.hsn_sac,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          gst_rate: item.gst_rate,
        })),
      };

      const res = await api.createInvoice(invoicePayload);
      setLastInvoiceNumber(res.invoice_number);
      setShowSuccessModal(true);
      onInvoiceCreated();
      // Reset cart
      setCart([]);
    } catch (err: any) {
      alert("Billing Error: " + (err.message || "Failed to issue POS invoice"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* POS Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Express POS Billing Counter
            </h1>
            <Badge variant="emerald" size="sm">
              Instant GST Invoicing
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Issue statutory B2C / B2B sales in under 15 seconds.
          </p>
        </div>

        {/* Customer & Place of Supply Quick Config */}
        <div className="flex items-center gap-2.5">
          <select
            value={selectedCustomerId}
            onChange={(e) => {
              const custId = e.target.value;
              setSelectedCustomerId(custId);
              const cust = customers.find((c) => c.id === custId);
              if (cust?.state_code) {
                setPlaceOfSupply(cust.state_code);
              }
            }}
            className="text-xs rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 px-2.5 text-slate-700 font-medium cursor-pointer"
          >
            <option value="">👤 Walk-in / Cash Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.gstin ? `(${c.gstin})` : ""}
              </option>
            ))}
          </select>

          <select
            value={placeOfSupply}
            onChange={(e) => setPlaceOfSupply(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 bg-slate-50/70 py-1.5 px-2.5 text-slate-700 font-medium cursor-pointer"
          >
            <option value="27">State 27 (Maharashtra)</option>
            <option value="29">State 29 (Karnataka)</option>
            <option value="07">State 07 (Delhi)</option>
            <option value="24">State 24 (Gujarat)</option>
            <option value="19">State 19 (West Bengal)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Item Picker & Cart Table */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quick Product Search Bar */}
          <Card>
            <div className="p-3 border-b border-slate-100 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                placeholder="Scan barcode or type item name / SKU to add..."
                className="w-full text-xs sm:text-sm bg-transparent placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            {filteredProducts.length > 0 && (
              <div className="p-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar bg-slate-50/50">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addItemToCart(p)}
                    className="shrink-0 text-left px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-[#167a55] hover:bg-[#e8f5ee] transition-all text-xs cursor-pointer"
                  >
                    <p className="font-semibold text-slate-800 truncate max-w-[120px]">{p.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">₹{p.sale_price}</p>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Cart Table */}
          <Card>
            <CardHeader
              title={`Cart Items (${cart.length})`}
              action={
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() =>
                    setCart((prev) => [
                      ...prev,
                      {
                        item_name: "Custom Product",
                        hsn_sac: "84713010",
                        quantity: 1,
                        unit: "NOS",
                        unit_price: 100,
                        gst_rate: 18,
                        discount_percent: 0,
                      },
                    ])
                  }
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Custom Item
                </Button>
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3">HSN</th>
                    <th className="py-2.5 px-3 text-center w-18">Qty</th>
                    <th className="py-2.5 px-3 text-right w-24">Price (₹)</th>
                    <th className="py-2.5 px-3 text-center w-20">GST %</th>
                    <th className="py-2.5 px-3 text-right">Total (₹)</th>
                    <th className="py-2.5 px-3 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400">
                        Cart is empty. Click a product above or scan a barcode to add.
                      </td>
                    </tr>
                  ) : (
                    cart.map((item, idx) => {
                      const itemTotal =
                        item.quantity * item.unit_price * (1 + item.gst_rate / 100);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={item.item_name}
                              onChange={(e) => updateCartItem(idx, "item_name", e.target.value)}
                              className="w-full bg-transparent font-medium text-slate-800 focus:outline-none focus:border-b focus:border-[#167a55]"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={item.hsn_sac}
                              onChange={(e) => updateCartItem(idx, "hsn_sac", e.target.value)}
                              className="w-16 bg-transparent text-slate-500 font-mono text-[11px] focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              value={item.quantity}
                              onChange={(e) =>
                                updateCartItem(idx, "quantity", parseFloat(e.target.value) || 1)
                              }
                              className="w-14 text-center rounded border border-slate-200 py-1 font-semibold text-slate-800"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.unit_price}
                              onChange={(e) =>
                                updateCartItem(idx, "unit_price", parseFloat(e.target.value) || 0)
                              }
                              className="w-20 text-right rounded border border-slate-200 py-1 font-mono text-slate-800"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <select
                              value={item.gst_rate}
                              onChange={(e) =>
                                updateCartItem(idx, "gst_rate", parseFloat(e.target.value) || 0)
                              }
                              className="rounded border border-slate-200 py-1 px-1 text-[11px] font-semibold cursor-pointer"
                            >
                              <option value="0">0%</option>
                              <option value="5">5%</option>
                              <option value="12">12%</option>
                              <option value="18">18%</option>
                              <option value="28">28%</option>
                            </select>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                            ₹{itemTotal.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeCartItem(idx)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: Checkout & Bill Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Billing Summary" />
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Taxable Amount</span>
                <span className="font-mono font-medium text-slate-900">₹{totals.taxable}</span>
              </div>

              {isInterstate ? (
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Output IGST</span>
                  <span className="font-mono font-medium text-slate-900">₹{totals.igst}</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Output CGST</span>
                    <span className="font-mono font-medium text-slate-900">₹{totals.cgst}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Output SGST/UTGST</span>
                    <span className="font-mono font-medium text-slate-900">₹{totals.sgst}</span>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Round Off</span>
                <span className="font-mono text-slate-500">₹{totals.roundOff}</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between">
                <span className="text-sm font-bold text-slate-900">Grand Total</span>
                <span className="text-2xl font-black text-[#167a55] font-mono">
                  ₹{totals.grandTotal}
                </span>
              </div>

              {/* Payment Mode Selector */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-700 mb-2">Tender Mode</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode("cash")}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      paymentMode === "cash"
                        ? "border-[#167a55] bg-[#e8f5ee] text-[#167a55]"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    Cash
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMode("upi");
                      handleGenerateUpiQr();
                    }}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      paymentMode === "upi"
                        ? "border-[#167a55] bg-[#e8f5ee] text-[#167a55]"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    UPI QR
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode("card")}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      paymentMode === "card"
                        ? "border-[#167a55] bg-[#e8f5ee] text-[#167a55]"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Card
                  </button>
                </div>
              </div>

              {/* UPI Dynamic QR Display */}
              {paymentMode === "upi" && upiQrDataUrl && (
                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-center flex flex-col items-center justify-center">
                  <img src={upiQrDataUrl} alt="UPI Dynamic QR" className="w-32 h-32 rounded-lg" />
                  <p className="text-[11px] text-slate-500 mt-1">Scan & Pay ₹{totals.grandTotal}</p>
                </div>
              )}

              {/* Checkout Action Button */}
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full text-base py-3"
                  loading={loading}
                  disabled={cart.length === 0}
                  onClick={handleCheckout}
                  icon={<CheckCircle2 className="w-5 h-5" />}
                >
                  Pay & Generate Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="POS Invoice Generated Successfully!"
        size="sm"
        footer={
          <div className="w-full flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              icon={<Printer className="w-4 h-4" />}
            >
              Print Receipt
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowSuccessModal(false)}
            >
              Done
            </Button>
          </div>
        }
      >
        <div className="text-center py-4 space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900 font-mono">
              #{lastInvoiceNumber}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Statutory GST invoice recorded. Ledger entries balanced.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 font-mono text-sm font-bold text-[#167a55]">
            Amount Collected: ₹{totals.grandTotal}
          </div>
        </div>
      </Modal>
    </div>
  );
};
