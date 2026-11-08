import React from "react";
import {
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  ShoppingBag,
  Package,
  BookOpen,
  FileSpreadsheet,
  Users,
  Store,
  Boxes,
  Settings,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import type { BusinessProfile } from "../../services/api";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  children?: { id: string; label: string }[];
}

export interface SidebarProps {
  activeScreen: string;
  onNavigate: (screenId: string) => void;
  activeBusiness: BusinessProfile | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const NAV_ITEMS: { category: string; items: NavItem[] }[] = [
  {
    category: "MAIN",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: <LayoutDashboard className="w-4 h-4" />,
      },
      {
        id: "billing_pos",
        label: "POS Billing",
        icon: <Receipt className="w-4 h-4" />,
        badge: "Fast",
      },
      {
        id: "sales",
        label: "Sales & Invoices",
        icon: <ShoppingCart className="w-4 h-4" />,
      },
      {
        id: "purchases",
        label: "Purchases & Bills",
        icon: <ShoppingBag className="w-4 h-4" />,
      },
    ],
  },
  {
    category: "OPERATIONS",
    items: [
      {
        id: "inventory",
        label: "Inventory & Warehouses",
        icon: <Package className="w-4 h-4" />,
      },
      {
        id: "accounting",
        label: "Double-Entry Books",
        icon: <BookOpen className="w-4 h-4" />,
      },
      {
        id: "gst",
        label: "GST Returns & IRN",
        icon: <FileSpreadsheet className="w-4 h-4" />,
        badge: "Gov",
      },
      {
        id: "contacts",
        label: "Parties (CRM)",
        icon: <Users className="w-4 h-4" />,
      },
    ],
  },
  {
    category: "CHANNELS & ADMIN",
    items: [
      {
        id: "marketplace",
        label: "Marketplace Reports",
        icon: <Boxes className="w-4 h-4" />,
      },
      {
        id: "shopify",
        label: "Shopify Store",
        icon: <Store className="w-4 h-4" />,
      },
      {
        id: "settings",
        label: "Settings & GSTINs",
        icon: <Settings className="w-4 h-4" />,
      },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeScreen,
  onNavigate,
  activeBusiness,
  collapsed,
  onToggleCollapse,
}) => {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-[#0f231c] text-slate-200 transition-all duration-300 border-r border-[#16382b] select-none ${
        collapsed ? "w-18" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#16382b]">
        <div
          onClick={() => onNavigate("dashboard")}
          className="flex items-center gap-3 cursor-pointer overflow-hidden"
        >
          <div className="w-9 h-9 rounded-xl bg-[#167a55] text-white flex items-center justify-center font-black text-base shadow-md shrink-0">
            Q
          </div>
          {!collapsed && (
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-sm tracking-tight">
                  Quantum GST
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#167a55] text-emerald-100">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-emerald-300/70 truncate">
                Financial OS for Bharat
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Active Business Mini Card */}
      {!collapsed && (
        <div className="mx-3 mt-3.5 mb-2 p-2.5 rounded-xl bg-[#16382b]/70 border border-[#1d4737] flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {activeBusiness?.trade_name || activeBusiness?.legal_name || "Primary Company"}
            </p>
            <p className="text-[10px] text-emerald-300 font-mono tracking-wider truncate">
              {activeBusiness?.gstins?.[0]?.gstin || "No Active GSTIN"}
            </p>
          </div>
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        </div>
      )}

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5 no-scrollbar">
        {NAV_ITEMS.map((group) => (
          <div key={group.category} className="space-y-1">
            {!collapsed && (
              <p className="px-2.5 text-[10px] font-semibold text-emerald-300/50 tracking-wider">
                {group.category}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = activeScreen === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                      isActive
                        ? "bg-[#167a55] text-white shadow-sm font-semibold"
                        : "text-slate-300 hover:bg-[#16382b]/60 hover:text-white"
                    } ${collapsed ? "justify-center px-0" : ""}`}
                  >
                    <span
                      className={`shrink-0 transition-colors ${
                        isActive ? "text-white" : "text-emerald-300/80 group-hover:text-white"
                      }`}
                    >
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <>
                        <span className="truncate flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-[#16382b] text-emerald-300 border border-[#235843]"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer / Toggle */}
      <div className="p-3 border-t border-[#16382b] bg-[#0c1c16] flex items-center justify-between text-xs text-slate-400">
        {!collapsed && (
          <div className="truncate text-[11px]">
            <span className="text-emerald-400 font-medium">v1.2.4</span> • PostgreSQL 16
          </div>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          className="p-1.5 rounded-lg bg-[#16382b] hover:bg-[#1d4737] text-emerald-300 hover:text-white transition-colors"
        >
          <ChevronRight
            className={`w-4 h-4 transition-transform duration-200 ${
              collapsed ? "" : "rotate-180"
            }`}
          />
        </button>
      </div>
    </aside>
  );
};
