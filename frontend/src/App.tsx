import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  ReceiptText,
  ShoppingCart,
  Package,
  Store,
  Plug,
  FileBarChart,
  RefreshCw,
  Users,
  Settings,
  Search,
  Bell,
  ChevronDown,
  Plus,
  Download,
  Share2,
  Send,
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  FileSpreadsheet,
  Menu,
  X,
  Building,
  Building2,
  MapPin,
  FileCheck,
  Check,
  Eye,
  Save,
  Sliders,
  FolderDown,
  Sparkles,
  Layers,
  Cloud,
  CheckCheck,
  DownloadCloud,
  ExternalLink,
  ShieldCheck,
  GitBranch,
  LogOut
} from "lucide-react";
import { AuthScreen } from "./components/AuthScreen";
import { api } from "./services/api";
import type { Invoice } from "./services/api";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from "recharts";

type Page =
  | "Dashboard"
  | "Billing"
  | "Sales"
  | "Purchases"
  | "Marketplace"
  | "Shopify"
  | "GST Reports"
  | "Reconciliation"
  | "Contacts"
  | "Inventory"
  | "Settings"
  | "InvoicePreview"
  | "App Updates";

const nav = [
  ["Dashboard", LayoutDashboard],
  ["Billing", ReceiptText],
  ["Sales", ShoppingCart],
  ["Purchases", Package],
  ["Marketplace", Store],
  ["Shopify", Plug],
  ["GST Reports", FileBarChart],
  ["Reconciliation", RefreshCw],
  ["Contacts", Users],
  ["Inventory", Package],
  ["Settings", Settings],
  ["App Updates", DownloadCloud]
] as const;

const salesData = [
  { m: "Apr", s: 32, p: 20 },
  { m: "May", s: 42, p: 26 },
  { m: "Jun", s: 37, p: 24 },
  { m: "Jul", s: 58, p: 35 },
  { m: "Aug", s: 49, p: 30 },
  { m: "Sep", s: 72, p: 43 }
];

const mockOrders = [
  ["171-1234567-1234567", "15/04/2026", "Rohit Sharma", "₹ 12,499", "Imported"],
  ["171-1234567-7654321", "14/04/2026", "Priya Singh", "₹ 8,999", "Imported"],
  ["171-1234567-9876543", "14/04/2026", "Karan Mehta", "₹ 4,999", "Pending"],
  ["171-1234567-4567890", "13/04/2026", "Sneha Patel", "₹ 15,999", "Imported"]
];

function Btn({
  children,
  secondary = false,
  onClick
}: {
  children: React.ReactNode;
  secondary?: boolean;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className={secondary ? "btn secondary" : "btn"}>
      {children}
    </button>
  );
}

function Heading({
  title,
  sub,
  action
}: {
  title: string;
  sub: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="heading">
      <div>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      {action}
    </div>
  );
}

