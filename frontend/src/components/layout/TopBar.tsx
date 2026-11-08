import React, { useState } from "react";
import {
  Building2,
  Calendar,
  Search,
  Plus,
  Bell,
  LogOut,
  Menu,
  ChevronDown,
  FileText,
  Receipt,
  ShoppingCart,
} from "lucide-react";
import type { AuthUser, BusinessProfile } from "../../services/api";

export interface TopBarProps {
  user: AuthUser | null;
  businesses: BusinessProfile[];
  activeBusiness: BusinessProfile | null;
  onSelectBusiness: (b: BusinessProfile) => void;
  financialYear: string;
  onSelectFinancialYear: (fy: string) => void;
  onOpenMobileNav: () => void;
  onLogout: () => void;
  onQuickAction: (action: "new_invoice" | "pos_bill" | "new_purchase") => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  user,
  businesses,
  activeBusiness,
  onSelectBusiness,
  financialYear,
  onSelectFinancialYear,
  onOpenMobileNav,
  onLogout,
  onQuickAction,
}) => {
  const [showBizDropdown, setShowBizDropdown] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-20 px-3 sm:px-6 flex items-center justify-between gap-3 shadow-2xs">
      {/* Left: Mobile Toggle & Business Switcher */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Business Switcher Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowBizDropdown(!showBizDropdown);
              setShowQuickMenu(false);
              setShowProfileMenu(false);
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition-colors"
          >
            <Building2 className="w-4 h-4 text-[#167a55]" />
            <span className="truncate max-w-[130px] sm:max-w-[200px]">
              {activeBusiness?.trade_name || activeBusiness?.legal_name || "Select Company"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {showBizDropdown && (
            <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Switch Business
              </div>
              <div className="max-h-56 overflow-y-auto">
                {businesses.map((biz) => {
                  const isSelected = activeBusiness?.id === biz.id;
                  return (
                    <button
                      key={biz.id}
                      type="button"
                      onClick={() => {
                        onSelectBusiness(biz);
                        setShowBizDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        isSelected ? "bg-[#e8f5ee] text-[#167a55] font-semibold" : "text-slate-700"
                      }`}
                    >
                      <span className="truncate">{biz.trade_name || biz.legal_name}</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#167a55]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Financial Year Selector */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={financialYear}
            onChange={(e) => onSelectFinancialYear(e.target.value)}
            className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="2026-27">FY 2026-27</option>
            <option value="2025-26">FY 2025-26</option>
            <option value="2024-25">FY 2024-25</option>
          </select>
        </div>
      </div>

      {/* Middle: Global Search */}
      <div className="hidden lg:flex flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoices, parties, items (Ctrl + K)..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/70 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#167a55]/20 focus:border-[#167a55] transition-all"
          />
        </div>
      </div>

      {/* Right: Quick Create + Notification + Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Action Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowQuickMenu(!showQuickMenu);
              setShowBizDropdown(false);
              setShowProfileMenu(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#167a55] hover:bg-[#126345] text-white text-xs font-semibold shadow-xs transition-all active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </button>

          {showQuickMenu && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40">
              <button
                type="button"
                onClick={() => {
                  onQuickAction("pos_bill");
                  setShowQuickMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-[#e8f5ee] hover:text-[#167a55] flex items-center gap-2 transition-colors font-medium"
              >
                <Receipt className="w-4 h-4 text-[#167a55]" />
                New POS Bill
              </button>
              <button
                type="button"
                onClick={() => {
                  onQuickAction("new_invoice");
                  setShowQuickMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors font-medium"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                GST Tax Invoice
              </button>
              <button
                type="button"
                onClick={() => {
                  onQuickAction("new_purchase");
                  setShowQuickMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors font-medium"
              >
                <ShoppingCart className="w-4 h-4 text-amber-600" />
                Purchase Bill
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <button
          type="button"
          title="Notifications"
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5" />
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowBizDropdown(false);
              setShowQuickMenu(false);
            }}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[#e8f5ee] text-[#167a55] font-bold text-xs flex items-center justify-center border border-[#b8e2cd]">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="hidden xl:block text-left text-xs">
              <p className="font-semibold text-slate-800 leading-tight">
                {user?.name || "Admin"}
              </p>
              <p className="text-[10px] text-slate-400 leading-tight truncate max-w-[120px]">
                {user?.email || "authorized"}
              </p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-800">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors font-medium"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
