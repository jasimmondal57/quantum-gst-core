import React, { useState } from "react";
import {
  ShieldCheck,
  Building2,
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  Store,
  FileSpreadsheet
} from "lucide-react";
import { api } from "../services/api";

interface AuthScreenProps {
  onAuthSuccess: (authData: any) => void;
}

const INDIAN_STATES: Record<string, string> = {
  "01": "Jammu & Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "26": "Dadra & Nagar Haveli and Daman & Diu",
  "27": "Maharashtra",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman & Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh"
};

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Sign In fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Sign Up fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [businessLegalName, setBusinessLegalName] = useState("");
  const [gstin, setGstin] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [stateName, setStateName] = useState("");

  // Auto-fill state from GSTIN
  const handleGstinChange = (val: string) => {
    const upper = val.toUpperCase().slice(0, 15);
    setGstin(upper);
    if (upper.length >= 2) {
      const code = upper.substring(0, 2);
      if (INDIAN_STATES[code]) {
        setStateCode(code);
        setStateName(INDIAN_STATES[code]);
      }
    }
  };

  const handleOrgNameChange = (val: string) => {
    setOrgName(val);
    if (!businessLegalName || businessLegalName === orgName) {
      setBusinessLegalName(val);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!loginEmail || !loginPassword) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.login(loginEmail, loginPassword);
      onAuthSuccess(res);
    } catch (err: any) {
      setErrorMsg(err.message || "Sign in failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!name.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        name: name.trim(),
        email: email.trim(),
        password: password,
        organization_name: orgName.trim() || `${name.trim()}'s Org`,
        business_legal_name: businessLegalName.trim() || orgName.trim() || `${name.trim()} Traders`
      };

      if (gstin.trim()) {
        payload.gstin = gstin.trim().toUpperCase();
        payload.state_code = stateCode || gstin.substring(0, 2);
        payload.state_name = stateName || (INDIAN_STATES[payload.state_code] || "State");
      }

      const res = await api.register(payload);
      onAuthSuccess(res);
    } catch (err: any) {
      setErrorMsg(err.message || "Registration failed. Please check the form fields.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f274a 0%, #123b73 50%, #1a4f9c 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "Inter, sans-serif"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1020px",
          background: "#ffffff",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.4)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))"
        }}
      >
        {/* Left Side: Brand Showcase & Value Proposition */}
        <div
          style={{
            background: "linear-gradient(145deg, #0a254a 0%, #123b73 100%)",
            color: "#ffffff",
            padding: "48px 40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px" }}>
              <div
                style={{
                  background: "#ffffff",
                  color: "#123b73",
                  fontWeight: 900,
                  fontSize: "20px",
                  width: "42px",
                  height: "42px",
                  borderRadius: "10px",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}
              >
                Q
              </div>
              <div>
                <div style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.5px" }}>
                  Quantum <span style={{ color: "#60a5fa" }}>GST</span>
                </div>
                <div style={{ fontSize: "12px", color: "#93c5fd", fontWeight: 500 }}>
                  Statutory Cloud Accounting & Compliance
                </div>
              </div>
            </div>

            <h2 style={{ fontSize: "24px", fontWeight: 700, lineHeight: 1.3, marginBottom: "16px" }}>
              Unified GST compliance & multi-channel invoicing for India.
            </h2>
            <p style={{ color: "#bfdbfe", fontSize: "14px", lineHeight: 1.6, marginBottom: "32px" }}>
              Seamlessly generate statutory GST invoices, sync orders from Amazon, Shopify, and Meesho, and file accurate returns with automated reconciliations.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: "rgba(96, 165, 250, 0.18)", padding: "8px", borderRadius: "8px", color: "#60a5fa" }}>
                  <Zap size={18} />
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600 }}>Automated Invoicing & GSTR-1</div>
                  <div style={{ fontSize: "12px", color: "#93c5fd" }}>Instant e-Invoicing with QR & B2B compliance</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: "rgba(96, 165, 250, 0.18)", padding: "8px", borderRadius: "8px", color: "#60a5fa" }}>
                  <Store size={18} />
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600 }}>Multi-Marketplace Reconciliation</div>
                  <div style={{ fontSize: "12px", color: "#93c5fd" }}>Direct imports for Flipkart, Amazon & Shopify</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ background: "rgba(96, 165, 250, 0.18)", padding: "8px", borderRadius: "8px", color: "#60a5fa" }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600 }}>256-Bit Bank-Grade Security</div>
                  <div style={{ fontSize: "12px", color: "#93c5fd" }}>Encrypted multi-tenant data architecture</div>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: "40px",
              paddingTop: "24px",
              borderTop: "1px solid rgba(255,255,255,0.12)",
              fontSize: "12px",
              color: "#93c5fd",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <span>quantumgst.in</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#60a5fa" }}>
              <Sparkles size={12} /> Certified GST Ready
            </span>
          </div>
        </div>

        {/* Right Side: Auth Forms (Sign In & Sign Up) */}
        <div style={{ padding: "44px 38px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {/* Tab Switcher */}
          <div
            style={{
              display: "flex",
              background: "#f1f5f9",
              padding: "4px",
              borderRadius: "12px",
              marginBottom: "28px"
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setErrorMsg(null);
              }}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "9px",
                border: "none",
                fontSize: "14px",
                fontWeight: mode === "signin" ? 700 : 500,
                background: mode === "signin" ? "#ffffff" : "transparent",
                color: mode === "signin" ? "#123b73" : "#64748b",
                boxShadow: mode === "signin" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setErrorMsg(null);
              }}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "9px",
                border: "none",
                fontSize: "14px",
                fontWeight: mode === "signup" ? 700 : 500,
                background: mode === "signup" ? "#ffffff" : "transparent",
                color: mode === "signup" ? "#123b73" : "#64748b",
                boxShadow: mode === "signup" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              Create Account
            </button>
          </div>

          <div style={{ marginBottom: "22px" }}>
            <h3 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>
              {mode === "signin" ? "Welcome back" : "Create your Quantum GST account"}
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
              {mode === "signin"
                ? "Sign in with your registered credentials to access your dashboard."
                : "Get started with your company workspace in under a minute."}
            </p>
          </div>

          {/* Error Message Box */}
          {errorMsg && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "10px",
                padding: "12px 14px",
                marginBottom: "20px",
                color: "#991b1b",
                fontSize: "13px",
                display: "flex",
                alignItems: "flex-start",
                gap: "8px"
              }}
            >
              <AlertCircle size={16} style={{ marginTop: "2px", flexShrink: 0 }} />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === "signin" ? (
            <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Work Email
                </label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "#94a3b8" }} />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@company.com"
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 36px",
                      borderRadius: "9px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      outline: "none",
                      color: "#1e293b",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "#94a3b8" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    style={{
                      width: "100%",
                      padding: "10px 38px 10px 36px",
                      borderRadius: "9px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      outline: "none",
                      color: "#1e293b",
                      boxSizing: "border-box"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "10px",
                      background: "none",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                      padding: "2px"
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#475569", cursor: "pointer" }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: "#123b73", cursor: "pointer" }} />
                  Remember me
                </label>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setErrorMsg("Please contact your administrator or support at admin@quantumgst.in for password recovery.");
                  }}
                  style={{ color: "#2563eb", textDecoration: "none", fontWeight: 500 }}
                >
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: "8px",
                  padding: "12px",
                  borderRadius: "10px",
                  background: "#123b73",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "15px",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "background 0.2s ease"
                }}
              >
                {loading ? "Authenticating..." : (
                  <>
                    Sign In to Quantum GST <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div style={{ marginTop: "16px", textAlign: "center", fontSize: "13px", color: "#64748b" }}>
                Don't have an account yet?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setErrorMsg(null);
                  }}
                  style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 600, cursor: "pointer" }}
                >
                  Create one now
                </button>
              </div>
            </form>
          ) : (
            /* SIGN UP FORM */
            <form onSubmit={handleSignUp} style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    Full Name *
                  </label>
                  <div style={{ position: "relative" }}>
                    <User size={15} style={{ position: "absolute", left: "10px", top: "11px", color: "#94a3b8" }} />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Jasim Mondal"
                      style={{
                        width: "100%",
                        padding: "8px 10px 8px 32px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    Work Email *
                  </label>
                  <div style={{ position: "relative" }}>
                    <Mail size={15} style={{ position: "absolute", left: "10px", top: "11px", color: "#94a3b8" }} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@mycompany.com"
                      style={{
                        width: "100%",
                        padding: "8px 10px 8px 32px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  Create Password (min 8 chars) *
                </label>
                <div style={{ position: "relative" }}>
                  <Lock size={15} style={{ position: "absolute", left: "10px", top: "11px", color: "#94a3b8" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: "100%",
                      padding: "8px 36px 8px 32px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "8px",
                      background: "none",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer"
                    }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    Company / Org Name
                  </label>
                  <div style={{ position: "relative" }}>
                    <Building2 size={15} style={{ position: "absolute", left: "10px", top: "11px", color: "#94a3b8" }} />
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => handleOrgNameChange(e.target.value)}
                      placeholder="e.g. Apex Enterprises"
                      style={{
                        width: "100%",
                        padding: "8px 10px 8px 32px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                    GSTIN (Optional)
                  </label>
                  <div style={{ position: "relative" }}>
                    <FileSpreadsheet size={15} style={{ position: "absolute", left: "10px", top: "11px", color: "#94a3b8" }} />
                    <input
                      type="text"
                      maxLength={15}
                      value={gstin}
                      onChange={(e) => handleGstinChange(e.target.value)}
                      placeholder="27AAACQ1234F1Z5"
                      style={{
                        width: "100%",
                        padding: "8px 10px 8px 32px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        textTransform: "uppercase",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>
              </div>

              {stateName && (
                <div
                  style={{
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    color: "#065f46",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <CheckCircle2 size={14} color="#059669" />
                  <span>
                    Detected State: <strong>{stateName} ({stateCode})</strong>
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: "6px",
                  padding: "11px",
                  borderRadius: "10px",
                  background: "#123b73",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                {loading ? "Creating your workspace..." : (
                  <>
                    Create Account & Get Started <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div style={{ textAlign: "center", fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setErrorMsg(null);
                  }}
                  style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 600, cursor: "pointer" }}
                >
                  Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
