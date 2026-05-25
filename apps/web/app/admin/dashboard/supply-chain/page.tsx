// apps/web/app/admin/dashboard/supply-chain/page.tsx
'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchFromProductionEngine } from '../../../../services/apiClient';

interface InventoryItem {
  sku: string;
  name: string;
  stock: number;
  reorderPoint: number;
  status: string;
}

export default function SupplyChainDashboardPage() {
  const { data: items, isLoading, error } = useQuery<InventoryItem[]>({
    queryKey: ['live-inventory-dataset'],
    queryFn: () => fetchFromProductionEngine<InventoryItem[]>('api/supply-chain/inventory'),
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 bg-[#030712] min-h-screen text-white">
        <div className="h-4 w-32 bg-slate-800 animate-pulse rounded" />
        <div className="h-8 w-64 bg-slate-800 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-[#0B0F19] border border-white/5 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-[#030712] min-h-screen flex items-center justify-center text-white">
        <div className="p-6 border border-rose-500/20 bg-rose-500/5 rounded-2xl max-w-xl text-center font-mono text-sm text-rose-400">
          <p className="font-bold uppercase tracking-widest mb-2">[ SUPPLY_CHAIN_ERROR ]</p>
          <p className="font-sans text-slate-400 text-xs">NestJS Backend supply-chain gateway is unreachable or offline.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 min-h-screen bg-[#030712] text-white p-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block mb-1">LOGISTICS &amp; PROCUREMENT</span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Warehouse Inventory &amp; Reorder Gates</h1>
        </div>
      </div>

      {/* Warehouse Grid */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-[#0B0F19]">
        <h3 className="text-base font-bold text-white mb-4">Stock Volume Tracking &amp; Reorder Telemetry</h3>
        
        {!items || items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/5 rounded-xl">
            <span className="material-symbols-outlined text-red-500/20 text-display-lg mb-4">database_off</span>
            <p className="font-mono text-xs text-red-500/60 uppercase">[ PARTITION EMPTY: Awaiting System Synchronization ]</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item) => {
              const isBelowReorder = item.stock < item.reorderPoint;
              return (
                <div 
                  key={item.sku}
                  className={`glass-panel p-6 rounded-xl flex flex-col justify-between min-h-[160px] transition-fluid border border-white/5 bg-[#080e1a] ${
                    isBelowReorder 
                      ? 'border-red-500/30 bg-red-500/[0.02]' 
                      : 'hover:border-white/10'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-mono text-slate-400">{item.sku}</span>
                      {isBelowReorder && (
                        <span className="text-[9px] font-mono text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30 animate-pulse">
                          REORDER
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white mb-4 font-mono">{item.name}</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono text-[#918fa1]">
                      <span>STOCK LEVEL:</span>
                      <span className={isBelowReorder ? "text-red-500 font-bold" : "text-[#10B981] font-bold"}>
                        {item.stock} / {item.reorderPoint} R.O.
                      </span>
                    </div>
                    <div className="w-full bg-[#080e1a] h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${isBelowReorder ? 'bg-red-500' : 'bg-[#10B981]'}`} 
                        style={{ width: `${Math.min((item.stock / (item.reorderPoint || 1)) * 50, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
