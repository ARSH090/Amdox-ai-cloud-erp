// apps/web/app/services/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ServicesPricingPage() {
  const [users, setUsers] = useState(50);
  const [storage, setStorage] = useState(500); // in GB
  const [plan, setPlan] = useState("enterprise"); // trial | starter | enterprise
  const [dedicatedForecast, setDedicatedForecast] = useState(true);

  // Compute calculated pricing matrix
  const calculateTotal = () => {
    let basePrice = plan === "starter" ? 250 : plan === "enterprise" ? 1200 : 0;
    let userCost = users * (plan === "starter" ? 8 : 6);
    let storageCost = (storage / 100) * 15;
    let aiCost = dedicatedForecast ? 350 : 0;

    return basePrice + userCost + storageCost + aiCost;
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Top Nav */}
      <nav className="w-full bg-[#030712]/80 border-b border-white/5 h-16 flex items-center">
        <div className="flex justify-between items-center w-full px-8 max-w-7xl mx-auto">
          <Link href="/" className="font-bold text-lg text-[#C0C1FF] tracking-tight">
            AMDOX ERP
          </Link>
          <Link href="/" className="text-xs uppercase font-bold text-[#918fa1] hover:text-white transition-fluid">
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full px-8 py-16">
        <div className="text-center mb-12">
          <span className="text-xs font-mono text-[#10B981] bg-[#10B981]/10 px-3 py-1 rounded-full inline-block border border-[#10B981]/20 mb-3">
            [SERVICES // MODULE PRICING]
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">Interactive Capacity Calculator</h1>
          <p className="text-sm text-[#918fa1] mt-2">Scale computational nodes, database storage capacities, and forecast features dynamically.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Controls - Left Col (60%) */}
          <div className="md:col-span-7 glass-panel p-6 rounded-2xl space-y-6">
            {/* Plan Tier */}
            <div>
              <label className="block text-xs font-mono uppercase text-[#918fa1] mb-3">Platform Tier</label>
              <div className="grid grid-cols-3 gap-3">
                {["trial", "starter", "enterprise"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setPlan(t)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold uppercase transition-fluid border ${
                      plan === t
                        ? "bg-[#4F46E5]/10 border-[#4F46E5] text-white"
                        : "bg-[#0B0F19] border-white/5 text-[#918fa1] hover:border-white/10"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono text-[#918fa1]">
                <span>COMPUTE CORES / USER SEATS</span>
                <span className="text-[#C0C1FF] font-bold text-sm">{users} Cores</span>
              </div>
              <input
                type="range"
                min="5"
                max="500"
                step="5"
                value={users}
                onChange={(e) => setUsers(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#0B0F19] rounded-lg appearance-none cursor-pointer accent-[#4F46E5] focus:outline-none"
              />
              <div className="flex justify-between text-[10px] text-[#918fa1]/60 font-mono">
                <span>5 Cores</span>
                <span>500 Cores</span>
              </div>
            </div>

            {/* Storage Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono text-[#918fa1]">
                <span>PROVISIONED STORAGE (POSTGRES DB)</span>
                <span className="text-[#C0C1FF] font-bold text-sm">{storage} GB</span>
              </div>
              <input
                type="range"
                min="50"
                max="10000"
                step="50"
                value={storage}
                onChange={(e) => setStorage(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#0B0F19] rounded-lg appearance-none cursor-pointer accent-[#10B981] focus:outline-none"
              />
              <div className="flex justify-between text-[10px] text-[#918fa1]/60 font-mono">
                <span>50 GB</span>
                <span>10 TB</span>
              </div>
            </div>

            {/* Forecasting Microservice Toggle */}
            <div className="flex items-center justify-between p-4 bg-[#080e1a] border border-white/5 rounded-lg">
              <div className="space-y-1">
                <span className="text-xs font-bold text-white block">Dedicated Prophet ML Forecasting</span>
                <span className="text-[10px] text-[#918fa1] block">Prophet model parameters + weekly auto-retraining.</span>
              </div>
              <button
                onClick={() => setDedicatedForecast(!dedicatedForecast)}
                className={`w-12 h-6 rounded-full p-1 transition-fluid ${
                  dedicatedForecast ? "bg-[#10B981]" : "bg-[#0B0F19] border border-white/10"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-fluid transform ${
                    dedicatedForecast ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Pricing Summary - Right Col (40%) */}
          <div className="md:col-span-5 glass-panel p-6 rounded-2xl border-[#4F46E5]/20 flex flex-col justify-between min-h-[350px]">
            <div>
              <h3 className="text-xs font-mono uppercase text-[#918fa1] mb-6">Subscription Matrix</h3>
              <div className="space-y-4 text-xs font-mono">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[#918fa1]">Base Platform Allocation</span>
                  <span className="text-white">${plan === "starter" ? 250 : plan === "enterprise" ? 1200 : 0}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[#918fa1]">Compute Capacity ({users} cores)</span>
                  <span className="text-white">${users * (plan === "starter" ? 8 : 6)}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[#918fa1]">Direct DB Storage ({storage} GB)</span>
                  <span className="text-white">${(storage / 100) * 15}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-[#918fa1]">Prophet AI forecasting</span>
                  <span className="text-white">${dedicatedForecast ? 350 : 0}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 mt-6">
              <div className="flex justify-between items-baseline mb-6">
                <span className="text-xs font-mono text-[#918fa1]">ESTIMATED MONTHLY</span>
                <span className="text-3xl font-extrabold text-[#10B981] text-glow">${calculateTotal().toLocaleString()}</span>
              </div>
              <Link
                href="/contact"
                className="w-full block bg-[#4F46E5] text-white py-3 rounded-lg font-bold text-xs uppercase tracking-wider hover:translate-y-[-2px] transition-fluid text-center shadow-lg shadow-[#4F46E5]/20"
              >
                Provision Platform Node
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 px-8 border-t border-white/5 bg-[#080e1a]">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-[10px] font-mono text-[#918fa1]/60">
          <span>AMDOX SUBSCRIPTION PORTAL</span>
          <span>© 2026 AMDOX ENTERPRISE. ENCRYPTED PIPELINE.</span>
        </div>
      </footer>
    </div>
  );
}
