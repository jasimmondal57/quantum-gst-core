import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import type { AuthUser, BusinessProfile } from "../../services/api";

export interface AppLayoutProps {
  children: React.ReactNode;
  activeScreen: string;
  onNavigate: (screenId: string) => void;
  user: AuthUser | null;
  businesses: BusinessProfile[];
  activeBusiness: BusinessProfile | null;
  onSelectBusiness: (b: BusinessProfile) => void;
  financialYear: string;
  onSelectFinancialYear: (fy: string) => void;
  onLogout: () => void;
  onQuickAction: (action: "new_invoice" | "pos_bill" | "new_purchase") => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeScreen,
  onNavigate,
  user,
  businesses,
  activeBusiness,
  onSelectBusiness,
  financialYear,
  onSelectFinancialYear,
  onLogout,
  onQuickAction,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-800 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0 sticky top-0 h-screen z-30">
        <Sidebar
          activeScreen={activeScreen}
          onNavigate={onNavigate}
          activeBusiness={activeBusiness}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative z-10 w-64 max-w-[80vw]">
            <Sidebar
              activeScreen={activeScreen}
              onNavigate={(screen) => {
                onNavigate(screen);
                setMobileNavOpen(false);
              }}
              activeBusiness={activeBusiness}
              collapsed={false}
              onToggleCollapse={() => setMobileNavOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <TopBar
          user={user}
          businesses={businesses}
          activeBusiness={activeBusiness}
          onSelectBusiness={onSelectBusiness}
          financialYear={financialYear}
          onSelectFinancialYear={onSelectFinancialYear}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          onLogout={onLogout}
          onQuickAction={onQuickAction}
        />

        <main className="flex-1 p-3 sm:p-5 lg:p-6 w-full animate-fadeIn">
          {children}
        </main>
      </div>
    </div>
  );
};
