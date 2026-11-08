export interface AuthUser {
  id: number | string;
  name: string;
  email: string;
}

export interface BusinessProfile {
  id: string;
  organization_id: string;
  legal_name: string;
  trade_name: string;
  pan?: string;
  email?: string;
  phone?: string;
  address?: string;
  currency?: string;
  status?: string;
  gstins?: Array<{
    id: string;
    gstin: string;
    state_code: string;
    state_name: string;
    address_line1?: string;
    city?: string;
    pincode?: string;
  }>;
}

export interface Customer {
  id: string;
  business_id: string;
  name: string;
  company_name?: string;
  customer_type?: string;
  gstin?: string;
  state_code: string;
  state_name?: string;
  state?: string;
  email?: string;
  phone?: string;
  billing_address?: string;
  address?: string;
  billing_pincode?: string;
  pincode?: string;
  city?: string;
}

export interface Product {
  id: string;
  business_id: string;
  type?: string;
  sku?: string;
  barcode?: string;
  name: string;
  hsn_sac?: string;
  hsn_code?: string;
  unit?: string;
  sale_price?: string;
  selling_price?: string | number;
  purchase_price?: string;
  tax_inclusive?: boolean;
  gst_rate?: number | string;
  current_stock?: number | string;
}

export interface InvoiceItem {
  id?: string;
  item_name: string;
  hsn_sac: string;
  quantity: number;
  unit: string;
  unit_price: number;
  taxable_value: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  total_amount: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  invoice_type: string;
  status: string;
  place_of_supply_state_code: string;
  is_interstate: boolean;
  total_taxable_value: string;
  total_cgst: string;
  total_sgst: string;
  total_igst: string;
  total_tax_amount: string;
  grand_total: string;
  customer?: Customer;
  items?: InvoiceItem[];
  irn?: string;
  ack_no?: string;
  ack_date?: string;
  signed_qr_code?: string;
  einvoice_status?: string;
}

export interface PurchaseBill {
  id: string;
  bill_number: string;
  bill_date: string;
  due_date?: string;
  supplier?: Customer;
  place_of_supply_state_code: string;
  total_taxable_value: string;
  total_cgst: string;
  total_sgst: string;
  total_igst: string;
  total_tax_amount: string;
  grand_total: string;
  status: string;
  itc_eligibility?: string;
  items?: any[];
}

export interface EWayBill {
  id: string;
  eway_bill_number: string;
  eway_bill_date: string;
  valid_until: string;
  doc_type: string;
  doc_number: string;
  vehicle_number?: string;
  distance_km: number;
  status: string;
  qr_code?: string;
}

const API_BASE =
  typeof window !== "undefined" && window.location.origin.includes("quantumgst.in")
    ? `${window.location.origin}/api/v1`
    : "https://quantumgst.in/api/v1";

class QuantumApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem("quantum_token");
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("quantum_token", token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("quantum_token");
    localStorage.removeItem("quantum_user_info");
  }

  getToken() {
    return this.token || localStorage.getItem("quantum_token");
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private getHeaders() {
    const activeToken = this.getToken();
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {})
    };
  }

  async checkOnboardingStatus() {
    const res = await fetch(`${API_BASE}/onboarding/status`, {
      headers: this.getHeaders()
    });
    return res.json();
  }

  async completeOnboarding(data: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/onboarding/complete`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (json.token) {
      this.setToken(json.token);
    }
    return json;
  }

  async post(endpoint: string, body?: unknown) {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${API_BASE}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;
    const res = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error((json as { message?: string }).message || "Request failed");
    }
    return json;
  }

  async get(endpoint: string) {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${API_BASE}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;
    const res = await fetch(url, {
      headers: this.getHeaders(),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error((json as { message?: string }).message || "Request failed");
    }
    return json;
  }

  async register(data: {
    name: string;
    email: string;
    password: string;
    organization_name?: string;
    business_legal_name?: string;
    gstin?: string;
    state_code?: string;
    state_name?: string;
  }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) {
      const errorMsg =
        json.message ||
        (json.errors ? Object.values(json.errors).flat().join(" ") : "Registration failed.");
      throw new Error(errorMsg);
    }
    if (json.token) {
      this.setToken(json.token);
      if (json.user) {
        localStorage.setItem("quantum_user_info", JSON.stringify(json.user));
      }
    }
    return json;
  }

  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ email, password })
    });
    const json = await res.json();
    if (!res.ok) {
      const errorMsg =
        json.message ||
        (json.errors ? Object.values(json.errors).flat().join(" ") : "Invalid email or password.");
      throw new Error(errorMsg);
    }
    if (json.token) {
      this.setToken(json.token);
      if (json.user) {
        localStorage.setItem("quantum_user_info", JSON.stringify(json.user));
      }
    }
    return json;
  }

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: this.getHeaders()
    });
    if (!res.ok) {
      if (res.status === 401) {
        this.clearToken();
      }
      throw new Error("Session expired. Please sign in again.");
    }
    const json = await res.json();
    if (json.user) {
      localStorage.setItem("quantum_user_info", JSON.stringify(json.user));
    }
    return json;
  }

  async logout() {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: this.getHeaders()
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      this.clearToken();
    }
  }

  async fetchInvoices(businessId?: string): Promise<{ data: Invoice[] }> {
    const url = businessId ? `${API_BASE}/invoices?business_id=${businessId}` : `${API_BASE}/invoices`;
    const res = await fetch(url, {
      headers: this.getHeaders()
    });
    return res.json();
  }

  async fetchBusinesses(): Promise<{ data: BusinessProfile[] }> {
    const res = await fetch(`${API_BASE}/businesses`, {
      headers: this.getHeaders()
    });
    return res.json();
  }

  async createBusiness(data: {
    legal_name: string;
    trade_name?: string;
    pan?: string;
    gstin?: string;
    state_code?: string;
    state_name?: string;
    email?: string;
    phone?: string;
    organization_id?: string;
  }): Promise<{ message: string; business: BusinessProfile }> {
    const res = await fetch(`${API_BASE}/businesses`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || "Failed to create company.");
    }
    return json;
  }

  async createInvoice(data: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/invoices`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  }

  async fetchCustomers(businessId?: string): Promise<{ data: Customer[] }> {
    const url = businessId ? `${API_BASE}/customers?business_id=${businessId}` : `${API_BASE}/customers`;
    const res = await fetch(url, {
      headers: this.getHeaders()
    });
    return res.json();
  }

  async createCustomer(data: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/customers`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  }

  async fetchGstr1Summary(businessId?: string) {
    const url = businessId ? `${API_BASE}/reports/gstr1?business_id=${businessId}` : `${API_BASE}/reports/gstr1`;
    const res = await fetch(url, {
      headers: this.getHeaders()
    });
    return res.json();
  }

  async fetchMarketplaceOrders(businessId?: string) {
    const url = businessId ? `${API_BASE}/marketplace/orders?business_id=${businessId}` : `${API_BASE}/marketplace/orders`;
    const res = await fetch(url, {
      headers: this.getHeaders()
    });
    return res.json();
  }

  // Statutory E-Invoice & E-Way Bill Methods
  async generateEInvoice(invoiceId: string) {
    const res = await fetch(`${API_BASE}/einvoice/generate`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ invoice_id: invoiceId })
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || "Failed to generate e-Invoice IRN");
    }
    return json;
  }

  async cancelEInvoice(invoiceId: string, reason: string = "Data entry error") {
    const res = await fetch(`${API_BASE}/einvoice/cancel`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ invoice_id: invoiceId, cancel_reason: reason })
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || "Failed to cancel e-Invoice");
    }
    return json;
  }

  async generateEWayBill(data: {
    invoice_id: string;
    distance_km: number;
    vehicle_number?: string;
    transport_mode?: string;
    transporter_name?: string;
  }) {
    const res = await fetch(`${API_BASE}/eway/generate-invoice`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || "Failed to generate e-Way Bill");
    }
    return json;
  }

  async fetchEWayBills(businessId: string): Promise<{ data: EWayBill[] }> {
    const res = await fetch(`${API_BASE}/eway?business_id=${businessId}`, {
      headers: this.getHeaders()
    });
    return res.json();
  }

  // Purchases & GSTR-2B
  async fetchPurchases(businessId: string): Promise<{ data: PurchaseBill[] }> {
    const res = await fetch(`${API_BASE}/purchases?business_id=${businessId}`, {
      headers: this.getHeaders()
    });
    return res.json();
  }

  async createPurchase(data: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/purchases`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || "Failed to record purchase bill");
    }
    return json;
  }

  async reconcileGstr2b(businessId: string, returnPeriod: string, gstr2bData: any) {
    const res = await fetch(`${API_BASE}/reports/gstr2b-reconcile`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        business_id: businessId,
        return_period: returnPeriod,
        gstr2b_data: gstr2bData
      })
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || "Failed to reconcile GSTR-2B");
    }
    return json;
  }

  async fetchProducts(businessId?: string): Promise<Product[]> {
    const url = businessId ? `${API_BASE}/products?business_id=${businessId}` : `${API_BASE}/products`;
    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) return [];
    return res.json();
  }

  async createProduct(data: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/products`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || "Failed to create product");
    }
    return json;
  }

  async createGstin(data: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/gstins`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || "Failed to register GSTIN");
    }
    return json;
  }

  async fetchGstr3b(businessId: string) {
    const res = await fetch(`${API_BASE}/reports/gstr3b?business_id=${businessId}`, {
      headers: this.getHeaders()
    });
    if (!res.ok) return {};
    return res.json();
  }

  async fetchAccounts(businessId: string) {
    const res = await fetch(`${API_BASE}/accounting/accounts?business_id=${businessId}`, {
      headers: this.getHeaders()
    });
    if (!res.ok) return [];
    return res.json();
  }

  async fetchJournalEntries(businessId: string) {
    const res = await fetch(`${API_BASE}/accounting/journal-entries?business_id=${businessId}`, {
      headers: this.getHeaders()
    });
    if (!res.ok) return { data: [] };
    return res.json();
  }

  async fetchTrialBalance(businessId: string) {
    const res = await fetch(`${API_BASE}/accounting/trial-balance?business_id=${businessId}`, {
      headers: this.getHeaders()
    });
    if (!res.ok) return null;
    return res.json();
  }

  async fetchProfitLoss(businessId: string) {
    const res = await fetch(`${API_BASE}/accounting/profit-loss?business_id=${businessId}`, {
      headers: this.getHeaders()
    });
    if (!res.ok) return null;
    return res.json();
  }

  async cancelInvoice(invoiceId: string, reason: string = "Cancelled by user") {
    const res = await fetch(`${API_BASE}/invoices/${invoiceId}/cancel`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ reason })
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || "Failed to cancel invoice");
    }
    return json;
  }

  async downloadInvoicePdf(invoiceId: string, invoiceNumber: string) {
    const res = await fetch(`${API_BASE}/invoices/${invoiceId}/pdf`, {
      headers: this.getHeaders()
    });
    if (!res.ok) {
      throw new Error("Failed to download PDF");
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice_${invoiceNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async importMarketplace(data: Record<string, unknown>) {
    const res = await fetch(`${API_BASE}/marketplace/import`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || "Marketplace report import failed");
    }
    return json;
  }

  // Convenience aliases
  getInvoices = (bizId?: string) => this.fetchInvoices(bizId);
  getCustomers = (bizId?: string) => this.fetchCustomers(bizId);
  getPurchases = (bizId: string) => this.fetchPurchases(bizId);
  getProducts = (bizId?: string) => this.fetchProducts(bizId);
  getEWayBills = (bizId: string) => this.fetchEWayBills(bizId);
  getGstr1 = (bizId?: string) => this.fetchGstr1Summary(bizId);
  getGstr3b = (bizId: string) => this.fetchGstr3b(bizId);
  getAccounts = (bizId: string) => this.fetchAccounts(bizId);
  getJournalEntries = (bizId: string) => this.fetchJournalEntries(bizId);
  getTrialBalance = (bizId: string) => this.fetchTrialBalance(bizId);
  getProfitLoss = (bizId: string) => this.fetchProfitLoss(bizId);

  getTallyXmlExportUrl(businessId: string, type: "all" | "masters" | "vouchers" = "all"): string {
    const activeToken = this.getToken();
    return `${API_BASE}/export/tally-xml?business_id=${businessId}&type=${type}&token=${activeToken || ""}`;
  }

  async checkLatestAppVersion(): Promise<{ hasUpdate: boolean; latestVersion: string; currentVersion: string; releaseUrl: string }> {
    const installedVersion = localStorage.getItem("quantum_installed_version") || "1.0.1";
    try {
      const res = await fetch("https://api.github.com/repos/jasimmondal57/quantum-gst-core/releases/latest", {
        headers: { Accept: "application/vnd.github.v3+json" }
      });
      if (res.ok) {
        const release = await res.json();
        const latestVersion = (release.tag_name || "v1.0.1").replace(/^v/, "");
        const hasUpdate = latestVersion !== installedVersion;
        return {
          hasUpdate,
          latestVersion,
          currentVersion: installedVersion,
          releaseUrl: release.html_url || "https://github.com/jasimmondal57/quantum-gst-core/releases"
        };
      }
    } catch {
      // Fallback
    }
    return {
      hasUpdate: false,
      latestVersion: installedVersion,
      currentVersion: installedVersion,
      releaseUrl: "https://github.com/jasimmondal57/quantum-gst-core/releases"
    };
  }
}

export const api = new QuantumApiClient();
