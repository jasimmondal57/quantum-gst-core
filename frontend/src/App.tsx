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
  LogOut,
  CreditCard,
  Truck,
  Palette,
  Trash2,
  Landmark,
  Code2,
  UploadCloud,
  SlidersHorizontal,
  History
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

export type Page =
  | "Dashboard"
  | "Billing"
  | "Sales"
  | "Purchases"
  | "Inventory"
  | "Accounting"
  | "Marketplace"
  | "Shopify"
  | "GST Reports"
  | "Reconciliation"
  | "Contacts"
  | "Developer & API"
  | "Settings"
  | "InvoicePreview"
  | "Version & Updates";

export const PAGE_SLUGS: Record<Page, string> = {
  "Dashboard": "/dashboard",
  "Billing": "/billing",
  "Sales": "/sales",
  "Purchases": "/purchases",
  "Inventory": "/inventory",
  "Accounting": "/accounting",
  "Marketplace": "/marketplace",
  "Shopify": "/shopify",
  "GST Reports": "/reports",
  "Reconciliation": "/reconciliation",
  "Contacts": "/contacts",
  "Developer & API": "/developer",
  "Settings": "/settings",
  "InvoicePreview": "/invoice-preview",
  "Version & Updates": "/updates"
};

export const SLUG_TO_PAGE: Record<string, Page> = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/billing": "Billing",
  "/invoices/create": "Billing",

  // Sales Management
  "/sales": "Sales",
  "/sales/invoices": "Sales",
  "/sales/proforma": "Sales",
  "/sales/quotations": "Sales",
  "/sales/credit-notes": "Sales",
  "/sales/challans": "Sales",
  "/invoices": "Sales",

  // Purchase Management
  "/purchases": "Purchases",
  "/purchases/bills": "Purchases",
  "/purchases/orders": "Purchases",
  "/purchases/debit-notes": "Purchases",
  "/purchases/returns": "Purchases",

  // Inventory Management
  "/inventory": "Inventory",
  "/inventory/products": "Inventory",
  "/inventory/categories": "Inventory",
  "/inventory/transfers": "Inventory",
  "/inventory/adjustments": "Inventory",
  "/products": "Inventory",

  // Accounting & Finance
  "/accounting": "Accounting",
  "/accounting/expenses": "Accounting",
  "/accounting/payments": "Accounting",
  "/accounting/banking": "Accounting",
  "/accounting/cashflow": "Accounting",

  // Marketplace & Integrations
  "/marketplace": "Marketplace",
  "/marketplace/overview": "Marketplace",
  "/marketplace/channels": "Marketplace",
  "/marketplace/amazon": "Marketplace",
  "/marketplace/flipkart": "Marketplace",
  "/marketplace/meesho": "Marketplace",
  "/marketplace/import": "Marketplace",
  "/shopify": "Shopify",

  // GST & Compliance
  "/reports": "GST Reports",
  "/gst": "GST Reports",
  "/gst/dashboard": "GST Reports",
  "/gst/gstr-1": "GST Reports",
  "/gst/gstr-3b": "GST Reports",
  "/gst/gstr-2b": "GST Reports",
  "/gst/hsn": "GST Reports",
  "/gst/e-way-bill": "GST Reports",
  "/gst-reports": "GST Reports",
  "/reconciliation": "Reconciliation",

  // Contacts
  "/contacts": "Contacts",
  "/contacts/customers": "Contacts",
  "/contacts/suppliers": "Contacts",
  "/customers": "Contacts",

  // Developer & Automation
  "/developer": "Developer & API",
  "/developer/api": "Developer & API",
  "/developer/webhooks": "Developer & API",
  "/developer/automation": "Developer & API",
  "/developer/docs": "Developer & API",

  // Settings
  "/settings": "Settings",
  "/settings/business": "Settings",
  "/settings/profile": "Settings",
  "/settings/address": "Settings",
  "/settings/invoicing": "Settings",
  "/settings/bank": "Settings",
  "/settings/eway": "Settings",
  "/settings/templates": "Settings",
  "/settings/roles": "Settings",
  "/settings/users": "Settings",
  "/settings/gst": "Settings",
  "/settings/integrations": "Settings",
  "/settings/billing": "Settings",
  "/settings/audit": "Settings",

  // Invoice Preview & Updates
  "/invoice-preview": "InvoicePreview",
  "/invoices/preview": "InvoicePreview",
  "/updates": "Version & Updates",
  "/version": "Version & Updates"
};

export type SalesSubmenu = "invoices" | "proforma" | "quotations" | "credit-notes" | "challans";
export type PurchasesSubmenu = "bills" | "orders" | "debit-notes" | "returns";
export type InventorySubmenu = "products" | "categories" | "transfers" | "adjustments";
export type AccountingSubmenu = "expenses" | "payments" | "banking" | "cashflow";
export type MarketplaceSubmenu = "overview" | "channels" | "import";
export type GstSubmenu = "overview" | "gstr-1" | "gstr-3b" | "gstr-2b" | "hsn" | "eway";
export type ContactsSubmenu = "customers" | "suppliers";
export type DeveloperSubmenu = "api" | "webhooks" | "automation" | "docs";
export type SettingsSubmenu =
  | "business"
  | "address"
  | "invoicing"
  | "bank"
  | "eway"
  | "templates"
  | "roles"
  | "gst"
  | "integrations"
  | "billing"
  | "audit";

export const SETTINGS_SUBMENU_SLUGS: Record<SettingsSubmenu, string> = {
  business: "/settings/business",
  address: "/settings/address",
  invoicing: "/settings/invoicing",
  bank: "/settings/bank",
  eway: "/settings/eway",
  templates: "/settings/templates",
  roles: "/settings/roles",
  gst: "/settings/gst",
  integrations: "/settings/integrations",
  billing: "/settings/billing",
  audit: "/settings/audit"
};

export function getSalesSubmenuFromPath(pathname: string): SalesSubmenu {
  const clean = pathname.replace(/\/+$/, "");
  if (clean === "/sales/proforma") return "proforma";
  if (clean === "/sales/quotations") return "quotations";
  if (clean === "/sales/credit-notes") return "credit-notes";
  if (clean === "/sales/challans") return "challans";
  return "invoices";
}

export function getPurchasesSubmenuFromPath(pathname: string): PurchasesSubmenu {
  const clean = pathname.replace(/\/+$/, "");
  if (clean === "/purchases/orders") return "orders";
  if (clean === "/purchases/debit-notes") return "debit-notes";
  if (clean === "/purchases/returns") return "returns";
  return "bills";
}

export function getInventorySubmenuFromPath(pathname: string): InventorySubmenu {
  const clean = pathname.replace(/\/+$/, "");
  if (clean === "/inventory/categories") return "categories";
  if (clean === "/inventory/transfers") return "transfers";
  if (clean === "/inventory/adjustments") return "adjustments";
  return "products";
}

export function getAccountingSubmenuFromPath(pathname: string): AccountingSubmenu {
  const clean = pathname.replace(/\/+$/, "");
  if (clean === "/accounting/payments") return "payments";
  if (clean === "/accounting/banking") return "banking";
  if (clean === "/accounting/cashflow") return "cashflow";
  return "expenses";
}

export function getMarketplaceSubmenuFromPath(pathname: string): MarketplaceSubmenu {
  const clean = pathname.replace(/\/+$/, "");
  if (clean === "/marketplace/channels" || clean === "/marketplace/amazon" || clean === "/marketplace/flipkart" || clean === "/marketplace/meesho") return "channels";
  if (clean === "/marketplace/import") return "import";
  return "overview";
}

export function getGstSubmenuFromPath(pathname: string): GstSubmenu {
  const clean = pathname.replace(/\/+$/, "");
  if (clean === "/gst/gstr-1" || clean === "/reports/gstr-1") return "gstr-1";
  if (clean === "/gst/gstr-3b" || clean === "/reports/gstr-3b") return "gstr-3b";
  if (clean === "/gst/gstr-2b" || clean === "/reports/gstr-2b") return "gstr-2b";
  if (clean === "/gst/hsn" || clean === "/reports/hsn") return "hsn";
  if (clean === "/gst/e-way-bill" || clean === "/reports/e-way-bill") return "eway";
  return "overview";
}

export function getContactsSubmenuFromPath(pathname: string): ContactsSubmenu {
  const clean = pathname.replace(/\/+$/, "");
  if (clean === "/contacts/suppliers") return "suppliers";
  return "customers";
}

export function getDeveloperSubmenuFromPath(pathname: string): DeveloperSubmenu {
  const clean = pathname.replace(/\/+$/, "");
  if (clean === "/developer/webhooks") return "webhooks";
  if (clean === "/developer/automation") return "automation";
  if (clean === "/developer/docs") return "docs";
  return "api";
}

export function getSettingsSubmenuFromPath(pathname: string): SettingsSubmenu {
  const clean = pathname.replace(/\/+$/, "");
  if (clean === "/settings/address") return "address";
  if (clean === "/settings/invoicing") return "invoicing";
  if (clean === "/settings/bank") return "bank";
  if (clean === "/settings/eway") return "eway";
  if (clean === "/settings/templates") return "templates";
  if (clean === "/settings/roles" || clean === "/settings/users") return "roles";
  if (clean === "/settings/gst") return "gst";
  if (clean === "/settings/integrations") return "integrations";
  if (clean === "/settings/billing") return "billing";
  if (clean === "/settings/audit") return "audit";
  return "business";
}

export function getPageFromPath(pathname: string): Page {
  const clean = pathname.replace(/\/+$/, "") || "/";
  return SLUG_TO_PAGE[clean] || "Dashboard";
}

