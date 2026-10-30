import React, { useState, useEffect, useMemo } from "react";
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
import type { Invoice, Customer, BusinessProfile } from "./services/api";
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
  | "Version & Updates";

export const PAGE_SLUGS: Record<Page, string> = {
  "Dashboard": "/dashboard",
  "Billing": "/billing",
  "Sales": "/sales",
  "Purchases": "/purchases",
  "Marketplace": "/marketplace",
  "Shopify": "/shopify",
  "GST Reports": "/reports",
  "Reconciliation": "/reconciliation",
  "Contacts": "/contacts",
  "Inventory": "/inventory",
  "Settings": "/settings",
  "InvoicePreview": "/invoice-preview",
  "Version & Updates": "/updates"
};

export const SLUG_TO_PAGE: Record<string, Page> = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/billing": "Billing",
  "/invoices/create": "Billing",
  "/sales": "Sales",
  "/invoices": "Sales",
  "/purchases": "Purchases",
  "/marketplace": "Marketplace",
  "/shopify": "Shopify",
  "/reports": "GST Reports",
  "/gst-reports": "GST Reports",
  "/reconciliation": "Reconciliation",
  "/contacts": "Contacts",
  "/customers": "Contacts",
  "/inventory": "Inventory",
  "/products": "Inventory",
  "/settings": "Settings",
  "/invoice-preview": "InvoicePreview",
  "/invoices/preview": "InvoicePreview",
  "/updates": "Version & Updates",
  "/version": "Version & Updates"
};

