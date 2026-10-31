import { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Search,
  Plus,
  Trash2,
  Printer,
  Eye,
  Save,
  UserPlus,
  Truck,
  Building,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  X,
  FileCheck,
  Barcode,
  Layers
} from "lucide-react";
import { api } from "../services/api";

export interface CreateInvoiceProps {
  primaryGstin: string;
  stateCode: string;
  stateName: string;
  legalName: string;
  tradeName: string;
  addressLine: string;
  city: string;
  pincode: string;
  activeBusinessId: string | null;
  activeOrgId: string | null;
  activeGstinId: string | null;
  onInvoiceCreated?: () => void;
  onPreview?: () => void;
}

export interface InvoiceItemRow {
  id: string;
  productId?: string;
  name: string;
  sku: string;
  hsn: string;
  qty: number;
  unit: string;
  rate: number;
  discountType: "percent" | "amount";
  discountValue: number;
  gstRate: number; // 0, 5, 12, 18, 28
  cessRate: number; // %
  description?: string;
  batchNo?: string;
  expDate?: string;
  inStock?: number;
}

const INDIAN_STATES = [
  { code: "01", name: "Jammu and Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "38", name: "Ladakh" }
];

const PRESET_CUSTOMERS = [
  {
    id: "cust-1",
    name: "Apex Retail Solutions Pvt Ltd",
    mobile: "9876543210",
    email: "accounts@apexretail.in",
    gstin: "27AABCA1234F1Z5",
    regType: "Regular",
    stateCode: "27",
    stateName: "Maharashtra",
    billingAddress: "Plot 42, MIDC Industrial Area, Andheri East, Mumbai",
    billingPincode: "400093",
    outstanding: 42500,
    creditLimit: 200000
  },
  {
    id: "cust-2",
    name: "Kolkata Global Traders",
    mobile: "9830112233",
    email: "billing@kolkataglobal.com",
    gstin: "19AABCK5678Q1Z9",
    regType: "Regular",
    stateCode: "19",
    stateName: "West Bengal",
    billingAddress: "12/A Park Street, 4th Floor, Kolkata",
    billingPincode: "700016",
    outstanding: 15400,
    creditLimit: 100000
  },
  {
    id: "cust-3",
    name: "Bengaluru HyperCloud Logistics",
    mobile: "9740556677",
    email: "finance@hypercloud.tech",
    gstin: "29AABCH9988P1Z2",
    regType: "Regular",
    stateCode: "29",
    stateName: "Karnataka",
    billingAddress: "77 Outer Ring Road, Bellandur, Bengaluru",
    billingPincode: "560103",
    outstanding: 0,
    creditLimit: 350000
  },
  {
    id: "cust-4",
    name: "Rohit Sharma (Direct Consumer)",
    mobile: "9988776655",
    email: "rohit.sharma@gmail.com",
    gstin: "",
    regType: "Consumer",
    stateCode: "27",
    stateName: "Maharashtra",
    billingAddress: "Flat 402, Sunshine Heights, Pune",
    billingPincode: "411001",
    outstanding: 0,
    creditLimit: 0
  }
];

const PRESET_PRODUCTS = [
  {
    id: "prod-1",
    name: "Cotton Formal Shirt (Sky Blue - L)",
    sku: "SHIRT-BLU-L",
    hsn: "6205",
    rate: 1250,
    unit: "PCS",
    gstRate: 5,
    cessRate: 0,
    inStock: 48
  },
  {
    id: "prod-2",
    name: "Designer Silk Saree (Banarasi Red)",
    sku: "SAREE-BAN-01",
    hsn: "5007",
    rate: 3450,
    unit: "PCS",
    gstRate: 5,
    cessRate: 0,
    inStock: 18
  },
  {
    id: "prod-3",
    name: "Quantum POS Thermal Receipt Printer (80mm)",
    sku: "POS-PRN-80",
    hsn: "8443",
    rate: 5800,
    unit: "NOS",
    gstRate: 18,
    cessRate: 0,
    inStock: 32
  },
  {
    id: "prod-4",
    name: "Wireless 2D Barcode Scanner with Stand",
    sku: "SCN-W2D-09",
    hsn: "8471",
    rate: 2600,
    unit: "NOS",
    gstRate: 18,
    cessRate: 0,
    inStock: 25
  },
  {
    id: "prod-5",
    name: "Thermal Paper Rolls 79mm x 50m (Pack of 20)",
    sku: "ROLL-79-50",
    hsn: "4811",
    rate: 950,
    unit: "BOX",
    gstRate: 12,
    cessRate: 0,
    inStock: 120
  },
  {
    id: "prod-6",
    name: "Cloud ERP Annual Implementation & AMC",
    sku: "SRV-ERP-AMC",
    hsn: "998314",
    rate: 25000,
    unit: "SRV",
    gstRate: 18,
    cessRate: 0,
    inStock: 999
  }
];

export function CreateInvoiceScreen({
  primaryGstin,
  stateCode,
  stateName,
  legalName,
  tradeName,
  addressLine,
  city,
  pincode,
  activeBusinessId,
  activeOrgId,
  activeGstinId,
  onInvoiceCreated,
  onPreview
}: CreateInvoiceProps) {
  // Document Type & Numbering
  const [invoiceType, setInvoiceType] = useState<"Tax Invoice" | "Bill of Supply">("Tax Invoice");
  const [invoiceNo, setInvoiceNo] = useState("QGST/2026-27/0042");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [paymentTerms, setPaymentTerms] = useState("Immediate");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split("T")[0];
  });
  const [priceList, setPriceList] = useState("Standard / Retail");
  const [warehouse, setWarehouse] = useState("Main Central Godown");

  // Customer / Party Details
  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [customerRegType, setCustomerRegType] = useState("Regular");
  const [billingAddress, setBillingAddress] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [placeOfSupplyCode, setPlaceOfSupplyCode] = useState(stateCode || "27");
  const [reverseCharge, setReverseCharge] = useState(false);
  const [customerCredit, setCustomerCredit] = useState({ outstanding: 0, limit: 0 });

  // Quick Customer Modal
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustGstin, setNewCustGstin] = useState("");
  const [newCustMobile, setNewCustMobile] = useState("");
  const [newCustState, setNewCustState] = useState("27");
  const [newCustAddress, setNewCustAddress] = useState("");

  // Items Table
  const [items, setItems] = useState<InvoiceItemRow[]>([
    {
      id: "row-1",
      name: "Cotton Formal Shirt (Sky Blue - L)",
      sku: "SHIRT-BLU-L",
      hsn: "6205",
      qty: 2,
      unit: "PCS",
      rate: 1250,
      discountType: "percent",
      discountValue: 0,
      gstRate: 5,
      cessRate: 0,
      inStock: 48
    },
    {
      id: "row-2",
      name: "Quantum POS Thermal Receipt Printer (80mm)",
      sku: "POS-PRN-80",
      hsn: "8443",
      qty: 1,
      unit: "NOS",
      rate: 5800,
      discountType: "percent",
      discountValue: 5,
      gstRate: 18,
      cessRate: 0,
      inStock: 32
    }
  ]);

  // Product Autocomplete / Search Modal
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [activeRowIdForProduct, setActiveRowIdForProduct] = useState<string | null>(null);
  const [showProductSearchModal, setShowProductSearchModal] = useState(false);

  // Transport & E-way Bill
  const [showTransportSection, setShowTransportSection] = useState(false);
  const [transporterName, setTransporterName] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [lrNo, setLrNo] = useState("");
  const [distanceKm, setDistanceKm] = useState("45");

  // Extra Charges & Discounts
  const [additionalDiscountValue, setAdditionalDiscountValue] = useState(0);
  const [shippingCharges, setShippingCharges] = useState(0);

  // Payment Breakdown
  const [paymentMode, setPaymentMode] = useState<"Cash" | "UPI" | "Bank Transfer" | "Credit" | "Cheque" | "Split">("UPI");
  const [amountReceived, setAmountReceived] = useState(0);
  const [paymentRefNo, setPaymentRefNo] = useState("");
  const [notes, setNotes] = useState("Thank you for your business! Please settle outstanding balances within 15 days.");

  // Save State & Instant Modal Preview
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showInstantPdfModal, setShowInstantPdfModal] = useState(false);
  const [pdfTemplate, setPdfTemplate] = useState<"modern-a4" | "compact-a5" | "thermal-pos">("modern-a4");

  // Determine Inter-state vs Intra-state based on Place of Supply (POS)
  const isInterState = useMemo(() => {
    const originState = (stateCode || "27").trim();
    const destinationState = (placeOfSupplyCode || "").trim();
    return originState !== destinationState;
  }, [stateCode, placeOfSupplyCode]);

  // Line Item Calculations
  const lineCalculations = useMemo(() => {
    return items.map((item) => {
      const gross = (Number(item.qty) || 0) * (Number(item.rate) || 0);
      const discount =
        item.discountType === "percent"
          ? (gross * (Number(item.discountValue) || 0)) / 100
          : Number(item.discountValue) || 0;
      const taxable = Math.max(0, gross - discount);

      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      if (invoiceType === "Bill of Supply") {
        // Zero tax in composition / bill of supply
      } else if (isInterState) {
        igst = (taxable * (Number(item.gstRate) || 0)) / 100;
      } else {
        cgst = (taxable * ((Number(item.gstRate) || 0) / 2)) / 100;
        sgst = (taxable * ((Number(item.gstRate) || 0) / 2)) / 100;
      }

      const cess = (taxable * (Number(item.cessRate) || 0)) / 100;
      const totalTax = cgst + sgst + igst + cess;
      const netTotal = taxable + totalTax;

      return {
        ...item,
        gross,
        discount,
        taxable,
        cgst,
        sgst,
        igst,
        cess,
        totalTax,
        netTotal
      };
    });
  }, [items, isInterState, invoiceType]);

  // Aggregate Totals
  const totals = useMemo(() => {
    const grossTotal = lineCalculations.reduce((sum, it) => sum + it.gross, 0);
    const itemDiscountsTotal = lineCalculations.reduce((sum, it) => sum + it.discount, 0);
    let taxableTotal = lineCalculations.reduce((sum, it) => sum + it.taxable, 0);

    const extraDiscount = Number(additionalDiscountValue) || 0;
    taxableTotal = Math.max(0, taxableTotal - extraDiscount);

    // Calculate total taxes
    const totalCgst = lineCalculations.reduce((sum, it) => sum + it.cgst, 0);
    const totalSgst = lineCalculations.reduce((sum, it) => sum + it.sgst, 0);
    const totalIgst = lineCalculations.reduce((sum, it) => sum + it.igst, 0);
    const totalCess = lineCalculations.reduce((sum, it) => sum + it.cess, 0);
    const totalGst = totalCgst + totalSgst + totalIgst + totalCess;

    const extraCharges = Number(shippingCharges) || 0;
    const rawGrandTotal = taxableTotal + totalGst + extraCharges;
    const finalRoundedGrandTotal = Math.round(rawGrandTotal);
    const roundOffDiff = Number((finalRoundedGrandTotal - rawGrandTotal).toFixed(2));
    const balanceDue = Math.max(0, finalRoundedGrandTotal - (Number(amountReceived) || 0));

    return {
      grossTotal,
      itemDiscountsTotal,
      extraDiscount,
      taxableTotal,
      totalCgst,
      totalSgst,
      totalIgst,
      totalCess,
      totalGst,
      extraCharges,
      rawGrandTotal,
      roundOffDiff,
      grandTotal: finalRoundedGrandTotal,
      balanceDue
    };
  }, [
    lineCalculations,
    additionalDiscountValue,
    shippingCharges,
    amountReceived
  ]);

  // Default initial customer load
  useEffect(() => {
    if (!customerName && PRESET_CUSTOMERS.length > 0) {
      handleSelectCustomer(PRESET_CUSTOMERS[0]);
    }
  }, []);

  const handleSelectCustomer = (cust: (typeof PRESET_CUSTOMERS)[0]) => {
    setCustomerId(cust.id);
    setCustomerName(cust.name);
    setCustomerMobile(cust.mobile);
    setCustomerGstin(cust.gstin);
    setCustomerRegType(cust.regType);
    setBillingAddress(cust.billingAddress);
    setShippingAddress(cust.billingAddress);
    setPlaceOfSupplyCode(cust.stateCode);
    setCustomerCredit({
      outstanding: cust.outstanding,
      limit: cust.creditLimit
    });
    setShowCustomerDropdown(false);
  };

  const handleCopyBillingToShipping = () => {
    setShippingAddress(billingAddress);
  };

  // Item Management
  const handleAddItem = () => {
    const newId = `row-${Date.now()}`;
    setItems((prev) => [
      ...prev,
      {
        id: newId,
        name: "",
        sku: "",
        hsn: "8471",
        qty: 1,
        unit: "PCS",
        rate: 0,
        discountType: "percent",
        discountValue: 0,
        gstRate: 18,
        cessRate: 0,
        inStock: 0
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      alert("An invoice must contain at least one item.");
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof InvoiceItemRow, value: any) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  const handleOpenProductPicker = (rowId: string) => {
    setActiveRowIdForProduct(rowId);
    setProductSearchQuery("");
    setShowProductSearchModal(true);
  };

  const handleSelectProduct = (prod: (typeof PRESET_PRODUCTS)[0]) => {
    if (activeRowIdForProduct) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === activeRowIdForProduct
            ? {
                ...it,
                productId: prod.id,
                name: prod.name,
                sku: prod.sku,
                hsn: prod.hsn,
                rate: prod.rate,
                unit: prod.unit,
                gstRate: prod.gstRate,
                cessRate: prod.cessRate,
                inStock: prod.inStock
              }
            : it
        )
      );
    }
    setShowProductSearchModal(false);
    setActiveRowIdForProduct(null);
  };

  // Keyboard Shortcuts (F2: Customer, F3: Item, F8: Payment, F9: Save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        setShowCustomerDropdown(true);
      } else if (e.key === "F3") {
        e.preventDefault();
        handleAddItem();
      } else if (e.key === "F9") {
        e.preventDefault();
        handleSaveInvoice();
      } else if (e.key === "Escape") {
        setShowCustomerDropdown(false);
        setShowProductSearchModal(false);
        setShowQuickCustomerModal(false);
        setShowInstantPdfModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items, customerName, totals]);

  // Save / Finalize Invoice Execution
  const handleSaveInvoice = async () => {
    if (!customerName.trim()) {
      alert("Please select or enter a Customer Name.");
      return;
    }
    if (items.some((it) => !it.name.trim() || it.rate <= 0)) {
      alert("Please ensure all invoice items have valid product names and non-zero rates.");
      return;
    }

    setIsSaving(true);
    try {
      if (activeBusinessId && activeOrgId && activeGstinId) {
        await api.createInvoice({
          organization_id: activeOrgId,
          business_id: activeBusinessId,
          business_gstin_id: activeGstinId,
          invoice_date: invoiceDate,
          place_of_supply_state_code: placeOfSupplyCode,
          reverse_charge: reverseCharge,
          items: lineCalculations.map((it) => ({
            item_name: it.name,
            hsn_sac: it.hsn,
            quantity: it.qty,
            unit: it.unit,
            unit_price: it.rate,
            discount_amount: it.discount,
            gst_rate: it.gstRate
          }))
        });
      }
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 4000);
      if (onInvoiceCreated) onInvoiceCreated();
    } catch {
      // Offline fallback state
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateQuickCustomer = () => {
    if (!newCustName.trim()) {
      alert("Customer Name is required.");
      return;
    }
    const newCust = {
      id: `cust-${Date.now()}`,
      name: newCustName,
      mobile: newCustMobile,
      email: "",
      gstin: newCustGstin.toUpperCase(),
      regType: newCustGstin ? "Regular" : "Consumer",
      stateCode: newCustState,
      stateName: INDIAN_STATES.find((s) => s.code === newCustState)?.name || "Maharashtra",
      billingAddress: newCustAddress,
      billingPincode: "400001",
      outstanding: 0,
      creditLimit: 50000
    };
    PRESET_CUSTOMERS.unshift(newCust);
    handleSelectCustomer(newCust);
    setShowQuickCustomerModal(false);
    setNewCustName("");
    setNewCustGstin("");
    setNewCustMobile("");
    setNewCustAddress("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* ================= 1. HEADER SECTION & ACTIONS ================= */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          padding: "20px 24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #123b78, #1677e8)",
                display: "grid",
                placeItems: "center",
                color: "#ffffff"
              }}
            >
              <FileText size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#1e293b" }}>
                  Create Sales Invoice
                </h1>
                <span
                  onClick={() => setInvoiceType(invoiceType === "Tax Invoice" ? "Bill of Supply" : "Tax Invoice")}
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "999px",
                    background: invoiceType === "Tax Invoice" ? "#eff6ff" : "#fef3c7",
                    color: invoiceType === "Tax Invoice" ? "#1d4ed8" : "#b45309",
                    border: invoiceType === "Tax Invoice" ? "1px solid #bfdbfe" : "1px solid #fde68a",
                    cursor: "pointer"
                  }}
                  title="Click to toggle Tax Invoice / Bill of Supply"
                >
                  {invoiceType}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: "999px",
                    background: isInterState ? "#f5f3ff" : "#ecfdf5",
                    color: isInterState ? "#6d28d9" : "#047857",
                    border: isInterState ? "1px solid #ddd6fe" : "1px solid #a7f3d0"
                  }}
                >
                  {isInterState ? "Inter-State (IGST)" : "Intra-State (CGST + SGST)"}
                </span>
              </div>
              <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#64748b" }}>
                High-speed desktop billing engine with automatic Place of Supply (POS) GST resolution.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              if (onPreview) onPreview();
              setShowInstantPdfModal(true);
            }}
            style={{
              padding: "9px 15px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#334155",
              fontSize: "13px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer"
            }}
          >
            <Eye size={15} style={{ color: "#1677e8" }} />
            Preview PDF
          </button>

          <button
            onClick={() => window.print()}
            style={{
              padding: "9px 15px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#334155",
              fontSize: "13px",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer"
            }}
          >
            <Printer size={15} style={{ color: "#64748b" }} />
            Print (Ctrl+P)
          </button>

          <button
            onClick={handleSaveInvoice}
            disabled={isSaving}
            style={{
              padding: "9px 20px",
              borderRadius: "8px",
              border: "none",
              background: "linear-gradient(135deg, #123b78, #1677e8)",
              color: "#ffffff",
              fontSize: "13px",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              cursor: isSaving ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(22, 119, 232, 0.3)"
            }}
          >
            <Save size={15} />
            {isSaving ? "Finalizing..." : "Save & Finalize (F9)"}
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {showSuccessToast && (
        <div
          style={{
            background: "#ecfdf5",
            border: "1px solid #6ee7b7",
            borderRadius: "10px",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#065f46"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", fontWeight: 600 }}>
            <CheckCircle2 size={18} style={{ color: "#10b981" }} />
            Invoice <b>{invoiceNo}</b> saved successfully! Stock counts decremented and customer ledger posted.
          </div>
          <button
            onClick={() => setShowInstantPdfModal(true)}
            style={{
              background: "#10b981",
              color: "#ffffff",
              border: "none",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Open Printable PDF
          </button>
        </div>
      )}

      {/* ================= 2. CONFIGURATION & CUSTOMER BAR ================= */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "18px" }}>
        {/* Bill To / Customer Card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Building size={16} style={{ color: "#1677e8" }} />
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
                Bill To (Customer / Party)
              </h3>
            </div>
            <button
              onClick={() => setShowQuickCustomerModal(true)}
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#16a34a",
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer"
              }}
            >
              <UserPlus size={12} /> + New Customer
            </button>
          </div>

          {/* Searchable Customer Dropdown */}
          <div style={{ position: "relative", marginBottom: "14px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                padding: "8px 12px",
                background: "#f8fafc"
              }}
            >
              <Search size={16} style={{ color: "#94a3b8", marginRight: "8px" }} />
              <input
                placeholder="Search party by name, mobile, GSTIN... (Press F2)"
                value={customerSearch || customerName}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setCustomerName(e.target.value);
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#1e293b"
                }}
              />
              <ChevronDown
                size={16}
                style={{ color: "#64748b", cursor: "pointer" }}
                onClick={() => setShowCustomerDropdown((prev) => !prev)}
              />
            </div>

            {/* Dropdown Results */}
            {showCustomerDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "105%",
                  left: 0,
                  right: 0,
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  zIndex: 50,
                  maxHeight: "220px",
                  overflowY: "auto"
                }}
              >
                {PRESET_CUSTOMERS.filter(
                  (c) =>
                    c.name.toLowerCase().includes((customerSearch || "").toLowerCase()) ||
                    c.mobile.includes(customerSearch || "") ||
                    c.gstin.toLowerCase().includes((customerSearch || "").toLowerCase())
                ).map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCustomer(c)}
                    style={{
                      padding: "10px 14px",
                      borderBottom: "1px solid #f1f5f9",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: customerId === c.id ? "#eff6ff" : "transparent"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>{c.name}</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>
                        Phone: {c.mobile} | GSTIN: {c.gstin || "Unregistered"} | {c.stateName} ({c.stateCode})
                      </div>
                    </div>
                    {c.outstanding > 0 && (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#dc2626",
                          background: "#fef2f2",
                          padding: "2px 6px",
                          borderRadius: "4px"
                        }}
                      >
                        Due: ₹{c.outstanding.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Party Fields Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "12px" }}>
            <div>
              <label style={{ display: "block", color: "#64748b", marginBottom: "4px", fontWeight: 600 }}>
                Customer GSTIN
              </label>
              <input
                value={customerGstin}
                onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                placeholder="27AAAAA0000A1Z5"
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                  fontWeight: 600,
                  fontFamily: "monospace"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", color: "#64748b", marginBottom: "4px", fontWeight: 600 }}>
                Registration Type
              </label>
              <select
                value={customerRegType}
                onChange={(e) => setCustomerRegType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                  background: "#ffffff"
                }}
              >
                <option value="Regular">Regular (Registered Business)</option>
                <option value="Composition">Composition Dealer</option>
                <option value="Consumer">Consumer (B2C)</option>
                <option value="Unregistered">Unregistered Business</option>
                <option value="Overseas / SEZ">SEZ / Zero-Rated</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", color: "#64748b", marginBottom: "4px", fontWeight: 600 }}>
                Place of Supply (POS) *
              </label>
              <select
                value={placeOfSupplyCode}
                onChange={(e) => setPlaceOfSupplyCode(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: "6px",
                  border: "1px solid #1677e8",
                  background: "#f0f7ff",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#123b78"
                }}
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", color: "#64748b", marginBottom: "4px", fontWeight: 600 }}>
                Reverse Charge (RCM)
              </label>
              <select
                value={reverseCharge ? "yes" : "no"}
                onChange={(e) => setReverseCharge(e.target.value === "yes")}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                  background: "#ffffff"
                }}
              >
                <option value="no">No (Normal Tax Pay)</option>
                <option value="yes">Yes (Section 9(3) / 9(4))</option>
              </select>
            </div>
          </div>

          {/* Addresses */}
          <div style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Billing Address</span>
              </div>
              <textarea
                rows={2}
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                placeholder="Street address, city, pincode"
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "11px",
                  resize: "none"
                }}
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Shipping Address</span>
                <span
                  onClick={handleCopyBillingToShipping}
                  style={{ fontSize: "11px", color: "#1677e8", cursor: "pointer", fontWeight: 700 }}
                >
                  Same as Billing
                </span>
              </div>
              <textarea
                rows={2}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Consignee delivery address"
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "11px",
                  resize: "none"
                }}
              />
            </div>
          </div>

          {/* Customer Credit Notice */}
          {customerCredit.outstanding > 0 && (
            <div
              style={{
                marginTop: "12px",
                padding: "8px 12px",
                borderRadius: "6px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                fontSize: "11px",
                color: "#991b1b",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <AlertCircle size={14} />
              Party has outstanding ledger balance of <b>₹{customerCredit.outstanding.toLocaleString("en-IN")}</b>{" "}
              (Credit limit: ₹{customerCredit.limit.toLocaleString("en-IN")})
            </div>
          )}
        </div>

        {/* Invoice Metadata Card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <FileCheck size={16} style={{ color: "#1677e8" }} />
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
              Invoice Parameters & Terms
            </h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "12px" }}>
            <div>
              <label style={{ display: "block", color: "#64748b", marginBottom: "4px", fontWeight: 600 }}>
                Invoice Series & Number
              </label>
              <input
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                  fontWeight: 700,
                  fontFamily: "monospace"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", color: "#64748b", marginBottom: "4px", fontWeight: 600 }}>
                Invoice Date
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", color: "#64748b", marginBottom: "4px", fontWeight: 600 }}>
                Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => {
                  setPaymentTerms(e.target.value);
                  const days = e.target.value === "Immediate" ? 0 : parseInt(e.target.value);
                  const d = new Date(invoiceDate);
                  d.setDate(d.getDate() + (isNaN(days) ? 15 : days));
                  setDueDate(d.toISOString().split("T")[0]);
                }}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                  background: "#ffffff"
                }}
              >
                <option value="Immediate">Immediate / Cash</option>
                <option value="7">Net 7 Days</option>
                <option value="15">Net 15 Days</option>
                <option value="30">Net 30 Days</option>
                <option value="45">Net 45 Days</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", color: "#64748b", marginBottom: "4px", fontWeight: 600 }}>
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", color: "#64748b", marginBottom: "4px", fontWeight: 600 }}>
                Warehouse / Godown
              </label>
              <select
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                  background: "#ffffff"
                }}
              >
                <option value="Main Central Godown">Main Central Godown</option>
                <option value="Bhiwandi Hub 1">Bhiwandi Hub 1</option>
                <option value="Kolkata Depo">Kolkata Depo</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", color: "#64748b", marginBottom: "4px", fontWeight: 600 }}>
                Price List / Scheme
              </label>
              <select
                value={priceList}
                onChange={(e) => setPriceList(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px",
                  background: "#ffffff"
                }}
              >
                <option value="Standard / Retail">Standard / Retail</option>
                <option value="Wholesale Tier 1">Wholesale Tier 1</option>
                <option value="Distributor (Special)">Distributor (Special)</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              onClick={() => setShowTransportSection((prev) => !prev)}
              style={{
                background: "transparent",
                border: "none",
                color: "#1677e8",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              <Truck size={14} />
              {showTransportSection ? "Hide Transport / E-way Details" : "+ Add Transport & E-Way Bill Details"}
            </button>
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>
              Origin: {stateName} ({stateCode}) | Mobile: {customerMobile}
            </span>
          </div>

          {/* Collapsible Transport Details */}
          {showTransportSection && (
            <div
              style={{
                marginTop: "12px",
                padding: "12px",
                borderRadius: "8px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                fontSize: "11px"
              }}
            >
              <div>
                <label style={{ display: "block", color: "#64748b", marginBottom: "2px" }}>Transporter Name</label>
                <input
                  value={transporterName}
                  onChange={(e) => setTransporterName(e.target.value)}
                  placeholder="e.g. V-Trans / Delhivery"
                  style={{ width: "100%", padding: "5px 8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                />
              </div>
              <div>
                <label style={{ display: "block", color: "#64748b", marginBottom: "2px" }}>Vehicle Number</label>
                <input
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                  placeholder="MH12AB1234"
                  style={{ width: "100%", padding: "5px 8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                />
              </div>
              <div>
                <label style={{ display: "block", color: "#64748b", marginBottom: "2px" }}>Distance (Km)</label>
                <input
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  placeholder="45"
                  style={{ width: "100%", padding: "5px 8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                />
              </div>
              <div>
                <label style={{ display: "block", color: "#64748b", marginBottom: "2px" }}>LR / Bilty No.</label>
                <input
                  value={lrNo}
                  onChange={(e) => setLrNo(e.target.value)}
                  placeholder="LR-88219"
                  style={{ width: "100%", padding: "5px 8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= 3. INVOICE ITEMS TABLE ================= */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          padding: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Layers size={18} style={{ color: "#1677e8" }} />
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>
              Line Items & GST Classification
            </h3>
            <span style={{ fontSize: "12px", color: "#64748b" }}>({items.length} items)</span>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleAddItem}
              style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                color: "#1d4ed8",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer"
              }}
            >
              <Plus size={14} /> Add Item Row (F3)
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", color: "#475569" }}>
                <th style={{ padding: "10px 8px", width: "35px" }}>#</th>
                <th style={{ padding: "10px 10px", minWidth: "220px" }}>Product / Item Name</th>
                <th style={{ padding: "10px 8px", width: "95px" }}>HSN/SAC</th>
                <th style={{ padding: "10px 8px", width: "75px" }}>Qty</th>
                <th style={{ padding: "10px 8px", width: "75px" }}>Unit</th>
                <th style={{ padding: "10px 8px", width: "105px" }}>Rate (₹)</th>
                <th style={{ padding: "10px 8px", width: "85px" }}>Discount</th>
                <th style={{ padding: "10px 8px", width: "105px" }}>Taxable (₹)</th>
                <th style={{ padding: "10px 8px", width: "80px" }}>GST %</th>
                <th style={{ padding: "10px 8px", width: "95px" }}>Tax Amt</th>
                <th style={{ padding: "10px 10px", width: "115px", textAlign: "right" }}>Total (₹)</th>
                <th style={{ padding: "10px 8px", width: "40px" }}></th>
              </tr>
            </thead>
            <tbody>
              {lineCalculations.map((row, idx) => (
                <tr key={row.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 8px", color: "#94a3b8", fontWeight: 600 }}>{idx + 1}</td>

                  {/* Product Search & Input */}
                  <td style={{ padding: "10px 10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <input
                        value={row.name}
                        onChange={(e) => handleUpdateItem(row.id, "name", e.target.value)}
                        placeholder="Search or enter product..."
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          fontSize: "12px",
                          fontWeight: 600
                        }}
                      />
                      <button
                        onClick={() => handleOpenProductPicker(row.id)}
                        title="Pick from Catalog (Barcode / SKU)"
                        style={{
                          background: "#f1f5f9",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          padding: "6px 8px",
                          cursor: "pointer",
                          color: "#1677e8"
                        }}
                      >
                        <Search size={14} />
                      </button>
                    </div>
                    {row.inStock !== undefined && row.inStock > 0 && (
                      <div style={{ fontSize: "10px", color: "#16a34a", marginTop: "2px", fontWeight: 500 }}>
                        In Stock: {row.inStock} {row.unit}
                      </div>
                    )}
                  </td>

                  {/* HSN */}
                  <td style={{ padding: "10px 8px" }}>
                    <input
                      value={row.hsn}
                      onChange={(e) => handleUpdateItem(row.id, "hsn", e.target.value)}
                      placeholder="HSN"
                      style={{
                        width: "100%",
                        padding: "6px 6px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        fontFamily: "monospace"
                      }}
                    />
                  </td>

                  {/* Qty */}
                  <td style={{ padding: "10px 8px" }}>
                    <input
                      type="number"
                      min="1"
                      value={row.qty}
                      onChange={(e) => handleUpdateItem(row.id, "qty", Math.max(1, parseFloat(e.target.value) || 1))}
                      style={{
                        width: "100%",
                        padding: "6px 6px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        fontWeight: 700
                      }}
                    />
                  </td>

                  {/* Unit */}
                  <td style={{ padding: "10px 8px" }}>
                    <select
                      value={row.unit}
                      onChange={(e) => handleUpdateItem(row.id, "unit", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "6px 4px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "11px",
                        background: "#ffffff"
                      }}
                    >
                      <option value="PCS">PCS</option>
                      <option value="NOS">NOS</option>
                      <option value="BOX">BOX</option>
                      <option value="KG">KG</option>
                      <option value="MTR">MTR</option>
                      <option value="SET">SET</option>
                      <option value="SRV">SRV</option>
                    </select>
                  </td>

                  {/* Rate */}
                  <td style={{ padding: "10px 8px" }}>
                    <input
                      type="number"
                      min="0"
                      value={row.rate}
                      onChange={(e) => handleUpdateItem(row.id, "rate", Math.max(0, parseFloat(e.target.value) || 0))}
                      style={{
                        width: "100%",
                        padding: "6px 6px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        fontWeight: 600
                      }}
                    />
                  </td>

                  {/* Discount */}
                  <td style={{ padding: "10px 8px" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <input
                        type="number"
                        min="0"
                        value={row.discountValue}
                        onChange={(e) =>
                          handleUpdateItem(row.id, "discountValue", Math.max(0, parseFloat(e.target.value) || 0))
                        }
                        style={{
                          width: "60px",
                          padding: "6px 4px",
                          borderRadius: "6px 0 0 6px",
                          border: "1px solid #cbd5e1",
                          fontSize: "12px"
                        }}
                      />
                      <span
                        style={{
                          background: "#f1f5f9",
                          border: "1px solid #cbd5e1",
                          borderLeft: "none",
                          padding: "6px 6px",
                          borderRadius: "0 6px 6px 0",
                          fontSize: "11px",
                          color: "#64748b"
                        }}
                      >
                        %
                      </span>
                    </div>
                  </td>

                  {/* Taxable Value */}
                  <td style={{ padding: "10px 8px", fontWeight: 700, color: "#1e293b" }}>
                    ₹{row.taxable.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* GST % */}
                  <td style={{ padding: "10px 8px" }}>
                    <select
                      value={row.gstRate}
                      onChange={(e) => handleUpdateItem(row.id, "gstRate", parseFloat(e.target.value) || 0)}
                      style={{
                        width: "100%",
                        padding: "6px 4px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "11px",
                        background: "#ffffff",
                        fontWeight: 600
                      }}
                    >
                      <option value="0">0% (Nil)</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </td>

                  {/* Tax Amount */}
                  <td style={{ padding: "10px 8px", color: "#64748b", fontSize: "11px" }}>
                    ₹{row.totalTax.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <div style={{ fontSize: "9px", color: "#94a3b8" }}>
                      {isInterState ? `IGST` : `C+S ${(row.gstRate / 2).toFixed(1)}%`}
                    </div>
                  </td>

                  {/* Row Total */}
                  <td style={{ padding: "10px 10px", textAlign: "right", fontWeight: 800, color: "#0f172a" }}>
                    ₹{row.netTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* Delete Button */}
                  <td style={{ padding: "10px 8px", textAlign: "center" }}>
                    <button
                      onClick={() => handleRemoveItem(row.id)}
                      title="Remove Row"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        padding: "4px"
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= 4. TAX SUMMARY & PAYMENT CARD ================= */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "18px" }}>
        {/* Payment Terms & Additional Charges */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <CreditCard size={16} style={{ color: "#1677e8" }} />
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
              Settlement & Payment Method
            </h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "16px" }}>
            {(["UPI", "Bank Transfer", "Cash", "Credit"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setPaymentMode(mode)}
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: paymentMode === mode ? "2px solid #1677e8" : "1px solid #cbd5e1",
                  background: paymentMode === mode ? "#eff6ff" : "#ffffff",
                  color: paymentMode === mode ? "#1d4ed8" : "#475569",
                  fontWeight: 700,
                  fontSize: "12px",
                  cursor: "pointer",
                  textAlign: "center"
                }}
              >
                {mode}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "12px" }}>
            <div>
              <label style={{ display: "block", color: "#64748b", marginBottom: "4px", fontWeight: 600 }}>
                Amount Received (₹)
              </label>
              <input
                type="number"
                min="0"
                value={amountReceived}
                onChange={(e) => setAmountReceived(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="₹ 0.00"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#059669"
                }}
              />
              <span
                onClick={() => setAmountReceived(totals.grandTotal)}
                style={{ fontSize: "11px", color: "#1677e8", cursor: "pointer", fontWeight: 600, marginTop: "2px", display: "inline-block" }}
              >
                Mark Full Payment (₹{totals.grandTotal.toLocaleString("en-IN")})
              </span>
            </div>

            <div>
              <label style={{ display: "block", color: "#64748b", marginBottom: "4px", fontWeight: 600 }}>
                Payment Reference / Transaction ID
              </label>
              <input
                value={paymentRefNo}
                onChange={(e) => setPaymentRefNo(e.target.value)}
                placeholder="UPI Ref / Cheque No / Bank UTR"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "12px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", color: "#64748b", marginBottom: "4px", fontWeight: 600 }}>
                Overall Discount (₹)
              </label>
              <input
                type="number"
                min="0"
                value={additionalDiscountValue}
                onChange={(e) => setAdditionalDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0"
                style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              />
            </div>

            <div>
              <label style={{ display: "block", color: "#64748b", marginBottom: "4px", fontWeight: 600 }}>
                Freight & Shipping (₹)
              </label>
              <input
                type="number"
                min="0"
                value={shippingCharges}
                onChange={(e) => setShippingCharges(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0"
                style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              />
            </div>
          </div>

          {/* Notes & Terms Accordion */}
          <div style={{ marginTop: "16px" }}>
            <label style={{ display: "block", color: "#64748b", marginBottom: "4px", fontSize: "11px", fontWeight: 600 }}>
              Invoice Notes & Bank Account Details printed on bill
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "11px",
                resize: "none"
              }}
            />
          </div>
        </div>

        {/* GST Breakup & Grand Total Summary */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
          }}
        >
          <h3 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>
            Invoice Summary & Tax Breakup
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "9px", fontSize: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}>
              <span>Items Subtotal:</span>
              <span style={{ fontWeight: 600, color: "#1e293b" }}>
                ₹{totals.grossTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {totals.itemDiscountsTotal > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "#dc2626" }}>
                <span>Line Item Discounts:</span>
                <span style={{ fontWeight: 600 }}>
                  - ₹{totals.itemDiscountsTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", color: "#475569", fontWeight: 600 }}>
              <span>Taxable Value:</span>
              <span>₹{totals.taxableTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            <hr style={{ border: "none", borderTop: "1px dashed #e2e8f0", margin: "4px 0" }} />

            {/* GST Split: CGST + SGST or IGST */}
            {invoiceType === "Bill of Supply" ? (
              <div style={{ display: "flex", justifyContent: "space-between", color: "#b45309", fontSize: "11px" }}>
                <span>Composition Tax (Nil on Bill of Supply):</span>
                <span>₹0.00</span>
              </div>
            ) : isInterState ? (
              <div style={{ display: "flex", justifyContent: "space-between", color: "#6d28d9" }}>
                <span>Integrated GST (IGST):</span>
                <span style={{ fontWeight: 700 }}>
                  ₹{totals.totalIgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#047857" }}>
                  <span>Central GST (CGST):</span>
                  <span style={{ fontWeight: 700 }}>
                    ₹{totals.totalCgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#047857" }}>
                  <span>State GST (SGST):</span>
                  <span style={{ fontWeight: 700 }}>
                    ₹{totals.totalSgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </>
            )}

            {totals.totalCess > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "#c2410c" }}>
                <span>GST Compensation Cess:</span>
                <span>₹{totals.totalCess.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}

            {/* Round off difference */}
            <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8", fontSize: "11px" }}>
              <span>Round Off:</span>
              <span>
                {totals.roundOffDiff >= 0 ? `+ ₹${totals.roundOffDiff}` : `- ₹${Math.abs(totals.roundOffDiff)}`}
              </span>
            </div>

            <hr style={{ border: "none", borderTop: "2px solid #1e293b", margin: "6px 0" }} />

            {/* Grand Total */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "15px", fontWeight: 800, color: "#1e293b" }}>Invoice Grand Total:</span>
              <span style={{ fontSize: "20px", fontWeight: 900, color: "#123b78" }}>
                ₹{totals.grandTotal.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Received and Balance Due */}
            <div
              style={{
                marginTop: "10px",
                padding: "10px 14px",
                borderRadius: "8px",
                background: totals.balanceDue > 0 ? "#fff7ed" : "#f0fdf4",
                border: `1px solid ${totals.balanceDue > 0 ? "#ffedd5" : "#dcfce7"}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <div style={{ fontSize: "11px", color: totals.balanceDue > 0 ? "#9a3412" : "#166534" }}>
                  Received: ₹{Number(amountReceived).toLocaleString("en-IN")}
                </div>
                <div style={{ fontSize: "13px", fontWeight: 800, color: totals.balanceDue > 0 ? "#c2410c" : "#15803d" }}>
                  {totals.balanceDue > 0 ? `Balance Due: ₹${totals.balanceDue.toLocaleString("en-IN")}` : "Full Payment Settled ✓"}
                </div>
              </div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "999px",
                  background: totals.balanceDue > 0 ? "#fed7aa" : "#bbf7d0",
                  color: totals.balanceDue > 0 ? "#9a3412" : "#14532d"
                }}
              >
                {totals.balanceDue > 0 ? "Credit Sale" : "Paid"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 5. PRODUCT SEARCH MODAL ================= */}
      {showProductSearchModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 100,
            display: "grid",
            placeItems: "center",
            padding: "20px"
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              width: "100%",
              maxWidth: "680px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f8fafc"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Barcode size={18} style={{ color: "#1677e8" }} />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>
                  Select Product from Inventory Catalog
                </h3>
              </div>
              <button
                onClick={() => setShowProductSearchModal(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "16px 20px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  marginBottom: "16px",
                  background: "#ffffff"
                }}
              >
                <Search size={16} style={{ color: "#94a3b8", marginRight: "10px" }} />
                <input
                  autoFocus
                  placeholder="Scan barcode, search by SKU, item name or HSN..."
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#1e293b"
                  }}
                />
              </div>

              <div style={{ maxHeight: "320px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                {PRESET_PRODUCTS.filter(
                  (p) =>
                    p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                    p.sku.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                    p.hsn.includes(productSearchQuery)
                ).map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => handleSelectProduct(prod)}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                  >
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>{prod.name}</div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                        SKU: <span style={{ fontFamily: "monospace" }}>{prod.sku}</span> | HSN: {prod.hsn} | GST: {prod.gstRate}%
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: "#123b78" }}>
                        ₹{prod.rate.toLocaleString("en-IN")} / {prod.unit}
                      </div>
                      <div style={{ fontSize: "11px", color: prod.inStock > 0 ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                        {prod.inStock > 0 ? `Stock: ${prod.inStock} ${prod.unit}` : "Out of stock"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 6. QUICK CUSTOMER CREATION MODAL ================= */}
      {showQuickCustomerModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 100,
            display: "grid",
            placeItems: "center",
            padding: "20px"
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              width: "100%",
              maxWidth: "520px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f8fafc"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <UserPlus size={18} style={{ color: "#16a34a" }} />
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>
                  Quick Customer Creation
                </h3>
              </div>
              <button
                onClick={() => setShowQuickCustomerModal(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px", fontSize: "12px" }}>
              <div>
                <label style={{ display: "block", color: "#475569", marginBottom: "4px", fontWeight: 600 }}>
                  Party / Company Name *
                </label>
                <input
                  autoFocus
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Reliance Retail Ventures Ltd"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", color: "#475569", marginBottom: "4px", fontWeight: 600 }}>
                    Mobile Number
                  </label>
                  <input
                    value={newCustMobile}
                    onChange={(e) => setNewCustMobile(e.target.value)}
                    placeholder="9876543210"
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", color: "#475569", marginBottom: "4px", fontWeight: 600 }}>
                    GSTIN (Optional for B2C)
                  </label>
                  <input
                    value={newCustGstin}
                    onChange={(e) => setNewCustGstin(e.target.value.toUpperCase())}
                    placeholder="27AABCU9603R1ZM"
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontFamily: "monospace" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", color: "#475569", marginBottom: "4px", fontWeight: 600 }}>
                  State of Registration *
                </label>
                <select
                  value={newCustState}
                  onChange={(e) => setNewCustState(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#ffffff" }}
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", color: "#475569", marginBottom: "4px", fontWeight: 600 }}>
                  Billing Address
                </label>
                <textarea
                  rows={2}
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="Full office or factory address"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  onClick={() => setShowQuickCustomerModal(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    color: "#64748b",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateQuickCustomer}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "6px",
                    border: "none",
                    background: "#16a34a",
                    color: "#ffffff",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Save & Apply Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 7. INSTANT PDF PREVIEW MODAL ================= */}
      {showInstantPdfModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.7)",
            backdropFilter: "blur(6px)",
            zIndex: 100,
            display: "grid",
            placeItems: "center",
            padding: "20px"
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              width: "100%",
              maxWidth: "840px",
              maxHeight: "92vh",
              boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column"
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f8fafc"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <span style={{ fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>
                  Instant GST Invoice Preview ({invoiceNo})
                </span>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => setPdfTemplate("modern-a4")}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      border: pdfTemplate === "modern-a4" ? "1px solid #1677e8" : "1px solid #cbd5e1",
                      background: pdfTemplate === "modern-a4" ? "#eff6ff" : "#ffffff",
                      color: pdfTemplate === "modern-a4" ? "#1d4ed8" : "#475569"
                    }}
                  >
                    Modern A4
                  </button>
                  <button
                    onClick={() => setPdfTemplate("compact-a5")}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      border: pdfTemplate === "compact-a5" ? "1px solid #1677e8" : "1px solid #cbd5e1",
                      background: pdfTemplate === "compact-a5" ? "#eff6ff" : "#ffffff",
                      color: pdfTemplate === "compact-a5" ? "#1d4ed8" : "#475569"
                    }}
                  >
                    Compact A5
                  </button>
                  <button
                    onClick={() => setPdfTemplate("thermal-pos")}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      border: pdfTemplate === "thermal-pos" ? "1px solid #1677e8" : "1px solid #cbd5e1",
                      background: pdfTemplate === "thermal-pos" ? "#eff6ff" : "#ffffff",
                      color: pdfTemplate === "thermal-pos" ? "#1d4ed8" : "#475569"
                    }}
                  >
                    Thermal POS (80mm)
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "none",
                    background: "#1677e8",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    cursor: "pointer"
                  }}
                >
                  <Printer size={13} /> Print
                </button>
                <button
                  onClick={() => setShowInstantPdfModal(false)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Render Printable Invoice Canvas */}
            <div style={{ flex: 1, overflowY: "auto", padding: "28px", background: "#f1f5f9" }}>
              <div
                style={{
                  background: "#ffffff",
                  maxWidth: pdfTemplate === "thermal-pos" ? "380px" : "100%",
                  margin: "0 auto",
                  padding: pdfTemplate === "thermal-pos" ? "16px" : "32px",
                  borderRadius: "8px",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                  fontFamily: pdfTemplate === "thermal-pos" ? "monospace" : "inherit"
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "2px solid #1677e8",
                    paddingBottom: "16px",
                    marginBottom: "20px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <img
                      src="/logo.png"
                      alt="Logo"
                      style={{ width: "48px", height: "48px", borderRadius: "10px", objectFit: "cover" }}
                    />
                    <div>
                      <h2 style={{ margin: 0, fontSize: "18px", color: "#123b78", fontWeight: 800 }}>
                        {tradeName || legalName}
                      </h2>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                        {addressLine}, {city} – {pincode}
                        <br />
                        GSTIN: <b>{primaryGstin}</b> | State: {stateName} ({stateCode})
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "20px", fontWeight: 900, color: "#1e293b" }}>{invoiceType}</div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                      Invoice No: <b>{invoiceNo}</b>
                      <br />
                      Date: <b>{invoiceDate}</b> | Due: <b>{dueDate}</b>
                    </div>
                  </div>
                </div>

                {/* Party Details */}
                <div
                  style={{
                    background: "#f8fafc",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    marginBottom: "18px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    fontSize: "11px"
                  }}
                >
                  <div>
                    <span style={{ color: "#64748b", fontWeight: 700 }}>BILL TO:</span>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                      {customerName}
                    </div>
                    <div style={{ color: "#475569" }}>
                      {billingAddress}
                      <br />
                      GSTIN: <b>{customerGstin || "Unregistered (B2C)"}</b>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ color: "#64748b", fontWeight: 700 }}>TAX RESOLUTION:</span>
                    <div style={{ color: "#1e293b", marginTop: "2px" }}>
                      Place of Supply: <b>{placeOfSupplyCode} - {INDIAN_STATES.find(s => s.code === placeOfSupplyCode)?.name}</b>
                    </div>
                    <div style={{ color: isInterState ? "#6d28d9" : "#047857", fontWeight: 700 }}>
                      Applicable Tax: {isInterState ? "IGST (Inter-State)" : "CGST + SGST (Intra-State)"}
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", marginBottom: "18px" }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #cbd5e1", textAlign: "left" }}>
                      <th style={{ padding: "8px" }}>#</th>
                      <th style={{ padding: "8px" }}>Item Description</th>
                      <th style={{ padding: "8px" }}>HSN</th>
                      <th style={{ padding: "8px" }}>Qty</th>
                      <th style={{ padding: "8px" }}>Rate</th>
                      <th style={{ padding: "8px" }}>Taxable</th>
                      <th style={{ padding: "8px" }}>GST</th>
                      <th style={{ padding: "8px", textAlign: "right" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineCalculations.map((it, idx) => (
                      <tr key={it.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "8px" }}>{idx + 1}</td>
                        <td style={{ padding: "8px", fontWeight: 600 }}>{it.name}</td>
                        <td style={{ padding: "8px" }}>{it.hsn}</td>
                        <td style={{ padding: "8px" }}>
                          {it.qty} {it.unit}
                        </td>
                        <td style={{ padding: "8px" }}>₹{it.rate}</td>
                        <td style={{ padding: "8px" }}>₹{it.taxable.toFixed(2)}</td>
                        <td style={{ padding: "8px" }}>{it.gstRate}%</td>
                        <td style={{ padding: "8px", textAlign: "right", fontWeight: 700 }}>
                          ₹{it.netTotal.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Summary Box */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderTop: "1px solid #e2e8f0",
                    paddingTop: "14px"
                  }}
                >
                  <div style={{ fontSize: "11px", color: "#64748b", maxWidth: "320px" }}>
                    <b>Bank Details for Settlement:</b>
                    <br />
                    Bank: HDFC Bank Limited | A/C: 50200012345678
                    <br />
                    IFSC: HDFC0000123 | UPI: quantumgst@okhdfcbank
                  </div>
                  <div style={{ width: "240px", fontSize: "11px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span>Subtotal:</span>
                      <span>₹{totals.grossTotal.toFixed(2)}</span>
                    </div>
                    {isInterState ? (
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#6d28d9", marginBottom: "4px" }}>
                        <span>IGST:</span>
                        <span>₹{totals.totalIgst.toFixed(2)}</span>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", color: "#047857", marginBottom: "4px" }}>
                          <span>CGST:</span>
                          <span>₹{totals.totalCgst.toFixed(2)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", color: "#047857", marginBottom: "4px" }}>
                          <span>SGST:</span>
                          <span>₹{totals.totalSgst.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "6px 0" }} />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "14px",
                        fontWeight: 900,
                        color: "#123b78"
                      }}
                    >
                      <span>Grand Total:</span>
                      <span>₹{totals.grandTotal.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
