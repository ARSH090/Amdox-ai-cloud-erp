// apps/web/src/app/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function HomePage() {
  const [loadTime, setLoadTime] = useState("42ms");
  const [isDbLive, setIsDbLive] = useState(false);

  useEffect(() => {
    // Simulate query loading check
    const time = (Math.random() * 15 + 25).toFixed(0);
    setLoadTime(`${time}ms`);

    // Verify localStorage fallback settings
    const url = localStorage.getItem("AMDOX_SUPABASE_URL");
    const key = localStorage.getItem("AMDOX_SUPABASE_KEY");
    if (url && key) {
      setIsDbLive(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation */}
      <nav className="fixed top-0 z-50 w-full bg-[#030712]/80 backdrop-blur-md border-b border-white/5 h-16 transition-fluid">
        <div className="flex justify-between items-center w-full px-8 max-w-7xl mx-auto h-full">
          <div className="flex items-center gap-4">
            <span className="font-bold text-lg text-[#C0C1FF] tracking-tight cursor-pointer">AMDOX ERP</span>
            <span className={`text-[9px] font-mono px-2 py-0.5 rounded border select-none ${isDbLive ? 'border-[#10B981]/30 text-[#10B981] bg-[#10B981]/10' : 'border-yellow-500/30 text-yellow-500 bg-yellow-500/10'}`}>
              {isDbLive ? "[DB: SUPABASE LIVE]" : "[DB: SANDBOX MOCK]"}
            </span>
          </div>
          <div className="hidden md:flex gap-6 items-center">
            <a className="text-xs font-semibold uppercase tracking-wider text-[#918fa1] hover:text-white transition-colors duration-300" href="#modules">Modules</a>
            <Link className="text-xs font-semibold uppercase tracking-wider text-[#918fa1] hover:text-white transition-colors duration-300" href="/services">Pricing Calculator</Link>
            <a className="text-xs font-semibold uppercase tracking-wider text-[#918fa1] hover:text-white transition-colors duration-300" href="#case-studies">Case Studies</a>
            <Link className="text-xs font-semibold uppercase tracking-wider text-[#918fa1] hover:text-white transition-colors duration-300" href="/contact">Contact</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin/login" className="bg-[#4F46E5] text-white px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90 active:scale-95 transition-all text-center">
              Secure Login
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-16 flex-1">
        {/* Hero Section */}
        <section className="relative min-h-[750px] flex items-center px-8 max-w-7xl mx-auto grid grid-cols-12 gap-6 py-16">
          <div className="col-span-12 lg:col-span-8 z-10">
            <div className="mb-4">
              <span className="text-xs font-mono text-[#10B981] bg-[#10B981]/10 px-3 py-1 rounded-full inline-block border border-[#10B981]/20">
                [SYS_STAT // ACTIVE]
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 max-w-3xl leading-[1.1] tracking-tight">
              Orchestrating <span className="text-[#C0C1FF] italic font-serif">Global Enterprise</span> Intelligence with AI Precision.
            </h1>
            <p className="text-lg text-[#c7c4d8] mb-8 max-w-xl leading-relaxed">
              The autonomous backbone for high-performance corporations. Real-time observability, predictive logistics, and cognitive financial processing in one unified canvas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/admin/login" className="bg-[#4F46E5] text-white px-6 py-3.5 rounded-lg font-bold text-xs uppercase tracking-wider hover:translate-y-[-2px] transition-fluid shadow-lg shadow-[#4F46E5]/20 text-center">
                Request Enterprise Demo
              </Link>
              <a href="#modules" className="border border-white/10 text-white px-6 py-3.5 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-white/5 transition-fluid text-center">
                Explore Modules
              </a>
            </div>
          </div>
          {/* Decorative Glow */}
          <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-[550px] h-[550px] opacity-10 pointer-events-none">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#4F46E5] via-[#10B981] to-transparent blur-3xl"></div>
          </div>
        </section>

        {/* Live Metrics Ticker */}
        <div className="w-full border-y border-white/5 bg-[#080e1a] overflow-hidden py-4">
          <div className="flex ticker-scroll whitespace-nowrap gap-12 items-center">
            <div className="flex gap-12 items-center font-mono text-xs text-[#918fa1]">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span> P95 API LATENCY &lt; <span className="text-[#10B981]">300MS</span>
              </span>
              <span>|</span>
              <span>SLA: <span className="text-[#C0C1FF]">99.9% UPTIME</span></span>
              <span>|</span>
              <span>ACTIVE TENANTS: <span className="text-white">4,208</span></span>
              <span>|</span>
              <span>THROUGHPUT: <span className="text-[#10B981]">1.2B REQ/DAY</span></span>
            </div>
            <div className="flex gap-12 items-center font-mono text-xs text-[#918fa1]">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span> P95 API LATENCY &lt; <span className="text-[#10B981]">300MS</span>
              </span>
              <span>|</span>
              <span>SLA: <span className="text-[#C0C1FF]">99.9% UPTIME</span></span>
              <span>|</span>
              <span>ACTIVE TENANTS: <span className="text-white">4,208</span></span>
              <span>|</span>
              <span>THROUGHPUT: <span className="text-[#10B981]">1.2B REQ/DAY</span></span>
            </div>
          </div>
        </div>

        {/* Interactive Module Matrix */}
        <section id="modules" className="px-8 max-w-7xl mx-auto py-24">
          <div className="mb-12 flex justify-between items-end">
            <div>
              <span className="text-xs font-mono text-[#4F46E5] uppercase tracking-wider block mb-1">CORE CAPABILITIES</span>
              <h2 className="text-3xl font-bold text-white tracking-tight">Integrated Module Ecosystem</h2>
            </div>
            <div className="text-xs font-mono text-[#918fa1]">
              LOAD_TIME: {loadTime}
            </div>
          </div>
          <div className="grid grid-cols-12 gap-6 items-start">
            {/* Finance Card */}
            <div className="col-span-12 lg:col-span-8 glass-panel p-6 rounded-xl glow-card relative overflow-hidden group">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded bg-[#4F46E5]/10 flex items-center justify-center border border-[#4F46E5]/20">
                    <span className="material-symbols-outlined text-[#4F46E5]">account_balance_wallet</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Advanced Finance</h3>
                    <p className="text-xs font-mono text-[#10B981]">PREDICTIVE_CASHFLOW: ON</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#918fa1] group-hover:text-[#4F46E5] transition-colors">arrow_outward</span>
              </div>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="p-4 bg-[#080e1a] border border-white/5 rounded-lg">
                  <span className="text-[10px] font-mono text-[#918fa1] block mb-2">GLOBAL CONSOLIDATION</span>
                  <div className="text-2xl font-bold text-white">$2.4B <span className="text-[#10B981] text-xs font-mono">↑ 12%</span></div>
                </div>
                <div className="p-4 bg-[#080e1a] border border-white/5 rounded-lg">
                  <span className="text-[10px] font-mono text-[#918fa1] block mb-2">TAX COMPLIANCE</span>
                  <div className="text-2xl font-bold text-white">100% <span className="text-[#4F46E5] text-xs font-mono">SECURED</span></div>
                </div>
              </div>
              <div className="ai-border p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[#10B981] text-sm">auto_awesome</span>
                  <span className="text-[10px] font-mono text-[#10B981] uppercase font-bold">AI Engine Output</span>
                </div>
                <p className="text-xs text-[#c7c4d8] leading-relaxed">
                  "Anomaly detected in APAC subsidiary VAT filings. Auto-reconciling 4,200 transactions against latest regional regulations. Projected impact: +$1.2M recoverable credits."
                </p>
              </div>
            </div>

            {/* HR Module */}
            <div className="col-span-12 md:col-span-6 lg:col-span-4 glass-panel p-6 rounded-xl glow-card h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded bg-[#C0C1FF]/10 flex items-center justify-center border border-[#C0C1FF]/20 mb-4">
                  <span className="material-symbols-outlined text-[#C0C1FF]">groups</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Human Capital</h3>
                <p className="text-xs text-[#c7c4d8] leading-relaxed mb-6">
                  Global workforce orchestration with automated payroll and talent acquisition intelligence.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="bg-[#2f3542] px-2 py-1 font-mono text-[10px] rounded text-white">PAYROLL_v4</span>
                <span className="bg-[#2f3542] px-2 py-1 font-mono text-[10px] rounded text-white">LMS_SYNC</span>
              </div>
            </div>

            {/* Supply Chain */}
            <div className="col-span-12 md:col-span-6 lg:col-span-4 glass-panel p-6 rounded-xl glow-card h-full flex flex-col justify-between mt-6 md:mt-0">
              <div>
                <div className="w-10 h-10 rounded bg-[#10B981]/10 flex items-center justify-center border border-[#10B981]/20 mb-4">
                  <span className="material-symbols-outlined text-[#10B981]">inventory_2</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Supply Chain</h3>
                <p className="text-xs text-[#c7c4d8] leading-relaxed mb-6">
                  End-to-end logistics visibility with predictive inventory management and automated procurement.
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-full bg-[#080e1a] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#10B981] h-full w-3/4 rounded-full"></div>
                </div>
                <div className="flex justify-between font-mono text-[10px] text-[#918fa1]">
                  <span>NODE_OPTIMIZATION</span>
                  <span>75%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Case Studies */}
        <section id="case-studies" className="bg-[#080e1a] py-24">
          <div className="px-8 max-w-7xl mx-auto">
            <div className="mb-12">
              <span className="text-xs font-mono text-[#4F46E5] block mb-1">PROVEN RESULTS</span>
              <h2 className="text-3xl font-bold text-white tracking-tight">Global Enterprise Impact</h2>
            </div>
            <div className="divide-y divide-white/5">
              {/* Row 1 */}
              <div className="group py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.01] px-4 rounded-lg transition-colors cursor-pointer">
                <div className="flex items-center gap-6 flex-1">
                  <span className="font-mono text-xs text-[#918fa1]">01 //</span>
                  <div>
                    <h4 className="text-base font-bold text-white">Fortune 500 Retailer</h4>
                    <p className="text-xs text-[#918fa1]">Supply Chain Digitalization</p>
                  </div>
                </div>
                <div className="flex-1">
                  <span className="text-lg font-bold text-[#10B981]">INVENTORY OVERHEAD REDUCED BY 22%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono border border-white/10 px-2 py-0.5 rounded-full text-white">SAP_MIGRATION</span>
                  <span className="material-symbols-outlined text-[#918fa1] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
              </div>
              {/* Row 2 */}
              <div className="group py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.01] px-4 rounded-lg transition-colors cursor-pointer">
                <div className="flex items-center gap-6 flex-1">
                  <span className="font-mono text-xs text-[#918fa1]">02 //</span>
                  <div>
                    <h4 className="text-base font-bold text-white">NexGen Logistics</h4>
                    <p className="text-xs text-[#918fa1]">Automated Fulfillment Hub</p>
                  </div>
                </div>
                <div className="flex-1">
                  <span className="text-lg font-bold text-[#4F46E5]">OPERATIONAL EFFICIENCY +34%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono border border-white/10 px-2 py-0.5 rounded-full text-white">ROBOTIC_API</span>
                  <span className="material-symbols-outlined text-[#918fa1] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-8 max-w-7xl mx-auto py-24 text-center">
          <div className="glass-panel p-16 rounded-2xl relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Scale the <span className="text-[#10B981]">Unattainable?</span></h2>
              <p className="text-base text-[#c7c4d8] mb-8 max-w-xl mx-auto leading-relaxed">
                Join 4,000+ global enterprises that have upgraded their operational nervous system to AMDOX.
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/admin/login" className="bg-[#4F46E5] text-white px-6 py-3 rounded-lg font-bold text-xs uppercase hover:translate-y-[-2px] transition-fluid shadow-lg">
                  Talk to an Architect
                </Link>
                <Link href="/admin/login" className="border border-white/10 text-white px-6 py-3 rounded-lg font-bold text-xs uppercase hover:bg-white/5 transition-fluid">
                  View Documentation
                </Link>
              </div>
            </div>
            {/* Grid line animations */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#4F46E5] to-transparent"></div>
              <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#10B981] to-transparent"></div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-8 border-t border-white/5 bg-[#080e1a]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <div className="font-bold text-xs text-[#918fa1] mb-1">AMDOX ENTERPRISE</div>
            <div className="font-mono text-[10px] text-[#918fa1]/60">© 2026 AMDOX ENTERPRISE. ENCRYPTED END-TO-END.</div>
          </div>
          <div className="flex gap-6 font-mono text-[11px] text-[#918fa1]">
            <a className="hover:text-[#4F46E5] transition-colors" href="#">Security Protocol</a>
            <a className="hover:text-[#4F46E5] transition-colors" href="#">Privacy</a>
            <a className="hover:text-[#4F46E5] transition-colors" href="#">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
