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
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Plus,
  FileText,
  FileCheck,
  RotateCcw,
  Truck,
} from "lucide-react";
import { Badge } from "../ui/Badge";
import type { BusinessProfile } from "../../services/api";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
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
        id: "billing",
        label: "Create Invoice",
        icon: <FileText className="w-4 h-4" />,
        badge: "New",
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
    category: "DOCUMENTS & OPERATIONS",
    items: [
      {
        id: "quotations",
        label: "Quotations",
        icon: <FileCheck className="w-4 h-4" />,
      },
      {
        id: "credit_notes",
        label: "Credit Notes",
        icon: <RotateCcw className="w-4 h-4" />,
      },
      {
        id: "delivery_challans",
        label: "Delivery Challans",
        icon: <Truck className="w-4 h-4" />,
      },
      {
        id: "inventory",
        label: "Inventory & Stock",
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
    ],
  },
  {
    category: "CHANNELS & ADMIN",
    items: [
      {
        id: "contacts",
        label: "Parties & Contacts",
        icon: <Users className="w-4 h-4" />,
      },
      {
        id: "marketplace",
        label: "Marketplace Feeds",
        icon: <Store className="w-4 h-4" />,
      },
      {
        id: "shopify",
        label: "Shopify Sync",
        icon: <Store className="w-4 h-4" />,
      },
      {
        id: "settings",
        label: "Business & GSTINs",
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
  const primaryGstin = activeBusiness?.gstins?.[0]?.gstin || "No GSTIN Registered";

  return (
    <aside
      className={`relative bg-white border-r border-[#e2ebe5] flex flex-col transition-all duration-200 select-none ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#e2ebe5]">
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#167a55] flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
              Q
            </div>
            <div className="truncate">
              <span className="font-extrabold text-sm tracking-tight text-[#172b25] block">
                Quantum<span className="text-[#167a55]">GST</span>
              </span>
              <span className="text-[10px] text-[#71817a] font-medium block truncate">
                Billing & Cloud ERP
              </span>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="w-8 h-8 mx-auto rounded-lg bg-[#167a55] flex items-center justify-center text-white font-bold text-sm shadow-xs">
            Q
          </div>
        )}

        <button
          type="button"
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-lg text-[#71817a] hover:text-[#172b25] hover:bg-[#f5f8f6] transition-colors ${
            collapsed ? "hidden" : "block"
          }`}
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Active Business Context Pill */}
      {!collapsed && (
        <div className="p-3 mx-3 my-2 rounded-xl bg-[#eaf6ef] border border-[#b8e2cd]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#172b25] truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-[#167a55] shrink-0" />
            <span className="truncate">
              {activeBusiness?.trade_name || activeBusiness?.legal_name || "Primary Entity"}
            </span>
          </div>
          <p className="text-[10px] font-mono text-[#167a55] mt-0.5 truncate pl-5">
            {primaryGstin}
          </p>
        </div>
      )}

      {/* Quick Action Button */}
      <div className="p-3">
        <button
          type="button"
          onClick={() => onNavigate("billing")}
          className={`w-full flex items-center justify-center gap-2 bg-[#167a55] hover:bg-[#136949] text-white font-semibold text-xs py-2 rounded-xl shadow-xs transition-colors ${
            collapsed ? "px-0" : "px-3"
          }`}
          title="Create Tax Invoice (F3)"
        >
          <Plus className="w-4 h-4 shrink-0" />
          {!collapsed && <span>+ Create Invoice</span>}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4 scrollbar-thin">
        {NAV_ITEMS.map((group) => (
          <div key={group.category} className="space-y-0.5">
            {!collapsed && (
              <h4 className="px-3 text-[10px] font-bold text-[#71817a] uppercase tracking-wider mb-1">
                {group.category}
              </h4>
            )}
            {group.items.map((item) => {
              const isActive = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#eaf6ef] text-[#167a55] font-semibold"
                      : "text-[#71817a] hover:text-[#172b25] hover:bg-[#f5f8f6]"
                  } ${collapsed ? "justify-center" : "justify-between"}`}
                  title={item.label}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`shrink-0 ${
                        isActive ? "text-[#167a55]" : "text-[#71817a]"
                      }`}
                    >
                      {item.icon}
                    </span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!collapsed && item.badge && (
                    <Badge
                      variant={item.badge === "Fast" ? "emerald" : "neutral"}
                      size="sm"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom Toggle when collapsed */}
      {collapsed && (
        <div className="p-2 border-t border-[#e2ebe5]">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 rounded-lg text-[#71817a] hover:bg-[#f5f8f6]"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
};