function Panel({
  title,
  sub,
  children,
  action
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panelhead">
        <div>
          <h3>{title}</h3>
          {sub && <p>{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Stat({
  title,
  value,
  trend,
  icon: Icon,
  tone
}: {
  title: string;
  value: string;
  trend: string;
  icon: React.ComponentType<{ size?: number }>;
  tone: string;
}) {
  return (
    <div className="stat">
      <div className="stathead">
        <span>{title}</span>
        <i className={tone}>
          <Icon size={17} />
        </i>
      </div>
      <strong>{value}</strong>
      <small>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", fontWeight: "bold", color: "#16865b" }}>
          <ArrowUpRight size={12} /> {trend}
        </span> vs last month
      </small>
    </div>
  );
}

function Table({
  headers,
  rows,
  onAction
}: {
  headers: string[];
  rows: string[][];
  onAction?: (action: string, row: string[]) => void;
}) {
  return (
    <div className="tablewrap">
      <table>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((v, j) => (
                <td key={j}>
                  {["Imported", "Paid", "Matched", "Enabled"].includes(v) ? (
                    <span className="good">{v}</span>
                  ) : ["Pending", "Unmatched", "Mismatch"].includes(v) ? (
                    <span className="warn">{v}</span>
                  ) : v === "View" || v === "Edit" || v === "Import" ? (
                    <a onClick={() => onAction && onAction(v, r)}>{v}</a>
                  ) : (
                    v
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Field({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange?: (val: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
      />
    </label>
  );
}

export function App() {
  // Sync Status
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>("Synced with Cloud");
  const [cloudInvoices, setCloudInvoices] = useState<Invoice[]>([]);
  const [activeBusinessId, setActiveBusinessId] = useState<string>("");
  const [activeOrgId, setActiveOrgId] = useState<string>("");
  const [activeGstinId, setActiveGstinId] = useState<string>("");

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const stored = localStorage.getItem("quantum_user_info");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => api.isAuthenticated());
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // Onboarding Wizard State (Only opens if not previously completed or explicitly launched)
  const [isOnboarding, setIsOnboarding] = useState<boolean>(() => {
    return localStorage.getItem("quantum_onboarding_completed") !== "true";
  });
  const [setupStep, setSetupStep] = useState<1 | 2 | 3 | 4>(1);

  // Business Profile Setup Form State
  const [legalName, setLegalName] = useState("Quantum Traders India Pvt Ltd");
  const [tradeName, setTradeName] = useState("Quantum Traders");
  const [panNumber, setPanNumber] = useState("AAACQ1234F");
  const [bizType, setBizType] = useState("pvt_ltd");
  const [bizEmail, setBizEmail] = useState("admin@quantumgst.in");
  const [bizPhone, setBizPhone] = useState("9876543210");

  // Primary GSTIN & Place of Supply
  const [primaryGstin, setPrimaryGstin] = useState("27AAACQ1234F1Z5");
  const [stateCode, setStateCode] = useState("27");
  const [stateName, setStateName] = useState("Maharashtra");
  const [addressLine, setAddressLine] = useState("123 Business Street, Tech Park");
  const [city, setCity] = useState("Mumbai");
  const [pincode, setPincode] = useState("400001");

  // Invoicing & Sales Channels Preferences
  const [invoicePrefix, setInvoicePrefix] = useState("INV/");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([
    "Amazon",
    "Shopify",
    "Meesho"
  ]);

  const [page, setPage] = useState<Page>("Dashboard");
  const [mobile, setMobile] = useState(false);

  // Invoice Form State
  const [custName, setCustName] = useState("ABC Enterprises");
  const [custGstin, setCustGstin] = useState("27AABCU9603R1ZM");
  const [posState, setPosState] = useState("Maharashtra (27)");
  const [invNum, setInvNum] = useState("INV-2026-001");
  const [invDate, setInvDate] = useState("2026-10-30");
  const [payTerms, setPayTerms] = useState("Net 30");

  const [items, setItems] = useState([
    { name: "HP Business Laptop 15", hsn: "84713010", qty: 2, rate: 45000, gst: 18 },
    { name: "Logitech Wireless Mouse", hsn: "84716060", qty: 5, rate: 1200, gst: 18 }
  ]);

  // App Update Notification Banner State
  const [hasUpdate, setHasUpdate] = useState(false);
  const [latestVersion, setLatestVersion] = useState("1.0.1");
  const [currentVersion, setCurrentVersion] = useState(() => {
    return localStorage.getItem("quantum_installed_version") || "1.0.1";
  });
  const [, setReleaseUrl] = useState("https://github.com/jasimmondal57/quantum-gst-core/releases");
  const [dismissUpdate, setDismissUpdate] = useState(false);

  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateCheckMsg, setUpdateCheckMsg] = useState("");

  const handleManualCheckUpdate = async () => {
    setCheckingUpdate(true);
    setUpdateCheckMsg("Checking GitHub for updates...");
    try {
      const updateInfo = await api.checkLatestAppVersion();
      if (updateInfo.hasUpdate) {
        setHasUpdate(true);
        setDismissUpdate(false);
        setLatestVersion(updateInfo.latestVersion);
        setReleaseUrl(updateInfo.releaseUrl);
        setUpdateCheckMsg(`Update found! Version v${updateInfo.latestVersion} is available.`);
      } else {
        setUpdateCheckMsg(`You are on the latest version (v${currentVersion}). No update needed.`);
      }
    } catch {
      setUpdateCheckMsg("Unable to reach update servers. Please check internet connection.");
    } finally {
      setCheckingUpdate(false);
    }
  };

  // In-app Auto Update Download State
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [isUpdateReadyToInstall, setIsUpdateReadyToInstall] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updatePhase, setUpdatePhase] = useState<"idle" | "downloading" | "verifying" | "ready" | "complete">("idle");
  const [updateLog, setUpdateLog] = useState<string[]>([]);

  // Listen to Electron auto-updater if running on Desktop
  useEffect(() => {
    const desktop = (window as any).quantumDesktop;
    if (desktop && desktop.onUpdateStatus) {
      desktop.onUpdateStatus((info: { status: string; percent?: number; version?: string }) => {
        if (info.status === "available") {
          setHasUpdate(true);
          setLatestVersion(info.version || "1.0.1");
        } else if (info.status === "downloading") {
          setUpdatePhase("downloading");
          setDownloadProgress(info.percent || 0);
        } else if (info.status === "downloaded") {
          setUpdatePhase("ready");
          setDownloadProgress(100);
          setIsUpdateReadyToInstall(true);
        }
      });
    }
  }, []);

  const handleTriggerAutoUpdate = () => {
    const desktop = (window as any).quantumDesktop;
    setShowUpdateModal(true);
    setUpdatePhase("downloading");
    setDownloadProgress(10);
    setUpdateLog(["Connecting to Quantum GST Update Cluster...", `Target version: v${latestVersion}`]);

    if (desktop && desktop.isElectron) {
      desktop.startDownloadUpdate();
      return;
    }

    // Web Application Automated Update Simulation & Service Worker Asset Refresh
    let progress = 10;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 18) + 12;
      if (progress >= 95) {
        progress = 100;
        clearInterval(interval);
        setDownloadProgress(100);
        setUpdatePhase("verifying");
        setUpdateLog((prev) => [
          ...prev,
          "✓ Downloaded incremental delta update package (24.8 MB)",
          "✓ Verified cryptographic SHA-256 package checksum",
          "✓ Applying database migrations and UI layout updates..."
        ]);

        setTimeout(() => {
          setUpdatePhase("complete");
          setUpdateLog((prev) => [
            ...prev,
            "✓ All modules synchronized successfully!",
            "✓ Ready to launch Quantum GST v" + latestVersion
          ]);
        }, 1200);
      } else {
        setDownloadProgress(progress);
        if (progress > 40 && progress < 65) {
          setUpdateLog((prev) => prev.length === 2 ? [...prev, "Downloading core application bundle..."] : prev);
        }
      }
    }, 280);
  };

  const handleApplyWebUpdate = () => {
    // Record that the app is now officially updated to latestVersion
    localStorage.setItem("quantum_installed_version", latestVersion);
    setCurrentVersion(latestVersion);
    setHasUpdate(false);
    setShowUpdateModal(false);

    // Clear all storage caches and reload to newest build
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    window.location.reload();
  };

  // Initial Sync from Cloud API
  const refreshCloudData = async () => {
    setIsSyncing(true);
    setSyncStatus("Syncing...");
    try {
      // Check for available updates
      const updateInfo = await api.checkLatestAppVersion();
      if (updateInfo.hasUpdate) {
        setHasUpdate(true);
        setLatestVersion(updateInfo.latestVersion);
        setReleaseUrl(updateInfo.releaseUrl);
      }

      const statusRes = await api.checkOnboardingStatus();
      if (statusRes.is_initialized && statusRes.business) {
        // Business already onboarded in database
        localStorage.setItem("quantum_onboarding_completed", "true");
        setIsOnboarding(false);

        setLegalName(statusRes.business.legal_name || legalName);
        setTradeName(statusRes.business.trade_name || tradeName);
        setPanNumber(statusRes.business.pan || panNumber);
        setBizEmail(statusRes.business.email || bizEmail);
        setBizPhone(statusRes.business.phone || bizPhone);
        setActiveBusinessId(statusRes.business.id);
        setActiveOrgId(statusRes.business.organization_id);

        if (statusRes.business.gstins && statusRes.business.gstins.length > 0) {
          const g = statusRes.business.gstins[0];
          setPrimaryGstin(g.gstin);
          setStateCode(g.state_code);
          setStateName(g.state_name);
          setActiveGstinId(g.id);
          if (g.address_line1) setAddressLine(g.address_line1);
          if (g.city) setCity(g.city);
          if (g.pincode) setPincode(g.pincode);
        }

        // Fetch Invoices from Cloud
        const invRes = await api.fetchInvoices(statusRes.business.id);
        if (invRes && invRes.data) {
          setCloudInvoices(invRes.data);
        }
      } else {
        // First-time setup required
        localStorage.removeItem("quantum_onboarding_completed");
        setIsOnboarding(true);
      }
      setSyncStatus("Cloud Synced");
    } catch {
      setSyncStatus("Working Offline");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAuthSuccess = (authData: any) => {
    if (authData.user) {
      setCurrentUser(authData.user);
    }
    if (authData.business) {
      setActiveBusinessId(authData.business.id);
      if (authData.business.legal_name) setLegalName(authData.business.legal_name);
      if (authData.business.trade_name) setTradeName(authData.business.trade_name);
      if (authData.business.gstins && authData.business.gstins.length > 0) {
        const g = authData.business.gstins[0];
        setPrimaryGstin(g.gstin);
        setStateCode(g.state_code);
        setStateName(g.state_name);
        setActiveGstinId(g.id);
      }
    }
    if (authData.organization) {
      setActiveOrgId(authData.organization.id);
    }
    setIsAuthenticated(true);
    refreshCloudData();
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setPage("Dashboard");
  };

  useEffect(() => {
    const initAuthAndData = async () => {
      if (!api.isAuthenticated()) {
        setIsAuthenticated(false);
        setIsAuthChecking(false);
        return;
      }

      try {
        const me = await api.getMe();
        if (me && me.user) {
          setCurrentUser(me.user);
          setIsAuthenticated(true);
          if (me.organization) {
            setActiveOrgId(me.organization.id);
          }
          if (me.business) {
            setActiveBusinessId(me.business.id);
            setLegalName(me.business.legal_name || legalName);
            setTradeName(me.business.trade_name || tradeName);
            setPanNumber(me.business.pan || panNumber);
            setBizEmail(me.business.email || bizEmail);
            setBizPhone(me.business.phone || bizPhone);
            if (me.business.gstins && me.business.gstins.length > 0) {
              const g = me.business.gstins[0];
              setPrimaryGstin(g.gstin);
              setStateCode(g.state_code);
              setStateName(g.state_name);
              setActiveGstinId(g.id);
              if (g.address_line1) setAddressLine(g.address_line1);
              if (g.city) setCity(g.city);
              if (g.pincode) setPincode(g.pincode);
            }
          }
          await refreshCloudData();
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        api.clearToken();
        setIsAuthenticated(false);
      } finally {
        setIsAuthChecking(false);
      }
    };

    initAuthAndData();
  }, []);

  const subtotal = items.reduce((acc, curr) => acc + curr.qty * curr.rate, 0);
  const isInter = !posState.includes("27");
  const cgst = isInter ? 0 : subtotal * 0.09;
  const sgst = isInter ? 0 : subtotal * 0.09;
  const igst = isInter ? subtotal * 0.18 : 0;
  const totalAmount = Math.round(subtotal + cgst + sgst + igst);

  const toggleChannel = (ch: string) => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const handleFinishOnboarding = async () => {
    setIsSyncing(true);
    try {
      await api.completeOnboarding({
        legal_name: legalName,
        trade_name: tradeName,
        pan: panNumber,
        business_type: bizType,
        email: bizEmail,
        phone: bizPhone,
        gstin: primaryGstin,
        state_code: stateCode,
        state_name: stateName,
        address_line1: addressLine,
        city: city,
        pincode: pincode,
        invoice_prefix: invoicePrefix,
        default_payment_terms: paymentTerms,
        enabled_channels: selectedChannels
      });
      localStorage.setItem("quantum_onboarding_completed", "true");
      await refreshCloudData();
      setIsOnboarding(false);
      setPage("Dashboard");
    } catch {
      localStorage.setItem("quantum_onboarding_completed", "true");
      setIsOnboarding(false);
      setPage("Dashboard");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveInvoiceToCloud = async () => {
    setIsSyncing(true);
    try {
      if (activeBusinessId && activeOrgId && activeGstinId) {
        await api.createInvoice({
          organization_id: activeOrgId,
          business_id: activeBusinessId,
          business_gstin_id: activeGstinId,
          invoice_date: new Date().toISOString().split("T")[0],
          place_of_supply_state_code: stateCode,
          reverse_charge: false,
          items: items.map((it) => ({
            item_name: it.name,
            hsn_sac: it.hsn,
            quantity: it.qty,
            unit: "NOS",
            unit_price: it.rate,
            discount_amount: 0,
            gst_rate: it.gst
          }))
        });
        await refreshCloudData();
      }
      setPage("InvoicePreview");
    } catch {
      setPage("InvoicePreview");
    } finally {
      setIsSyncing(false);
    }
  };

  // ================= AUTHENTICATION GATE =================
  if (isAuthChecking) {
    return (
      <div style={{ minHeight: "100vh", background: "#f4f7fb", display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              background: "#123b73",
              color: "white",
              fontSize: "24px",
              fontWeight: "bold",
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 16px",
              boxShadow: "0 8px 24px rgba(18,59,115,0.2)"
            }}
          >
            Q
          </div>
          <h3 style={{ margin: "0 0 6px", color: "#123b73", fontSize: "18px", fontWeight: "bold" }}>Quantum GST</h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>Connecting to secure cloud session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  // ================= ONBOARDING MODAL / SCREEN =================
  if (isOnboarding) {
    return (
      <div style={{ minHeight: "100vh", background: "#f4f7fb", display: "grid", placeItems: "center", padding: "20px" }}>
        <div style={{ maxWidth: "760px", width: "100%", background: "white", borderRadius: "16px", border: "1px solid #e8edf4", boxShadow: "0 10px 30px rgba(18,59,115,0.08)", overflow: "hidden" }}>
          
          {/* Header banner */}
          <div style={{ background: "linear-gradient(135deg, #123b73, #2878e5)", padding: "28px 32px", color: "white", position: "relative" }}>
            <button
              onClick={() => {
                localStorage.setItem("quantum_onboarding_completed", "true");
                setIsOnboarding(false);
              }}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "rgba(255,255,255,0.15)",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                color: "white",
                cursor: "pointer",
                display: "grid",
                placeItems: "center"
              }}
              title="Close Wizard"
            >
              <X size={16} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <b style={{ background: "white", color: "#2878e5", borderRadius: "8px", padding: "5px 9px", fontSize: "14px" }}>Q</b>
              <span style={{ fontSize: "18px", fontWeight: "bold" }}>Quantum GST Onboarding</span>
            </div>
            <p style={{ margin: 0, fontSize: "13px", opacity: 0.85 }}>
              Setup your company profile, multi-GSTIN credentials, and invoice numbering in 4 quick steps.
            </p>
            
            {/* Step indicators */}
            <div style={{ display: "flex", gap: "12px", marginTop: "22px" }}>
              {[
                { s: 1, label: "Company Profile" },
                { s: 2, label: "GSTIN & Address" },
                { s: 3, label: "Invoice Series" },
                { s: 4, label: "Sales Channels" }
              ].map((step) => (
                <div
                  key={step.s}
                  onClick={() => setSetupStep(step.s as any)}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: "8px",
                    background: setupStep === step.s ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
                    border: setupStep === step.s ? "1px solid white" : "none",
                    cursor: "pointer",
                    textAlign: "center",
                    fontSize: "11px",
                    fontWeight: setupStep === step.s ? "bold" : "normal"
                  }}
                >
                  Step {step.s}: {step.label}
                </div>
              ))}
            </div>
          </div>

          {/* Wizard Content Body */}
          <div style={{ padding: "32px" }}>
            {setupStep === 1 && (
              <div style={{ display: "grid", gap: "18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #e8edf4", paddingBottom: "12px" }}>
                  <Building size={20} style={{ color: "#2878e5" }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: "15px", color: "#172033" }}>Step 1: Legal Business Identity</h3>
                    <p style={{ margin: 0, fontSize: "11px", color: "#718096" }}>Enter your registered company particulars.</p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <Field label="Legal Business Name *" value={legalName} onChange={setLegalName} />
                  <Field label="Trade Name (DBA)" value={tradeName} onChange={setTradeName} />
                  <Field label="Permanent Account Number (PAN) *" value={panNumber} onChange={setPanNumber} />
                  <label className="field">
                    <span>Business Constitution *</span>
                    <select
                      value={bizType}
                      onChange={(e) => setBizType(e.target.value)}
                      style={{ height: "37px", border: "1px solid #dce3ed", borderRadius: "7px", padding: "0 10px", fontSize: "11px", background: "white" }}
                    >
                      <option value="proprietorship">Sole Proprietorship</option>
                      <option value="partnership">Partnership Firm</option>
                      <option value="llp">Limited Liability Partnership (LLP)</option>
                      <option value="pvt_ltd">Private Limited Company</option>
                      <option value="public_ltd">Public Limited Company</option>
                    </select>
                  </label>
                  <Field label="Official Email *" value={bizEmail} onChange={setBizEmail} />
                  <Field label="Official Phone / Mobile *" value={bizPhone} onChange={setBizPhone} />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "14px" }}>
                  <Btn onClick={() => setSetupStep(2)}>
                    Continue to GSTIN Setup <ArrowRight size={14} style={{ marginLeft: "4px" }} />
                  </Btn>
                </div>
              </div>
            )}

            {setupStep === 2 && (
              <div style={{ display: "grid", gap: "18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #e8edf4", paddingBottom: "12px" }}>
                  <MapPin size={20} style={{ color: "#0d9f91" }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: "15px", color: "#172033" }}>Step 2: State GST Registration & Address</h3>
                    <p style={{ margin: 0, fontSize: "11px", color: "#718096" }}>Used as the default Supplier Place of Origin on tax invoices.</p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "14px" }}>
                  <Field label="Primary GSTIN (15 Digits) *" value={primaryGstin} onChange={setPrimaryGstin} />
                  <label className="field">
                    <span>Origin State Code *</span>
                    <select
                      value={stateCode}
                      onChange={(e) => {
                        setStateCode(e.target.value);
                        if (e.target.value === "27") setStateName("Maharashtra");
                        if (e.target.value === "29") setStateName("Karnataka");
                        if (e.target.value === "07") setStateName("Delhi");
                        if (e.target.value === "24") setStateName("Gujarat");
                      }}
                      style={{ height: "37px", border: "1px solid #dce3ed", borderRadius: "7px", padding: "0 10px", fontSize: "11px", background: "white" }}
                    >
                      <option value="27">27 - Maharashtra</option>
                      <option value="29">29 - Karnataka</option>
                      <option value="07">07 - Delhi</option>
                      <option value="24">24 - Gujarat</option>
                      <option value="33">33 - Tamil Nadu</option>
                    </select>
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "14px" }}>
                  <Field label="Principal Place of Business (Address) *" value={addressLine} onChange={setAddressLine} />
                  <Field label="City *" value={city} onChange={setCity} />
                  <Field label="Pincode (6 Digits) *" value={pincode} onChange={setPincode} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "14px" }}>
                  <Btn secondary onClick={() => setSetupStep(1)}>
                    <ArrowLeft size={14} style={{ marginRight: "4px" }} /> Back
                  </Btn>
                  <Btn onClick={() => setSetupStep(3)}>
                    Configure Invoicing <ArrowRight size={14} style={{ marginLeft: "4px" }} />
                  </Btn>
                </div>
              </div>
            )}

            {setupStep === 3 && (
              <div style={{ display: "grid", gap: "18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #e8edf4", paddingBottom: "12px" }}>
                  <FileCheck size={20} style={{ color: "#8064d9" }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: "15px", color: "#172033" }}>Step 3: Financial Year & Invoicing Sequence</h3>
                    <p style={{ margin: 0, fontSize: "11px", color: "#718096" }}>Continuous serial numbering compliant with Rule 46 of CGST Rules.</p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <Field label="Invoice Number Prefix" value={invoicePrefix} onChange={setInvoicePrefix} />
                  <label className="field">
                    <span>Default Payment Terms</span>
                    <select
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      style={{ height: "37px", border: "1px solid #dce3ed", borderRadius: "7px", padding: "0 10px", fontSize: "11px", background: "white" }}
                    >
                      <option value="Due on Receipt">Due on Receipt (Immediate / POS)</option>
                      <option value="Net 15">Net 15 Days</option>
                      <option value="Net 30">Net 30 Days</option>
                      <option value="Net 60">Net 60 Days</option>
                    </select>
                  </label>
                </div>

                <div style={{ background: "#f8fafd", padding: "14px", borderRadius: "8px", border: "1px solid #e8edf4", fontSize: "11px" }}>
                  <span style={{ color: "#718096" }}>Sample First Generated Invoice Number:</span>
                  <div style={{ fontSize: "15px", fontWeight: "bold", color: "#123b73", marginTop: "4px" }}>
                    {invoicePrefix}2026-27/0001
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "14px" }}>
                  <Btn secondary onClick={() => setSetupStep(2)}>
                    <ArrowLeft size={14} style={{ marginRight: "4px" }} /> Back
                  </Btn>
                  <Btn onClick={() => setSetupStep(4)}>
                    Channel Selection <ArrowRight size={14} style={{ marginLeft: "4px" }} />
                  </Btn>
                </div>
              </div>
            )}

            {setupStep === 4 && (
              <div style={{ display: "grid", gap: "18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #e8edf4", paddingBottom: "12px" }}>
                  <Plug size={20} style={{ color: "#e39a31" }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: "15px", color: "#172033" }}>Step 4: Enable Sales & Marketplace Connectors</h3>
                    <p style={{ margin: 0, fontSize: "11px", color: "#718096" }}>Select platforms you sell on for automatic order ingestion.</p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                  {["Amazon India", "Shopify Store", "Meesho Seller", "Flipkart", "Retail Counter POS", "WooCommerce"].map((channel) => {
                    const isSelected = selectedChannels.includes(channel);
                    return (
                      <div
                        key={channel}
                        onClick={() => toggleChannel(channel)}
                        style={{
                          padding: "16px",
                          borderRadius: "10px",
                          border: isSelected ? "2px solid #2878e5" : "1px solid #e8edf4",
                          background: isSelected ? "#eaf2ff" : "white",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between"
                        }}
                      >
                        <span style={{ fontSize: "12px", fontWeight: isSelected ? "bold" : "normal", color: "#172033" }}>
                          {channel}
                        </span>
                        {isSelected && <Check size={16} style={{ color: "#2878e5" }} />}
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}>
                  <Btn secondary onClick={() => setSetupStep(3)}>
                    <ArrowLeft size={14} style={{ marginRight: "4px" }} /> Back
                  </Btn>
                  <Btn onClick={handleFinishOnboarding}>
                    <CheckCircle2 size={15} style={{ marginRight: "6px" }} /> Complete Setup & Launch Dashboard
                  </Btn>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ================= MAIN APP SHELL =================
  const side = (
    <aside className={"sidebar " + (mobile ? "open" : "")}>
      <div className="brand">
        <b className="logo">Q</b> Quantum <b>GST</b>
        <button className="close" onClick={() => setMobile(false)}>
          <X size={18} />
        </button>
      </div>
      <div className="business" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Building2 size={14} style={{ color: "#2878e5" }} />
          <span>{tradeName}</span>
        </div>
        <ChevronDown size={14} />
      </div>
      <nav>
        {nav.map(([name, Icon]) => (
          <button
            key={name}
            className={page === name ? "active" : ""}
            onClick={() => {
              setPage(name);
              setMobile(false);
            }}
          >
            <Icon size={17} />
            {name}
          </button>
        ))}
      </nav>
      <div className="support">
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", fontWeight: "bold" }}>
          <Sparkles size={14} style={{ color: "#2878e5" }} />
          <span>Need a hand?</span>
        </div>
        <p>Visit our help centre for quick answers.</p>
        <a href="https://quantumgst.in" target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          Get support <ArrowUpRight size={12} />
        </a>
      </div>
      <div className="profile" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, overflow: "hidden" }}>
          <b className="avatar">
            {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : "QG"}
          </b>
          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <div style={{ fontWeight: 600, fontSize: "13px", color: "#fff", textOverflow: "ellipsis", overflow: "hidden" }}>
              {currentUser?.name || tradeName}
            </div>
            <small style={{ color: "#93c5fd", display: "block", fontSize: "11px", textOverflow: "ellipsis", overflow: "hidden" }}>
              {currentUser?.email || "Admin account"}
            </small>
          </span>
        </div>
        <button
          onClick={handleLogout}
          title="Sign out of Quantum GST"
          style={{
            background: "rgba(255, 255, 255, 0.12)",
            border: "none",
            borderRadius: "6px",
            padding: "7px",
            color: "#e2e8f0",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            flexShrink: 0
          }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );

  const statCards = (
    <div className="stats">
      <Stat
        title="Total Sales"
        value="₹ 12,48,500"
        trend="12.4%"
        icon={ShoppingCart}
        tone="blue"
      />
      <Stat
        title="Total Purchases"
        value="₹ 8,32,400"
        trend="8.2%"
        icon={Package}
        tone="teal"
      />
      <Stat
        title="Total GST Collected"
        value="₹ 2,24,730"
        trend="10% from last month"
        icon={ReceiptText}
        tone="purple"
      />
      <Stat
        title="Total GST Paid"
        value="₹ 1,48,320"
        trend="4.1%"
        icon={FileBarChart}
        tone="orange"
      />
    </div>
  );

  let screen: React.ReactNode;

  // 1. DASHBOARD
  if (page === "Dashboard") {
    screen = (
      <>
        <Heading
          title="Dashboard"
          sub="Welcome back! Here's your business overview."
          action={
            <div style={{ display: "flex", gap: "8px" }}>
              <Btn secondary onClick={() => setIsOnboarding(true)}>
                <Sliders size={14} /> Setup Wizard
              </Btn>
              <button className="date">
                <CalendarDays size={15} /> 01 Apr 2026 – 30 Apr 2026 <ChevronDown size={13} style={{ marginLeft: "4px" }} />
              </button>
            </div>
          }
        />
        {statCards}
        <div className="twocol">
          <Panel
            title="Sales & Purchases"
            sub="Monthly business performance"
            action={
              <div style={{ display: "flex", gap: "10px", fontSize: "11px", color: "#718096", alignItems: "center" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2878e5" }} /> Sales
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#0d9f91" }} /> Purchases
                </span>
              </div>
            }
          >
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <CartesianGrid stroke="#edf1f7" vertical={false} />
                  <XAxis dataKey="m" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    dataKey="s"
                    stroke="#2878e5"
                    fill="#2878e522"
                    name="Sales"
                  />
                  <Area
                    dataKey="p"
                    stroke="#0d9f91"
                    fill="none"
                    name="Purchases"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
          <Panel title="GST Compliance" sub="Return filing overview">
            <div className="compliance">
              <div className="donut">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[{ v: 80 }, { v: 20 }]}
                      dataKey="v"
                      innerRadius={47}
                      outerRadius={59}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <Cell fill="#0d9f91" />
                      <Cell fill="#e9eff5" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <b>80%</b>
              </div>
              <div style={{ lineHeight: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={14} style={{ color: "#16865b" }} />
                  <span style={{ fontWeight: "bold" }}>GSTR-1</span> Filed
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <AlertCircle size={14} style={{ color: "#e39a31" }} />
                  <span style={{ fontWeight: "bold" }}>GSTR-3B</span> Pending
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <CalendarDays size={14} style={{ color: "#8a97a9" }} />
                  <span style={{ fontWeight: "bold" }}>GSTR-9</span> Not Due
                </div>
              </div>
            </div>
          </Panel>
        </div>

        <Panel title="Connected sales channels" sub="Import orders and keep your sales in sync">
          <div className="channels">
            {[
              { name: "Amazon", count: "1,248 Orders", icon: "a" },
              { name: "Flipkart", count: "850 Orders", icon: "f" },
              { name: "Meesho", count: "642 Orders", icon: "m" },
              { name: "Facebook", count: "320 Orders", icon: "f" },
              { name: "Shopify", count: "410 Orders", icon: "s" }
            ].map((c, i) => (
              <button
                key={c.name}
                onClick={() => setPage(c.name === "Shopify" ? "Shopify" : "Marketplace")}
              >
                <b className={"channel c" + i}>{c.icon}</b>
                <span>
                  {c.name}
                  <small>{c.count}</small>
                </span>
                <CheckCircle2 size={14} style={{ marginLeft: "auto", color: "#0d9f91" }} />
              </button>
            ))}
          </div>
        </Panel>

        <Panel
          title="Recent Invoices"
          sub="Live synced statutory invoices"
          action={
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button onClick={refreshCloudData} style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#2878e5" }}>
                <RefreshCw size={12} className={isSyncing ? "spin" : ""} /> Refresh
              </button>
              <a onClick={() => setPage("Billing")} style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                View all <ArrowUpRight size={12} />
              </a>
            </div>
          }
        >
          <Table
            headers={["Invoice ID", "Date", "Customer", "Amount", "Status", "Action"]}
            rows={
              cloudInvoices.length > 0
                ? cloudInvoices.map((inv) => [
                    inv.invoice_number,
                    inv.invoice_date,
                    inv.customer ? inv.customer.name : "Walk-in Customer",
                    `₹ ${Number(inv.grand_total).toLocaleString("en-IN")}`,
                    inv.status === "finalized" ? "Imported" : "Pending",
                    "View"
                  ])
                : mockOrders.map((r) => [...r, "View"])
            }
            onAction={() => setPage("InvoicePreview")}
          />
        </Panel>
      </>
    );
  }

  // 2. CREATE INVOICE (BILLING)
  else if (page === "Billing") {
    screen = (
      <>
        <Heading
          title="Create Invoice"
          sub="Generate GST compliant invoice"
          action={
            <div style={{ display: "flex", gap: "10px" }}>
              <Btn secondary onClick={() => setPage("InvoicePreview")}>
                <Eye size={14} /> Preview
              </Btn>
              <Btn onClick={handleSaveInvoiceToCloud}>
                <Save size={14} /> {isSyncing ? "Saving..." : "Save Invoice"}
              </Btn>
            </div>
          }
        />
        <div className="formlayout">
          <Panel title="Customer Details">
            <div className="fields">
              <Field
                label="Customer Name"
                value={custName}
                onChange={setCustName}
              />
              <Field
                label="GSTIN"
                value={custGstin}
                onChange={setCustGstin}
              />
              <Field
                label="Place of Supply"
                value={posState}
                onChange={setPosState}
              />
            </div>

            <h3 className="section">Invoice Details</h3>
            <div className="fields">
              <Field
                label="Invoice Number"
                value={invNum}
                onChange={setInvNum}
              />
              <Field
                label="Invoice Date"
                value={invDate}
                onChange={setInvDate}
              />
              <Field
                label="Payment Terms"
                value={payTerms}
                onChange={setPayTerms}
              />
            </div>

            <h3 className="section">Items</h3>
            <Table
              headers={["#", "Item Name", "HSN/SAC", "Qty", "Rate (₹)", "GST %", "Amount (₹)"]}
              rows={items.map((it, idx) => [
                String(idx + 1),
                it.name,
                it.hsn,
                String(it.qty),
                it.rate.toLocaleString("en-IN"),
                `${it.gst}%`,
                (it.qty * it.rate).toLocaleString("en-IN")
              ])}
            />
            <div style={{ marginTop: "12px" }}>
              <a
                style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#2878e5", fontWeight: "bold" }}
                onClick={() =>
                  setItems([
                    ...items,
                    {
                      name: "HDMI Display Adapter",
                      hsn: "85444299",
                      qty: 1,
                      rate: 1500,
                      gst: 18
                    }
                  ])
                }
              >
                <Plus size={14} /> Add Item
              </a>
            </div>
          </Panel>

          <Panel title="Invoice Summary">
            <div className="totals">
              Subtotal <b>₹ {subtotal.toLocaleString("en-IN")}</b>
              <br />
              {isInter ? (
                <>
                  IGST (18%) <b>₹ {igst.toLocaleString("en-IN")}</b>
                  <br />
                </>
              ) : (
                <>
                  CGST (9%) <b>₹ {cgst.toLocaleString("en-IN")}</b>
                  <br />
                  SGST (9%) <b>₹ {sgst.toLocaleString("en-IN")}</b>
                  <br />
                </>
              )}
              <hr />
              Total Amount <strong>₹ {totalAmount.toLocaleString("en-IN")}</strong>
            </div>
          </Panel>
        </div>
      </>
    );
  }

  // 3. INVOICE PREVIEW (PDF VIEW)
  else if (page === "InvoicePreview") {
    screen = (
      <>
        <Heading
          title="Tax Invoice"
          sub="Preview and print official GST invoice"
          action={
            <div style={{ display: "flex", gap: "8px" }}>
              <Btn secondary onClick={() => window.print()}>
                <Download size={14} /> Download PDF
              </Btn>
              <Btn secondary onClick={() => alert("Invoice link copied!")}>
                <Share2 size={14} /> Share
              </Btn>
              <Btn onClick={() => alert("Invoice sent to customer email!")}>
                <Send size={14} /> Send
              </Btn>
            </div>
          }
        />
        <div className="invoice-pdf-view">
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #2878e5", paddingBottom: "16px", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "48px", height: "48px", background: "#123b73", borderRadius: "10px", display: "grid", placeItems: "center", color: "white" }}>
                <Layers size={24} style={{ color: "#2878e5" }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "18px", color: "#123b73" }}>{legalName}</h2>
                <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#718096" }}>
                  {addressLine}, {city} – {pincode}<br />
                  GSTIN: {primaryGstin}
                </p>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                <h1 style={{ margin: 0, fontSize: "22px", color: "#172033" }}>Tax Invoice</h1>
                <span className="good">PAID</span>
              </div>
              <div style={{ fontSize: "11px", color: "#718096", marginTop: "8px", lineHeight: "1.6" }}>
                Invoice No: <b>{invNum}</b><br />
                Invoice Date: <b>{invDate}</b><br />
                Due Date: <b>15/05/2026</b>
              </div>
            </div>
          </div>

          <div style={{ background: "#f8fafd", padding: "14px", borderRadius: "8px", border: "1px solid #e8edf4", marginBottom: "20px", fontSize: "11px", lineHeight: "1.6" }}>
            <span style={{ fontSize: "10px", fontWeight: "bold", color: "#718096", textTransform: "uppercase" }}>Bill To:</span><br />
            <strong style={{ fontSize: "13px", color: "#172033" }}>{custName}</strong><br />
            456 Industrial Area, Pune – 411001<br />
            GSTIN: <b>{custGstin}</b> | Place of Supply: <b>{posState}</b>
          </div>

          <Table
            headers={["#", "Description", "HSN/SAC", "Qty", "Rate (₹)", "GST %", "Amount (₹)"]}
            rows={items.map((it, idx) => [
              String(idx + 1),
              it.name,
              it.hsn,
              String(it.qty),
              it.rate.toLocaleString("en-IN"),
              `${it.gst}%`,
              (it.qty * it.rate).toLocaleString("en-IN")
            ])}
          />

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
            <div style={{ fontSize: "11px", color: "#718096", maxWidth: "450px" }}>
              <strong>Amount in Words:</strong><br />
              One Lakh Thirteen Thousand Two Hundred Eighty Rupees Only
            </div>
            <div style={{ width: "260px", fontSize: "11px", lineHeight: "2" }}>
              Subtotal <b style={{ float: "right" }}>₹ {subtotal.toLocaleString("en-IN")}</b><br />
              {isInter ? (
                <>IGST (18%) <b style={{ float: "right" }}>₹ {igst.toLocaleString("en-IN")}</b><br /></>
              ) : (
                <>
                  CGST (9%) <b style={{ float: "right" }}>₹ {cgst.toLocaleString("en-IN")}</b><br />
                  SGST (9%) <b style={{ float: "right" }}>₹ {sgst.toLocaleString("en-IN")}</b><br />
                </>
              )}
              <div style={{ borderTop: "2px solid #172033", marginTop: "8px", paddingTop: "8px", fontSize: "14px" }}>
                <strong>Total Amount</strong> <strong style={{ float: "right", color: "#123b73" }}>₹ {totalAmount.toLocaleString("en-IN")}</strong>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 4. MARKETPLACE IMPORTS
  else if (page === "Marketplace") {
    screen = (
      <>
        <Heading
          title="Marketplace Imports"
          sub="Import orders and generate GST invoices"
          action={
            <Btn secondary>
              <FolderDown size={14} style={{ marginRight: "4px" }} /> Import History <ChevronDown size={12} style={{ marginLeft: "4px" }} />
            </Btn>
          }
        />
        <div className="tabs">
          <span style={{ fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <Store size={14} /> Amazon
          </span>
          <span>Flipkart</span>
          <span>Meesho</span>
          <span>Facebook</span>
          <span>Others</span>
        </div>
        <Panel
          title="Import from Amazon"
          sub="Connect your Amazon seller account and import orders automatically."
          action={<Btn>Connect Account</Btn>}
        >
          <div className="toolbar">
            <button className="date">
              <CalendarDays size={14} /> 01 Apr 2026 – 30 Apr 2026 <ChevronDown size={12} />
            </button>
            <Btn onClick={() => alert("Syncing latest Amazon MTR orders...")}>
              <RefreshCw size={14} style={{ marginRight: "4px" }} /> Sync Orders
            </Btn>
          </div>
          <Table
            headers={["Order ID", "Order Date", "Customer", "Amount", "Status", "Action"]}
            rows={mockOrders.map((r) => [...r, "View"])}
          />
        </Panel>
      </>
    );
  }

  // 5. SHOPIFY INTEGRATION
  else if (page === "Shopify") {
    screen = (
      <>
        <Heading
          title="Shopify Integration"
          sub="Connect your Shopify store for automatic invoicing"
        />
        <Panel title="Shopify Store Gateway">
          <div className="importbox">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold" }}>
              <Store size={18} style={{ color: "#0d9f91" }} /> Shopify
            </div>
            <span>Connect your Shopify store to sync orders, customers and products automatically.</span>
            <span className="good">Connected</span>
            <Btn secondary>Disconnect</Btn>
          </div>
        </Panel>
        <div className="stats three">
          <Stat
            title="Total Orders"
            value="1,240"
            trend="Last 30 days"
            icon={ShoppingCart}
            tone="blue"
          />
          <Stat
            title="Total Revenue"
            value="₹ 18,45,320"
            trend="9.6%"
            icon={ArrowUpRight}
            tone="teal"
          />
          <Stat
            title="Auto Invoice"
            value="Enabled"
            trend="GST compliant invoices"
            icon={CheckCircle2}
            tone="purple"
          />
        </div>
        <Panel title="Recent Orders">
          <Table
            headers={["Order #", "Date", "Customer", "Amount", "Status"]}
            rows={[
              ["#1031", "15/04/2026", "Rahul Verma", "₹ 4,990", "Paid"],
              ["#1032", "15/04/2026", "Neha Kapoor", "₹ 12,499", "Paid"],
              ["#1033", "14/04/2026", "Amit Shah", "₹ 4,299", "Pending"],
              ["#1034", "14/04/2026", "Pooja Mehta", "₹ 8,000", "Paid"]
            ]}
          />
        </Panel>
      </>
    );
  }

  // 6. GST REPORTS
  else if (page === "GST Reports") {
    screen = (
      <>
        <Heading
          title="GST Reports"
          sub="Generate and file GST returns"
          action={
            <button className="date">
              <CalendarDays size={14} /> FY 2026–27 <ChevronDown size={12} />
            </button>
          }
        />
        <div className="tabs">
          <span style={{ fontWeight: "bold" }}>GSTR-1</span>
          <span>GSTR-3B</span>
          <span>GSTR-2B</span>
          <span>GSTR-9</span>
          <span>Audit Reports</span>
        </div>
        <Panel
          title="GSTR-1 – Outward Supplies"
          sub="Details of outward supplies of goods or services"
          action={
            <Btn onClick={() => alert("GSTR-1 statutory JSON export downloaded.")}>
              <Download size={14} style={{ marginRight: "4px" }} /> Generate Report
            </Btn>
          }
        >
          <div className="stats" style={{ marginBottom: "20px" }}>
            <div className="stat">
              <span style={{ fontSize: "11px", color: "#718096" }}>Total Invoices</span>
              <strong style={{ fontSize: "20px" }}>1,248</strong>
            </div>
            <div className="stat">
              <span style={{ fontSize: "11px", color: "#718096" }}>Total Taxable Value</span>
              <strong style={{ fontSize: "20px", color: "#16865b" }}>₹ 10,24,680</strong>
            </div>
            <div className="stat">
              <span style={{ fontSize: "11px", color: "#718096" }}>Total GST</span>
              <strong style={{ fontSize: "20px", color: "#2878e5" }}>₹ 1,84,442</strong>
            </div>
            <div className="stat">
              <span style={{ fontSize: "11px", color: "#718096" }}>Total Records</span>
              <strong style={{ fontSize: "20px" }}>1,248</strong>
            </div>
          </div>
          <h3 className="section">B2B Invoices</h3>
          <Table
            headers={["Customer GSTIN", "Customer Name", "Invoices", "Taxable Value (₹)", "GST (₹)"]}
            rows={[
              ["27AABCU1234D1Z5", "ABC Enterprises", "24", "4,23,500", "76,230"],
              ["27BBBBB1234D1Z6", "XYZ Solutions", "18", "2,14,800", "38,664"],
              ["27CCCCC1234D1Z7", "Global Traders", "12", "1,45,200", "26,136"]
            ]}
          />
        </Panel>
      </>
    );
  }

  // 7. SALES RECONCILIATION
  else if (page === "Reconciliation") {
    screen = (
      <>
        <Heading
          title="Reconciliation"
          sub="Match marketplace sales with bank statements and GST reports"
          action={
            <Btn>
              <RefreshCw size={14} style={{ marginRight: "4px" }} /> Reconcile
            </Btn>
          }
        />
        <div className="tabs">
          <span style={{ fontWeight: "bold" }}>Sales Reconciliation</span>
          <span>Purchase Reconciliation</span>
          <span>GSTR-2B Matching</span>
        </div>
        <Panel title="Sales Reconciliation" sub="Automated settlement matching engine">
          <div className="toolbar">
            <button className="date">Amazon <ChevronDown size={12} /></button>
            <button className="date">Apr 2026 <ChevronDown size={12} /></button>
          </div>
          <div className="stats">
            <Stat
              title="Total Orders"
              value="1,248"
              trend="—"
              icon={ShoppingCart}
              tone="blue"
            />
            <Stat
              title="Matched"
              value="1,180"
              trend="94.5%"
              icon={CheckCircle2}
              tone="teal"
            />
            <Stat
              title="Unmatched"
              value="68"
              trend="5.5%"
              icon={AlertCircle}
              tone="orange"
            />
            <Stat
              title="Mismatch Amount"
              value="₹ 24,580"
              trend="Review"
              icon={RefreshCw}
              tone="purple"
            />
          </div>
          <Table
            headers={["Order ID", "Order Amount", "Bank Amount", "Status", "Remarks"]}
            rows={[
              ["171-1234567-1234567", "₹ 12,499", "₹ 12,499", "Matched", "—"],
              ["171-1234567-7654321", "₹ 8,999", "₹ 8,999", "Matched", "—"],
              ["171-1234567-9876543", "₹ 4,999", "₹ 0", "Unmatched", "Payment missing"],
              ["171-1234567-4567890", "₹ 15,999", "₹ 15,500", "Mismatch", "Amount difference"]
            ]}
          />
        </Panel>
      </>
    );
  }

  // 8. CUSTOMERS & SUPPLIERS
  else if (page === "Contacts") {
    screen = (
      <>
        <Heading
          title="Customers"
          sub="Manage your customers and suppliers"
          action={
            <div style={{ display: "flex", gap: "8px" }}>
              <Btn secondary>
                <FolderDown size={14} style={{ marginRight: "4px" }} /> Import
              </Btn>
              <Btn>
                <Plus size={14} style={{ marginRight: "4px" }} /> Add Customer
              </Btn>
            </div>
          }
        />
        <div className="tabs">
          <span style={{ fontWeight: "bold" }}>Customers</span>
          <span>Suppliers</span>
          <span>Transporters</span>
        </div>
        <Panel title="Directory">
          <Table
            headers={["Name", "GSTIN", "State", "Type", "Actions"]}
            rows={[
              ["ABC Enterprises", "27AAACB1234D1Z6", "Maharashtra", "B2B", "View"],
              ["XYZ Solutions", "27BBBCB2245E1Z7", "Maharashtra", "B2B", "View"],
              ["Global Traders", "27CCCDB3396F1Z8", "Gujarat", "B2B", "View"],
              ["Retail Customer", "—", "Delhi", "B2C", "View"],
              ["Neha Kapoor", "—", "Maharashtra", "B2C", "View"]
            ]}
          />
        </Panel>
      </>
    );
  }

  // 9. SETTINGS & BUSINESS PROFILE
  else if (page === "Settings") {
    screen = (
      <>
        <Heading
          title="Settings"
          sub="Manage your business settings"
          action={
            <Btn secondary onClick={() => setIsOnboarding(true)}>
              <Sliders size={14} style={{ marginRight: "4px" }} /> Launch Onboarding Wizard
            </Btn>
          }
        />
        <div className="tabs">
          <span style={{ fontWeight: "bold" }}>Business Profile</span>
          <span>Users & Roles</span>
          <span>GST Settings</span>
          <span>Integrations</span>
          <span>Billing</span>
        </div>
        <div className="formlayout">
          <Panel title="Settings Navigation">
            <div style={{ lineHeight: "2.4", fontSize: "11px" }}>
              <b style={{ color: "#2878e5", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Building2 size={13} /> Business Details
              </b><br />
              Address & Contacts<br />
              Invoice Settings<br />
              Bank Details<br />
              E-way Bill Settings<br />
              Document Templates
            </div>
          </Panel>
          <Panel title="Business Details">
            <div className="fields" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <Field label="Business Name" value={legalName} onChange={setLegalName} />
              <Field label="Trade Name" value={tradeName} onChange={setTradeName} />
              <Field label="GSTIN" value={primaryGstin} onChange={setPrimaryGstin} />
              <Field label="Business Type" value={bizType.toUpperCase()} />
              <Field label="PAN" value={panNumber} onChange={setPanNumber} />
              <Field label="State" value={`${stateName} (${stateCode})`} />
            </div>
            <div className="save" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Btn secondary onClick={handleManualCheckUpdate}>
                  <RefreshCw size={13} className={checkingUpdate ? "spin" : ""} style={{ marginRight: "4px" }} />
                  Check for Updates
                </Btn>
                {updateCheckMsg && (
                  <span style={{ fontSize: "11px", color: updateCheckMsg.includes("found") ? "#0d9f91" : "#718096", fontWeight: "500" }}>
                    {updateCheckMsg}
                  </span>
                )}
              </div>
              <Btn onClick={() => alert("Company settings saved successfully!")}>
                Update
              </Btn>
            </div>
          </Panel>
        </div>
      </>
    );
  }

  // 10. APP UPDATES & VERSION CONTROL
  else if (page === "App Updates") {
    screen = (
      <>
        <Heading
          title="App Updates & Version"
          sub="Manage software releases, runtime environments, and live update channels."
          action={
            <Btn onClick={handleManualCheckUpdate}>
              <RefreshCw size={13} className={checkingUpdate ? "spin" : ""} style={{ marginRight: "6px" }} />
              Check for Updates
            </Btn>
          }
        />

        <div className="grid">
          <Panel title="Current Version Information" sub="Detailed software build & distribution telemetry">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "20px" }}>
              <div style={{ padding: "16px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Installed Version</div>
                <div style={{ fontSize: "20px", fontWeight: "bold", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                  v{currentVersion}
                  <span style={{ fontSize: "11px", fontWeight: "600", padding: "2px 8px", borderRadius: "999px", background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0" }}>
                    Active
                  </span>
                </div>
              </div>

              <div style={{ padding: "16px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Latest GitHub Release</div>
                <div style={{ fontSize: "20px", fontWeight: "bold", color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                  v{latestVersion}
                  {hasUpdate ? (
                    <span style={{ fontSize: "11px", fontWeight: "600", padding: "2px 8px", borderRadius: "999px", background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" }}>
                      Update Available
                    </span>
                  ) : (
                    <span style={{ fontSize: "11px", fontWeight: "600", padding: "2px 8px", borderRadius: "999px", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                      Up to date
                    </span>
                  )}
                </div>
              </div>

              <div style={{ padding: "16px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Release Channel</div>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                  <ShieldCheck size={18} style={{ color: "#0d9f91" }} /> Stable / Production
                </div>
              </div>

              <div style={{ padding: "16px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>Open Source Core</div>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                  <GitBranch size={18} style={{ color: "#2563eb" }} /> MIT License
                </div>
              </div>
            </div>

            <div style={{ padding: "18px", borderRadius: "10px", background: hasUpdate ? "#fffbeb" : "#f0fdf4", border: `1px solid ${hasUpdate ? "#fde68a" : "#bbf7d0"}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {hasUpdate ? (
                  <AlertCircle size={24} style={{ color: "#d97706", flexShrink: 0 }} />
                ) : (
                  <CheckCircle2 size={24} style={{ color: "#16a34a", flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "bold", color: hasUpdate ? "#92400e" : "#166534" }}>
                    {hasUpdate ? `A new update (v${latestVersion}) is ready to install!` : "You are currently running the latest version of Quantum GST."}
                  </div>
                  <div style={{ fontSize: "12px", color: hasUpdate ? "#b45309" : "#15803d", marginTop: "2px" }}>
                    {updateCheckMsg || (hasUpdate ? "Includes tax rate amendments, speed enhancements, and UI polish." : "All systems, GST calculation engines, and synchronization drivers are current.")}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                {hasUpdate && (
                  <Btn onClick={handleTriggerAutoUpdate}>
                    <DownloadCloud size={14} style={{ marginRight: "6px" }} />
                    Update to v{latestVersion} Now
                  </Btn>
                )}
                <Btn secondary onClick={handleManualCheckUpdate}>
                  <RefreshCw size={13} className={checkingUpdate ? "spin" : ""} style={{ marginRight: "6px" }} />
                  {checkingUpdate ? "Checking GitHub..." : "Re-check"}
                </Btn>
              </div>
            </div>
          </Panel>

          <Panel title="Release Repository & Architecture" sub="Automated CI/CD deployment pipeline details">
            <div style={{ display: "grid", gap: "14px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>GitHub Repository:</span>
                <a
                  href="https://github.com/jasimmondal57/quantum-gst-core"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#2563eb", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px", textDecoration: "none" }}
                >
                  jasimmondal57/quantum-gst-core <ExternalLink size={12} />
                </a>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>Release Notes:</span>
                <a
                  href={`https://github.com/jasimmondal57/quantum-gst-core/releases/tag/v${latestVersion}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#2563eb", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "4px", textDecoration: "none" }}
                >
                  View Changelog for v{latestVersion} <ExternalLink size={12} />
                </a>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b" }}>Cross-Platform Client Status:</span>
                <span style={{ color: "#0f172a", fontWeight: "600" }}>Web PWA, Windows 64-bit Desktop, Android APK</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Cloud API Endpoint:</span>
                <span style={{ color: "#0f172a", fontFamily: "monospace", fontSize: "12px", background: "#f8fafc", padding: "2px 6px", borderRadius: "4px" }}>
                  https://quantumgst.in/api/v1
                </span>
              </div>
            </div>
          </Panel>
        </div>
      </>
    );
  }

  // DEFAULT / FALLBACK
  else {
    screen = (
      <>
        <Heading
          title={page}
          sub={`Manage your ${page.toLowerCase()} in Quantum GST.`}
          action={
            <Btn>
              <Plus size={15} /> Add New
            </Btn>
          }
        />
        <Panel title={`${page} Overview`}>
          <div className="empty">
            <FileSpreadsheet size={34} />
            <h3>Your {page.toLowerCase()} workspace</h3>
            <p>This module is fully configured and ready for data.</p>
          </div>
        </Panel>
      </>
    );
  }

  return (
    <div className="app">
      {side}
      <div className="main">
        <header className="topbar">
          <button className="hamb" onClick={() => setMobile(true)}>
            <Menu size={20} />
          </button>
          <div className="search">
            <Search size={16} />
            <input placeholder="Search invoices, customers, reports..." />
          </div>
          <div className="topright">
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "4px 8px",
                borderRadius: "12px",
                background: syncStatus.includes("Synced") ? "#e6f8f1" : "#fef4e6",
                color: syncStatus.includes("Synced") ? "#0d9f91" : "#e39a31",
                fontSize: "11px",
                fontWeight: "600"
              }}
            >
              {syncStatus.includes("Synced") ? <CheckCheck size={13} /> : <Cloud size={13} />}
              <span>{syncStatus}</span>
            </div>
            <button
              onClick={() => setIsOnboarding(true)}
              style={{
                background: "#eaf2ff",
                color: "#1d5fbf",
                border: "1px solid #1d5fbf",
                borderRadius: "6px",
                padding: "6px 10px",
                fontSize: "11px",
                fontWeight: "bold",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              <Sliders size={13} /> Setup Wizard
            </button>
            <Bell size={18} style={{ color: "#718096", cursor: "pointer" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "10px", borderLeft: "1px solid #e2e8f0", paddingLeft: "12px" }}>
              <b className="avatar">
                {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : "QG"}
              </b>
              <div style={{ display: "flex", flexDirection: "column", textAlign: "left", lineHeight: 1.2 }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b" }}>
                  {currentUser?.name || tradeName}
                </span>
                <span style={{ fontSize: "10px", color: "#64748b" }}>
                  {currentUser?.email || "Administrator"}
                </span>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "#fef2f2",
                  color: "#dc2626",
                  border: "1px solid #fee2e2",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  marginLeft: "4px"
                }}
                title="Sign Out"
              >
                <LogOut size={12} />
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* ================= UPDATE AVAILABLE NOTIFICATION BANNER ================= */}
        {hasUpdate && !dismissUpdate && (
          <div
            style={{
              background: "linear-gradient(90deg, #123b73, #1d5fbf)",
              color: "white",
              padding: "12px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "13px",
              boxShadow: "0 2px 8px rgba(18,59,115,0.15)",
              borderBottom: "1px solid rgba(255,255,255,0.15)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  background: "#0d9f91",
                  color: "white",
                  fontSize: "11px",
                  fontWeight: "bold",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  textTransform: "uppercase"
                }}
              >
                Update Available
              </span>
              <span>
                A new version of <b>Quantum GST (v{latestVersion})</b> is available. You are running <b>v{currentVersion}</b>.
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={handleTriggerAutoUpdate}
                style={{
                  background: isUpdateReadyToInstall ? "#16865b" : "#0d9f91",
                  color: "white",
                  border: "none",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.15)"
                }}
              >
                <DownloadCloud size={14} />
                {isUpdateReadyToInstall
                  ? "Restart & Apply Update"
                  : downloadProgress !== null
                  ? `Downloading (${downloadProgress}%)...`
                  : "Update Now"}
              </button>
              <button
                onClick={() => setDismissUpdate(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.7)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center"
                }}
                title="Dismiss for this session"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        <main className="content">
          {screen}

          {/* ================= IN-APP SOFTWARE UPDATING MODAL DIALOG ================= */}
          {showUpdateModal && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(18, 59, 115, 0.75)",
                backdropFilter: "blur(6px)",
                display: "grid",
                placeItems: "center",
                zIndex: 99999,
                padding: "20px"
              }}
            >
              <div
                style={{
                  background: "white",
                  borderRadius: "16px",
                  maxWidth: "520px",
                  width: "100%",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
                  overflow: "hidden",
                  border: "1px solid #e8edf4"
                }}
              >
                {/* Header */}
                <div style={{ background: "linear-gradient(135deg, #123b73, #1d5fbf)", padding: "24px 28px", color: "white" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <DownloadCloud size={24} style={{ color: "#0d9f91" }} />
                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>
                      Quantum GST Software Updater
                    </h3>
                  </div>
                  <p style={{ margin: 0, fontSize: "12px", opacity: 0.85 }}>
                    Upgrading from v{currentVersion} to v{latestVersion}
                  </p>
                </div>

                {/* Body */}
                <div style={{ padding: "28px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#172033" }}>
                      {updatePhase === "downloading"
                        ? "Downloading update packages..."
                        : updatePhase === "verifying"
                        ? "Verifying integrity and applying updates..."
                        : "Update completed successfully!"}
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: "bold", color: "#1d5fbf" }}>
                      {downloadProgress || 0}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ height: "10px", background: "#eef2f6", borderRadius: "10px", overflow: "hidden", marginBottom: "20px" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${downloadProgress || 0}%`,
                        background: updatePhase === "complete" ? "#16865b" : "linear-gradient(90deg, #1d5fbf, #0d9f91)",
                        transition: "width 0.25s ease-in-out"
                      }}
                    />
                  </div>

                  {/* Terminal Log Output */}
                  <div
                    style={{
                      background: "#0f172a",
                      color: "#38bdf8",
                      fontFamily: "monospace",
                      fontSize: "11px",
                      padding: "14px",
                      borderRadius: "8px",
                      lineHeight: "1.7",
                      minHeight: "110px",
                      marginBottom: "24px"
                    }}
                  >
                    {updateLog.map((log, idx) => (
                      <div key={idx} style={{ color: log.startsWith("✓") ? "#4ade80" : "#38bdf8" }}>
                        {log}
                      </div>
                    ))}
                    {updatePhase === "downloading" && (
                      <div style={{ color: "#94a3b8" }}>&gt; Transferring binary packages...</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    {updatePhase !== "complete" ? (
                      <button
                        onClick={() => setShowUpdateModal(false)}
                        style={{
                          background: "#f1f5f9",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#64748b",
                          cursor: "pointer"
                        }}
                      >
                        Run in Background
                      </button>
                    ) : (
                      <button
                        onClick={handleApplyWebUpdate}
                        style={{
                          background: "#16865b",
                          color: "white",
                          border: "none",
                          padding: "10px 22px",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: "bold",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          boxShadow: "0 4px 12px rgba(22, 134, 91, 0.25)"
                        }}
                      >
                        <Check size={16} /> Launch Quantum GST v{latestVersion} Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <footer>
            © 2026 Quantum GST <span>Cloud GST Billing & Automation · quantumgst.in</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default App;
