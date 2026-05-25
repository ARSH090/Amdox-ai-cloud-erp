// apps/web/app/admin/dashboard/layout.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Session Auth Guard check
    const user = localStorage.getItem("amdox_current_user");
    if (!user) {
      router.push("/admin/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  if (!isAuthenticated) {
    // Show slow pulsing layout skeleton CLS shield
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="space-y-4 w-64 animate-pulse">
          <div className="h-4 bg-white/10 rounded w-3/4"></div>
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
          <div className="h-10 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  const navLinks = [
    { name: "Overview", path: "/admin/dashboard", icon: "dashboard" },
    { name: "Finance Ledger", path: "/admin/dashboard/finance", icon: "account_balance_wallet" },
    { name: "HR & Payroll", path: "/admin/dashboard/hr", icon: "groups" },
    { name: "Supply Chain", path: "/admin/dashboard/supply-chain", icon: "inventory_2" }
  ];

  return (
    <div className="min-h-screen flex bg-[#030712]">
      {/* Sidebar Panel */}
      <aside
        className={`bg-[#080e1a] border-r border-white/5 flex flex-col justify-between py-6 px-4 transition-fluid fixed left-0 top-0 h-full z-30 ${
          sidebarCollapsed ? "w-20" : "w-72"
        }`}
      >
        <div>
          {/* Brand */}
          <div className="mb-10 flex justify-between items-center px-2">
            {!sidebarCollapsed && (
              <div>
                <h2 className="text-xs font-mono font-bold text-[#C0C1FF] tracking-wider mb-1">AMDOX ERP</h2>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-mono text-white/60">[SYS: ACTIVE]</span>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-[#918fa1] hover:text-white p-1 rounded hover:bg-white/5"
            >
              <span className="material-symbols-outlined text-sm">
                {sidebarCollapsed ? "menu" : "menu_open"}
              </span>
            </button>
          </div>

          {/* Links */}
          <nav className="space-y-2">
            {navLinks.map((link) => {
              const active = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-fluid font-mono text-xs ${
                    active
                      ? "bg-[#4F46E5] text-white font-bold"
                      : "text-[#918fa1] hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{link.icon}</span>
                  {!sidebarCollapsed && <span>{link.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Back Link */}
        <div className="border-t border-white/5 pt-4">
          <Link
            href="/"
            className="flex items-center gap-3 p-3 text-xs text-[#918fa1] hover:bg-white/5 hover:text-white rounded-lg transition-fluid font-mono"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            {!sidebarCollapsed && <span>Exit Portal</span>}
          </Link>
        </div>
      </aside>

      {/* Main Container */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-fluid ${
          sidebarCollapsed ? "pl-20" : "pl-72"
        }`}
      >
        {/* Header Bar */}
        <header className="h-16 border-b border-white/5 bg-[#030712]/80 backdrop-blur-md px-8 flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#918fa1]">/admin/dashboard</span>
            <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/20 uppercase">
              US-EAST-01
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-[#918fa1]">
            <span>Platform Admin</span>
            <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden border border-white/5">
              <div className="w-full h-full bg-gradient-to-br from-[#4F46E5] to-[#10B981]"></div>
            </div>
          </div>
        </header>

        {/* Child Views Canvas */}
        <main className="p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
