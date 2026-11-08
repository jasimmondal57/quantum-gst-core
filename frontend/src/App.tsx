import { useState, useEffect } from "react";
import { AuthScreen } from "./components/AuthScreen";
import { AppLayout } from "./components/layout/AppLayout";
import { DashboardScreen } from "./modules/dashboard/DashboardScreen";
import { PosBillingScreen } from "./modules/billing/PosBillingScreen";
import { SalesInvoiceCreate } from "./modules/billing/pages/SalesInvoiceCreate";
import { QuotationCreate } from "./modules/billing/pages/QuotationCreate";
import { CreditNoteCreate } from "./modules/billing/pages/CreditNoteCreate";
import { DeliveryChallanCreate } from "./modules/billing/pages/DeliveryChallanCreate";
import { InvoiceList } from "./modules/billing/pages/InvoiceList";
import { PurchasesListScreen } from "./modules/purchases/PurchasesListScreen";
import { InventoryScreen } from "./modules/inventory/InventoryScreen";
import { AccountingScreen } from "./modules/accounting/AccountingScreen";
import { GstComplianceScreen } from "./modules/gst/GstComplianceScreen";
import { ContactsScreen } from "./modules/contacts/ContactsScreen";
import { MarketplaceScreen } from "./modules/marketplace/MarketplaceScreen";
import { ShopifyScreen } from "./modules/shopify/ShopifyScreen";
import { SettingsScreen } from "./modules/settings/SettingsScreen";
import { Modal } from "./components/ui/Modal";
import { Button } from "./components/ui/Button";
import { Badge } from "./components/ui/Badge";
import { FileDown } from "lucide-react";
import { api } from "./services/api";
import type {
  AuthUser,
  BusinessProfile,
  Customer,
  Invoice,
  Product,
  PurchaseBill,
} from "./services/api";

export type ScreenId =
  | "dashboard"
  | "billing_pos"
  | "billing"
  | "quotations"
  | "credit_notes"
  | "delivery_challans"
  | "sales"
  | "purchases"
  | "inventory"
  | "accounting"
  | "gst"
  | "contacts"
  | "marketplace"
  | "shopify"
  | "settings";

export const ROUTE_MAP: Record<string, ScreenId> = {
  "/": "dashboard",
  "/dashboard": "dashboard",
  "/billing": "billing",
  "/pos": "billing_pos",
  "/invoices/create": "billing",
  "/quotations": "quotations",
  "/quotations/create": "quotations",
  "/credit-notes": "credit_notes",
  "/credit-notes/create": "credit_notes",
  "/delivery-challans": "delivery_challans",
  "/delivery-challans/create": "delivery_challans",
  "/sales": "sales",
  "/sales/invoices": "sales",
  "/purchases": "purchases",
  "/purchases/bills": "purchases",
  "/inventory": "inventory",
  "/accounting": "accounting",
  "/gst": "gst",
  "/reports": "gst",
  "/contacts": "contacts",
  "/customers": "contacts",
  "/marketplace": "marketplace",
  "/shopify": "shopify",
  "/settings": "settings",
};

export const SCREEN_TO_SLUG: Record<ScreenId, string> = {
  dashboard: "/dashboard",
  billing_pos: "/pos",
  billing: "/billing",
  quotations: "/quotations",
  credit_notes: "/credit-notes",
  delivery_challans: "/delivery-challans",
  sales: "/sales",
  purchases: "/purchases",
  inventory: "/inventory",
  accounting: "/accounting",
  gst: "/gst",
  contacts: "/contacts",
  marketplace: "/marketplace",
  shopify: "/shopify",
  settings: "/settings",
};

function getScreenFromPathname(path: string): ScreenId {
  const clean = path.replace(/\/+$/, "") || "/";
  return ROUTE_MAP[clean] || "dashboard";
}

