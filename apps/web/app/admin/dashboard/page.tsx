// apps/web/app/admin/dashboard/page.tsx
"use client";

import React, { useState, useEffect } from "react";

export default function DashboardOverviewPage() {
  const [telemetry, setTelemetry] = useState({ cpu: "34%", ram: "18.4GB", net: "1.2GB/s" });

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry({
        cpu: `${(30 + Math.random() * 15).toFixed(0)}%`,
        ram: `${(17.5 + Math.random() * 1.5).toFixed(1)}GB`,
        net: `${(1.0 + Math.random() * 0.4).toFixed(1)}GB/s`
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <span className="text-xs font-mono text-[#4F46E5] uppercase tracking-wider block mb-1">ADMINISTRATIVE CORE</span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Executive Control Center</h1>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-[#918fa1] block mb-1">NODE COMPUTE</span>
            <div className="text-2xl font-bold text-white font-mono">{telemetry.cpu}</div>
          </div>
          <span className="material-symbols-outlined text-[#4F46E5] text-3xl">memory</span>
        </div>
        <div className="glass-panel p-6 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-[#918fa1] block mb-1">RAM ALLOCATED</span>
            <div className="text-2xl font-bold text-[#10B981] font-mono">{telemetry.ram}</div>
          </div>
          <span className="material-symbols-outlined text-[#10B981] text-3xl">developer_board</span>
        </div>
        <div className="glass-panel p-6 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-[#918fa1] block mb-1">NET THROUGHPUT</span>
            <div className="text-2xl font-bold text-[#C0C1FF] font-mono">{telemetry.net}</div>
          </div>
          <span className="material-symbols-outlined text-[#C0C1FF] text-3xl">speed</span>
        </div>
        <div className="glass-panel p-6 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-[#918fa1] block mb-1">SHIELD INTEGRITY</span>
            <div className="text-2xl font-bold text-white font-mono">100% SECURE</div>
          </div>
          <span className="material-symbols-outlined text-[#10B981] text-3xl">vpn_key</span>
        </div>
      </div>

      {/* Main Content Info */}
      <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
        <h3 className="text-lg font-bold text-white mb-4">Awaiting Monorepo Sync</h3>
        <p className="text-sm text-[#c7c4d8] leading-relaxed max-w-xl mb-6">
          The local directory trees, Prisma schemas, and Docker-Compose microservice definitions have been initialized successfully. Please navigate using the sidebar links to query active sub-dashboards.
        </p>
        <div className="flex gap-4">
          <button className="bg-[#4F46E5] text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase transition-fluid">
            Run Telemetry Diagnostic
          </button>
        </div>
        <div className="absolute right-6 bottom-6 opacity-5">
          <span className="material-symbols-outlined text-display-lg text-white">dns</span>
        </div>
      </div>
    </div>
  );
}