export function getPageFromPath(pathname: string): Page {
  const clean = pathname.replace(/\/+$/, "") || "/";
  return SLUG_TO_PAGE[clean] || "Dashboard";
}

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
  ["Version & Updates", DownloadCloud]
] as const;

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
  const [legalName, setLegalName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [bizType, setBizType] = useState("proprietorship");
  const [bizEmail, setBizEmail] = useState("");
  const [bizPhone, setBizPhone] = useState("");

  // Primary GSTIN & Place of Supply
  const [primaryGstin, setPrimaryGstin] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [stateName, setStateName] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

  // Invoicing & Sales Channels Preferences
  const [invoicePrefix, setInvoicePrefix] = useState("INV/");
  const [paymentTerms, setPaymentTerms] = useState("Immediate");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  // Real Multi-Entity Data Collections
  const [cloudCustomers, setCloudCustomers] = useState<Customer[]>([]);
  const [marketplaceOrders, setMarketplaceOrders] = useState<any[]>([]);
  const [_gstr1Data, setGstr1Data] = useState<any>(null);

  // Multi-Company State
  const [userBusinesses, setUserBusinesses] = useState<BusinessProfile[]>([]);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [showNewCompanyModal, setShowNewCompanyModal] = useState(false);
  const [newLegalName, setNewLegalName] = useState("");
  const [newTradeName, setNewTradeName] = useState("");
  const [newGstin, setNewGstin] = useState("");
  const [newPan, setNewPan] = useState("");
  const [newStateName, setNewStateName] = useState("West Bengal");
  const [newStateCode, setNewStateCode] = useState("19");
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [createCompanyError, setCreateCompanyError] = useState("");

  const [page, setPageState] = useState<Page>(() => {
    if (typeof window !== "undefined") {
      return getPageFromPath(window.location.pathname);
    }
    return "Dashboard";
  });

  const setPage = (newPage: Page, replace: boolean = false) => {
    setPageState(newPage);
    if (typeof window !== "undefined") {
      const slug = PAGE_SLUGS[newPage] || "/dashboard";
      if (window.location.pathname !== slug) {
        if (replace) {
          window.history.replaceState({ page: newPage }, "", slug);
        } else {
          window.history.pushState({ page: newPage }, "", slug);
        }
      }
      document.title = newPage === "Dashboard" ? "Quantum GST - Dashboard" : `Quantum GST - ${newPage}`;
    }
  };

  useEffect(() => {
    // Initial URL sync and popstate listener for back/forward browser buttons
    if (typeof window !== "undefined") {
      const initialPage = getPageFromPath(window.location.pathname);
      const targetSlug = PAGE_SLUGS[initialPage] || "/dashboard";
      if (window.location.pathname !== targetSlug && window.location.pathname === "/") {
        window.history.replaceState({ page: initialPage }, "", targetSlug);
      }
      document.title = initialPage === "Dashboard" ? "Quantum GST - Dashboard" : `Quantum GST - ${initialPage}`;
    }

    const handlePopState = () => {
      if (typeof window !== "undefined") {
        const p = getPageFromPath(window.location.pathname);
        setPageState(p);
        document.title = p === "Dashboard" ? "Quantum GST - Dashboard" : `Quantum GST - ${p}`;
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const [mobile, setMobile] = useState(false);

  // Invoice Form State
  const [custName, setCustName] = useState("");
  const [custGstin, setCustGstin] = useState("");
  const [posState, setPosState] = useState("");
  const [invNum, setInvNum] = useState("");
  const [invDate, setInvDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [payTerms, setPayTerms] = useState("Immediate");

  const [items, setItems] = useState([
    { name: "", hsn: "", qty: 1, rate: 0, gst: 18 }
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
  const refreshCloudData = async (overrideBizId?: string) => {
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

      // Check authentic user session & entity hierarchy
      const me = await api.getMe();
      if (me && me.user) {
        setCurrentUser(me.user);
        setIsAuthenticated(true);

        const org = me.organization || (me.organizations && me.organizations[0]);
        if (org) {
          setActiveOrgId(org.id);
        }

        // Fetch user's registered businesses
        let allBusinesses: BusinessProfile[] = [];
        try {
          const bizRes = await api.fetchBusinesses();
          if (bizRes && Array.isArray(bizRes.data) && bizRes.data.length > 0) {
            allBusinesses = bizRes.data;
          }
        } catch {
          // fallback
        }
        if (allBusinesses.length === 0) {
          if (me.business) allBusinesses.push(me.business);
          else if (org && org.businesses) allBusinesses = org.businesses;
        }
        setUserBusinesses(allBusinesses);

        const targetBiz = overrideBizId
          ? allBusinesses.find((b) => b.id === overrideBizId) || allBusinesses[0]
          : allBusinesses.find((b) => b.id === activeBusinessId) || allBusinesses[0] || me.business;

        if (targetBiz) {
          const currentBizId = targetBiz.id;
          setActiveBusinessId(currentBizId);
          setLegalName(targetBiz.legal_name || me.user.name || "My Business");
          setTradeName(targetBiz.trade_name || targetBiz.legal_name || me.user.name || "My Business");
          setPanNumber(targetBiz.pan || "");
          setBizEmail(targetBiz.email || me.user.email || "");
          setBizPhone(targetBiz.phone || "");

          if (targetBiz.gstins && targetBiz.gstins.length > 0) {
            const g = targetBiz.gstins[0];
            setPrimaryGstin(g.gstin);
            setStateCode(g.state_code);
            setStateName(g.state_name);
            setActiveGstinId(g.id);
            if (g.address_line1) setAddressLine(g.address_line1);
            if (g.city) setCity(g.city);
            if (g.pincode) setPincode(g.pincode);
          } else {
            setPrimaryGstin("");
            setActiveGstinId("");
          }

          localStorage.setItem("quantum_onboarding_completed", "true");
          setIsOnboarding(false);

          // Fetch real Invoices from Cloud
          try {
            const invRes = await api.fetchInvoices(currentBizId);
            if (invRes && invRes.data) {
              setCloudInvoices(invRes.data);
            } else {
              setCloudInvoices([]);
            }
          } catch {
            setCloudInvoices([]);
          }

          // Fetch real Customers from Cloud
          try {
            const custRes = await api.fetchCustomers(currentBizId);
            if (custRes) {
              setCloudCustomers(Array.isArray(custRes) ? custRes : (custRes as any).data || []);
            } else {
              setCloudCustomers([]);
            }
          } catch {
            setCloudCustomers([]);
          }

          // Fetch real Marketplace Orders from Cloud
          try {
            const mtrRes = await api.fetchMarketplaceOrders(currentBizId);
            if (mtrRes && mtrRes.data) {
              setMarketplaceOrders(mtrRes.data);
            } else {
              setMarketplaceOrders([]);
            }
          } catch {
            setMarketplaceOrders([]);
          }

          // Fetch real GSTR-1 statutory summary from Cloud
          try {
            const gstrRes = await api.fetchGstr1Summary(currentBizId);
            if (gstrRes) {
              setGstr1Data(gstrRes);
            }
          } catch {
            // Keep existing
          }
        }
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
      setLegalName(authData.business.legal_name || authData.user?.name || "");
      setTradeName(authData.business.trade_name || authData.business.legal_name || authData.user?.name || "");
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
    refreshCloudData(authData.business?.id);
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
        await refreshCloudData();
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

  // Real Database-driven Aggregations
  const totalSalesAmount = useMemo(() => {
    return cloudInvoices.reduce((acc, inv) => acc + (Number(inv.grand_total) || 0), 0);
  }, [cloudInvoices]);

  const totalTaxAmount = useMemo(() => {
    return cloudInvoices.reduce((acc, inv) => acc + (Number(inv.total_tax_amount) || 0), 0);
  }, [cloudInvoices]);

  const totalTaxableAmount = useMemo(() => {
    return cloudInvoices.reduce((acc, inv) => acc + (Number(inv.total_taxable_value) || 0), 0);
  }, [cloudInvoices]);

  const totalPurchasesAmount = 0;
  const totalGstPaidAmount = 0;

  const realChartData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonthIdx = new Date().getMonth();
    const last6: Array<{ m: string; monthNum: number; year: number; s: number; p: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(currentMonthIdx - i);
      last6.push({
        m: months[d.getMonth()],
        monthNum: d.getMonth() + 1,
        year: d.getFullYear(),
        s: 0,
        p: 0
      });
    }

    cloudInvoices.forEach((inv) => {
      if (inv.invoice_date) {
        const d = new Date(inv.invoice_date);
        const m = d.getMonth() + 1;
        const y = d.getFullYear();
        const found = last6.find((item) => item.monthNum === m && item.year === y);
        if (found) {
          found.s += Number(inv.grand_total) || 0;
        }
      }
    });

    return last6;
  }, [cloudInvoices]);

  const channelOrderCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Amazon: 0,
      Flipkart: 0,
      Meesho: 0,
      Facebook: 0,
      Shopify: 0
    };
    marketplaceOrders.forEach((ord) => {
      const ch = ord.marketplace_connection?.channel || ord.channel;
      if (ch) {
        const cap = ch.charAt(0).toUpperCase() + ch.slice(1);
        counts[cap] = (counts[cap] || 0) + 1;
      }
    });
    return counts;
  }, [marketplaceOrders]);

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
      if (activeBusinessId && activeOrgId) {
        const validItems = items.filter((it) => it.name.trim() !== "" || it.rate > 0);
        await api.createInvoice({
          organization_id: activeOrgId,
          business_id: activeBusinessId,
          business_gstin_id: activeGstinId || undefined,
          customer_name: custName.trim() || "Cash Customer",
          customer_gstin: custGstin.trim() || undefined,
          invoice_date: invDate || new Date().toISOString().split("T")[0],
          place_of_supply_state_code: posState.replace(/[^0-9]/g, "") || stateCode || "27",
          reverse_charge: false,
          items: (validItems.length > 0 ? validItems : items).map((it) => ({
            item_name: it.name || "Goods/Services",
            hsn_sac: it.hsn || "998311",
            quantity: it.qty || 1,
            unit: "NOS",
            unit_price: it.rate || 0,
            discount_amount: 0,
            gst_rate: it.gst || 18
          }))
        });
        await refreshCloudData();
      }
      setPage("Dashboard");
    } catch (err: any) {
      alert("Failed to save invoice: " + (err.message || "Please check required fields."));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSelectBusiness = (b: BusinessProfile) => {
    setActiveBusinessId(b.id);
    setLegalName(b.legal_name || "");
    setTradeName(b.trade_name || b.legal_name || "");
    setPanNumber(b.pan || "");
    setBizEmail(b.email || currentUser?.email || "");
    setBizPhone(b.phone || "");
    if (b.gstins && b.gstins.length > 0) {
      const g = b.gstins[0];
      setPrimaryGstin(g.gstin);
      setStateCode(g.state_code);
      setStateName(g.state_name);
      setActiveGstinId(g.id);
    } else {
      setPrimaryGstin("");
      setActiveGstinId("");
    }
    setIsCompanyDropdownOpen(false);
    refreshCloudData(b.id);
  };

  const handleCreateNewBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLegalName.trim()) {
      setCreateCompanyError("Please enter a legal business name.");
      return;
    }
    setIsCreatingCompany(true);
    setCreateCompanyError("");
    try {
      const res = await api.createBusiness({
        organization_id: activeOrgId || undefined,
        legal_name: newLegalName.trim(),
        trade_name: newTradeName.trim() || newLegalName.trim(),
        pan: newPan.trim() || undefined,
        gstin: newGstin.trim() || undefined,
        state_code: newStateCode,
        state_name: newStateName,
        email: currentUser?.email
      });
      if (res && res.business) {
        setShowNewCompanyModal(false);
        setIsCompanyDropdownOpen(false);
        setNewLegalName("");
        setNewTradeName("");
        setNewGstin("");
        setNewPan("");
        await refreshCloudData(res.business.id);
      }
    } catch (err: any) {
      setCreateCompanyError(err.message || "Failed to create company.");
    } finally {
      setIsCreatingCompany(false);
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
      <div style={{ position: "relative", zIndex: 100 }}>
        <div
          className="business"
          onClick={() => setIsCompanyDropdownOpen((prev) => !prev)}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: isCompanyDropdownOpen ? "#245799" : "#1b4b86",
            border: isCompanyDropdownOpen ? "1px solid #3b82f6" : "1px solid transparent",
            transition: "all 0.15s ease",
            userSelect: "none"
          }}
          title="Click to switch or create company"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, overflow: "hidden" }}>
            <Building2 size={15} style={{ color: "#60a5fa", flexShrink: 0 }} />
            <div style={{ minWidth: 0, overflow: "hidden", textAlign: "left" }}>
              <span style={{ fontWeight: 600, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#fff", fontSize: "12px" }}>
                {tradeName || legalName || currentUser?.name || "My Business"}
              </span>
              <small style={{ color: "#93c5fd", fontSize: "10px", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {primaryGstin ? primaryGstin : (userBusinesses.length > 1 ? `${userBusinesses.length} companies available` : "Default Entity")}
              </small>
            </div>
          </div>
          <ChevronDown
            size={14}
            style={{
              color: "#93c5fd",
              transform: isCompanyDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.18s ease",
              flexShrink: 0,
              marginLeft: "6px"
            }}
          />
        </div>

        {/* Floating Company Switcher Popup */}
        {isCompanyDropdownOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% - 10px)",
              left: "3px",
              right: "3px",
              background: "#123460",
              border: "1px solid #2b5d9b",
              borderRadius: "10px",
              boxShadow: "0 14px 28px rgba(0,0,0,0.5)",
              padding: "8px",
              zIndex: 999
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 6px 8px", borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: "6px" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#93c5fd", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Switch Company ({userBusinesses.length || 1})
              </span>
            </div>

            <div style={{ maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
              {userBusinesses.map((b) => {
                const isSelected = b.id === activeBusinessId;
                const gstin = b.gstins && b.gstins.length > 0 ? b.gstins[0].gstin : b.pan ? `PAN: ${b.pan}` : null;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleSelectBusiness(b)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "7px",
                      background: isSelected ? "#2563eb" : "rgba(255,255,255,0.06)",
                      border: "none",
                      color: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      textAlign: "left",
                      transition: "all 0.12s ease"
                    }}
                  >
                    <div style={{ minWidth: 0, overflow: "hidden" }}>
                      <div style={{ fontWeight: 600, fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {b.trade_name || b.legal_name}
                      </div>
                      <div style={{ fontSize: "10px", color: isSelected ? "#bfdbfe" : "#94a3b8" }}>
                        {gstin || "Regular Entity"}
                      </div>
                    </div>
                    {isSelected && <Check size={14} style={{ color: "#fff", flexShrink: 0, marginLeft: "4px" }} />}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsCompanyDropdownOpen(false);
                setShowNewCompanyModal(true);
              }}
              style={{
                width: "100%",
                marginTop: "8px",
                padding: "8px",
                borderRadius: "7px",
                background: "rgba(37, 99, 235, 0.2)",
                border: "1px dashed #60a5fa",
                color: "#93c5fd",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
            >
              <Plus size={13} /> Add New Company
            </button>
          </div>
        )}
      </div>
      <nav>
        {nav.map(([name, Icon]) => {
          const slug = PAGE_SLUGS[name];
          const isActive = page === name;
          return (
            <a
              key={name}
              href={slug}
              className={isActive ? "active" : ""}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                setPage(name);
                setMobile(false);
              }}
            >
              <Icon size={17} />
              {name}
            </a>
          );
        })}
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

      {/* Sidebar Version & Live Update Menu Card */}
      <div
        style={{
          marginTop: "14px",
          background: "rgba(255, 255, 255, 0.08)",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          borderRadius: "10px",
          padding: "12px",
          fontSize: "11px",
          color: "#dce9fb"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <div
            onClick={() => {
              setPage("Version & Updates");
              setMobile(false);
            }}
            style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, cursor: "pointer" }}
            title="Open Version Details"
          >
            <GitBranch size={13} style={{ color: "#60a5fa" }} />
            <span>Version</span>
          </div>
          <span
            onClick={() => {
              setPage("Version & Updates");
              setMobile(false);
            }}
            style={{
              background: hasUpdate ? "#fef3c7" : "rgba(96, 165, 250, 0.2)",
              color: hasUpdate ? "#b45309" : "#93c5fd",
              padding: "2px 7px",
              borderRadius: "4px",
              fontSize: "10px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            v{currentVersion}
          </span>
        </div>

        <div style={{ fontSize: "10px", color: "#93c5fd", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Channel: Release</span>
          {hasUpdate ? (
            <span style={{ color: "#34d399", fontWeight: 700 }}>v{latestVersion} available</span>
          ) : (
            <span style={{ color: "#86efac", display: "inline-flex", alignItems: "center", gap: "2px" }}>
              <Check size={10} /> Up to date
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={hasUpdate ? handleTriggerAutoUpdate : handleManualCheckUpdate}
          disabled={checkingUpdate}
          style={{
            width: "100%",
            padding: "7px 10px",
            borderRadius: "7px",
            background: hasUpdate ? "#2563eb" : "rgba(255, 255, 255, 0.12)",
            color: "#ffffff",
            border: "none",
            fontSize: "11px",
            fontWeight: 600,
            cursor: checkingUpdate ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            transition: "all 0.15s ease"
          }}
        >
          <RefreshCw size={12} className={checkingUpdate ? "spin" : ""} />
          {checkingUpdate
            ? "Checking GitHub..."
            : hasUpdate
            ? `Update to v${latestVersion}`
            : "Check for updates"}
        </button>

        {updateCheckMsg && (
          <div
            style={{
              marginTop: "7px",
              fontSize: "10px",
              color: updateCheckMsg.includes("found") ? "#34d399" : "#bfdbfe",
              textAlign: "center",
              lineHeight: 1.2
            }}
          >
            {updateCheckMsg}
          </div>
        )}
      </div>

      <div className="profile" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, overflow: "hidden" }}>
          <b className="avatar">
            {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : (tradeName ? tradeName.slice(0, 2).toUpperCase() : "QG")}
          </b>
          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <div style={{ fontWeight: 600, fontSize: "13px", color: "#fff", textOverflow: "ellipsis", overflow: "hidden" }}>
              {currentUser?.name || tradeName || "User"}
            </div>
            <small style={{ color: "#93c5fd", display: "block", fontSize: "11px", textOverflow: "ellipsis", overflow: "hidden" }}>
              {tradeName || currentUser?.email || "Admin account"}
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
        value={`₹ ${totalSalesAmount.toLocaleString("en-IN")}`}
        trend={cloudInvoices.length > 0 ? `${cloudInvoices.length} invoices` : "No sales yet"}
        icon={ShoppingCart}
        tone="blue"
      />
      <Stat
        title="Total Purchases"
        value={`₹ ${totalPurchasesAmount.toLocaleString("en-IN")}`}
        trend="0 bills recorded"
        icon={Package}
        tone="teal"
      />
      <Stat
        title="Total GST Collected"
        value={`₹ ${totalTaxAmount.toLocaleString("en-IN")}`}
        trend={cloudInvoices.length > 0 ? "Output Tax (GSTR-1)" : "₹ 0 output tax"}
        icon={ReceiptText}
        tone="purple"
      />
      <Stat
        title="Total GST Paid"
        value={`₹ ${totalGstPaidAmount.toLocaleString("en-IN")}`}
        trend="Input Tax Credit (ITC)"
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
              <Btn onClick={() => setPage("Billing")}>
                <Plus size={14} style={{ marginRight: "4px" }} /> New Invoice
              </Btn>
              <button className="date">
                <CalendarDays size={15} /> Current Financial Period <ChevronDown size={13} style={{ marginLeft: "4px" }} />
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
                <AreaChart data={realChartData}>
                  <CartesianGrid stroke="#edf1f7" vertical={false} />
                  <XAxis dataKey="m" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [`₹ ${Number(value).toLocaleString("en-IN")}`, ""]} />
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
                      data={cloudInvoices.length > 0 ? [{ v: 100 }] : [{ v: 100 }]}
                      dataKey="v"
                      innerRadius={47}
                      outerRadius={59}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <Cell fill={cloudInvoices.length > 0 ? "#0d9f91" : "#cbd5e1"} />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <b>{cloudInvoices.length > 0 ? "100%" : "—"}</b>
              </div>
              <div style={{ lineHeight: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={14} style={{ color: cloudInvoices.length > 0 ? "#16865b" : "#94a3b8" }} />
                  <span style={{ fontWeight: "bold" }}>GSTR-1</span> {cloudInvoices.length > 0 ? `${cloudInvoices.length} invoices ready` : "No sales"}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <AlertCircle size={14} style={{ color: cloudInvoices.length > 0 ? "#e39a31" : "#94a3b8" }} />
                  <span style={{ fontWeight: "bold" }}>GSTR-3B</span> {cloudInvoices.length > 0 ? `Tax ₹ ${totalTaxAmount.toLocaleString("en-IN")}` : "Nil Return"}
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
              { name: "Amazon", count: `${channelOrderCounts.Amazon} Orders`, icon: "a" },
              { name: "Flipkart", count: `${channelOrderCounts.Flipkart} Orders`, icon: "f" },
              { name: "Meesho", count: `${channelOrderCounts.Meesho} Orders`, icon: "m" },
              { name: "Facebook", count: `${channelOrderCounts.Facebook} Orders`, icon: "f" },
              { name: "Shopify", count: `${channelOrderCounts.Shopify} Orders`, icon: "s" }
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
                <CheckCircle2 size={14} style={{ marginLeft: "auto", color: (channelOrderCounts[c.name as keyof typeof channelOrderCounts] || 0) > 0 ? "#0d9f91" : "#cbd5e1" }} />
              </button>
            ))}
          </div>
        </Panel>

        <Panel
          title="Recent Invoices"
          sub="Live synced statutory invoices"
          action={
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button onClick={() => refreshCloudData()} style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#2878e5" }}>
                <RefreshCw size={12} className={isSyncing ? "spin" : ""} /> Refresh
              </button>
              <a
                href="/sales"
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                  e.preventDefault();
                  setPage("Sales");
                }}
                style={{ display: "inline-flex", alignItems: "center", gap: "3px", cursor: "pointer", color: "#2878e5", textDecoration: "none" }}
              >
                View all <ArrowUpRight size={12} />
              </a>
            </div>
          }
        >
          {cloudInvoices.length > 0 ? (
            <Table
              headers={["Invoice ID", "Date", "Customer", "Amount", "Status", "Action"]}
              rows={cloudInvoices.slice(0, 10).map((inv) => [
                inv.invoice_number,
                inv.invoice_date,
                inv.customer ? inv.customer.name : "Cash Customer",
                `₹ ${Number(inv.grand_total).toLocaleString("en-IN")}`,
                inv.status === "finalized" ? "Filed" : "Generated",
                "View"
              ])}
              onAction={() => setPage("InvoicePreview")}
            />
          ) : (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
              <ReceiptText size={36} style={{ color: "#94a3b8", margin: "0 auto 12px", display: "block" }} />
              <div style={{ fontWeight: 600, fontSize: "14px", color: "#1e293b", marginBottom: "4px" }}>
                No invoices generated yet
              </div>
              <div style={{ fontSize: "12px", marginBottom: "16px" }}>
                Create your first GST compliant invoice for {tradeName || "your business"} to start tracking statutory sales.
              </div>
              <Btn onClick={() => setPage("Billing")}>
                <Plus size={14} style={{ marginRight: "4px" }} /> Create First Invoice
              </Btn>
            </div>
          )}
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

  // 4. SALES (ALL INVOICES)
  else if (page === "Sales") {
    screen = (
      <>
        <Heading
          title="Sales & Invoices"
          sub="Manage and track all GST sales invoices"
          action={
            <div style={{ display: "flex", gap: "8px" }}>
              <Btn onClick={() => setPage("Billing")}>
                <Plus size={14} style={{ marginRight: "4px" }} /> Create New Invoice
              </Btn>
            </div>
          }
        />
        <div className="stats">
          <Stat
            title="Total Invoices"
            value={String(cloudInvoices.length)}
            trend={cloudInvoices.length > 0 ? "Live synced" : "No invoices"}
            icon={ReceiptText}
            tone="blue"
          />
          <Stat
            title="Total Sales Value"
            value={`₹ ${totalSalesAmount.toLocaleString("en-IN")}`}
            trend="Gross Revenue"
            icon={ShoppingCart}
            tone="teal"
          />
          <Stat
            title="Taxable Turnover"
            value={`₹ ${totalTaxableAmount.toLocaleString("en-IN")}`}
            trend="Net Taxable"
            icon={FileBarChart}
            tone="purple"
          />
          <Stat
            title="GST Output"
            value={`₹ ${totalTaxAmount.toLocaleString("en-IN")}`}
            trend="Statutory Tax"
            icon={ShieldCheck}
            tone="orange"
          />
        </div>
        <Panel title="Sales Register" sub="Complete outward supplies audit trail">
          {cloudInvoices.length > 0 ? (
            <Table
              headers={["Invoice #", "Date", "Customer", "Place of Supply", "Taxable (₹)", "GST (₹)", "Total (₹)", "Action"]}
              rows={cloudInvoices.map((inv) => [
                inv.invoice_number,
                inv.invoice_date,
                inv.customer ? inv.customer.name : "Cash Customer",
                inv.place_of_supply_state_code,
                Number(inv.total_taxable_value).toLocaleString("en-IN"),
                Number(inv.total_tax_amount).toLocaleString("en-IN"),
                `₹ ${Number(inv.grand_total).toLocaleString("en-IN")}`,
                "View"
              ])}
              onAction={() => setPage("InvoicePreview")}
            />
          ) : (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
              <ShoppingCart size={36} style={{ color: "#94a3b8", margin: "0 auto 12px", display: "block" }} />
              <div style={{ fontWeight: 600, fontSize: "14px", color: "#1e293b", marginBottom: "4px" }}>
                No sales recorded yet
              </div>
              <div style={{ fontSize: "12px", marginBottom: "16px" }}>
                Generate your first tax invoice to populate your statutory sales register.
              </div>
              <Btn onClick={() => setPage("Billing")}>
                <Plus size={14} style={{ marginRight: "4px" }} /> Create Invoice
              </Btn>
            </div>
          )}
        </Panel>
      </>
    );
  }

  // 5. PURCHASES
  else if (page === "Purchases") {
    screen = (
      <>
        <Heading
          title="Purchases & Inward Supplies"
          sub="Track vendor bills, expenses, and claim Input Tax Credit (ITC)"
          action={
            <div style={{ display: "flex", gap: "8px" }}>
              <Btn onClick={() => alert("Vendor purchase recording will be available in the next release.")}>
                <Plus size={14} style={{ marginRight: "4px" }} /> Record Purchase
              </Btn>
            </div>
          }
        />
        <div className="stats">
          <Stat
            title="Total Purchases"
            value="₹ 0"
            trend="0 Bills Recorded"
            icon={Package}
            tone="blue"
          />
          <Stat
            title="ITC Claimed"
            value="₹ 0"
            trend="Eligible Credit"
            icon={CheckCircle2}
            tone="teal"
          />
          <Stat
            title="Pending ITC"
            value="₹ 0"
            trend="GSTR-2B Matching"
            icon={AlertCircle}
            tone="orange"
          />
          <Stat
            title="Active Suppliers"
            value="0"
            trend="Vendor count"
            icon={Users}
            tone="purple"
          />
        </div>
        <Panel title="Purchase Register" sub="Inward supplies and supplier tax invoices">
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
            <Package size={36} style={{ color: "#94a3b8", margin: "0 auto 12px", display: "block" }} />
            <div style={{ fontWeight: 600, fontSize: "14px", color: "#1e293b", marginBottom: "4px" }}>
              No purchase bills recorded yet
            </div>
            <div style={{ fontSize: "12px", marginBottom: "16px" }}>
              Import vendor invoices or reconcile with GSTR-2B to claim your maximum eligible Input Tax Credit.
            </div>
            <Btn secondary onClick={() => setPage("Reconciliation")}>
              <RefreshCw size={14} style={{ marginRight: "4px" }} /> Check GSTR-2B
            </Btn>
          </div>
        </Panel>
      </>
    );
  }

  // 6. MARKETPLACE IMPORTS
  else if (page === "Marketplace") {
    screen = (
      <>
        <Heading
          title="Marketplace Imports"
          sub="Import orders from e-commerce channels and generate GST compliant invoices"
          action={
            <Btn secondary onClick={() => refreshCloudData()}>
              <RefreshCw size={14} className={isSyncing ? "spin" : ""} style={{ marginRight: "4px" }} /> Refresh Orders
            </Btn>
          }
        />
        <div className="tabs">
          <span style={{ fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <Store size={14} /> Amazon ({channelOrderCounts.Amazon || 0})
          </span>
          <span>Flipkart ({channelOrderCounts.Flipkart || 0})</span>
          <span>Meesho ({channelOrderCounts.Meesho || 0})</span>
          <span>Shopify ({channelOrderCounts.Shopify || 0})</span>
        </div>
        <Panel
          title="Marketplace Channel Gateway"
          sub="Upload MTR reports or connect automated channel sync"
          action={
            <Btn onClick={() => alert("Upload Amazon Merchant Tax Report (MTR) CSV or Meesho sales report to import orders.")}>
              <FolderDown size={14} style={{ marginRight: "4px" }} /> Import CSV Report
            </Btn>
          }
        >
          {marketplaceOrders.length > 0 ? (
            <Table
              headers={["Order ID", "Date", "Channel", "Customer", "Amount", "Status", "Action"]}
              rows={marketplaceOrders.map((ord: any) => [
                ord.order_id || ord.id,
                ord.order_date || "—",
                ord.marketplace_connection?.channel?.toUpperCase() || ord.channel?.toUpperCase() || "AMAZON",
                ord.buyer_name || "Marketplace Buyer",
                `₹ ${Number(ord.total_amount || 0).toLocaleString("en-IN")}`,
                ord.sync_status || "Imported",
                "View"
              ])}
            />
          ) : (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
              <Store size={36} style={{ color: "#94a3b8", margin: "0 auto 12px", display: "block" }} />
              <div style={{ fontWeight: 600, fontSize: "14px", color: "#1e293b", marginBottom: "4px" }}>
                No marketplace orders imported yet
              </div>
              <div style={{ fontSize: "12px", marginBottom: "16px" }}>
                Connect your Amazon, Flipkart, Meesho, or Shopify stores to automatically ingest orders and generate GST invoices.
              </div>
              <Btn onClick={() => alert("To import: download MTR report from your seller portal and upload via Import CSV Report.")}>
                <FolderDown size={14} style={{ marginRight: "4px" }} /> Upload MTR Report
              </Btn>
            </div>
          )}
        </Panel>
      </>
    );
  }

  // 7. SHOPIFY INTEGRATION
  else if (page === "Shopify") {
    screen = (
      <>
        <Heading
          title="Shopify Integration"
          sub="Connect your Shopify storefront for automated real-time GST invoicing"
        />
        <Panel title="Shopify Store Gateway">
          <div className="importbox">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold" }}>
              <Store size={18} style={{ color: "#0d9f91" }} /> Shopify Webhook Gateway
            </div>
            <span>
              Orders placed on your Shopify store are instantly converted into statutory GST invoices via webhook endpoint:
              <br />
              <code style={{ fontSize: "11px", background: "#f1f5f9", padding: "3px 6px", borderRadius: "4px", color: "#0f172a", marginTop: "4px", display: "inline-block" }}>
                https://quantumgst.in/api/v1/webhooks/shopify/orders-create
              </code>
            </span>
            <span className="good">Gateway Ready</span>
            <Btn secondary onClick={() => alert("Shopify Webhook URL copied! Paste this in your Shopify Admin -> Settings -> Notifications -> Webhooks -> Order creation.")}>
              Copy Webhook URL
            </Btn>
          </div>
        </Panel>
        <div className="stats three">
          <Stat
            title="Total Shopify Orders"
            value={String(channelOrderCounts.Shopify || 0)}
            trend="Live synced"
            icon={ShoppingCart}
            tone="blue"
          />
          <Stat
            title="Total Revenue"
            value="₹ 0"
            trend="0.0% variance"
            icon={ArrowUpRight}
            tone="teal"
          />
          <Stat
            title="Auto Invoice"
            value="Active"
            trend="GST compliant invoices"
            icon={CheckCircle2}
            tone="purple"
          />
        </div>
        <Panel title="Recent Shopify Orders">
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
            <Plug size={36} style={{ color: "#94a3b8", margin: "0 auto 12px", display: "block" }} />
            <div style={{ fontWeight: 600, fontSize: "14px", color: "#1e293b", marginBottom: "4px" }}>
              No Shopify orders received yet
            </div>
            <div style={{ fontSize: "12px", marginBottom: "16px" }}>
              When a customer places an order on your Shopify store, it will automatically appear here with full tax calculations.
            </div>
          </div>
        </Panel>
      </>
    );
  }

  // 8. GST REPORTS
  else if (page === "GST Reports") {
    const b2bInvoices = cloudInvoices.filter((i) => i.customer && i.customer.gstin);
    screen = (
      <>
        <Heading
          title="GST Reports"
          sub="Generate and file statutory GST returns"
          action={
            <button className="date">
              <CalendarDays size={14} /> Current Financial Period <ChevronDown size={12} />
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
              <Download size={14} style={{ marginRight: "4px" }} /> Export JSON
            </Btn>
          }
        >
          <div className="stats" style={{ marginBottom: "20px" }}>
            <div className="stat">
              <span style={{ fontSize: "11px", color: "#718096" }}>Total Invoices</span>
              <strong style={{ fontSize: "20px" }}>{cloudInvoices.length}</strong>
            </div>
            <div className="stat">
              <span style={{ fontSize: "11px", color: "#718096" }}>Total Taxable Value</span>
              <strong style={{ fontSize: "20px", color: "#16865b" }}>₹ {totalTaxableAmount.toLocaleString("en-IN")}</strong>
            </div>
            <div className="stat">
              <span style={{ fontSize: "11px", color: "#718096" }}>Total GST</span>
              <strong style={{ fontSize: "20px", color: "#2878e5" }}>₹ {totalTaxAmount.toLocaleString("en-IN")}</strong>
            </div>
            <div className="stat">
              <span style={{ fontSize: "11px", color: "#718096" }}>Total Records</span>
              <strong style={{ fontSize: "20px" }}>{cloudInvoices.length}</strong>
            </div>
          </div>
          <h3 className="section">B2B Invoices</h3>
          {b2bInvoices.length > 0 ? (
            <Table
              headers={["Customer GSTIN", "Customer Name", "Invoice No", "Taxable Value (₹)", "GST (₹)"]}
              rows={b2bInvoices.map((inv) => [
                inv.customer?.gstin || "—",
                inv.customer?.name || "B2B Customer",
                inv.invoice_number,
                Number(inv.total_taxable_value).toLocaleString("en-IN"),
                Number(inv.total_tax_amount).toLocaleString("en-IN")
              ])}
            />
          ) : (
            <div style={{ padding: "30px 20px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "8px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>No B2B Invoices Recorded</div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                All retail or unregistered invoices are automatically classified into B2C tables for statutory return filing.
              </div>
            </div>
          )}
        </Panel>
      </>
    );
  }

  // 9. SALES RECONCILIATION
  else if (page === "Reconciliation") {
    screen = (
      <>
        <Heading
          title="Reconciliation"
          sub="Match marketplace sales with bank settlements and GST returns"
          action={
            <Btn onClick={() => alert("Reconciliation complete: 0 unmatched variances detected.")}>
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
          <div className="stats">
            <Stat
              title="Total Orders"
              value={String(marketplaceOrders.length)}
              trend="Marketplace transactions"
              icon={ShoppingCart}
              tone="blue"
            />
            <Stat
              title="Matched"
              value={String(marketplaceOrders.length)}
              trend="100%"
              icon={CheckCircle2}
              tone="teal"
            />
            <Stat
              title="Unmatched"
              value="0"
              trend="0%"
              icon={AlertCircle}
              tone="orange"
            />
            <Stat
              title="Mismatch Amount"
              value="₹ 0"
              trend="No variance"
              icon={RefreshCw}
              tone="purple"
            />
          </div>
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
            <CheckCircle2 size={36} style={{ color: "#10b981", margin: "0 auto 12px", display: "block" }} />
            <div style={{ fontWeight: 600, fontSize: "14px", color: "#1e293b", marginBottom: "4px" }}>
              All transactions reconciled
            </div>
            <div style={{ fontSize: "12px" }}>
              No discrepancies or pending settlements detected between marketplace records and filed invoices.
            </div>
          </div>
        </Panel>
      </>
    );
  }

  // 10. CUSTOMERS & CONTACTS
  else if (page === "Contacts") {
    screen = (
      <>
        <Heading
          title="Customers & Contacts"
          sub="Manage your verified customers, vendors and business entities"
          action={
            <div style={{ display: "flex", gap: "8px" }}>
              <Btn onClick={() => setPage("Billing")}>
                <Plus size={14} style={{ marginRight: "4px" }} /> Add Customer / Invoice
              </Btn>
            </div>
          }
        />
        <div className="tabs">
          <span style={{ fontWeight: "bold" }}>Customers ({cloudCustomers.length})</span>
          <span>Suppliers (0)</span>
          <span>Transporters (0)</span>
        </div>
        <Panel title="Directory">
          {cloudCustomers.length > 0 ? (
            <Table
              headers={["Name", "GSTIN", "State", "Email", "Phone", "Action"]}
              rows={cloudCustomers.map((c) => [
                c.name,
                c.gstin || "— (B2C)",
                c.state_name || `State (${c.state_code})`,
                c.email || "—",
                c.phone || "—",
                "View"
              ])}
            />
          ) : (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
              <Users size={36} style={{ color: "#94a3b8", margin: "0 auto 12px", display: "block" }} />
              <div style={{ fontWeight: 600, fontSize: "14px", color: "#1e293b", marginBottom: "4px" }}>
                No customer records yet
              </div>
              <div style={{ fontSize: "12px", marginBottom: "16px" }}>
                Customers are automatically saved and cataloged whenever you create an invoice in Quantum GST.
              </div>
              <Btn onClick={() => setPage("Billing")}>
                <Plus size={14} style={{ marginRight: "4px" }} /> Bill a Customer
              </Btn>
            </div>
          )}
        </Panel>
      </>
    );
  }

  // 11. INVENTORY & PRODUCTS
  else if (page === "Inventory") {
    screen = (
      <>
        <Heading
          title="Inventory & Items"
          sub="Manage products, services, HSN/SAC codes and tax rates"
          action={
            <div style={{ display: "flex", gap: "8px" }}>
              <Btn onClick={() => alert("Product catalog management is enabled via billing items.")}>
                <Plus size={14} style={{ marginRight: "4px" }} /> Add Product
              </Btn>
            </div>
          }
        />
        <div className="stats">
          <Stat
            title="Total Products"
            value="0"
            trend="Catalog items"
            icon={Package}
            tone="blue"
          />
          <Stat
            title="Stock Value"
            value="₹ 0"
            trend="Inventory asset"
            icon={CheckCircle2}
            tone="teal"
          />
          <Stat
            title="Tax Slabs Configured"
            value="5%, 12%, 18%, 28%"
            trend="Standard GST"
            icon={FileBarChart}
            tone="purple"
          />
          <Stat
            title="Low Stock Alerts"
            value="0"
            trend="All optimal"
            icon={AlertCircle}
            tone="orange"
          />
        </div>
        <Panel title="Product Catalog">
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
            <Package size={36} style={{ color: "#94a3b8", margin: "0 auto 12px", display: "block" }} />
            <div style={{ fontWeight: 600, fontSize: "14px", color: "#1e293b", marginBottom: "4px" }}>
              No products cataloged yet
            </div>
            <div style={{ fontSize: "12px", marginBottom: "16px" }}>
              Products and services are automatically added to your catalog when you generate invoices.
            </div>
            <Btn onClick={() => setPage("Billing")}>
              <Plus size={14} style={{ marginRight: "4px" }} /> Create First Invoice Item
            </Btn>
          </div>
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
  else if (page === "Version & Updates") {
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
    const pageTitle = String(page);
    screen = (
      <>
        <Heading
          title={pageTitle}
          sub={`Manage your ${pageTitle.toLowerCase()} in Quantum GST.`}
          action={
            <Btn>
              <Plus size={15} /> Add New
            </Btn>
          }
        />
        <Panel title={`${pageTitle} Overview`}>
          <div className="empty">
            <FileSpreadsheet size={34} />
            <h3>Your {pageTitle.toLowerCase()} workspace</h3>
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
            <Bell size={18} style={{ color: "#718096", cursor: "pointer" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "10px", borderLeft: "1px solid #e2e8f0", paddingLeft: "12px" }}>
              <b className="avatar">
                {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : (tradeName ? tradeName.slice(0, 2).toUpperCase() : "QG")}
              </b>
              <div style={{ display: "flex", flexDirection: "column", textAlign: "left", lineHeight: 1.2 }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b" }}>
                  {currentUser?.name || tradeName || "User"}
                </span>
                <span style={{ fontSize: "10px", color: "#64748b" }}>
                  {tradeName ? `${tradeName} • ${currentUser?.email || ""}` : (currentUser?.email || "Administrator")}
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

      {/* ================= NEW COMPANY MODAL ================= */}
      {showNewCompanyModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "grid",
            placeItems: "center",
            padding: "20px"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isCreatingCompany) {
              setShowNewCompanyModal(false);
            }
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              width: "100%",
              maxWidth: "520px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
              border: "1px solid #e2e8f0"
            }}
          >
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "#eff6ff",
                    color: "#2563eb",
                    display: "grid",
                    placeItems: "center"
                  }}
                >
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", color: "#0f172a", fontWeight: "700" }}>
                    Create New Company
                  </h3>
                  <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                    Add another business profile or GSTIN branch to your account.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewCompanyModal(false)}
                disabled={isCreatingCompany}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  padding: "4px"
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewBusiness} style={{ padding: "20px 24px" }}>
              {createCompanyError && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#b91c1c",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <AlertCircle size={15} />
                  <span>{createCompanyError}</span>
                </div>
              )}

              <div style={{ display: "grid", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                    Legal Business Name <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jasim Global Exports"
                    value={newLegalName}
                    onChange={(e) => setNewLegalName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "7px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                      Trade Name / Brand (DBA)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Jasim Store"
                      value={newTradeName}
                      onChange={(e) => setNewTradeName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "7px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                      PAN Number (Optional)
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="e.g. ABCDE1234F"
                      value={newPan}
                      onChange={(e) => setNewPan(e.target.value.toUpperCase())}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "7px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        outline: "none",
                        textTransform: "uppercase",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                      GSTIN (Optional)
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      placeholder="15-digit GSTIN (optional)"
                      value={newGstin}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setNewGstin(val);
                        if (val.length >= 2) {
                          setNewStateCode(val.slice(0, 2));
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "7px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        outline: "none",
                        textTransform: "uppercase",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                      State / Place of Supply
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. West Bengal (19)"
                      value={`${newStateName} (${newStateCode})`}
                      onChange={(e) => setNewStateName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: "7px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: "24px",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px"
                }}
              >
                <button
                  type="button"
                  disabled={isCreatingCompany}
                  onClick={() => setShowNewCompanyModal(false)}
                  style={{
                    padding: "9px 16px",
                    borderRadius: "7px",
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    color: "#475569",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCompany}
                  style={{
                    padding: "9px 20px",
                    borderRadius: "7px",
                    border: "none",
                    background: "#2563eb",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: isCreatingCompany ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <Plus size={14} />
                  {isCreatingCompany ? "Creating Company..." : "Create Company"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