export function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>(() =>
    typeof window !== "undefined" ? getScreenFromPathname(window.location.pathname) : "dashboard"
  );

  const [financialYear, setFinancialYear] = useState("2026-27");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem("quantum_user_info");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => api.isAuthenticated());
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<BusinessProfile | null>(null);

  // Business Data Collections
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [purchases, setPurchases] = useState<PurchaseBill[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Selected Invoice Modal for View / Preview
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  // Sync URL popstate
  useEffect(() => {
    const handlePopState = () => {
      setActiveScreen(getScreenFromPathname(window.location.pathname));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = (screenId: string) => {
    const validId = (screenId as ScreenId) || "dashboard";
    setActiveScreen(validId);
    const slug = SCREEN_TO_SLUG[validId] || "/dashboard";
    if (window.location.pathname !== slug) {
      window.history.pushState(null, "", slug);
    }
  };

  // Load Initial Cloud Data
  const refreshCloudData = async (overrideBizId?: string) => {
    if (!api.isAuthenticated()) {
      setIsAuthenticated(false);
      return;
    }

    try {
      const me = await api.getMe();
      if (me && me.user) {
        setCurrentUser(me.user);
        setIsAuthenticated(true);
      }

      // 1. Fetch user's registered businesses
      const bizRes = await api.fetchBusinesses();
      let allBiz: BusinessProfile[] = [];
      if (bizRes && Array.isArray(bizRes.data) && bizRes.data.length > 0) {
        allBiz = bizRes.data;
        setBusinesses(allBiz);
      }

      const currentBizId =
        overrideBizId || activeBusiness?.id || (allBiz.length > 0 ? allBiz[0].id : null);

      if (currentBizId) {
        const selected = allBiz.find((b) => b.id === currentBizId) || allBiz[0] || null;
        setActiveBusiness(selected);

        // 2. Fetch Invoices for this Business
        try {
          const invRes = await api.getInvoices(currentBizId);
          setInvoices(invRes.data || []);
        } catch (e) {
          console.error("Invoices fetch error:", e);
        }

        // 3. Fetch Purchases
        try {
          const purchRes = await api.getPurchases(currentBizId);
          setPurchases(purchRes.data || []);
        } catch (e) {
          console.error("Purchases fetch error:", e);
        }

        // 4. Fetch Customers & Suppliers
        try {
          const custRes = await api.getCustomers(currentBizId);
          const allParties = (custRes as any).data || custRes || [];
          setCustomers(allParties.filter((c: Customer) => c.customer_type !== "supplier"));
          setSuppliers(allParties.filter((c: Customer) => c.customer_type === "supplier"));
        } catch (e) {
          console.error("Customers fetch error:", e);
        }

        // 5. Fetch Products Catalog
        try {
          const prodRes = await api.getProducts(currentBizId);
          setProducts(prodRes || []);
        } catch (e) {
          console.error("Products fetch error:", e);
        }
      }
    } catch (err) {
      console.error("Refresh cloud data error:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshCloudData();
    }
  }, [isAuthenticated]);

  const handleSelectBusiness = (b: BusinessProfile) => {
    setActiveBusiness(b);
    refreshCloudData(b.id);
  };

  const handleLogout = async () => {
    await api.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const handleDownloadPdf = async (inv: Invoice) => {
    try {
      await api.downloadInvoicePdf(inv.id, inv.invoice_number);
    } catch (e: any) {
      alert("Error downloading PDF: " + (e.message || "Failed"));
    }
  };

  // If unauthenticated, display the full Auth Screen
  if (!isAuthenticated) {
    return (
      <AuthScreen
        onAuthSuccess={() => {
          setIsAuthenticated(true);
          refreshCloudData();
        }}
      />
    );
  }

  return (
    <AppLayout
      activeScreen={activeScreen}
      onNavigate={navigateTo}
      user={currentUser}
      businesses={businesses}
      activeBusiness={activeBusiness}
      onSelectBusiness={handleSelectBusiness}
      financialYear={financialYear}
      onSelectFinancialYear={setFinancialYear}
      onLogout={handleLogout}
      onQuickAction={(action) => {
        if (action === "pos_bill") navigateTo("billing_pos");
        else if (action === "new_invoice") navigateTo("billing");
        else if (action === "new_purchase") navigateTo("purchases");
      }}
    >
      {/* 1. Dashboard Screen */}
      {activeScreen === "dashboard" && (
        <DashboardScreen
          business={activeBusiness}
          invoices={invoices}
          onNavigate={navigateTo}
          onOpenCreateInvoice={() => navigateTo("billing")}
          onOpenPosBilling={() => navigateTo("billing_pos")}
          onViewInvoice={(inv) => setViewingInvoice(inv)}
          onDownloadPdf={handleDownloadPdf}
        />
      )}

      {/* 2. Express POS Billing */}
      {activeScreen === "billing_pos" && (
        <PosBillingScreen
          business={activeBusiness}
          customers={customers}
          products={products}
          onInvoiceCreated={() => refreshCloudData()}
        />
      )}

      {/* 3. Sales Invoice Workspace (Modular Redesign) */}
      {activeScreen === "billing" && (
        <SalesInvoiceCreate
          business={activeBusiness}
          customers={customers}
          products={products}
          onInvoiceCreated={() => {
            refreshCloudData();
            navigateTo("sales");
          }}
          onCustomerCreated={(c) => setCustomers((prev) => [c, ...prev])}
          onProductCreated={(p) => setProducts((prev) => [p, ...prev])}
          onNavigate={(route) => {
            const screen = getScreenFromPathname(route);
            navigateTo(screen);
          }}
        />
      )}

      {/* 3a. Quotations & Estimates */}
      {activeScreen === "quotations" && (
        <QuotationCreate
          business={activeBusiness}
          customers={customers}
          products={products}
          onNavigate={(route) => {
            const screen = getScreenFromPathname(route);
            navigateTo(screen);
          }}
        />
      )}

      {/* 3b. Credit Notes (Sales Return) */}
      {activeScreen === "credit_notes" && (
        <CreditNoteCreate
          business={activeBusiness}
          customers={customers}
          products={products}
          onNavigate={(route) => {
            const screen = getScreenFromPathname(route);
            navigateTo(screen);
          }}
        />
      )}

      {/* 3c. Delivery Challans (Rule 55) */}
      {activeScreen === "delivery_challans" && (
        <DeliveryChallanCreate
          business={activeBusiness}
          customers={customers}
          products={products}
          onNavigate={(route) => {
            const screen = getScreenFromPathname(route);
            navigateTo(screen);
          }}
        />
      )}

      {/* 4. Sales & Invoices List */}
      {activeScreen === "sales" && (
        <InvoiceList
          business={activeBusiness}
          invoices={invoices}
          onRefresh={() => refreshCloudData()}
          onOpenCreateInvoice={() => navigateTo("billing")}
          onViewInvoice={(inv) => setViewingInvoice(inv)}
          onDownloadPdf={handleDownloadPdf}
        />
      )}

      {/* 5. Purchases & Inward Bills */}
      {activeScreen === "purchases" && (
        <PurchasesListScreen
          business={activeBusiness}
          purchases={purchases}
          suppliers={suppliers}
          products={products}
          onRefresh={() => refreshCloudData()}
        />
      )}

      {/* 6. Inventory & Warehouses */}
      {activeScreen === "inventory" && (
        <InventoryScreen
          business={activeBusiness}
          products={products}
          onRefresh={() => refreshCloudData()}
          onNavigate={(screen) => navigateTo(screen)}
        />
      )}

      {/* 7. Double-Entry Accounting */}
      {activeScreen === "accounting" && (
        <AccountingScreen business={activeBusiness} />
      )}

      {/* 8. GST Statutory Compliance */}
      {activeScreen === "gst" && (
        <GstComplianceScreen
          business={activeBusiness}
          invoices={invoices}
          onRefresh={() => refreshCloudData()}
        />
      )}

      {/* 9. Contacts & Parties CRM */}
      {activeScreen === "contacts" && (
        <ContactsScreen
          business={activeBusiness}
          customers={customers}
          suppliers={suppliers}
          onRefresh={() => refreshCloudData()}
        />
      )}

      {/* 10. E-Commerce Marketplace Ingestion */}
      {activeScreen === "marketplace" && (
        <MarketplaceScreen business={activeBusiness} />
      )}

      {/* 11. Shopify Webhook Sync */}
      {activeScreen === "shopify" && (
        <ShopifyScreen business={activeBusiness} />
      )}

      {/* 12. Settings & GSTIN Registrations */}
      {activeScreen === "settings" && (
        <SettingsScreen
          business={activeBusiness}
          onRefresh={() => refreshCloudData()}
        />
      )}

      {/* Invoice Detail & Preview Modal */}
      {viewingInvoice && (
        <Modal
          isOpen={!!viewingInvoice}
          onClose={() => setViewingInvoice(null)}
          title={`Tax Invoice #${viewingInvoice.invoice_number}`}
          subtitle={`Date: ${viewingInvoice.invoice_date} • Place of Supply: State ${viewingInvoice.place_of_supply_state_code}`}
          size="lg"
          footer={
            <div className="w-full flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadPdf(viewingInvoice)}
                icon={<FileDown className="w-4 h-4" />}
              >
                Download PDF
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setViewingInvoice(null)}
              >
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Billed To (Customer)</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {viewingInvoice.customer?.name || "Direct Cash Customer"}
                </p>
                {viewingInvoice.customer?.gstin && (
                  <p className="font-mono text-slate-600 mt-0.5">
                    GSTIN: {viewingInvoice.customer.gstin}
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Document Status</span>
                <div className="mt-1">
                  <Badge variant="emerald" size="md">
                    {viewingInvoice.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Line items table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Item</th>
                    <th className="py-2.5 px-3">HSN</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                    <th className="py-2.5 px-3 text-right">Taxable (₹)</th>
                    <th className="py-2.5 px-3 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {viewingInvoice.items?.map((item, i) => (
                    <tr key={i}>
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-800">
                        {item.item_name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{item.hsn_sac}</td>
                      <td className="py-2.5 px-3 text-center">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right">
                        ₹{parseFloat(String(item.unit_price)).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        ₹{parseFloat(String(item.taxable_value)).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        ₹{parseFloat(String(item.total_amount)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable:</span>
                  <span>₹{parseFloat(viewingInvoice.total_taxable_value || "0").toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Tax:</span>
                  <span>₹{parseFloat(viewingInvoice.total_tax_amount || "0").toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-[#167a55] pt-1 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span>₹{parseFloat(viewingInvoice.grand_total || "0").toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}

export default App;