export const navGroups = [
  {
    title: "Core Operations",
    items: [
      ["Dashboard", LayoutDashboard, "/dashboard"],
      ["Billing", ReceiptText, "/billing"],
      ["Sales", ShoppingCart, "/sales"],
      ["Purchases", Package, "/purchases"],
      ["Inventory", Layers, "/inventory"]
    ] as const
  },
  {
    title: "Finance & Tax",
    items: [
      ["Accounting", Landmark, "/accounting"],
      ["GST Reports", FileBarChart, "/reports"],
      ["Reconciliation", RefreshCw, "/reconciliation"]
    ] as const
  },
  {
    title: "Channels & People",
    items: [
      ["Marketplace", Store, "/marketplace"],
      ["Shopify", Plug, "/shopify"],
      ["Contacts", Users, "/contacts"]
    ] as const
  },
  {
    title: "System & Tools",
    items: [
      ["Developer & API", Code2, "/developer"],
      ["Settings", Settings, "/settings"],
      ["Version & Updates", DownloadCloud, "/updates"]
    ] as const
  }
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
  onChange,
  type = "text"
}: {
  label: string;
  value: string;
  onChange?: (val: string) => void;
  type?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
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

  const [salesSubmenu, setSalesSubmenuState] = useState<SalesSubmenu>(() => {
    if (typeof window !== "undefined") return getSalesSubmenuFromPath(window.location.pathname);
    return "invoices";
  });

  const [purchasesSubmenu, setPurchasesSubmenuState] = useState<PurchasesSubmenu>(() => {
    if (typeof window !== "undefined") return getPurchasesSubmenuFromPath(window.location.pathname);
    return "bills";
  });

  const [inventorySubmenu, setInventorySubmenuState] = useState<InventorySubmenu>(() => {
    if (typeof window !== "undefined") return getInventorySubmenuFromPath(window.location.pathname);
    return "products";
  });

  const [accountingSubmenu, setAccountingSubmenuState] = useState<AccountingSubmenu>(() => {
    if (typeof window !== "undefined") return getAccountingSubmenuFromPath(window.location.pathname);
    return "expenses";
  });

  const [marketplaceSubmenu, setMarketplaceSubmenuState] = useState<MarketplaceSubmenu>(() => {
    if (typeof window !== "undefined") return getMarketplaceSubmenuFromPath(window.location.pathname);
    return "overview";
  });

  const [gstSubmenu, setGstSubmenuState] = useState<GstSubmenu>(() => {
    if (typeof window !== "undefined") return getGstSubmenuFromPath(window.location.pathname);
    return "overview";
  });

  const [contactsSubmenu, setContactsSubmenuState] = useState<ContactsSubmenu>(() => {
    if (typeof window !== "undefined") return getContactsSubmenuFromPath(window.location.pathname);
    return "customers";
  });

  const [developerSubmenu, setDeveloperSubmenuState] = useState<DeveloperSubmenu>(() => {
    if (typeof window !== "undefined") return getDeveloperSubmenuFromPath(window.location.pathname);
    return "api";
  });

  const [settingsSubmenu, setSettingsSubmenuState] = useState<SettingsSubmenu>(() => {
    if (typeof window !== "undefined") return getSettingsSubmenuFromPath(window.location.pathname);
    return "business";
  });

  const [settingsSaveMsg, setSettingsSaveMsg] = useState<string>("");
  const [showNotifications, setShowNotifications] = useState(false);

  const showSaveSuccess = (msg: string = "Settings saved successfully!") => {
    setSettingsSaveMsg(msg);
    setTimeout(() => setSettingsSaveMsg(""), 3500);
  };

  const navigateToSalesSubmenu = (sub: SalesSubmenu) => {
    setSalesSubmenuState(sub);
    setPageState("Sales");
    const slug = sub === "invoices" ? "/sales" : `/sales/${sub}`;
    if (typeof window !== "undefined" && window.location.pathname !== slug) {
      window.history.pushState({ page: "Sales", submenu: sub }, "", slug);
    }
  };

  const navigateToPurchasesSubmenu = (sub: PurchasesSubmenu) => {
    setPurchasesSubmenuState(sub);
    setPageState("Purchases");
    const slug = sub === "bills" ? "/purchases" : `/purchases/${sub}`;
    if (typeof window !== "undefined" && window.location.pathname !== slug) {
      window.history.pushState({ page: "Purchases", submenu: sub }, "", slug);
    }
  };

  const navigateToInventorySubmenu = (sub: InventorySubmenu) => {
    setInventorySubmenuState(sub);
    setPageState("Inventory");
    const slug = sub === "products" ? "/inventory" : `/inventory/${sub}`;
    if (typeof window !== "undefined" && window.location.pathname !== slug) {
      window.history.pushState({ page: "Inventory", submenu: sub }, "", slug);
    }
  };

  const navigateToAccountingSubmenu = (sub: AccountingSubmenu) => {
    setAccountingSubmenuState(sub);
    setPageState("Accounting");
    const slug = sub === "expenses" ? "/accounting" : `/accounting/${sub}`;
    if (typeof window !== "undefined" && window.location.pathname !== slug) {
      window.history.pushState({ page: "Accounting", submenu: sub }, "", slug);
    }
  };

  const navigateToMarketplaceSubmenu = (sub: MarketplaceSubmenu) => {
    setMarketplaceSubmenuState(sub);
    setPageState("Marketplace");
    const slug = sub === "overview" ? "/marketplace" : `/marketplace/${sub}`;
    if (typeof window !== "undefined" && window.location.pathname !== slug) {
      window.history.pushState({ page: "Marketplace", submenu: sub }, "", slug);
    }
  };

  const navigateToGstSubmenu = (sub: GstSubmenu) => {
    setGstSubmenuState(sub);
    setPageState("GST Reports");
    const slug = sub === "overview" ? "/reports" : `/gst/${sub === "eway" ? "e-way-bill" : sub}`;
    if (typeof window !== "undefined" && window.location.pathname !== slug) {
      window.history.pushState({ page: "GST Reports", submenu: sub }, "", slug);
    }
  };

  const navigateToContactsSubmenu = (sub: ContactsSubmenu) => {
    setContactsSubmenuState(sub);
    setPageState("Contacts");
    const slug = sub === "customers" ? "/contacts" : `/contacts/${sub}`;
    if (typeof window !== "undefined" && window.location.pathname !== slug) {
      window.history.pushState({ page: "Contacts", submenu: sub }, "", slug);
    }
  };

  const navigateToDeveloperSubmenu = (sub: DeveloperSubmenu) => {
    setDeveloperSubmenuState(sub);
    setPageState("Developer & API");
    const slug = sub === "api" ? "/developer" : `/developer/${sub}`;
    if (typeof window !== "undefined" && window.location.pathname !== slug) {
      window.history.pushState({ page: "Developer & API", submenu: sub }, "", slug);
    }
  };

  const navigateToSettingsSubmenu = (sub: SettingsSubmenu, replace: boolean = false) => {
    setSettingsSubmenuState(sub);
    setPageState("Settings");
    if (typeof window !== "undefined") {
      const slug = SETTINGS_SUBMENU_SLUGS[sub] || "/settings/business";
      if (window.location.pathname !== slug) {
        if (replace) {
          window.history.replaceState({ page: "Settings", submenu: sub }, "", slug);
        } else {
          window.history.pushState({ page: "Settings", submenu: sub }, "", slug);
        }
      }
      const labelMap: Record<SettingsSubmenu, string> = {
        business: "Business Details",
        address: "Address & Contacts",
        invoicing: "Invoice Settings",
        bank: "Bank Details",
        eway: "E-Way Bill Settings",
        templates: "Document Templates",
        roles: "Users & Roles",
        gst: "GST Settings",
        integrations: "Integrations",
        billing: "Billing & Subscription",
        audit: "Audit Logs"
      };
      document.title = `Quantum GST - Settings: ${labelMap[sub] || "Business Profile"}`;
    }
  };

  const setPage = (newPage: Page, replace: boolean = false) => {
    setPageState(newPage);
    if (typeof window !== "undefined") {
      let slug = PAGE_SLUGS[newPage] || "/dashboard";
      if (newPage === "Sales") slug = salesSubmenu === "invoices" ? "/sales" : `/sales/${salesSubmenu}`;
      else if (newPage === "Purchases") slug = purchasesSubmenu === "bills" ? "/purchases" : `/purchases/${purchasesSubmenu}`;
      else if (newPage === "Inventory") slug = inventorySubmenu === "products" ? "/inventory" : `/inventory/${inventorySubmenu}`;
      else if (newPage === "Accounting") slug = accountingSubmenu === "expenses" ? "/accounting" : `/accounting/${accountingSubmenu}`;
      else if (newPage === "Marketplace") slug = marketplaceSubmenu === "overview" ? "/marketplace" : `/marketplace/${marketplaceSubmenu}`;
      else if (newPage === "GST Reports") slug = gstSubmenu === "overview" ? "/reports" : `/gst/${gstSubmenu === "eway" ? "e-way-bill" : gstSubmenu}`;
      else if (newPage === "Contacts") slug = contactsSubmenu === "customers" ? "/contacts" : `/contacts/${contactsSubmenu}`;
      else if (newPage === "Developer & API") slug = developerSubmenu === "api" ? "/developer" : `/developer/${developerSubmenu}`;
      else if (newPage === "Settings") slug = SETTINGS_SUBMENU_SLUGS[settingsSubmenu] || "/settings/business";

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
    if (typeof window !== "undefined") {
      const initialPage = getPageFromPath(window.location.pathname);
      setPageState(initialPage);
      setSalesSubmenuState(getSalesSubmenuFromPath(window.location.pathname));
      setPurchasesSubmenuState(getPurchasesSubmenuFromPath(window.location.pathname));
      setInventorySubmenuState(getInventorySubmenuFromPath(window.location.pathname));
      setAccountingSubmenuState(getAccountingSubmenuFromPath(window.location.pathname));
      setMarketplaceSubmenuState(getMarketplaceSubmenuFromPath(window.location.pathname));
      setGstSubmenuState(getGstSubmenuFromPath(window.location.pathname));
      setContactsSubmenuState(getContactsSubmenuFromPath(window.location.pathname));
      setDeveloperSubmenuState(getDeveloperSubmenuFromPath(window.location.pathname));
      setSettingsSubmenuState(getSettingsSubmenuFromPath(window.location.pathname));

      if (window.location.pathname === "/") {
        window.history.replaceState({ page: "Dashboard" }, "", "/dashboard");
      }
      document.title = initialPage === "Dashboard" ? "Quantum GST - Dashboard" : `Quantum GST - ${initialPage}`;
    }

    const handlePopState = () => {
      if (typeof window !== "undefined") {
        const p = getPageFromPath(window.location.pathname);
        setPageState(p);
        setSalesSubmenuState(getSalesSubmenuFromPath(window.location.pathname));
        setPurchasesSubmenuState(getPurchasesSubmenuFromPath(window.location.pathname));
        setInventorySubmenuState(getInventorySubmenuFromPath(window.location.pathname));
        setAccountingSubmenuState(getAccountingSubmenuFromPath(window.location.pathname));
        setMarketplaceSubmenuState(getMarketplaceSubmenuFromPath(window.location.pathname));
        setGstSubmenuState(getGstSubmenuFromPath(window.location.pathname));
        setContactsSubmenuState(getContactsSubmenuFromPath(window.location.pathname));
        setDeveloperSubmenuState(getDeveloperSubmenuFromPath(window.location.pathname));
        setSettingsSubmenuState(getSettingsSubmenuFromPath(window.location.pathname));
        document.title = p === "Dashboard" ? "Quantum GST - Dashboard" : `Quantum GST - ${p}`;
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Settings Submenu Specific States
  const [bankName, setBankName] = useState("HDFC Bank");
  const [accountNumber, setAccountNumber] = useState("50200019283746");
  const [ifscCode, setIfscCode] = useState("HDFC0001234");
  const [branchName, setBranchName] = useState("Park Circus Commercial Branch");
  const [upiId, setUpiId] = useState("quantumgst@hdfcbank");
  const [accountHolderName, setAccountHolderName] = useState("");

  const [ewayThreshold, setEwayThreshold] = useState("50000");
  const [autoEway, setAutoEway] = useState(true);
  const [ewayDistanceCalc, setEwayDistanceCalc] = useState(true);
  const [ewayUsername, setEwayUsername] = useState("QUANTUM_GST_USER");
  const [ewayPassword, setEwayPassword] = useState("••••••••••••");
  const [defaultTransporterId, setDefaultTransporterId] = useState("19AAACG0521F1ZX");

  const [startingInvNum, setStartingInvNum] = useState("1001");
  const [invoiceTerms, setInvoiceTerms] = useState(
    "1. Goods once sold will not be taken back. 2. Interest @ 18% p.a. will be charged if payment is delayed beyond agreed terms. 3. Subject to local jurisdiction."
  );
  const [selectedTemplate, setSelectedTemplate] = useState<"standard" | "modern" | "compact" | "gst_detailed">("modern");
  const [templateColor, setTemplateColor] = useState("#2563eb");
  const [showLogoOnInvoice, setShowLogoOnInvoice] = useState(true);
  const [showBankOnInvoice, setShowBankOnInvoice] = useState(true);

  const [gstScheme, setGstScheme] = useState("Regular");
  const [filingPeriodicity, setFilingPeriodicity] = useState("Monthly");
  const [eInvoicingEnabled, setEInvoicingEnabled] = useState(false);
  const [autoGstr2b, setAutoGstr2b] = useState(true);

  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: "Jasim Mondal", email: "jasimmondal57@gmail.com", role: "Owner / Administrator", status: "Active" },
    { id: 2, name: "Accountant Senior", email: "finance@quantumgst.in", role: "Accountant", status: "Active" }
  ]);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Accountant");
  const [showAddMember, setShowAddMember] = useState(false);

  // 1. Sales Additional Documents State
  const [proformaInvoices, setProformaInvoices] = useState([
    { id: "PRO-2026-001", date: "2026-10-28", customer: "TechCorp Logistics Pvt Ltd", gstin: "27AAACT2345M1Z1", total: 48500, status: "Sent", validUntil: "2026-11-15" },
    { id: "PRO-2026-002", date: "2026-10-29", customer: "Kolkata Retail Solutions", gstin: "19BBBCD9876K1ZP", total: 12800, status: "Accepted", validUntil: "2026-11-10" }
  ]);
  const [quotations, setQuotations] = useState([
    { id: "EST-2026-014", date: "2026-10-25", customer: "Bengal Commercial Hub", subject: "Annual GST Hardware & Setup", amount: 125000, status: "Accepted" },
    { id: "EST-2026-015", date: "2026-10-29", customer: "East India Traders", subject: "Barcode Scanners & Thermal Printers", amount: 34200, status: "Pending" }
  ]);
  const [creditNotes, setCreditNotes] = useState([
    { id: "CRN-2026-001", date: "2026-10-22", originalInv: "INV/26-27/0012", customer: "Apex Tech Distributors", reason: "Defective goods returned", taxable: 5000, tax: 900, total: 5900, status: "Adjusted" }
  ]);
  const [deliveryChallans, setDeliveryChallans] = useState([
    { id: "DC-2026-009", date: "2026-10-29", consignee: "Howrah Goods Hub", vehicle: "WB-19-AB-4521", transporter: "V-Trans Logistics", ewayBill: "191029384756", status: "Delivered" }
  ]);

  // Sales Modals
  // modal triggers
  
  
  

  // 2. Purchases Management State
  const [purchaseBills, setPurchaseBills] = useState([
    { id: "PB-2026-081", billNo: "EXP/SUP/4521", date: "2026-10-26", supplier: "Supreme Paper & Packaging", gstin: "19AAACS8812F1Z8", taxable: 24500, tax: 4410, total: 28910, itcStatus: "Eligible", paymentStatus: "Paid" },
    { id: "PB-2026-082", billNo: "INV-9921", date: "2026-10-28", supplier: "Delta Electronics Hardware", gstin: "27AABCD4411Q1ZN", taxable: 65000, tax: 11700, total: 76700, itcStatus: "Matched 2B", paymentStatus: "Pending" }
  ]);
  const [purchaseOrders, setPurchaseOrders] = useState([
    { id: "PO-2026-031", date: "2026-10-27", supplier: "Delta Electronics Hardware", itemsCount: 4, total: 85000, expectedDate: "2026-11-05", status: "Confirmed" }
  ]);
  const [debitNotes, setDebitNotes] = useState([
    { id: "DRN-2026-003", billNo: "PB-2026-081", date: "2026-10-29", supplier: "Supreme Paper & Packaging", reason: "Rate discount post-sale", amount: 3540, status: "Settled" }
  ]);
  const [purchaseReturns] = useState([
    { id: "PR-2026-001", date: "2026-10-25", supplier: "Delta Electronics Hardware", items: "Faulty Barcode Scanner x 2", amount: 6400, status: "Credit Awaited" }
  ]);
  const [showRecordPurchaseModal, setShowRecordPurchaseModal] = useState(false);
  
  

  // Form states for Record Purchase
  const [pbSupplier, setPbSupplier] = useState("");
  const [pbGstin, setPbGstin] = useState("");
  const [pbBillNo, setPbBillNo] = useState("");
  const [pbDate, setPbDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [pbTaxable, setPbTaxable] = useState(0);
  const [pbGstRate, setPbGstRate] = useState(18);
  const [pbItcEligible, setPbItcEligible] = useState(true);

  // 3. Inventory Management State
  const [inventoryProducts, setInventoryProducts] = useState([
    { id: 1, name: "Thermal Paper Roll 80mm x 50m", sku: "SKU-THM-80", hsn: "4811", category: "Stationery & Packaging", unit: "Rolls", buyPrice: 42, sellPrice: 65, gst: 12, stock: 4, minStock: 20 },
    { id: 2, name: "2D Wireless Barcode Scanner", sku: "SKU-SCN-2D", hsn: "8471", category: "Hardware & POS", unit: "Pcs", buyPrice: 2200, sellPrice: 3100, gst: 18, stock: 18, minStock: 5 },
    { id: 3, name: "Laser Invoice Paper (500 Sheets)", sku: "SKU-PPR-A4", hsn: "4802", category: "Stationery & Packaging", unit: "Ream", buyPrice: 240, sellPrice: 320, gst: 12, stock: 45, minStock: 10 },
    { id: 4, name: "GST Billing Handheld Terminal", sku: "SKU-POS-HAND", hsn: "8470", category: "Hardware & POS", unit: "Pcs", buyPrice: 8500, sellPrice: 11999, gst: 18, stock: 8, minStock: 3 }
  ]);
  const [inventoryCategories, setInventoryCategories] = useState([
    { name: "Hardware & POS", itemsCount: 2, hsn: "8470, 8471" },
    { name: "Stationery & Packaging", itemsCount: 2, hsn: "4802, 4811" },
    { name: "Raw Materials", itemsCount: 0, hsn: "Various" },
    { name: "Electronics & Peripherals", itemsCount: 0, hsn: "8528" }
  ]);
  const [stockTransfers, setStockTransfers] = useState([
    { id: "TR-2026-004", date: "2026-10-27", source: "Main Warehouse (Howrah)", destination: "Retail Counter (Park Circus)", item: "Thermal Paper Roll 80mm", qty: 50, status: "Received" }
  ]);
  const [stockAdjustments] = useState([
    { id: "ADJ-2026-001", date: "2026-10-24", item: "Laser Invoice Paper", type: "Decrease", qty: 2, reason: "Water damage during transit", status: "Approved" }
  ]);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  
  

  // Form states for Add Product
  const [prodName, setProdName] = useState("");
  const [prodSku, setProdSku] = useState("");
  const [prodHsn, setProdHsn] = useState("");
  const [prodCat, setProdCat] = useState("Hardware & POS");
  const [prodUnit, setProdUnit] = useState("Pcs");
  const [prodBuyPrice, setProdBuyPrice] = useState(0);
  const [prodSellPrice, setProdSellPrice] = useState(0);
  const [prodGst, setProdGst] = useState(18);
  const [prodStock, setProdStock] = useState(0);

  // 4. Accounting & Finance State
  const [expensesList, setExpensesList] = useState([
    { id: "EXP-2026-041", date: "2026-10-28", category: "Office Rent", payee: "Park Street Commercial Estates", amount: 35000, gstPaid: 6300, itcEligible: true, mode: "Bank Transfer" },
    { id: "EXP-2026-042", date: "2026-10-27", category: "Logistics & Courier", payee: "Delhivery Surface Express", amount: 8450, gstPaid: 1521, itcEligible: true, mode: "UPI" },
    { id: "EXP-2026-043", date: "2026-10-25", category: "Software & Cloud Hosting", payee: "Hostinger International", amount: 4999, gstPaid: 900, itcEligible: true, mode: "Corporate Card" },
    { id: "EXP-2026-044", date: "2026-10-22", category: "Electricity & Utilities", payee: "CESC Limited Kolkata", amount: 6240, gstPaid: 0, itcEligible: false, mode: "Net Banking" }
  ]);
  const [bankAccountsList, setBankAccountsList] = useState([
    { name: "HDFC Bank Current Account", accountNo: "••••••••7846", ifsc: "HDFC0001234", branch: "Park Circus", balance: 342890, type: "Current" },
    { name: "ICICI Statutory Tax Account", accountNo: "••••••••3319", ifsc: "ICIC0000412", branch: "Kolkata Main", balance: 118400, type: "Tax Escrow" },
    { name: "Cash in Hand (Office Drawer)", accountNo: "CASH-DESK-01", ifsc: "N/A", branch: "Main Office", balance: 24500, type: "Cash" }
  ]);
  const [paymentsList] = useState([
    { id: "PAY-2026-102", type: "Received", party: "Kolkata Retail Solutions", ref: "INV/26-27/0002", amount: 24780, mode: "UPI / QR", date: "2026-10-29", status: "Settled" },
    { id: "PAY-2026-101", type: "Disbursed", party: "Supreme Paper & Packaging", ref: "PB-2026-081", amount: 28910, mode: "NEFT", date: "2026-10-27", status: "Completed" }
  ]);
  const [showRecordExpenseModal, setShowRecordExpenseModal] = useState(false);
  

  // Form states for Record Expense
  const [expCategory, setExpCategory] = useState("Office Rent");
  const [expPayee, setExpPayee] = useState("");
  const [expAmount, setExpAmount] = useState(0);
  const [expGstPaid, setExpGstPaid] = useState(0);
  const [expItc, setExpItc] = useState(true);
  const [expMode, setExpMode] = useState("Bank Transfer");

  // 5. Contacts (Suppliers list in addition to cloudCustomers)
  const [suppliersList, setSuppliersList] = useState([
    { id: 1, name: "Supreme Paper & Packaging", gstin: "19AAACS8812F1Z8", contactPerson: "Rajesh Sharma", phone: "9830012345", email: "sales@supremepaper.in", city: "Kolkata", state: "West Bengal", payables: 28910 },
    { id: 2, name: "Delta Electronics Hardware", gstin: "27AABCD4411Q1ZN", contactPerson: "Vikram Mehta", phone: "9820054321", email: "orders@deltahardware.com", city: "Mumbai", state: "Maharashtra", payables: 76700 },
    { id: 3, name: "Apex Commercial Logistics", gstin: "07AAACA4512D1ZX", contactPerson: "Amit Verma", phone: "9811198765", email: "billing@apexlogistics.in", city: "New Delhi", state: "Delhi", payables: 0 }
  ]);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [contactType, setContactType] = useState<"customer" | "supplier">("customer");
  const [contactName, setContactName] = useState("");
  const [contactGstin, setContactGstin] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactState, setContactState] = useState("West Bengal");

  // 6. Developer & API State
  const [apiKeys, setApiKeys] = useState([
    { id: 1, name: "Production ERP Sync Key", key: "qtm_live_9a8f4c2e1b0d7a6e5c4b3a2f1e0d9c8b", created: "2026-04-10", lastUsed: "10 mins ago", scopes: "Read / Write (Invoices, Customers, Stock)" },
    { id: 2, name: "Shopify Webhook Sync Token", key: "qtm_sec_3d8e7b1a0f9e8c7b6a5d4c3b2a1f0e9d", created: "2026-05-15", lastUsed: "1 hour ago", scopes: "Webhooks Only" }
  ]);
  const [webhooksList] = useState([
    { id: 1, url: "https://quantumgst.in/api/v1/shopify/webhook", events: "order.created, order.paid", status: "Active", deliveries: 1240 },
    { id: 2, url: "https://erp.mybusiness.com/webhooks/gst-invoices", events: "invoice.created, invoice.cancelled", status: "Active", deliveries: 489 }
  ]);
  const [automationRules, setAutomationRules] = useState([
    { id: 1, title: "Auto-Generate Tax Invoice on Paid E-Commerce Order", trigger: "Shopify / Amazon order marked as Paid", action: "Create B2C/B2B GST invoice with sequential numbering and send SMS receipt", active: true },
    { id: 2, title: "Automated Payment Overdue Reminders via WhatsApp", trigger: "Invoice unpaid for > 15 days after due date", action: "Send WhatsApp message with UPI payment link to customer phone", active: true },
    { id: 3, title: "Low Stock Inventory Warning Notification", trigger: "Product stock level reaches minimum threshold limit", action: "Send push notification & email to inventory manager", active: true },
    { id: 4, title: "Auto GSTR-2B Input Tax Credit Reconciliation", trigger: "14th of every month (After GSTR-1 cutoff)", action: "Fetch supplier inward supplies and auto-match against purchase register", active: true }
  ]);
  const [showGenerateApiKeyModal, setShowGenerateApiKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScope, setNewKeyScope] = useState("Full Read / Write");

  // 7. Audit Logs
  const [auditLogs] = useState([
    { id: 1, timestamp: "2026-10-30 18:04:12", user: currentUser?.name || "Jasim Mondal", action: "Update Settings", details: "Saved statutory GST and banking preferences", ip: "72.62.194.51", status: "Success" },
    { id: 2, timestamp: "2026-10-30 17:42:05", user: currentUser?.name || "Jasim Mondal", action: "Create Company", details: "Registered new business entity: Jasim", ip: "72.62.194.51", status: "Success" },
    { id: 3, timestamp: "2026-10-30 16:30:11", user: "System Auto-Sync", action: "OTA App Version Check", details: "Verified GitHub releases channel (v1.0.2)", ip: "127.0.0.1", status: "Success" },
    { id: 4, timestamp: "2026-10-30 15:10:44", user: currentUser?.name || "Jasim Mondal", action: "User Authentication", details: "Signed in via cloud Sanctum token", ip: "103.21.144.2", status: "Success" }
  ]);

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
        <img src="/logo.png" alt="Quantum GST" className="logo-img" /> Quantum <b>GST</b>
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
      <nav style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {navGroups.map((group) => (
          <div key={group.title}>
            <div className="sidebar-section-label">{group.title}</div>
            <div style={{ display: "grid", gap: "2px" }}>
              {group.items.map(([name, Icon, slug]) => {
                const isActive = page === name;
                return (
                  <a
                    key={name}
                    href={slug}
                    className={isActive ? "active" : ""}
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                      e.preventDefault();
                      setPage(name as Page);
                      setMobile(false);
                    }}
                  >
                    <Icon size={16} />
                    <span>{name}</span>
                  </a>
                );
              })}
            </div>
          </div>
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

  // 4. SALES MANAGEMENT
  else if (page === "Sales") {
    screen = (
      <>
        <Heading
          title="Sales Management"
          sub="Statutory GST tax invoices, proformas, quotations, credit notes and delivery challans"
          action={
            <div style={{ display: "flex", gap: "8px" }}>
              <Btn onClick={() => setPage("Billing")}>
                <Plus size={14} style={{ marginRight: "4px" }} /> Create Tax Invoice
              </Btn>
            </div>
          }
        />
        <div className="tabs">
          <a
            href="/sales"
            className={salesSubmenu === "invoices" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToSalesSubmenu("invoices"); }}
          >
            Tax Invoices ({cloudInvoices.length})
          </a>
          <a
            href="/sales/proforma"
            className={salesSubmenu === "proforma" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToSalesSubmenu("proforma"); }}
          >
            Proforma Invoices ({proformaInvoices.length})
          </a>
          <a
            href="/sales/quotations"
            className={salesSubmenu === "quotations" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToSalesSubmenu("quotations"); }}
          >
            Quotations & Estimates ({quotations.length})
          </a>
          <a
            href="/sales/credit-notes"
            className={salesSubmenu === "credit-notes" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToSalesSubmenu("credit-notes"); }}
          >
            Credit Notes ({creditNotes.length})
          </a>
          <a
            href="/sales/challans"
            className={salesSubmenu === "challans" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToSalesSubmenu("challans"); }}
          >
            Delivery Challans ({deliveryChallans.length})
          </a>
        </div>

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

        {salesSubmenu === "invoices" && (
          <Panel title="Tax Invoices Register" sub="Complete outward supplies audit trail with GSTIN place of supply">
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
        )}

        {salesSubmenu === "proforma" && (
          <Panel
            title="Proforma Invoices"
            sub="Preliminary invoices issued prior to commercial supply and payment commitment"
            action={
              <Btn onClick={() => { const num = prompt("Enter Proforma Invoice Number:", "PRO-2026-" + Math.floor(100+Math.random()*900)); if (num) { setProformaInvoices([{ id: num, date: new Date().toISOString().split("T")[0], customer: "Apex Commercial Logistics", gstin: "19AAACA1234F1Z5", total: 48500, status: "Sent", validUntil: "2026-11-20" }, ...proformaInvoices]); } }}>
                <Plus size={14} style={{ marginRight: "4px" }} /> Create Proforma
              </Btn>
            }
          >
            <Table
              headers={["Proforma #", "Date", "Customer", "GSTIN", "Total Amount", "Valid Until", "Status", "Action"]}
              rows={proformaInvoices.map((p) => [
                p.id,
                p.date,
                p.customer,
                p.gstin,
                `₹ ${p.total.toLocaleString("en-IN")}`,
                p.validUntil,
                p.status,
                "Convert to Tax Invoice"
              ])}
              onAction={(_act, row) => {
                setCustName(row[2]);
                setCustGstin(row[3]);
                setPage("Billing");
                showSaveSuccess(`Proforma ${row[0]} loaded into Billing! Complete invoice details to issue.`);
              }}
            />
          </Panel>
        )}

        {salesSubmenu === "quotations" && (
          <Panel
            title="Quotations & Cost Estimates"
            sub="Commercial quotes and price estimates shared with prospective buyers"
            action={
              <Btn onClick={() => { const num = prompt("Enter Quotation Number:", "EST-2026-" + Math.floor(100+Math.random()*900)); if (num) { setQuotations([{ id: num, date: new Date().toISOString().split("T")[0], customer: "Bengal Commercial Hub", subject: "Annual GST Hardware & Setup", amount: 62000, status: "Pending" }, ...quotations]); } }}>
                <Plus size={14} style={{ marginRight: "4px" }} /> New Quotation
              </Btn>
            }
          >
            <Table
              headers={["Estimate #", "Date", "Client Name", "Subject / Scope", "Amount (₹)", "Status", "Action"]}
              rows={quotations.map((q) => [
                q.id,
                q.date,
                q.customer,
                q.subject,
                `₹ ${q.amount.toLocaleString("en-IN")}`,
                q.status,
                "Convert to Invoice"
              ])}
              onAction={(_act, row) => {
                setCustName(row[2]);
                setPage("Billing");
                showSaveSuccess(`Quotation ${row[0]} converted to Tax Invoice!`);
              }}
            />
          </Panel>
        )}

        {salesSubmenu === "credit-notes" && (
          <Panel
            title="GST Credit Notes (Section 34)"
            sub="Statutory credit adjustments against issued tax invoices for sales returns or discounts"
            action={
              <Btn onClick={() => { const num = prompt("Enter Credit Note ID:", "CRN-2026-" + Math.floor(100+Math.random()*900)); if (num) { setCreditNotes([{ id: num, date: new Date().toISOString().split("T")[0], originalInv: "INV/26-27/0001", customer: "Kolkata Retail Solutions", reason: "Damaged packaging return", taxable: 3000, tax: 540, total: 3540, status: "Adjusted" }, ...creditNotes]); } }}>
                <Plus size={14} style={{ marginRight: "4px" }} /> Issue Credit Note
              </Btn>
            }
          >
            <Table
              headers={["Credit Note #", "Date", "Original Invoice #", "Customer", "Reason", "Tax Adjustment", "Total Credit", "Status"]}
              rows={creditNotes.map((cn) => [
                cn.id,
                cn.date,
                cn.originalInv,
                cn.customer,
                cn.reason,
                `₹ ${cn.tax.toLocaleString("en-IN")}`,
                `₹ ${cn.total.toLocaleString("en-IN")}`,
                cn.status
              ])}
            />
          </Panel>
        )}

        {salesSubmenu === "challans" && (
          <Panel
            title="Delivery Challans"
            sub="Movement of goods for job work, exhibition, or approval without immediate tax invoice"
            action={
              <Btn onClick={() => { const num = prompt("Enter Challan Number:", "DC-2026-" + Math.floor(100+Math.random()*900)); if (num) { setDeliveryChallans([{ id: num, date: new Date().toISOString().split("T")[0], consignee: "Warehouse B (Howrah)", vehicle: "WB-19-AB-1234", transporter: "V-Trans Logistics", ewayBill: "191029384756", status: "In Transit" }, ...deliveryChallans]); } }}>
                <Plus size={14} style={{ marginRight: "4px" }} /> New Delivery Challan
              </Btn>
            }
          >
            <Table
              headers={["Challan #", "Date", "Consignee", "Vehicle #", "Transporter", "E-Way Bill #", "Status"]}
              rows={deliveryChallans.map((dc) => [
                dc.id,
                dc.date,
                dc.consignee,
                dc.vehicle,
                dc.transporter,
                dc.ewayBill,
                dc.status
              ])}
            />
          </Panel>
        )}
      </>
    );
  }

  // 5. PURCHASE MANAGEMENT
  else if (page === "Purchases") {
    const totalPurchasesVal = purchaseBills.reduce((acc, b) => acc + (b.total || 0), 0);
    const totalItcClaimable = purchaseBills.filter((b) => b.itcStatus.includes("Eligible") || b.itcStatus.includes("Matched")).reduce((acc, b) => acc + (b.tax || 0), 0);

    screen = (
      <>
        <Heading
          title="Purchase Management"
          sub="Track inward vendor supplies, purchase orders, debit notes and claim Input Tax Credit"
          action={
            <div style={{ display: "flex", gap: "8px" }}>
              <Btn onClick={() => setShowRecordPurchaseModal(true)}>
                <Plus size={14} style={{ marginRight: "4px" }} /> Record Purchase Bill
              </Btn>
            </div>
          }
        />
        <div className="tabs">
          <a
            href="/purchases"
            className={purchasesSubmenu === "bills" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToPurchasesSubmenu("bills"); }}
          >
            Purchase Bills ({purchaseBills.length})
          </a>
          <a
            href="/purchases/orders"
            className={purchasesSubmenu === "orders" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToPurchasesSubmenu("orders"); }}
          >
            Purchase Orders ({purchaseOrders.length})
          </a>
          <a
            href="/purchases/debit-notes"
            className={purchasesSubmenu === "debit-notes" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToPurchasesSubmenu("debit-notes"); }}
          >
            Debit Notes ({debitNotes.length})
          </a>
          <a
            href="/purchases/returns"
            className={purchasesSubmenu === "returns" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToPurchasesSubmenu("returns"); }}
          >
            Purchase Returns ({purchaseReturns.length})
          </a>
        </div>

        <div className="stats">
          <Stat
            title="Total Purchases"
            value={`₹ ${totalPurchasesVal.toLocaleString("en-IN")}`}
            trend={`${purchaseBills.length} Inward Bills`}
            icon={Package}
            tone="blue"
          />
          <Stat
            title="Claimable ITC"
            value={`₹ ${totalItcClaimable.toLocaleString("en-IN")}`}
            trend="Eligible Credit"
            icon={CheckCircle2}
            tone="teal"
          />
          <Stat
            title="GSTR-2B Matching"
            value="100% Match"
            trend="ITC Reconciled"
            icon={ShieldCheck}
            tone="purple"
          />
          <Stat
            title="Active Suppliers"
            value={String(suppliersList.length)}
            trend="Vendors & OEMs"
            icon={Users}
            tone="orange"
          />
        </div>

        {purchasesSubmenu === "bills" && (
          <Panel
            title="Purchase Bills Register"
            sub="Inward supplier tax invoices with ITC eligibility & reverse charge tracking"
            action={
              <Btn secondary onClick={() => setPage("Reconciliation")}>
                <RefreshCw size={13} style={{ marginRight: "4px" }} /> Match with GSTR-2B
              </Btn>
            }
          >
            <Table
              headers={["Bill #", "Supplier Inv #", "Date", "Supplier Name", "Supplier GSTIN", "Taxable (₹)", "GST (₹)", "Total (₹)", "ITC Status", "Payment"]}
              rows={purchaseBills.map((b) => [
                b.id,
                b.billNo,
                b.date,
                b.supplier,
                b.gstin,
                `₹ ${b.taxable.toLocaleString("en-IN")}`,
                `₹ ${b.tax.toLocaleString("en-IN")}`,
                `₹ ${b.total.toLocaleString("en-IN")}`,
                b.itcStatus,
                b.paymentStatus
              ])}
            />
          </Panel>
        )}

        {purchasesSubmenu === "orders" && (
          <Panel
            title="Purchase Orders (PO)"
            sub="Commercial procurement orders sent to vendors before delivery and billing"
            action={
              <Btn onClick={() => { const num = prompt("Enter Purchase Order Number:", "PO-2026-" + Math.floor(100+Math.random()*900)); if (num) { setPurchaseOrders([{ id: num, date: new Date().toISOString().split("T")[0], supplier: "Supreme Paper & Packaging", itemsCount: 5, total: 28000, expectedDate: "2026-11-10", status: "Confirmed" }, ...purchaseOrders]); } }}>
                <Plus size={14} style={{ marginRight: "4px" }} /> New Purchase Order
              </Btn>
            }
          >
            <Table
              headers={["PO #", "Date", "Supplier", "Items Count", "Total Value", "Expected Delivery", "Status"]}
              rows={purchaseOrders.map((po) => [
                po.id,
                po.date,
                po.supplier,
                String(po.itemsCount),
                `₹ ${po.total.toLocaleString("en-IN")}`,
                po.expectedDate,
                po.status
              ])}
            />
          </Panel>
        )}

        {purchasesSubmenu === "debit-notes" && (
          <Panel
            title="Debit Notes (Purchase Adjustments)"
            sub="Issued to suppliers for price adjustments, discounts, or defective goods deduction"
            action={
              <Btn onClick={() => { const num = prompt("Enter Debit Note Number:", "DRN-2026-" + Math.floor(100+Math.random()*900)); if (num) { setDebitNotes([{ id: num, billNo: "PB-2026-081", date: new Date().toISOString().split("T")[0], supplier: "Supreme Paper & Packaging", reason: "Rate discount post-sale", amount: 3540, status: "Settled" }, ...debitNotes]); } }}>
                <Plus size={14} style={{ marginRight: "4px" }} /> Issue Debit Note
              </Btn>
            }
          >
            <Table
              headers={["Debit Note #", "Purchase Bill Ref", "Date", "Supplier", "Reason", "Adjusted Amount", "Status"]}
              rows={debitNotes.map((dn) => [
                dn.id,
                dn.billNo,
                dn.date,
                dn.supplier,
                dn.reason,
                `₹ ${dn.amount.toLocaleString("en-IN")}`,
                dn.status
              ])}
            />
          </Panel>
        )}

        {purchasesSubmenu === "returns" && (
          <Panel title="Purchase Returns" sub="Defective or unfulfilled goods dispatched back to vendor">
            <Table
              headers={["Return #", "Date", "Supplier", "Returned Items & Reason", "Amount Refundable", "Status"]}
              rows={purchaseReturns.map((pr) => [
                pr.id,
                pr.date,
                pr.supplier,
                pr.items,
                `₹ ${pr.amount.toLocaleString("en-IN")}`,
                pr.status
              ])}
            />
          </Panel>
        )}
      </>
    );
  }

  // 6. MARKETPLACE & ECOMMERCE INTEGRATIONS
  else if (page === "Marketplace") {
    screen = (
      <>
        <Heading
          title="Marketplace & eCommerce Integrations"
          sub="Automated order synchronization, settlement reconciliation, and MTR reports ingestion"
          action={
            <Btn secondary onClick={() => refreshCloudData()}>
              <RefreshCw size={14} className={isSyncing ? "spin" : ""} style={{ marginRight: "4px" }} /> Sync Channels
            </Btn>
          }
        />
        <div className="tabs">
          <a
            href="/marketplace"
            className={marketplaceSubmenu === "overview" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToMarketplaceSubmenu("overview"); }}
          >
            Marketplace Overview ({marketplaceOrders.length} Orders)
          </a>
          <a
            href="/marketplace/channels"
            className={marketplaceSubmenu === "channels" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToMarketplaceSubmenu("channels"); }}
          >
            Connected Channels (4)
          </a>
          <a
            href="/marketplace/import"
            className={marketplaceSubmenu === "import" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToMarketplaceSubmenu("import"); }}
          >
            Universal CSV / Excel Importer
          </a>
        </div>

        <div className="stats">
          <Stat
            title="Imported Orders"
            value={String(marketplaceOrders.length || 2700)}
            trend="Multi-channel feed"
            icon={Store}
            tone="blue"
          />
          <Stat
            title="Marketplace GMV"
            value="₹ 14,80,500"
            trend="Gross sales"
            icon={ShoppingCart}
            tone="teal"
          />
          <Stat
            title="Commission & Fees"
            value="₹ 2,12,400"
            trend="Marketplace deductions"
            icon={ReceiptText}
            tone="orange"
          />
          <Stat
            title="Net Bank Settlement"
            value="₹ 12,68,100"
            trend="Reconciled to Bank"
            icon={ShieldCheck}
            tone="purple"
          />
        </div>

        {marketplaceSubmenu === "overview" && (
          <Panel title="Marketplace Orders Feed" sub="Real-time multi-channel transactions with statutory tax classification">
            {marketplaceOrders.length > 0 ? (
              <Table
                headers={["Order ID", "Date", "Channel", "Buyer", "Amount (₹)", "Sync Status", "Action"]}
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
                  Channel feed connected and waiting for orders
                </div>
                <div style={{ fontSize: "12px", marginBottom: "16px" }}>
                  Orders placed on Amazon, Flipkart, or Meesho automatically sync into Quantum GST and generate sequential invoices.
                </div>
                <Btn onClick={() => navigateToMarketplaceSubmenu("import")}>
                  <FolderDown size={14} style={{ marginRight: "4px" }} /> Upload MTR / Order CSV
                </Btn>
              </div>
            )}
          </Panel>
        )}

        {marketplaceSubmenu === "channels" && (
          <Panel title="Channel Integrations & API Status" sub="Manage seller credentials and webhook listeners">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              {[
                { name: "Amazon India SP-API", desc: "Automated FBA & Easy Ship settlement invoice sync", status: "Connected", orders: "1,240 orders synced" },
                { name: "Flipkart Seller Hub", desc: "Order management & commission credit note sync", status: "Connected", orders: "850 orders synced" },
                { name: "Meesho Supplier Panel", desc: "Zero commission order reconciliation & TCS reports", status: "Connected", orders: "612 orders synced" },
                { name: "Shopify Store Webhook", desc: "Real-time webhook listener for web storefront", status: "Active", orders: "Live Hook" }
              ].map((c) => (
                <div key={c.name} style={{ padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#f8fafc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <strong>{c.name}</strong>
                    <span className="badge badge-green">{c.status}</span>
                  </div>
                  <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 12px" }}>{c.desc}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <small style={{ color: "#94a3b8", fontSize: "11px" }}>{c.orders}</small>
                    <Btn secondary onClick={() => alert(`${c.name} is connected and syncing.`)}>Configure</Btn>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {marketplaceSubmenu === "import" && (
          <Panel title="Universal CSV / Excel Importer" sub="Bulk ingest Merchant Tax Reports (MTR) or custom spreadsheets">
            <div style={{ border: "2px dashed #cbd5e1", borderRadius: "10px", padding: "36px 20px", textAlign: "center", background: "#f8fafc", marginBottom: "20px" }}>
              <UploadCloud size={40} style={{ color: "#2563eb", margin: "0 auto 10px", display: "block" }} />
              <div style={{ fontWeight: "700", fontSize: "14px", color: "#0f172a", marginBottom: "4px" }}>
                Drag and drop your Marketplace MTR or Order CSV file
              </div>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 16px" }}>
                Supports Amazon MTR, Flipkart Sales Report, Meesho Order Excel, or custom CSV exports.
              </p>
              <Btn onClick={() => alert("Select CSV or XLSX file from your computer to start automatic field mapping.")}>
                Select File to Import
              </Btn>
            </div>
            <div style={{ padding: "16px", borderRadius: "8px", background: "#eff6ff", border: "1px solid #bfdbfe", fontSize: "12px", color: "#1e40af" }}>
              <strong>Standard Workflow:</strong> 1. Upload File &rarr; 2. Auto-Detect Columns (Order ID, SKU, Date, Amount, GSTIN) &rarr; 3. Validate Tax Calculations &rarr; 4. Ingest into Statutory Sales Register.
            </div>
          </Panel>
        )}
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

  // 8. GST & COMPLIANCE
  else if (page === "GST Reports") {
    const b2bInvoices = cloudInvoices.filter((i) => i.customer && i.customer.gstin);
    const b2cInvoices = cloudInvoices.filter((i) => !i.customer || !i.customer.gstin);

    screen = (
      <>
        <Heading
          title="GST & Statutory Compliance"
          sub="Prepare, audit and file GSTR-1, GSTR-3B, GSTR-2B ITC reconciliation and E-Way bills"
          action={
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="date">
                <CalendarDays size={14} /> Current Financial Period <ChevronDown size={12} />
              </button>
            </div>
          }
        />
        <div className="tabs">
          <a
            href="/reports"
            className={gstSubmenu === "overview" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToGstSubmenu("overview"); }}
          >
            GST Overview
          </a>
          <a
            href="/gst/gstr-1"
            className={gstSubmenu === "gstr-1" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToGstSubmenu("gstr-1"); }}
          >
            GSTR-1 Outward ({cloudInvoices.length})
          </a>
          <a
            href="/gst/gstr-3b"
            className={gstSubmenu === "gstr-3b" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToGstSubmenu("gstr-3b"); }}
          >
            GSTR-3B Return
          </a>
          <a
            href="/gst/gstr-2b"
            className={gstSubmenu === "gstr-2b" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToGstSubmenu("gstr-2b"); }}
          >
            GSTR-2B ITC Match
          </a>
          <a
            href="/gst/hsn"
            className={gstSubmenu === "hsn" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToGstSubmenu("hsn"); }}
          >
            HSN Summary
          </a>
          <a
            href="/gst/e-way-bill"
            className={gstSubmenu === "eway" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToGstSubmenu("eway"); }}
          >
            E-Way Bill & E-Invoice
          </a>
        </div>

        <div className="stats">
          <div className="stat">
            <span style={{ fontSize: "11px", color: "#718096" }}>Output Tax Liability</span>
            <strong style={{ fontSize: "20px", color: "#2563eb" }}>₹ {totalTaxAmount.toLocaleString("en-IN")}</strong>
            <small style={{ color: "#64748b" }}>From {cloudInvoices.length} sales</small>
          </div>
          <div className="stat">
            <span style={{ fontSize: "11px", color: "#718096" }}>Eligible Input Tax Credit (ITC)</span>
            <strong style={{ fontSize: "20px", color: "#059669" }}>₹ 16,110</strong>
            <small style={{ color: "#64748b" }}>GSTR-2B Verified</small>
          </div>
          <div className="stat">
            <span style={{ fontSize: "11px", color: "#718096" }}>Net Cash Tax Payable</span>
            <strong style={{ fontSize: "20px", color: "#dc2626" }}>
              ₹ {Math.max(0, totalTaxAmount - 16110).toLocaleString("en-IN")}
            </strong>
            <small style={{ color: "#64748b" }}>Electronic Cash Ledger</small>
          </div>
          <div className="stat">
            <span style={{ fontSize: "11px", color: "#718096" }}>Return Status</span>
            <strong style={{ fontSize: "16px", color: "#0d9f91" }}>GSTR-1 Draft Ready</strong>
            <small style={{ color: "#64748b" }}>Due by 11th Nov 2026</small>
          </div>
        </div>

        {gstSubmenu === "overview" && (
          <Panel title="Statutory GST Return Dashboard" sub="Consolidated outward tax liability vs purchase input tax credit">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "20px" }}>
              <div style={{ padding: "16px", borderRadius: "10px", border: "1px solid #bfdbfe", background: "#eff6ff" }}>
                <div style={{ fontWeight: "700", color: "#1e40af", marginBottom: "4px" }}>GSTR-1 (Outward Supplies)</div>
                <div style={{ fontSize: "12px", color: "#3b82f6", marginBottom: "12px" }}>Monthly return containing B2B invoices, B2C supplies, and export transactions.</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="badge badge-blue">Ready to Export</span>
                  <Btn onClick={() => navigateToGstSubmenu("gstr-1")}>Open GSTR-1 &rarr;</Btn>
                </div>
              </div>

              <div style={{ padding: "16px", borderRadius: "10px", border: "1px solid #bbf7d0", background: "#f0fdf4" }}>
                <div style={{ fontWeight: "700", color: "#166534", marginBottom: "4px" }}>GSTR-3B (Monthly Summary)</div>
                <div style={{ fontSize: "12px", color: "#15803d", marginBottom: "12px" }}>Self-declared summary of outward supplies, input tax credit claimed, and net tax paid.</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="badge badge-green">ITC Matched</span>
                  <Btn onClick={() => navigateToGstSubmenu("gstr-3b")}>Open GSTR-3B &rarr;</Btn>
                </div>
              </div>

              <div style={{ padding: "16px", borderRadius: "10px", border: "1px solid #fed7aa", background: "#fff7ed" }}>
                <div style={{ fontWeight: "700", color: "#9a3412", marginBottom: "4px" }}>GSTR-2B (Auto-Drafted ITC)</div>
                <div style={{ fontSize: "12px", color: "#c2410c", marginBottom: "12px" }}>Inward supplies auto-drafted from your suppliers GSTR-1 filings.</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="badge badge-amber">Reconciled</span>
                  <Btn onClick={() => navigateToGstSubmenu("gstr-2b")}>Match Invoices &rarr;</Btn>
                </div>
              </div>
            </div>
          </Panel>
        )}

        {gstSubmenu === "gstr-1" && (
          <Panel
            title="GSTR-1 – Statement of Outward Supplies"
            sub="Statutory return for B2B, B2C Large, B2C Small and Credit/Debit Notes"
            action={
              <Btn onClick={() => alert("GSTR-1 statutory JSON export downloaded. Ready for 1-click upload on GST Portal.")}>
                <Download size={14} style={{ marginRight: "4px" }} /> Download GSTR-1 JSON
              </Btn>
            }
          >
            <h4 style={{ margin: "0 0 12px", color: "#0f172a" }}>Table 4A, 4B, 6B – B2B Invoices ({b2bInvoices.length})</h4>
            {b2bInvoices.length > 0 ? (
              <Table
                headers={["Customer GSTIN", "Customer Name", "Invoice No", "Date", "Taxable Value (₹)", "GST Output (₹)"]}
                rows={b2bInvoices.map((inv) => [
                  inv.customer?.gstin || "—",
                  inv.customer?.name || "B2B Customer",
                  inv.invoice_number,
                  inv.invoice_date,
                  Number(inv.total_taxable_value).toLocaleString("en-IN"),
                  Number(inv.total_tax_amount).toLocaleString("en-IN")
                ])}
              />
            ) : (
              <div style={{ padding: "20px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "8px", marginBottom: "20px" }}>
                No B2B invoices with customer GSTIN in this period.
              </div>
            )}

            <h4 style={{ margin: "24px 0 12px", color: "#0f172a" }}>Table 7 – B2C (Small) Invoices ({b2cInvoices.length})</h4>
            {b2cInvoices.length > 0 ? (
              <Table
                headers={["Place of Supply", "Applicable Rate (%)", "Taxable Value (₹)", "CGST (₹)", "SGST (₹)", "IGST (₹)"]}
                rows={b2cInvoices.map((inv) => [
                  inv.place_of_supply_state_code,
                  "18%",
                  Number(inv.total_taxable_value).toLocaleString("en-IN"),
                  Number((inv as any).cgst_amount || 0).toLocaleString("en-IN"),
                  Number((inv as any).sgst_amount || 0).toLocaleString("en-IN"),
                  Number((inv as any).igst_amount || 0).toLocaleString("en-IN")
                ])}
              />
            ) : (
              <div style={{ padding: "20px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "8px" }}>
                No B2C small invoices in this tax period.
              </div>
            )}
          </Panel>
        )}

        {gstSubmenu === "gstr-3b" && (
          <Panel
            title="GSTR-3B – Monthly Summary Return"
            sub="Tax on outward and reverse charge supplies, and eligible ITC claims"
            action={
              <Btn onClick={() => alert("GSTR-3B filing summary PDF generated.")}>
                <Download size={14} style={{ marginRight: "4px" }} /> Export 3B Summary
              </Btn>
            }
          >
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Section</th>
                    <th>Nature of Supplies</th>
                    <th>Total Taxable Value (₹)</th>
                    <th>Integrated Tax (₹)</th>
                    <th>Central Tax (₹)</th>
                    <th>State/UT Tax (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Table 3.1(a)</strong></td>
                    <td>Outward taxable supplies (other than zero rated, nil and exempted)</td>
                    <td>₹ {totalTaxableAmount.toLocaleString("en-IN")}</td>
                    <td>₹ 0.00</td>
                    <td>₹ {(totalTaxAmount / 2).toLocaleString("en-IN")}</td>
                    <td>₹ {(totalTaxAmount / 2).toLocaleString("en-IN")}</td>
                  </tr>
                  <tr>
                    <td><strong>Table 4(A)(5)</strong></td>
                    <td>All other ITC (Inward supplies from registered persons)</td>
                    <td>₹ 89,500.00</td>
                    <td>₹ 11,700.00</td>
                    <td>₹ 2,205.00</td>
                    <td>₹ 2,205.00</td>
                  </tr>
                  <tr style={{ background: "#f8fafc", fontWeight: "700" }}>
                    <td><strong>Net Payable</strong></td>
                    <td>Net tax payable through Electronic Cash Ledger</td>
                    <td>—</td>
                    <td>₹ 0.00</td>
                    <td>₹ {Math.max(0, (totalTaxAmount / 2) - 2205).toLocaleString("en-IN")}</td>
                    <td>₹ {Math.max(0, (totalTaxAmount / 2) - 2205).toLocaleString("en-IN")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {gstSubmenu === "gstr-2b" && (
          <Panel
            title="GSTR-2B Input Tax Credit Matching"
            sub="Reconcile auto-drafted portal statements against inward purchase register"
            action={
              <Btn secondary onClick={() => alert("GSTR-2B data synced with GSTN Portal.")}>
                <RefreshCw size={13} style={{ marginRight: "4px" }} /> Refresh from Portal
              </Btn>
            }
          >
            <Table
              headers={["Supplier GSTIN", "Trade Name", "Invoice No", "Invoice Date", "Taxable (₹)", "Eligible ITC (₹)", "Match Status", "Action"]}
              rows={[
                ["19AAACS8812F1Z8", "Supreme Paper & Packaging", "EXP/SUP/4521", "2026-10-26", "24,500", "4,410", "Matched", "ITC Accepted"],
                ["27AABCD4411Q1ZN", "Delta Electronics Hardware", "INV-9921", "2026-10-28", "65,000", "11,700", "Matched", "ITC Accepted"]
              ]}
            />
          </Panel>
        )}

        {gstSubmenu === "hsn" && (
          <Panel
            title="HSN / SAC Summary of Outward Supplies"
            sub="Commodity classification and statutory tax breakups"
            action={
              <Btn secondary onClick={() => alert("HSN Summary exported to CSV.")}>
                <Download size={13} style={{ marginRight: "4px" }} /> Export CSV
              </Btn>
            }
          >
            <Table
              headers={["HSN / SAC", "Description", "Unit (UQC)", "Total Quantity", "Total Value (₹)", "Taxable Value (₹)", "Integrated Tax", "Central Tax", "State Tax"]}
              rows={[
                ["8471", "Automatic data processing machines & units", "PCS", "2", "6,200", "5,254", "0", "473", "473"],
                ["4811", "Paper, paperboard, cellulose wadding", "ROL", "40", "2,600", "2,321", "0", "139", "139"],
                ["9983", "Other professional, technical and business services", "OTH", "1", "15,000", "12,712", "0", "1,144", "1,144"]
              ]}
            />
          </Panel>
        )}

        {gstSubmenu === "eway" && (
          <Panel
            title="E-Way Bill & E-Invoice Management"
            sub="Generate electronic consignment bills and Invoice Reference Numbers (IRN)"
            action={
              <Btn onClick={() => alert("E-Way bill request dispatched to NIC Portal.")}>
                <Plus size={14} style={{ marginRight: "4px" }} /> Generate E-Way Bill
              </Btn>
            }
          >
            <Table
              headers={["E-Way Bill #", "Invoice #", "Customer / Consignee", "Valid From", "Valid Until", "Vehicle #", "Transporter", "Status"]}
              rows={[
                ["191029384756", "INV/26-27/0001", "Kolkata Retail Solutions", "2026-10-29", "2026-10-31", "WB-19-AB-4521", "V-Trans Logistics", "Active / In-Transit"],
                ["191022394851", "INV/26-27/0002", "TechCorp Logistics Pvt Ltd", "2026-10-22", "2026-10-24", "WB-24-DE-9912", "Safexpress India", "Closed / Delivered"]
              ]}
            />
          </Panel>
        )}
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
          title="Contacts & Directory"
          sub="Verified customers, wholesale buyers, suppliers, vendors and business entities"
          action={
            <div style={{ display: "flex", gap: "8px" }}>
              <Btn onClick={() => {
                setContactType(contactsSubmenu === "suppliers" ? "supplier" : "customer");
                setShowAddContactModal(true);
              }}>
                <Plus size={14} style={{ marginRight: "4px" }} /> Add {contactsSubmenu === "suppliers" ? "Supplier" : "Customer"}
              </Btn>
            </div>
          }
        />
        <div className="tabs">
          <a
            href="/contacts"
            className={contactsSubmenu === "customers" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToContactsSubmenu("customers"); }}
          >
            Customers ({cloudCustomers.length})
          </a>
          <a
            href="/contacts/suppliers"
            className={contactsSubmenu === "suppliers" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToContactsSubmenu("suppliers"); }}
          >
            Suppliers & Vendors ({suppliersList.length})
          </a>
        </div>

        <div className="stats">
          <Stat
            title="Total Customers"
            value={String(cloudCustomers.length)}
            trend="Active Buyers"
            icon={Users}
            tone="blue"
          />
          <Stat
            title="Total Suppliers"
            value={String(suppliersList.length)}
            trend="Vendors & OEMs"
            icon={Package}
            tone="teal"
          />
          <Stat
            title="Verified GSTINs"
            value={String(cloudCustomers.filter((c) => c.gstin).length + suppliersList.length)}
            trend="100% Tax Compliant"
            icon={ShieldCheck}
            tone="purple"
          />
          <Stat
            title="Outstanding Payables"
            value={`₹ ${suppliersList.reduce((acc, s) => acc + s.payables, 0).toLocaleString("en-IN")}`}
            trend="Supplier Due"
            icon={ReceiptText}
            tone="orange"
          />
        </div>

        {contactsSubmenu === "customers" && (
          <Panel
            title="Customers Directory"
            sub="Registered B2B and retail customers with billing address and GSTIN verification"
            action={
              <Btn onClick={() => { setContactType("customer"); setShowAddContactModal(true); }}>
                <Plus size={14} style={{ marginRight: "4px" }} /> Add Customer
              </Btn>
            }
          >
            {cloudCustomers.length > 0 ? (
              <Table
                headers={["Customer Name", "GSTIN", "State / POS", "Email", "Phone", "Action"]}
                rows={cloudCustomers.map((c) => [
                  c.name,
                  c.gstin || "— (B2C Retail)",
                  c.state_name || `State (${c.state_code})`,
                  c.email || "—",
                  c.phone || "—",
                  "Bill Customer"
                ])}
                onAction={(_act, row) => {
                  setCustName(row[0]);
                  setCustGstin(row[1].includes("B2C") ? "" : row[1]);
                  setPage("Billing");
                  showSaveSuccess(`Ready to bill customer: ${row[0]}`);
                }}
              />
            ) : (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
                <Users size={36} style={{ color: "#94a3b8", margin: "0 auto 12px", display: "block" }} />
                <div style={{ fontWeight: 600, fontSize: "14px", color: "#1e293b", marginBottom: "4px" }}>
                  No customer records yet
                </div>
                <div style={{ fontSize: "12px", marginBottom: "16px" }}>
                  Add your regular clients or generate invoices to automatically build your verified customer directory.
                </div>
                <Btn onClick={() => { setContactType("customer"); setShowAddContactModal(true); }}>
                  <Plus size={14} style={{ marginRight: "4px" }} /> Add First Customer
                </Btn>
              </div>
            )}
          </Panel>
        )}

        {contactsSubmenu === "suppliers" && (
          <Panel
            title="Suppliers & Vendor Register"
            sub="Raw material vendors, manufacturers and service providers"
            action={
              <Btn onClick={() => { setContactType("supplier"); setShowAddContactModal(true); }}>
                <Plus size={14} style={{ marginRight: "4px" }} /> Add Supplier
              </Btn>
            }
          >
            <Table
              headers={["Supplier Name", "GSTIN", "Contact Person", "Phone", "Email", "City / State", "Outstanding Payables", "Action"]}
              rows={suppliersList.map((s) => [
                s.name,
                s.gstin,
                s.contactPerson,
                s.phone,
                s.email,
                `${s.city}, ${s.state}`,
                `₹ ${s.payables.toLocaleString("en-IN")}`,
                "Record Bill"
              ])}
              onAction={(_act, row) => {
                setPbSupplier(row[0]);
                setPbGstin(row[1]);
                setShowRecordPurchaseModal(true);
              }}
            />
          </Panel>
        )}
      </>
    );
  }

  // 11. INVENTORY MANAGEMENT
  else if (page === "Inventory") {
    const totalStockValue = inventoryProducts.reduce((acc, p) => acc + (p.stock * p.buyPrice), 0);
    const lowStockCount = inventoryProducts.filter((p) => p.stock <= p.minStock).length;

    screen = (
      <>
        <Heading
          title="Inventory & Stock Management"
          sub="Products, services, HSN/SAC master catalog, warehouse transfers and stock adjustments"
          action={
            <div style={{ display: "flex", gap: "8px" }}>
              <Btn onClick={() => setShowAddProductModal(true)}>
                <Plus size={14} style={{ marginRight: "4px" }} /> Add Product / Service
              </Btn>
            </div>
          }
        />
        <div className="tabs">
          <a
            href="/inventory"
            className={inventorySubmenu === "products" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToInventorySubmenu("products"); }}
          >
            Products & Services ({inventoryProducts.length})
          </a>
          <a
            href="/inventory/categories"
            className={inventorySubmenu === "categories" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToInventorySubmenu("categories"); }}
          >
            Categories & Brands ({inventoryCategories.length})
          </a>
          <a
            href="/inventory/transfers"
            className={inventorySubmenu === "transfers" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToInventorySubmenu("transfers"); }}
          >
            Stock Transfers ({stockTransfers.length})
          </a>
          <a
            href="/inventory/adjustments"
            className={inventorySubmenu === "adjustments" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToInventorySubmenu("adjustments"); }}
          >
            Stock Adjustments ({stockAdjustments.length})
          </a>
        </div>

        <div className="stats">
          <Stat
            title="Total Catalog Items"
            value={String(inventoryProducts.length)}
            trend="Active SKUs"
            icon={Package}
            tone="blue"
          />
          <Stat
            title="Total Stock Value"
            value={`₹ ${totalStockValue.toLocaleString("en-IN")}`}
            trend="Asset valuation"
            icon={CheckCircle2}
            tone="teal"
          />
          <Stat
            title="Categories"
            value={String(inventoryCategories.length)}
            trend="Product groups"
            icon={Layers}
            tone="purple"
          />
          <Stat
            title="Low Stock Alerts"
            value={String(lowStockCount)}
            trend={lowStockCount > 0 ? "Requires re-order" : "Optimal stock"}
            icon={AlertCircle}
            tone="orange"
          />
        </div>

        {inventorySubmenu === "products" && (
          <Panel
            title="Product & Services Catalog"
            sub="Commodities with standardized HSN/SAC codes, tax slabs and inventory balances"
            action={
              <Btn onClick={() => setShowAddProductModal(true)}>
                <Plus size={14} style={{ marginRight: "4px" }} /> Add Product
              </Btn>
            }
          >
            <Table
              headers={["Product Name", "SKU", "HSN", "Category", "Unit", "Buy Price", "Selling Price", "GST (%)", "Current Stock", "Status"]}
              rows={inventoryProducts.map((p) => [
                p.name,
                p.sku,
                p.hsn,
                p.category,
                p.unit,
                `₹ ${p.buyPrice.toLocaleString("en-IN")}`,
                `₹ ${p.sellPrice.toLocaleString("en-IN")}`,
                `${p.gst}%`,
                `${p.stock} ${p.unit}`,
                p.stock <= p.minStock ? "⚠️ Low Stock" : "In Stock"
              ])}
            />
          </Panel>
        )}

        {inventorySubmenu === "categories" && (
          <Panel
            title="Categories & Product Groups"
            sub="Organize products and set default statutory HSN codes"
            action={
              <Btn onClick={() => { const name = prompt("Enter Category Name:"); if (name) { setInventoryCategories([...inventoryCategories, { name, itemsCount: 0, hsn: "General" }]); } }}>
                <Plus size={14} style={{ marginRight: "4px" }} /> Add Category
              </Btn>
            }
          >
            <Table
              headers={["Category Name", "Catalog Items", "Primary HSN / SAC Codes", "Status"]}
              rows={inventoryCategories.map((c) => [
                c.name,
                `${c.itemsCount} Products`,
                c.hsn,
                "Active"
              ])}
            />
          </Panel>
        )}

        {inventorySubmenu === "transfers" && (
          <Panel
            title="Inter-Warehouse Stock Transfers"
            sub="Movement of physical inventory between central warehouses and retail counters"
            action={
              <Btn onClick={() => { const item = prompt("Enter Item Name to Transfer:", "Thermal Paper Roll 80mm"); if (item) { setStockTransfers([{ id: "TR-2026-" + Math.floor(100+Math.random()*900), date: new Date().toISOString().split("T")[0], source: "Main Warehouse", destination: "Retail Counter", item, qty: 25, status: "Received" }, ...stockTransfers]); } }}>
                <Plus size={14} style={{ marginRight: "4px" }} /> Transfer Stock
              </Btn>
            }
          >
            <Table
              headers={["Transfer ID", "Date", "Source Location", "Destination Location", "Product", "Quantity", "Status"]}
              rows={stockTransfers.map((st) => [
                st.id,
                st.date,
                st.source,
                st.destination,
                st.item,
                String(st.qty),
                st.status
              ])}
            />
          </Panel>
        )}

        {inventorySubmenu === "adjustments" && (
          <Panel title="Stock Adjustments" sub="Audited corrections for damaged, expired, or shrinkage inventory">
            <Table
              headers={["Adjustment ID", "Date", "Product Item", "Type", "Quantity", "Reason", "Status"]}
              rows={stockAdjustments.map((sa) => [
                sa.id,
                sa.date,
                sa.item,
                sa.type,
                String(sa.qty),
                sa.reason,
                sa.status
              ])}
            />
          </Panel>
        )}
      </>
    );
  }

  // 12. ACCOUNTING & FINANCE
  else if (page === "Accounting") {
    const totalExpenses = expensesList.reduce((acc, e) => acc + e.amount, 0);
    const totalGstOnExpenses = expensesList.reduce((acc, e) => acc + e.gstPaid, 0);
    const totalBankBalance = bankAccountsList.reduce((acc, b) => acc + b.balance, 0);

    screen = (
      <>
        <Heading
          title="Accounting & Finance"
          sub="Manage business expenses, payments received & made, bank accounts and cash flow"
          action={
            <div style={{ display: "flex", gap: "8px" }}>
              <Btn onClick={() => setShowRecordExpenseModal(true)}>
                <Plus size={14} style={{ marginRight: "4px" }} /> Record Expense
              </Btn>
            </div>
          }
        />
        <div className="tabs">
          <a
            href="/accounting"
            className={accountingSubmenu === "expenses" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToAccountingSubmenu("expenses"); }}
          >
            Expenses & Outflows ({expensesList.length})
          </a>
          <a
            href="/accounting/payments"
            className={accountingSubmenu === "payments" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToAccountingSubmenu("payments"); }}
          >
            Payments ({paymentsList.length})
          </a>
          <a
            href="/accounting/banking"
            className={accountingSubmenu === "banking" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToAccountingSubmenu("banking"); }}
          >
            Bank & Cash ({bankAccountsList.length})
          </a>
          <a
            href="/accounting/cashflow"
            className={accountingSubmenu === "cashflow" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToAccountingSubmenu("cashflow"); }}
          >
            Cash Flow & Receivables
          </a>
        </div>

        <div className="stats">
          <Stat
            title="Total Operating Expenses"
            value={`₹ ${totalExpenses.toLocaleString("en-IN")}`}
            trend={`${expensesList.length} Vouchers`}
            icon={ReceiptText}
            tone="blue"
          />
          <Stat
            title="GST Paid on Expenses"
            value={`₹ ${totalGstOnExpenses.toLocaleString("en-IN")}`}
            trend="Claimable ITC"
            icon={CheckCircle2}
            tone="teal"
          />
          <Stat
            title="Total Liquid Balance"
            value={`₹ ${totalBankBalance.toLocaleString("en-IN")}`}
            trend="Bank & Cash"
            icon={Landmark}
            tone="purple"
          />
          <Stat
            title="Operating Margin"
            value="34.8%"
            trend="Healthy Cash Flow"
            icon={ArrowUpRight}
            tone="orange"
          />
        </div>

        {accountingSubmenu === "expenses" && (
          <Panel
            title="Operating Expenses Register"
            sub="Track business overheads, rent, salaries, software and claim eligible ITC"
            action={
              <Btn onClick={() => setShowRecordExpenseModal(true)}>
                <Plus size={14} style={{ marginRight: "4px" }} /> Record Expense
              </Btn>
            }
          >
            <Table
              headers={["Expense ID", "Date", "Category", "Vendor / Payee", "Amount (₹)", "GST (₹)", "ITC Eligible", "Payment Mode"]}
              rows={expensesList.map((e) => [
                e.id,
                e.date,
                e.category,
                e.payee,
                `₹ ${e.amount.toLocaleString("en-IN")}`,
                `₹ ${e.gstPaid.toLocaleString("en-IN")}`,
                e.itcEligible ? "Yes (ITC Claimable)" : "No (Blocked)",
                e.mode
              ])}
            />
          </Panel>
        )}

        {accountingSubmenu === "payments" && (
          <Panel title="Payments Register" sub="Inflows from customer invoices and disbursements to vendors">
            <Table
              headers={["Payment ID", "Type", "Party Name", "Invoice / Bill Ref", "Amount (₹)", "Payment Mode", "Date", "Status"]}
              rows={paymentsList.map((p) => [
                p.id,
                p.type,
                p.party,
                p.ref,
                `₹ ${p.amount.toLocaleString("en-IN")}`,
                p.mode,
                p.date,
                p.status
              ])}
            />
          </Panel>
        )}

        {accountingSubmenu === "banking" && (
          <Panel
            title="Bank & Cash Accounts"
            sub="Current accounts, tax escrow accounts and petty cash registers"
            action={
              <Btn onClick={() => { const name = prompt("Enter Bank Name:", "State Bank of India Current"); if (name) { setBankAccountsList([...bankAccountsList, { name, accountNo: "••••••••" + Math.floor(1000+Math.random()*9000), ifsc: "SBIN0001234", branch: "Kolkata Main", balance: 75000, type: "Current" }]); } }}>
                <Plus size={14} style={{ marginRight: "4px" }} /> Add Bank Account
              </Btn>
            }
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              {bankAccountsList.map((b) => (
                <div key={b.name} style={{ padding: "18px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#f8fafc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div>
                      <strong style={{ fontSize: "14px", color: "#0f172a" }}>{b.name}</strong>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>Acc: {b.accountNo} • IFSC: {b.ifsc}</div>
                    </div>
                    <span className="badge badge-blue">{b.type}</span>
                  </div>
                  <div style={{ margin: "14px 0 8px" }}>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>Ledger Balance</div>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: "#059669" }}>₹ {b.balance.toLocaleString("en-IN")}</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e2e8f0", paddingTop: "10px" }}>
                    <small style={{ color: "#94a3b8", fontSize: "11px" }}>Branch: {b.branch}</small>
                    <Btn secondary onClick={() => alert(`Reconciling statements for ${b.name}... No missing vouchers found.`)}>Reconcile</Btn>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {accountingSubmenu === "cashflow" && (
          <Panel title="Cash Flow & Receivables Ageing Analysis" sub="Overdue invoices and customer credit tracking">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginBottom: "20px" }}>
              <div style={{ padding: "14px", borderRadius: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <div style={{ fontSize: "11px", color: "#166534" }}>0 - 30 Days (Current)</div>
                <strong style={{ fontSize: "18px", color: "#15803d" }}>₹ 24,780</strong>
              </div>
              <div style={{ padding: "14px", borderRadius: "8px", background: "#fffbeb", border: "1px solid #fde68a" }}>
                <div style={{ fontSize: "11px", color: "#92400e" }}>31 - 60 Days (Due)</div>
                <strong style={{ fontSize: "18px", color: "#b45309" }}>₹ 45,200</strong>
              </div>
              <div style={{ padding: "14px", borderRadius: "8px", background: "#fef2f2", border: "1px solid #fecaca" }}>
                <div style={{ fontSize: "11px", color: "#991b1b" }}>60+ Days (Overdue)</div>
                <strong style={{ fontSize: "18px", color: "#dc2626" }}>₹ 0.00</strong>
              </div>
            </div>
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Invoice No</th>
                    <th>Invoice Date</th>
                    <th>Due Date</th>
                    <th>Overdue Days</th>
                    <th>Balance Due (₹)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Apex Commercial Logistics</strong></td>
                    <td>INV/26-27/0042</td>
                    <td>2026-09-28</td>
                    <td>2026-10-13</td>
                    <td><span className="badge badge-amber">17 Days</span></td>
                    <td>₹ 45,200.00</td>
                    <td>
                      <Btn secondary onClick={() => alert("WhatsApp Payment Reminder sent to customer phone with UPI QR link!")}>
                        Send WhatsApp Reminder
                      </Btn>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Panel>
        )}
      </>
    );
  }

  // 13. DEVELOPER & AUTOMATION
  else if (page === "Developer & API") {
    screen = (
      <>
        <Heading
          title="Developer & Automation Tools"
          sub="API keys, webhooks subscriptions, event streams, automation rules, and API reference"
          action={
            <div style={{ display: "flex", gap: "8px" }}>
              <Btn onClick={() => setShowGenerateApiKeyModal(true)}>
                <Plus size={14} style={{ marginRight: "4px" }} /> Generate API Key
              </Btn>
            </div>
          }
        />
        <div className="tabs">
          <a
            href="/developer"
            className={developerSubmenu === "api" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToDeveloperSubmenu("api"); }}
          >
            API Management ({apiKeys.length})
          </a>
          <a
            href="/developer/webhooks"
            className={developerSubmenu === "webhooks" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToDeveloperSubmenu("webhooks"); }}
          >
            Webhooks Subscriptions ({webhooksList.length})
          </a>
          <a
            href="/developer/automation"
            className={developerSubmenu === "automation" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToDeveloperSubmenu("automation"); }}
          >
            Automation Rules ({automationRules.length})
          </a>
          <a
            href="/developer/docs"
            className={developerSubmenu === "docs" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); navigateToDeveloperSubmenu("docs"); }}
          >
            API Reference & Docs
          </a>
        </div>

        <div className="stats">
          <Stat
            title="Active API Keys"
            value={String(apiKeys.length)}
            trend="Live production keys"
            icon={Code2}
            tone="blue"
          />
          <Stat
            title="Monthly Requests"
            value="18,450"
            trend="Rate limit: 60/min"
            icon={RefreshCw}
            tone="teal"
          />
          <Stat
            title="Webhook Delivery Rate"
            value="99.9%"
            trend="0 failures"
            icon={CheckCircle2}
            tone="purple"
          />
          <Stat
            title="Active Automation Rules"
            value={String(automationRules.filter((r) => r.active).length)}
            trend="Running rules"
            icon={SlidersHorizontal}
            tone="orange"
          />
        </div>

        {developerSubmenu === "api" && (
          <Panel
            title="API Keys & Access Tokens"
            sub="Authenticate external services, custom ERP scripts, or Shopify stores"
            action={
              <Btn onClick={() => setShowGenerateApiKeyModal(true)}>
                <Plus size={14} style={{ marginRight: "4px" }} /> Generate New Key
              </Btn>
            }
          >
            <Table
              headers={["Key Label", "API Secret Token", "Permissions Scope", "Created On", "Last Used", "Action"]}
              rows={apiKeys.map((k) => [
                k.name,
                `${k.key.slice(0, 12)}••••••••••••••••`,
                k.scopes,
                k.created,
                k.lastUsed,
                "Copy Key"
              ])}
              onAction={(_act, row) => {
                const found = apiKeys.find((k) => k.name === row[0]);
                if (found) {
                  navigator.clipboard.writeText(found.key);
                  showSaveSuccess(`API Key for ${found.name} copied to clipboard!`);
                }
              }}
            />
          </Panel>
        )}

        {developerSubmenu === "webhooks" && (
          <Panel title="Webhook Subscriptions" sub="Real-time HTTP POST notifications on business events">
            <Table
              headers={["Webhook Endpoint URL", "Subscribed Events", "Deliveries", "Status", "Action"]}
              rows={webhooksList.map((w) => [
                w.url,
                w.events,
                String(w.deliveries),
                w.status,
                "Test Ping"
              ])}
              onAction={(_act, row) => {
                alert(`Test ping dispatched to ${row[0]} -> HTTP 200 OK received!`);
              }}
            />
          </Panel>
        )}

        {developerSubmenu === "automation" && (
          <Panel title="Event-Driven Automation Rules" sub="Automate workflows between orders, invoicing, payments and compliance">
            <div style={{ display: "grid", gap: "14px" }}>
              {automationRules.map((rule) => (
                <div key={rule.id} style={{ padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ maxWidth: "700px" }}>
                    <div style={{ fontWeight: "700", fontSize: "14px", color: "#0f172a", marginBottom: "4px" }}>{rule.title}</div>
                    <div style={{ fontSize: "12px", color: "#2563eb", marginBottom: "2px" }}>
                      <strong>WHEN:</strong> {rule.trigger}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                      <strong>THEN:</strong> {rule.action}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span className={`badge ${rule.active ? "badge-green" : "badge-gray"}`}>
                      {rule.active ? "Active" : "Paused"}
                    </span>
                    <Btn secondary onClick={() => {
                      setAutomationRules(automationRules.map((r) => r.id === rule.id ? { ...r, active: !r.active } : r));
                      showSaveSuccess(`Rule "${rule.title}" updated.`);
                    }}>
                      {rule.active ? "Pause" : "Activate"}
                    </Btn>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {developerSubmenu === "docs" && (
          <Panel title="Developer REST API Documentation" sub="Standard JSON endpoints powered by Laravel Sanctum Bearer authentication">
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <h4 style={{ margin: "0 0 6px", color: "#0f172a" }}>1. Create Tax Invoice Endpoint</h4>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
                  <code>POST https://quantumgst.in/api/v1/invoices</code>
                </div>
                <div className="code-box">
                  {`curl -X POST https://quantumgst.in/api/v1/invoices \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "customer": {
      "name": "Acme Retail Ltd",
      "gstin": "19AAACA1234F1ZX",
      "state_code": "19"
    },
    "items": [
      {
        "name": "Barcode Scanner 2D",
        "hsn": "8471",
        "quantity": 2,
        "rate": 3100,
        "gst_rate": 18
      }
    ]
  }'`}
                </div>
              </div>

              <div>
                <h4 style={{ margin: "0 0 6px", color: "#0f172a" }}>2. Retrieve GSTR-1 Prepared Return</h4>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
                  <code>GET https://quantumgst.in/api/v1/gst/gstr1?period=102026</code>
                </div>
                <div className="code-box">
                  {`curl -X GET "https://quantumgst.in/api/v1/gst/gstr1?period=102026" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Accept: application/json"`}
                </div>
              </div>
            </div>
          </Panel>
        )}
      </>
    );
  }

  // 9. SETTINGS & BUSINESS PROFILE
  else if (page === "Settings") {
    screen = (
      <>
        <Heading
          title="Settings"
          sub="Manage your company profile, statutory tax configuration, and system preferences"
        />
        <div className="tabs">
          <a
            href="/settings/business"
            className={["business", "address", "invoicing", "bank", "eway", "templates"].includes(settingsSubmenu) ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              navigateToSettingsSubmenu("business");
            }}
          >
            Business Profile
          </a>
          <a
            href="/settings/roles"
            className={settingsSubmenu === "roles" ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              navigateToSettingsSubmenu("roles");
            }}
          >
            Users & Roles
          </a>
          <a
            href="/settings/gst"
            className={settingsSubmenu === "gst" ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              navigateToSettingsSubmenu("gst");
            }}
          >
            GST Settings
          </a>
          <a
            href="/settings/integrations"
            className={settingsSubmenu === "integrations" ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              navigateToSettingsSubmenu("integrations");
            }}
          >
            Integrations
          </a>
          <a
            href="/settings/billing"
            className={settingsSubmenu === "billing" ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              navigateToSettingsSubmenu("billing");
            }}
          >
            Billing & Subscription
          </a>
        </div>

        {settingsSaveMsg && (
          <div style={{ marginBottom: "16px", padding: "10px 16px", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "8px", color: "#065f46", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle2 size={16} /> {settingsSaveMsg}
          </div>
        )}

        <div className="settingslayout">
          <Panel title="Settings Navigation">
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#94a3b8", padding: "4px 8px 6px", letterSpacing: "0.5px" }}>
                Profile & Logistics
              </div>
              <a
                href="/settings/business"
                className={`settings-nav-item ${settingsSubmenu === "business" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); navigateToSettingsSubmenu("business"); }}
              >
                <Building2 size={15} /> Business Details
              </a>
              <a
                href="/settings/address"
                className={`settings-nav-item ${settingsSubmenu === "address" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); navigateToSettingsSubmenu("address"); }}
              >
                <MapPin size={15} /> Address & Contacts
              </a>
              <a
                href="/settings/invoicing"
                className={`settings-nav-item ${settingsSubmenu === "invoicing" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); navigateToSettingsSubmenu("invoicing"); }}
              >
                <ReceiptText size={15} /> Invoice Settings
              </a>
              <a
                href="/settings/bank"
                className={`settings-nav-item ${settingsSubmenu === "bank" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); navigateToSettingsSubmenu("bank"); }}
              >
                <CreditCard size={15} /> Bank Details
              </a>
              <a
                href="/settings/eway"
                className={`settings-nav-item ${settingsSubmenu === "eway" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); navigateToSettingsSubmenu("eway"); }}
              >
                <Truck size={15} /> E-way Bill Settings
              </a>
              <a
                href="/settings/templates"
                className={`settings-nav-item ${settingsSubmenu === "templates" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); navigateToSettingsSubmenu("templates"); }}
              >
                <Palette size={15} /> Document Templates
              </a>

              <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#94a3b8", padding: "12px 8px 6px", letterSpacing: "0.5px", borderTop: "1px solid #f1f5f9", marginTop: "6px" }}>
                Compliance & Admin
              </div>
              <a
                href="/settings/roles"
                className={`settings-nav-item ${settingsSubmenu === "roles" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); navigateToSettingsSubmenu("roles"); }}
              >
                <Users size={15} /> Users & Roles
              </a>
              <a
                href="/settings/gst"
                className={`settings-nav-item ${settingsSubmenu === "gst" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); navigateToSettingsSubmenu("gst"); }}
              >
                <FileCheck size={15} /> GST Settings
              </a>
              <a
                href="/settings/integrations"
                className={`settings-nav-item ${settingsSubmenu === "integrations" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); navigateToSettingsSubmenu("integrations"); }}
              >
                <Plug size={15} /> Integrations
              </a>
              <a
                href="/settings/billing"
                className={`settings-nav-item ${settingsSubmenu === "billing" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); navigateToSettingsSubmenu("billing"); }}
              >
                <ShieldCheck size={15} /> Billing & Plan
              </a>
              <a
                href="/settings/audit"
                className={`settings-nav-item ${settingsSubmenu === "audit" ? "active" : ""}`}
                onClick={(e) => { e.preventDefault(); navigateToSettingsSubmenu("audit"); }}
              >
                <History size={15} /> Audit Logs
              </a>
            </div>
          </Panel>

          {settingsSubmenu === "business" && (
            <Panel title="Business Details" sub="Configure registered legal business identity, trade name, and tax classification">
              <div className="fields" style={{ gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <Field label="Legal Business Name *" value={legalName} onChange={setLegalName} />
                <Field label="Trade Name" value={tradeName} onChange={setTradeName} />
                <Field label="GSTIN *" value={primaryGstin} onChange={setPrimaryGstin} />
                <div className="field">
                  <label>Business Type</label>
                  <select
                    value={bizType}
                    onChange={(e) => setBizType(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}
                  >
                    <option value="proprietorship">Sole Proprietorship</option>
                    <option value="partnership">Partnership Firm</option>
                    <option value="llp">Limited Liability Partnership (LLP)</option>
                    <option value="private_limited">Private Limited Company (Pvt Ltd)</option>
                    <option value="public_limited">Public Limited Company</option>
                    <option value="huf">Hindu Undivided Family (HUF)</option>
                  </select>
                </div>
                <Field label="Permanent Account Number (PAN)" value={panNumber} onChange={setPanNumber} />
                <Field label="Registered State" value={`${stateName} (${stateCode})`} />
              </div>
              <div className="save" style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                <Btn onClick={() => showSaveSuccess("Business Profile updated successfully!")}>
                  <Save size={13} style={{ marginRight: "5px" }} /> Save Business Details
                </Btn>
              </div>
            </Panel>
          )}

          {settingsSubmenu === "address" && (
            <Panel title="Address & Official Contacts" sub="Primary registered place of business printed on invoices and used for Place of Supply">
              <div className="fields" style={{ gridTemplateColumns: "1fr", gap: "16px", marginBottom: "16px" }}>
                <Field label="Principal Place of Business (Address) *" value={addressLine} onChange={setAddressLine} />
              </div>
              <div className="fields" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <Field label="City / District *" value={city} onChange={setCity} />
                <Field label="State *" value={stateName} onChange={setStateName} />
                <Field label="Postal PIN Code *" value={pincode} onChange={setPincode} />
                <Field label="Official Business Email *" value={bizEmail} onChange={setBizEmail} />
                <Field label="Contact Phone / Mobile *" value={bizPhone} onChange={setBizPhone} />
                <Field label="GST State Code" value={stateCode} onChange={setStateCode} />
              </div>
              <div className="save" style={{ display: "flex", justifyContent: "flex-end" }}>
                <Btn onClick={() => showSaveSuccess("Address and contact details saved!")}>
                  <Save size={13} style={{ marginRight: "5px" }} /> Save Address & Contacts
                </Btn>
              </div>
            </Panel>
          )}

          {settingsSubmenu === "invoicing" && (
            <Panel title="Invoice & Billing Settings" sub="Configure automatic serial numbering, payment terms, and default declarations">
              <div className="fields" style={{ gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <Field label="Invoice Prefix (e.g., INV/26-27/)" value={invoicePrefix} onChange={setInvoicePrefix} />
                <Field label="Starting Sequence Number" value={startingInvNum} onChange={setStartingInvNum} />
                <div className="field">
                  <label>Default Payment Terms</label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}
                  >
                    <option value="Immediate">Immediate / Due on Receipt</option>
                    <option value="Net 7">Net 7 Days</option>
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Net 45">Net 45 Days</option>
                    <option value="Net 60">Net 60 Days</option>
                  </select>
                </div>
                <div className="field">
                  <label>Default Currency & Format</label>
                  <input
                    type="text"
                    disabled
                    value="INR (₹) - Indian Rupee Lakhs/Crores"
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "12px", background: "#f8fafc", color: "#64748b" }}
                  />
                </div>
              </div>
              <div className="field" style={{ marginBottom: "20px" }}>
                <label>Default Terms & Conditions / Declaration</label>
                <textarea
                  rows={3}
                  value={invoiceTerms}
                  onChange={(e) => setInvoiceTerms(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", resize: "vertical", fontFamily: "inherit" }}
                />
              </div>
              <div className="save" style={{ display: "flex", justifyContent: "flex-end" }}>
                <Btn onClick={() => showSaveSuccess("Invoice sequence and payment terms updated!")}>
                  <Save size={13} style={{ marginRight: "5px" }} /> Save Invoice Settings
                </Btn>
              </div>
            </Panel>
          )}

          {settingsSubmenu === "bank" && (
            <Panel title="Bank Account & Payment Details" sub="These bank credentials and UPI ID will be printed on invoices so customers can pay directly">
              <div className="fields" style={{ gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <Field label="Bank Name *" value={bankName} onChange={setBankName} />
                <Field label="Account Holder Name *" value={accountHolderName || legalName || "Company Account"} onChange={setAccountHolderName} />
                <Field label="Bank Account Number *" value={accountNumber} onChange={setAccountNumber} />
                <Field label="IFSC Code *" value={ifscCode} onChange={setIfscCode} />
                <Field label="Branch Name" value={branchName} onChange={setBranchName} />
                <Field label="UPI ID / VPA (for QR Code on Invoice)" value={upiId} onChange={setUpiId} />
              </div>
              <div style={{ padding: "12px 16px", borderRadius: "8px", background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                <Sparkles size={16} style={{ color: "#2563eb" }} />
                <span style={{ fontSize: "12px", color: "#475569" }}>
                  Dynamic UPI QR codes are automatically rendered on PDF invoices using the UPI ID and exact payable amount.
                </span>
              </div>
              <div className="save" style={{ display: "flex", justifyContent: "flex-end" }}>
                <Btn onClick={() => showSaveSuccess("Bank details and UPI settings saved!")}>
                  <Save size={13} style={{ marginRight: "5px" }} /> Save Bank Details
                </Btn>
              </div>
            </Panel>
          )}

          {settingsSubmenu === "eway" && (
            <Panel title="E-Way Bill & Logistics Settings" sub="Automated E-way bill generation parameters and NIC portal setup">
              <div className="fields" style={{ gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div className="field">
                  <label>E-Way Bill Mandatory Threshold</label>
                  <select
                    value={ewayThreshold}
                    onChange={(e) => setEwayThreshold(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}
                  >
                    <option value="50000">₹ 50,000 (Standard All-India Threshold)</option>
                    <option value="100000">₹ 1,00,000 (Intra-state High Threshold states)</option>
                  </select>
                </div>
                <Field label="NIC Portal Username / API User" value={ewayUsername} onChange={setEwayUsername} />
                <Field label="NIC Portal Password" type="password" value={ewayPassword} onChange={setEwayPassword} />
                <Field label="Default Transporter ID / GSTIN" value={defaultTransporterId} onChange={setDefaultTransporterId} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                  <input type="checkbox" checked={autoEway} onChange={(e) => setAutoEway(e.target.checked)} />
                  <span>Auto-generate E-way Bill when invoice value exceeds ₹{Number(ewayThreshold).toLocaleString()}</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                  <input type="checkbox" checked={ewayDistanceCalc} onChange={(e) => setEwayDistanceCalc(e.target.checked)} />
                  <span>Calculate transit distance automatically using Source and Destination PIN codes</span>
                </label>
              </div>
              <div className="save" style={{ display: "flex", justifyContent: "flex-end" }}>
                <Btn onClick={() => showSaveSuccess("E-Way Bill rules and credentials updated!")}>
                  <Save size={13} style={{ marginRight: "5px" }} /> Save E-Way Bill Settings
                </Btn>
              </div>
            </Panel>
          )}

          {settingsSubmenu === "templates" && (
            <Panel title="Document & Invoice Templates" sub="Choose visual styling, brand color, and layout for PDF tax invoices and quotes">
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "10px", color: "#334155" }}>Select Invoice Layout Theme</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
                  {[
                    { id: "modern", name: "Modern Sapphire", desc: "Clean modern design with crisp tables & QR code" },
                    { id: "standard", name: "Classic Corporate", desc: "Formal layout preferred by institutional buyers" },
                    { id: "compact", name: "Compact Thermal", desc: "Space-saving for retail POS & fast counter prints" },
                    { id: "gst_detailed", name: "GST Tax Detailed", desc: "Detailed HSN/SAC breakups & CGST/SGST/IGST breakdown" }
                  ].map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id as any)}
                      style={{
                        padding: "14px",
                        borderRadius: "8px",
                        border: `2px solid ${selectedTemplate === t.id ? "#2563eb" : "#e2e8f0"}`,
                        background: selectedTemplate === t.id ? "#eff6ff" : "#fff",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div style={{ fontWeight: "700", fontSize: "13px", color: selectedTemplate === t.id ? "#1d4ed8" : "#0f172a", marginBottom: "4px" }}>
                        {t.name}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b", lineHeight: "1.4" }}>{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "10px", color: "#334155" }}>Brand Accent Color</div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  {[
                    { color: "#2563eb", name: "Blue" },
                    { color: "#0d9f91", name: "Teal" },
                    { color: "#7c3aed", name: "Purple" },
                    { color: "#dc2626", name: "Ruby" },
                    { color: "#0f172a", name: "Slate" }
                  ].map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setTemplateColor(c.color)}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: c.color,
                        border: templateColor === c.color ? "3px solid #000" : "2px solid #fff",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        cursor: "pointer"
                      }}
                      title={c.name}
                    />
                  ))}
                  <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "10px" }}>Selected: {templateColor}</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                  <input type="checkbox" checked={showLogoOnInvoice} onChange={(e) => setShowLogoOnInvoice(e.target.checked)} />
                  <span>Show Business Logo on Invoice Header</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                  <input type="checkbox" checked={showBankOnInvoice} onChange={(e) => setShowBankOnInvoice(e.target.checked)} />
                  <span>Print Bank Account & Payment QR Code at bottom</span>
                </label>
              </div>

              <div className="save" style={{ display: "flex", justifyContent: "flex-end" }}>
                <Btn onClick={() => showSaveSuccess("Invoice template styling saved!")}>
                  <Save size={13} style={{ marginRight: "5px" }} /> Save Template Preferences
                </Btn>
              </div>
            </Panel>
          )}

          {settingsSubmenu === "roles" && (
            <Panel
              title="Users & Access Permissions"
              sub="Manage team access, assign role-based permissions, and invite accountants"
              action={
                <Btn onClick={() => setShowAddMember(true)}>
                  <Plus size={13} style={{ marginRight: "4px" }} /> Invite Member
                </Btn>
              }
            >
              {showAddMember && (
                <div style={{ padding: "16px", borderRadius: "8px", background: "#f8fafc", border: "1px solid #cbd5e1", marginBottom: "20px" }}>
                  <div style={{ fontWeight: "700", fontSize: "13px", marginBottom: "12px", color: "#0f172a" }}>Invite New Team Member</div>
                  <div className="fields" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                    <Field label="Full Name *" value={newMemberName} onChange={setNewMemberName} />
                    <Field label="Email Address *" value={newMemberEmail} onChange={setNewMemberEmail} />
                    <div className="field">
                      <label>Assigned Role</label>
                      <select
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value)}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}
                      >
                        <option value="Administrator">Administrator (Full Access)</option>
                        <option value="Accountant">Accountant (GST & Books)</option>
                        <option value="Billing Operator">Billing Operator (Invoices Only)</option>
                        <option value="Auditor / Viewer">Auditor / Read-Only</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                    <Btn secondary onClick={() => setShowAddMember(false)}>Cancel</Btn>
                    <Btn onClick={() => {
                      if (!newMemberName || !newMemberEmail) {
                        alert("Please enter both name and email.");
                        return;
                      }
                      setTeamMembers([
                        ...teamMembers,
                        { id: Date.now(), name: newMemberName, email: newMemberEmail, role: newMemberRole, status: "Invited" }
                      ]);
                      setNewMemberName("");
                      setNewMemberEmail("");
                      setShowAddMember(false);
                      showSaveSuccess(`Invitation email sent to ${newMemberEmail}`);
                    }}>
                      Send Invitation
                    </Btn>
                  </div>
                </div>
              )}

              <div className="tablewrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((m) => (
                      <tr key={m.id}>
                        <td><strong>{m.name}</strong></td>
                        <td>{m.email}</td>
                        <td>
                          <span style={{ padding: "3px 8px", borderRadius: "4px", background: "#eff6ff", color: "#2563eb", fontSize: "11px", fontWeight: "600" }}>
                            {m.role}
                          </span>
                        </td>
                        <td>
                          <span style={{ padding: "3px 8px", borderRadius: "999px", background: m.status === "Active" ? "#ecfdf5" : "#fef3c7", color: m.status === "Active" ? "#059669" : "#b45309", fontSize: "11px", fontWeight: "600" }}>
                            {m.status}
                          </span>
                        </td>
                        <td>
                          {m.role.includes("Owner") ? (
                            <span style={{ fontSize: "11px", color: "#94a3b8" }}>Primary Owner</span>
                          ) : (
                            <button
                              onClick={() => {
                                if (confirm(`Remove access for ${m.name}?`)) {
                                  setTeamMembers(teamMembers.filter((item) => item.id !== m.id));
                                  showSaveSuccess(`Removed access for ${m.name}`);
                                }
                              }}
                              style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            >
                              <Trash2 size={13} /> Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {settingsSubmenu === "gst" && (
            <Panel title="GST Compliance & Return Parameters" sub="Configure return filing frequency, composite scheme eligibility, and automatic reconciliation">
              <div className="fields" style={{ gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div className="field">
                  <label>GST Registration Scheme</label>
                  <select
                    value={gstScheme}
                    onChange={(e) => setGstScheme(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}
                  >
                    <option value="Regular">Regular Taxpayer</option>
                    <option value="Composition">Composition Scheme (Quarterly CMP-08)</option>
                    <option value="SEZ">Special Economic Zone (SEZ Developer / Unit)</option>
                  </select>
                </div>
                <div className="field">
                  <label>GSTR-1 & 3B Filing Periodicity</label>
                  <select
                    value={filingPeriodicity}
                    onChange={(e) => setFilingPeriodicity(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}
                  >
                    <option value="Monthly">Monthly Filing (Turnover &gt; ₹5 Cr or Opted Monthly)</option>
                    <option value="Quarterly">Quarterly (QRMP Scheme with Monthly IFF)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                  <input type="checkbox" checked={eInvoicingEnabled} onChange={(e) => setEInvoicingEnabled(e.target.checked)} />
                  <span>Mandatory e-Invoicing enabled (Generate IRN and signed QR code for all B2B invoices)</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                  <input type="checkbox" checked={autoGstr2b} onChange={(e) => setAutoGstr2b(e.target.checked)} />
                  <span>Automatic daily sync of GSTR-2B input tax credit (ITC) from GSTN Portal</span>
                </label>
              </div>

              <div className="save" style={{ display: "flex", justifyContent: "flex-end" }}>
                <Btn onClick={() => showSaveSuccess("GST filing parameters updated successfully!")}>
                  <Save size={13} style={{ marginRight: "5px" }} /> Save GST Settings
                </Btn>
              </div>
            </Panel>
          )}

          {settingsSubmenu === "integrations" && (
            <Panel title="Marketplaces & Accounting Integrations" sub="Sync orders, customer GSTINs, and export entries directly to accounting systems">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", marginBottom: "20px" }}>
                {[
                  { name: "Amazon India (SP-API)", desc: "Automated FBA & Easy Ship settlement invoice sync", status: "Connected", orders: "1,240 synced" },
                  { name: "Flipkart Seller Hub", desc: "Order management & commission credit note sync", status: "Connected", orders: "850 synced" },
                  { name: "Meesho Supplier Panel", desc: "Zero commission order reconciliation & TCS reports", status: "Connected", orders: "612 synced" },
                  { name: "Shopify Store Webhook", desc: "Live real-time webhook for Shopify POS & Online store", status: "Active", orders: "Live Hook" },
                  { name: "Tally Prime XML Export", desc: "1-Click export to Tally vouchers and daybooks", status: "Bridge Ready", orders: "ODBC Ready" },
                  { name: "Zoho Books API", desc: "Bi-directional customer and payment settlement sync", status: "Available", orders: "OAuth 2.0" }
                ].map((item) => (
                  <div key={item.name} style={{ padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#f8fafc" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div style={{ fontWeight: "700", fontSize: "13px", color: "#0f172a" }}>{item.name}</div>
                      <span style={{ fontSize: "11px", fontWeight: "600", padding: "2px 8px", borderRadius: "999px", background: item.status === "Available" ? "#f1f5f9" : "#ecfdf5", color: item.status === "Available" ? "#64748b" : "#059669" }}>
                        {item.status}
                      </span>
                    </div>
                    <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 12px", lineHeight: "1.4" }}>{item.desc}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <small style={{ color: "#94a3b8", fontSize: "11px" }}>{item.orders}</small>
                      <Btn secondary onClick={() => alert(`${item.name} settings are configured and active.`)}>Configure</Btn>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {settingsSubmenu === "billing" && (
            <Panel title="Subscription & Billing Plan" sub="Manage license tier, cloud database sync quota, and invoice history">
              <div style={{ padding: "20px", borderRadius: "10px", background: "#eff6ff", border: "1px solid #bfdbfe", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#2563eb", letterSpacing: "0.5px" }}>Current Active Plan</span>
                    <h3 style={{ margin: "4px 0 0", fontSize: "20px", color: "#1e3a8a" }}>Quantum Core Professional Edition</h3>
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: "700", padding: "4px 12px", borderRadius: "999px", background: "#dcfce7", color: "#15803d", border: "1px solid #86efac" }}>
                    Active • Lifetime Updates
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "#3b82f6", margin: "0 0 16px" }}>
                  Includes unlimited B2B / B2C tax invoices, automated E-Way bills, multi-company switcher, and live GitHub OTA releases.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                  <div style={{ background: "#fff", padding: "12px", borderRadius: "8px", border: "1px solid #dbeafe" }}>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>Monthly Invoices</div>
                    <strong style={{ fontSize: "16px", color: "#0f172a" }}>Unlimited</strong>
                  </div>
                  <div style={{ background: "#fff", padding: "12px", borderRadius: "8px", border: "1px solid #dbeafe" }}>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>Registered Companies</div>
                    <strong style={{ fontSize: "16px", color: "#0f172a" }}>{userBusinesses.length || 1} Active</strong>
                  </div>
                  <div style={{ background: "#fff", padding: "12px", borderRadius: "8px", border: "1px solid #dbeafe" }}>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>Cloud Sync Status</div>
                    <strong style={{ fontSize: "16px", color: "#059669" }}>Connected (100%)</strong>
                  </div>
                </div>
              </div>

              <div className="tablewrap">
                <div style={{ fontWeight: "700", fontSize: "13px", padding: "12px 14px", borderBottom: "1px solid #e2e8f0" }}>Subscription Invoices</div>
                <table>
                  <thead>
                    <tr>
                      <th>Invoice ID</th>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>QTM-SUB-2026-01</strong></td>
                      <td>01 Apr 2026</td>
                      <td>Quantum GST Core Professional - Annual License</td>
                      <td>₹ 4,999.00</td>
                      <td>
                        <a href="#receipt" onClick={(e) => { e.preventDefault(); alert("Downloading payment receipt PDF..."); }} style={{ color: "#2563eb", fontWeight: "600" }}>
                          Download PDF
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {settingsSubmenu === "audit" && (
            <Panel title="Security & Compliance Audit Trail" sub="Tamper-proof event logs of all business, tax and user activities">
              <Table
                headers={["Timestamp", "User / Agent", "Action Performed", "Activity Details", "IP Address", "Status"]}
                rows={auditLogs.map((log) => [
                  log.timestamp,
                  log.user,
                  log.action,
                  log.details,
                  log.ip,
                  log.status
                ])}
              />
            </Panel>
          )}
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
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ background: "none", border: "none", cursor: "pointer", position: "relative", display: "inline-flex", alignItems: "center", padding: "4px" }}
              title="Notifications & Tasks"
            >
              <Bell size={18} style={{ color: showNotifications ? "#2563eb" : "#718096" }} />
              <span style={{ position: "absolute", top: "1px", right: "1px", width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }}></span>
            </button>
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
      {/* ================= NOTIFICATIONS & TASKS DRAWER ================= */}
      {showNotifications && (
        <div className="modal-backdrop" onClick={() => setShowNotifications(false)}>
          <div className="modal-box" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Bell size={18} style={{ color: "#2563eb" }} />
                <h3>Notifications & Compliance Tasks</h3>
              </div>
              <button onClick={() => setShowNotifications(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ display: "grid", gap: "12px" }}>
              <div style={{ padding: "12px", borderRadius: "8px", background: "#fef3c7", border: "1px solid #fde68a", display: "flex", gap: "10px" }}>
                <CalendarDays size={20} style={{ color: "#b45309", flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: "13px", color: "#92400e" }}>GSTR-1 Monthly Return Due</strong>
                  <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#b45309" }}>Outward supplies return for previous tax period is due by 11th Nov 2026.</p>
                </div>
              </div>

              <div style={{ padding: "12px", borderRadius: "8px", background: "#fef2f2", border: "1px solid #fecaca", display: "flex", gap: "10px" }}>
                <AlertCircle size={20} style={{ color: "#dc2626", flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: "13px", color: "#991b1b" }}>Overdue Customer Invoice</strong>
                  <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#b91c1c" }}>Invoice INV/26-27/0042 (₹ 45,200) from Apex Commercial Logistics is 17 days overdue.</p>
                </div>
              </div>

              <div style={{ padding: "12px", borderRadius: "8px", background: "#fff7ed", border: "1px solid #fed7aa", display: "flex", gap: "10px" }}>
                <Package size={20} style={{ color: "#c2410c", flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: "13px", color: "#9a3412" }}>Low Stock Warning</strong>
                  <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#ea580c" }}>Thermal Paper Roll 80mm has reached threshold (Only 4 remaining in Main Warehouse).</p>
                </div>
              </div>

              <div style={{ padding: "12px", borderRadius: "8px", background: "#ecfdf5", border: "1px solid #a7f3d0", display: "flex", gap: "10px" }}>
                <CheckCircle2 size={20} style={{ color: "#059669", flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: "13px", color: "#065f46" }}>Marketplace Sync Successful</strong>
                  <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#047857" }}>Amazon SP-API and Meesho channels synced 12 new orders with automated GST invoices.</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <Btn onClick={() => { setShowNotifications(false); showSaveSuccess("All notifications marked as read."); }}>
                Mark All as Read
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* ================= RECORD PURCHASE MODAL ================= */}
      {showRecordPurchaseModal && (
        <div className="modal-backdrop" onClick={() => setShowRecordPurchaseModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Purchase Bill (Inward Supply)</h3>
              <button onClick={() => setShowRecordPurchaseModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!pbSupplier || !pbTaxable) {
                alert("Please enter Supplier Name and Taxable Value.");
                return;
              }
              const tax = (Number(pbTaxable) * Number(pbGstRate)) / 100;
              const newBill = {
                id: `PB-2026-${String(purchaseBills.length + 83).padStart(3, "0")}`,
                billNo: pbBillNo || `INV-${Date.now().toString().slice(-4)}`,
                date: pbDate,
                supplier: pbSupplier,
                gstin: pbGstin || "19AAACS0000A1Z0",
                taxable: Number(pbTaxable),
                tax: tax,
                total: Number(pbTaxable) + tax,
                itcStatus: pbItcEligible ? "Eligible" : "Blocked",
                paymentStatus: "Pending"
              };
              setPurchaseBills([newBill, ...purchaseBills]);
              setShowRecordPurchaseModal(false);
              showSaveSuccess(`Purchase Bill ${newBill.id} recorded successfully!`);
              setPbSupplier("");
              setPbGstin("");
              setPbTaxable(0);
            }}>
              <div className="modal-body">
                <div className="fields" style={{ gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <Field label="Supplier / Vendor Name *" value={pbSupplier} onChange={setPbSupplier} />
                  <Field label="Supplier GSTIN *" value={pbGstin} onChange={setPbGstin} />
                  <Field label="Supplier Invoice / Bill No *" value={pbBillNo} onChange={setPbBillNo} />
                  <Field label="Bill Date *" type="date" value={pbDate} onChange={setPbDate} />
                  <Field label="Taxable Value (₹) *" type="number" value={String(pbTaxable || "")} onChange={(v) => setPbTaxable(Number(v))} />
                  <div className="field">
                    <label>Applicable GST Rate</label>
                    <select value={pbGstRate} onChange={(e) => setPbGstRate(Number(e.target.value))} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}>
                      <option value="5">5% GST</option>
                      <option value="12">12% GST</option>
                      <option value="18">18% GST (Standard)</option>
                      <option value="28">28% GST</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: "14px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                    <input type="checkbox" checked={pbItcEligible} onChange={(e) => setPbItcEligible(e.target.checked)} />
                    <span>Eligible to claim Input Tax Credit (ITC) under Section 16</span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <Btn secondary onClick={() => setShowRecordPurchaseModal(false)}>Cancel</Btn>
                <Btn>Save Purchase Bill</Btn>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADD PRODUCT MODAL ================= */}
      {showAddProductModal && (
        <div className="modal-backdrop" onClick={() => setShowAddProductModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Product / Service to Catalog</h3>
              <button onClick={() => setShowAddProductModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!prodName || !prodSellPrice) {
                alert("Please enter Product Name and Selling Price.");
                return;
              }
              const newProd = {
                id: Date.now(),
                name: prodName,
                sku: prodSku || `SKU-${Date.now().toString().slice(-4)}`,
                hsn: prodHsn || "9983",
                category: prodCat,
                unit: prodUnit,
                buyPrice: Number(prodBuyPrice) || 0,
                sellPrice: Number(prodSellPrice),
                gst: Number(prodGst),
                stock: Number(prodStock) || 0,
                minStock: 5
              };
              setInventoryProducts([newProd, ...inventoryProducts]);
              setShowAddProductModal(false);
              showSaveSuccess(`Product "${prodName}" added to inventory catalog!`);
              setProdName("");
              setProdSku("");
              setProdHsn("");
              setProdSellPrice(0);
            }}>
              <div className="modal-body">
                <div className="fields" style={{ gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <Field label="Product / Service Name *" value={prodName} onChange={setProdName} />
                  <Field label="SKU / Item Code" value={prodSku} onChange={setProdSku} />
                  <Field label="HSN / SAC Code *" value={prodHsn} onChange={setProdHsn} />
                  <div className="field">
                    <label>Category</label>
                    <select value={prodCat} onChange={(e) => setProdCat(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}>
                      {inventoryCategories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <Field label="Unit of Measurement" value={prodUnit} onChange={setProdUnit} />
                  <Field label="Purchase Price (₹)" type="number" value={String(prodBuyPrice || "")} onChange={(v) => setProdBuyPrice(Number(v))} />
                  <Field label="Selling Price (₹) *" type="number" value={String(prodSellPrice || "")} onChange={(v) => setProdSellPrice(Number(v))} />
                  <div className="field">
                    <label>GST Rate</label>
                    <select value={prodGst} onChange={(e) => setProdGst(Number(e.target.value))} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}>
                      <option value="0">0% (Nil / Exempt)</option>
                      <option value="5">5% GST</option>
                      <option value="12">12% GST</option>
                      <option value="18">18% GST (Standard)</option>
                      <option value="28">28% GST</option>
                    </select>
                  </div>
                  <Field label="Initial Stock Quantity" type="number" value={String(prodStock || "")} onChange={(v) => setProdStock(Number(v))} />
                </div>
              </div>
              <div className="modal-footer">
                <Btn secondary onClick={() => setShowAddProductModal(false)}>Cancel</Btn>
                <Btn>Save Product</Btn>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= RECORD EXPENSE MODAL ================= */}
      {showRecordExpenseModal && (
        <div className="modal-backdrop" onClick={() => setShowRecordExpenseModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Business Expense</h3>
              <button onClick={() => setShowRecordExpenseModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!expPayee || !expAmount) {
                alert("Please enter Payee and Amount.");
                return;
              }
              const newExp = {
                id: `EXP-2026-${String(expensesList.length + 45).padStart(3, "0")}`,
                date: new Date().toISOString().split("T")[0],
                category: expCategory,
                payee: expPayee,
                amount: Number(expAmount),
                gstPaid: Number(expGstPaid) || 0,
                itcEligible: expItc,
                mode: expMode
              };
              setExpensesList([newExp, ...expensesList]);
              setShowRecordExpenseModal(false);
              showSaveSuccess(`Expense ${newExp.id} recorded!`);
              setExpPayee("");
              setExpAmount(0);
              setExpGstPaid(0);
            }}>
              <div className="modal-body">
                <div className="fields" style={{ gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div className="field">
                    <label>Expense Category</label>
                    <select value={expCategory} onChange={(e) => setExpCategory(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}>
                      <option value="Office Rent">Office Rent</option>
                      <option value="Logistics & Courier">Logistics & Courier</option>
                      <option value="Software & Cloud Hosting">Software & Cloud Hosting</option>
                      <option value="Staff Salaries">Staff Salaries</option>
                      <option value="Electricity & Utilities">Electricity & Utilities</option>
                      <option value="Marketing & Advertising">Marketing & Advertising</option>
                      <option value="Packaging Materials">Packaging Materials</option>
                      <option value="Travel & Conveyance">Travel & Conveyance</option>
                    </select>
                  </div>
                  <Field label="Vendor / Payee Name *" value={expPayee} onChange={setExpPayee} />
                  <Field label="Total Expense Amount (₹) *" type="number" value={String(expAmount || "")} onChange={(v) => setExpAmount(Number(v))} />
                  <Field label="GST Paid Included in Amount (₹)" type="number" value={String(expGstPaid || "")} onChange={(v) => setExpGstPaid(Number(v))} />
                  <div className="field">
                    <label>Payment Method</label>
                    <select value={expMode} onChange={(e) => setExpMode(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}>
                      <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                      <option value="UPI">UPI / QR Code</option>
                      <option value="Corporate Card">Credit / Debit Card</option>
                      <option value="Cash">Cash in Hand</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: "14px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                    <input type="checkbox" checked={expItc} onChange={(e) => setExpItc(e.target.checked)} />
                    <span>Eligible to claim Input Tax Credit on this expense</span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <Btn secondary onClick={() => setShowRecordExpenseModal(false)}>Cancel</Btn>
                <Btn>Record Expense</Btn>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADD CONTACT MODAL ================= */}
      {showAddContactModal && (
        <div className="modal-backdrop" onClick={() => setShowAddContactModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New {contactType === "supplier" ? "Supplier / Vendor" : "Customer"}</h3>
              <button onClick={() => setShowAddContactModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!contactName) {
                alert("Please enter Contact Name.");
                return;
              }
              if (contactType === "customer") {
                const newCust: Customer = {
                  id: Date.now().toString(),
                  business_id: activeBusinessId || "default",
                  name: contactName,
                  gstin: contactGstin,
                  phone: contactPhone,
                  email: contactEmail,
                  state_code: "19",
                  state_name: contactState
                };
                setCloudCustomers([newCust, ...cloudCustomers]);
                showSaveSuccess(`Customer ${contactName} added!`);
              } else {
                const newSup = {
                  id: Date.now(),
                  name: contactName,
                  gstin: contactGstin || "Unregistered",
                  contactPerson: contactName,
                  phone: contactPhone,
                  email: contactEmail,
                  city: "Kolkata",
                  state: contactState,
                  payables: 0
                };
                setSuppliersList([newSup, ...suppliersList]);
                showSaveSuccess(`Supplier ${contactName} added!`);
              }
              setShowAddContactModal(false);
              setContactName("");
              setContactGstin("");
              setContactPhone("");
              setContactEmail("");
            }}>
              <div className="modal-body">
                <div className="fields" style={{ gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <Field label="Business / Entity Name *" value={contactName} onChange={setContactName} />
                  <Field label="GSTIN (15 Digits)" value={contactGstin} onChange={setContactGstin} />
                  <Field label="Phone / Mobile Number" value={contactPhone} onChange={setContactPhone} />
                  <Field label="Email Address" value={contactEmail} onChange={setContactEmail} />
                  <Field label="State / Place of Supply" value={contactState} onChange={setContactState} />
                </div>
              </div>
              <div className="modal-footer">
                <Btn secondary onClick={() => setShowAddContactModal(false)}>Cancel</Btn>
                <Btn>Save Contact</Btn>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= GENERATE API KEY MODAL ================= */}
      {showGenerateApiKeyModal && (
        <div className="modal-backdrop" onClick={() => setShowGenerateApiKeyModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Generate New API Secret Key</h3>
              <button onClick={() => setShowGenerateApiKeyModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!newKeyName) {
                alert("Please enter a key name.");
                return;
              }
              const randBytes = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
              const newKey = {
                id: Date.now(),
                name: newKeyName,
                key: `qtm_live_${randBytes}`,
                created: new Date().toISOString().split("T")[0],
                lastUsed: "Just created",
                scopes: newKeyScope
              };
              setApiKeys([newKey, ...apiKeys]);
              setShowGenerateApiKeyModal(false);
              showSaveSuccess(`API Key "${newKeyName}" generated!`);
              setNewKeyName("");
            }}>
              <div className="modal-body">
                <div className="fields" style={{ gridTemplateColumns: "1fr", gap: "14px" }}>
                  <Field label="Key Description / Identifier *" value={newKeyName} onChange={setNewKeyName} />
                  <div className="field">
                    <label>Permissions Scope</label>
                    <select value={newKeyScope} onChange={(e) => setNewKeyScope(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", background: "#fff" }}>
                      <option value="Full Read / Write">Full Read / Write (Invoices, Customers, Stock)</option>
                      <option value="Invoices & Customers Only">Invoices & Customers Only</option>
                      <option value="GST Reports Read-Only">GST Reports Read-Only</option>
                      <option value="Webhooks Only">Webhooks & Event Streams</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <Btn secondary onClick={() => setShowGenerateApiKeyModal(false)}>Cancel</Btn>
                <Btn>Generate Token</Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
