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
  gstin?: string;
  state_code: string;
  state_name: string;
  email?: string;
  phone?: string;
  billing_address?: string;
  billing_pincode?: string;
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

  async fetchGstr1Summary() {
    const res = await fetch(`${API_BASE}/reports/gstr1`, {
      headers: this.getHeaders()
    });
    return res.json();
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
