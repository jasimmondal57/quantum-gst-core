import React, { useState } from "react";
import {
  Barcode,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Printer,
  PauseCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Card, CardHeader, CardContent } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Modal } from "../../../components/ui/Modal";
import { api } from "../../../services/api";
import type { BusinessProfile, Customer, Product } from "../../../services/api";
import { generateUpiQrDataUrl } from "../../../utils/upiQr";

export interface POSBillingProps {
  business: BusinessProfile | null;
  customers: Customer[];
  products: Product[];
  onInvoiceCreated: () => void;
  onNavigate?: (route: string) => void;
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

export const POSBilling: React.FC<POSBillingProps> = ({
  business,
  customers,
  products,
  onInvoiceCreated,
}) => {
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi" | "card">("cash");
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [heldBills, setHeldBills] = useState<{ id: string; time: string; cart: PosCartItem[]; customer: Customer | null }[]>([]);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastIssuedInvoice, setLastIssuedInvoice] = useState<{ number: string; total: string; date: string } | null>(null);
  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Cart Calculations
  const totals = React.useMemo(() => {
    let subTotal = 0;
    let totalTax = 0;

    cart.forEach((item) => {
      const gross = item.quantity * item.unit_price;
      const discount = (gross * item.discount_percent) / 100;
      const taxable = gross - discount;
      const tax = (taxable * item.gst_rate) / 100;
      subTotal += taxable;
      totalTax += tax;
    });

    const grand = Math.round(subTotal + totalTax);
    return {
      taxableSubtotal: subTotal.toFixed(2),
      totalTax: totalTax.toFixed(2),
      grandTotal: grand.toFixed(2),
      itemCount: cart.reduce((acc, curr) => acc + curr.quantity, 0),
    };
  }, [cart]);

  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          item_name: product.name,
          hsn_sac: product.hsn_code || product.hsn_sac || "",
          quantity: 1,
          unit: product.unit || "NOS",
          unit_price: typeof product.selling_price === "string" ? parseFloat(product.selling_price) : (product.selling_price || 0),
          gst_rate: typeof product.gst_rate === "number"
            ? product.gst_rate
            : (typeof product.gst_rate === "string" && !isNaN(parseFloat(product.gst_rate)) ? parseFloat(product.gst_rate) : 0),
          discount_percent: 0,
        },
      ];
    });
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const match = products.find(
      (p) => p.sku?.toLowerCase() === barcodeInput.toLowerCase() || p.barcode === barcodeInput
    );
    if (match) {
      handleAddToCart(match);
      setBarcodeInput("");
    } else {
      alert(`No product found matching barcode/SKU: ${barcodeInput}`);
    }
  };

  const handleHoldBill = () => {
    if (cart.length === 0) return;
    setHeldBills((prev) => [
      ...prev,
      {
        id: `HOLD-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        cart,
        customer: selectedCustomer,
      },
    ]);
    setCart([]);
    setSelectedCustomer(null);
  };

  const handleResumeBill = (heldId: string) => {
    const held = heldBills.find((b) => b.id === heldId);
    if (!held) return;
    setCart(held.cart);
    setSelectedCustomer(held.customer);
    setHeldBills((prev) => prev.filter((b) => b.id !== heldId));
  };

  const handleGenerateUpiQr = async () => {
    if (!business) return;
    try {
      const gstin = business.gstins?.[0]?.gstin || "27AAACB9999F1Z9";
      const qrUrl = await generateUpiQrDataUrl({
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
      const gstinRecord = business.gstins?.[0];
      const payload = {
        organization_id: business.organization_id || "00000000-0000-0000-0000-000000000000",
        business_id: business.id,
        business_gstin_id: gstinRecord?.id,
        customer_id: selectedCustomer?.id || null,
        invoice_date: new Date().toISOString().split("T")[0],
        invoice_type: "tax_invoice",
        place_of_supply_state_code: gstinRecord?.state_code || "27",
        items: cart.map((c) => ({
          product_id: c.product_id,
          item_name: c.item_name,
          hsn_sac: c.hsn_sac,
          quantity: c.quantity,
          unit: c.unit,
          unit_price: c.unit_price,
          gst_rate: c.gst_rate,
        })),
      };

      const res = await api.createInvoice(payload);
      setLastIssuedInvoice({
        number: res.invoice_number,
        total: totals.grandTotal,
        date: new Date().toLocaleDateString(),
      });
      setShowReceiptModal(true);
      setCart([]);
      setSelectedCustomer(null);
      onInvoiceCreated();
    } catch (err: unknown) {
      console.error(err);
      alert((err as Error).message || "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#172b25] tracking-tight flex items-center gap-2">
            POS Fast Counter Checkout
            <Badge variant="emerald" size="sm">Retail Mode</Badge>
          </h1>
          <p className="text-xs text-[#71817a] mt-0.5">
            Instant barcode scanning, dynamic UPI QR payments, hold/resume bills & thermal printing.
          </p>
        </div>

        {heldBills.length > 0 && (
          <div className="flex items-center gap-2 bg-[#fffbeb] px-3 py-1.5 rounded-lg border border-[#fde68a]">
            <PauseCircle className="w-4 h-4 text-[#d97706]" />
            <span className="text-xs font-bold text-[#92400e]">
              {heldBills.length} Bill{heldBills.length > 1 ? "s" : ""} on Hold
            </span>
            <div className="flex gap-1">
              {heldBills.map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleResumeBill(b.id)}
                  className="text-[11px] bg-white border border-[#fde68a] px-2 py-0.5 rounded font-semibold text-[#92400e] hover:bg-[#fef3c7]"
                >
                  Resume ({b.time})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Product Search & Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardContent className="p-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <form onSubmit={handleBarcodeSubmit} className="relative">
                  <Barcode className="w-4 h-4 absolute left-3 top-2.5 text-[#71817a]" />
                  <input
                    type="text"
                    placeholder="Scan Barcode / SKU & Press Enter"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#e2ebe5] bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
                  />
                </form>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#71817a]" />
                  <input
                    type="text"
                    placeholder="Search product catalog..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#e2ebe5] bg-white text-[#172b25] focus:outline-none focus:border-[#167a55]"
                  />
                </div>
              </div>

              {/* Products Catalog Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[460px] overflow-y-auto pr-1">
                {products
                  .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      className="text-left p-2.5 rounded-lg border border-[#e2ebe5] bg-white hover:border-[#167a55] hover:bg-[#eaf6ef]/30 transition-all group flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-[#172b25] group-hover:text-[#167a55] line-clamp-1">
                          {product.name}
                        </span>
                        <div className="flex items-center justify-between text-[10px] text-[#71817a] mt-1">
                          <span>HSN: {product.hsn_code || product.hsn_sac || "Unspecified"}</span>
                          <span className="bg-[#f5f8f6] px-1 py-0.5 rounded font-mono">
                            GST {product.gst_rate !== undefined && product.gst_rate !== null ? `${product.gst_rate}%` : "Not Set"}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 pt-1 border-t border-[#f5f8f6] flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#167a55]">
                          ₹{Number(product.selling_price || 0).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-[#71817a]">
                          Qty: {product.current_stock ?? "—"}
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Active Cart & Quick Checkout (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader
              title={`Cart Items (${totals.itemCount})`}
              action={
                cart.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleHoldBill}
                    icon={<PauseCircle className="w-3.5 h-3.5" />}
                  >
                    Hold Bill
                  </Button>
                )
              }
            />
            <CardContent className="p-3 space-y-3">
              {/* Customer Selector */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedCustomer?.id || ""}
                  onChange={(e) => {
                    const c = customers.find((cust) => cust.id === e.target.value) || null;
                    setSelectedCustomer(c);
                  }}
                  className="w-full text-xs rounded-lg border border-[#e2ebe5] px-2.5 py-1.5 bg-white text-[#172b25]"
                >
                  <option value="">Walk-in Customer (Over The Counter)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.gstin ? `(${c.gstin})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cart Table */}
              <div className="max-h-64 overflow-y-auto divide-y divide-[#e2ebe5] border border-[#e2ebe5] rounded-lg">
                {cart.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#71817a]">
                    <ShoppingCart className="w-8 h-8 text-[#b8e2cd] mx-auto mb-2 opacity-60" />
                    Cart is empty. Scan barcodes or tap products on the left.
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between text-xs hover:bg-[#f5f8f6]">
                      <div className="flex-1 pr-2">
                        <p className="font-bold text-[#172b25] truncate">{item.item_name}</p>
                        <p className="text-[10px] text-[#71817a]">
                          ₹{item.unit_price.toFixed(2)} + GST {item.gst_rate}%
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity <= 1) {
                              setCart(cart.filter((_, i) => i !== idx));
                            } else {
                              const copy = [...cart];
                              copy[idx].quantity -= 1;
                              setCart(copy);
                            }
                          }}
                          className="p-1 rounded bg-[#f5f8f6] hover:bg-[#e2ebe5] text-[#172b25]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const copy = [...cart];
                            copy[idx].quantity += 1;
                            setCart(copy);
                          }}
                          className="p-1 rounded bg-[#f5f8f6] hover:bg-[#e2ebe5] text-[#172b25]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <span className="w-16 text-right font-bold text-[#167a55]">
                          ₹{(item.quantity * item.unit_price).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Settlement Totals */}
              <div className="p-3 bg-[#f5f8f6] rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-[#71817a]">
                  <span>Taxable Subtotal:</span>
                  <span>₹{totals.taxableSubtotal}</span>
                </div>
                <div className="flex justify-between text-[#71817a]">
                  <span>Total GST:</span>
                  <span>₹{totals.totalTax}</span>
                </div>
                <div className="flex justify-between font-extrabold text-base text-[#167a55] pt-1 border-t border-[#e2ebe5]">
                  <span>Total Payable:</span>
                  <span>₹{totals.grandTotal}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode("cash")}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      paymentMode === "cash"
                        ? "bg-[#167a55] text-white border-[#167a55]"
                        : "bg-white text-[#71817a] border-[#e2ebe5]"
                    }`}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMode("upi");
                      handleGenerateUpiQr();
                    }}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      paymentMode === "upi"
                        ? "bg-[#167a55] text-white border-[#167a55]"
                        : "bg-white text-[#71817a] border-[#e2ebe5]"
                    }`}
                  >
                    UPI QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode("card")}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      paymentMode === "card"
                        ? "bg-[#167a55] text-white border-[#167a55]"
                        : "bg-white text-[#71817a] border-[#e2ebe5]"
                    }`}
                  >
                    Card
                  </button>
                </div>

                {paymentMode === "cash" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Cash Tendered (₹)"
                      value={cashTendered || ""}
                      onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs font-bold p-2 rounded-lg border border-[#e2ebe5]"
                    />
                    {cashTendered >= parseFloat(totals.grandTotal) && (
                      <span className="text-xs font-bold text-[#065f46] whitespace-nowrap">
                        Change: ₹{(cashTendered - parseFloat(totals.grandTotal)).toFixed(2)}
                      </span>
                    )}
                  </div>
                )}

                {paymentMode === "upi" && upiQrDataUrl && (
                  <div className="p-3 bg-white border border-[#e2ebe5] rounded-xl flex flex-col items-center">
                    <img src={upiQrDataUrl} alt="UPI Payment QR" className="w-32 h-32" />
                    <span className="text-[10px] text-[#71817a] mt-1 font-mono">
                      Scan via GPay / PhonePe / Paytm
                    </span>
                  </div>
                )}

                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={cart.length === 0 || loading}
                  loading={loading}
                  onClick={handleCheckout}
                  className="w-full justify-center text-sm py-3 font-bold"
                >
                  Confirm & Print Bill (₹{totals.grandTotal})
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Instant Receipt Modal */}
      {showReceiptModal && lastIssuedInvoice && (
        <Modal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          title="Payment Received & Receipt Ready"
          size="sm"
          footer={
            <div className="flex justify-between w-full">
              <Button variant="outline" size="sm" onClick={() => setShowReceiptModal(false)}>
                Close
              </Button>
              <Button variant="primary" size="sm" onClick={() => window.print()} icon={<Printer className="w-4 h-4" />}>
                Print Receipt
              </Button>
            </div>
          }
        >
          <div className="text-center py-4 space-y-2">
            <CheckCircle2 className="w-12 h-12 text-[#167a55] mx-auto" />
            <h3 className="font-bold text-sm text-[#172b25]">Invoice Issued Successfully</h3>
            <p className="text-xs text-[#71817a]">
              Invoice No: <strong>{lastIssuedInvoice.number}</strong>
            </p>
            <p className="text-base font-extrabold text-[#167a55]">
              Amount Settled: ₹{lastIssuedInvoice.total}
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};
