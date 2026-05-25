// apps/web/app/admin/dashboard/finance/page.tsx
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchFromProductionEngine } from '../../../../services/apiClient';

interface AccountRow {
  id: string;
  code: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
}

export default function RealTimeFinanceDashboard() {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Fetch live PostgreSQL account balances directly through NestJS Service layer
  const { data: accounts, isLoading, error } = useQuery<AccountRow[]>({
    queryKey: ['live-ledger-dataset'],
    queryFn: () => fetchFromProductionEngine<AccountRow[]>('finance/ledger'),
    retry: 3,
    staleTime: 30000, // Background synchronize cache thresholds every 30 seconds
  });

  // 2. Setup Mutation pipeline to stream new journal transactions to live database partitions
  const postJournalMutation = useMutation({
    mutationFn: (journalPayload: any) => 
      fetchFromProductionEngine('finance/journal-entries', {
        method: 'POST',
        bodyData: journalPayload,
      }),
    onSuccess: () => {
      // Invalidate query cache matrices instantly on successful database mutation writes
      queryClient.invalidateQueries({ queryKey: ['live-ledger-dataset'] });
      setErrorMessage(null);
    },
    onError: (fault: any) => {
      setErrorMessage(fault.message || 'Transactional entry write error.');
    },
  });

  // 3. Technical Polish: Handle slow data loading shimmers to guarantee < 0.05 Cumulative Layout Shift
  if (isLoading) {
    return (
      <div className="p-8 space-y-6 bg-[#030712] min-h-screen text-white">
        <div className="h-4 w-32 bg-slate-800 animate-pulse rounded" />
        <div className="h-8 w-64 bg-slate-800 animate-pulse rounded-lg" />
        <div className="space-y-3 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 w-full bg-[#0B0F19] border border-white/5 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // 4. Handle connection or service-layer fault configurations elegantly
  if (error) {
    return (
      <div className="p-8 bg-[#030712] min-h-screen flex items-center justify-center text-white">
        <div className="p-6 border border-rose-500/20 bg-rose-500/5 rounded-2xl max-w-xl text-center font-mono text-sm text-rose-400">
          <p className="font-bold uppercase tracking-widest mb-2">[ REALTIME_CONNECTION_ERROR ]</p>
          <p className="font-sans text-slate-400 text-xs"> NestJS Backend service monolith is unreachable or database server pools are currently offline.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="p-8 bg-[#030712] min-h-screen text-white space-y-8 font-sans">
      
      {/* Upper Active System Ticker Layer */}
      <div className="w-full bg-indigo-950/20 border border-indigo-500/10 rounded-xl p-4 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-400">CONNECTION STATE: <span className="text-emerald-400 font-bold">[ LIVE_POSTGRESQL_17 ]</span></span>
        </div>
        <span className="text-slate-500">P95 LATENCY TARGET &lt; 300MS</span>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block mb-1">[ TRANSACTION_LEDGER ]</span>
          <h1 className="text-3xl font-light tracking-tight">General Ledger Accounts</h1>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 border border-rose-500/20 bg-rose-500/10 text-rose-400 font-mono text-xs rounded-xl">
          [ TRANSACTION REJECTED ]: {errorMessage.toUpperCase()}
        </div>
      )}

      {/* Real-time Data Grid Matrix Implementation */}
      <div className="border border-white/[0.04] bg-[#0B0F19] rounded-2xl overflow-hidden shadow-2xl">
        {accounts && accounts.length === 0 ? (
          <div className="p-16 text-center text-slate-500 font-mono text-xs">
            [ PARTITION EMPTY: NO REAL-TIME GENERAL LEDGER RECORDS DEFINED ]
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/[0.04] bg-white/[0.01] text-xs font-mono text-slate-400 uppercase tracking-wider">
                <th className="p-4">Account Code</th>
                <th className="p-4">Account Title Name</th>
                <th className="p-4">Accounting Type</th>
                <th className="p-4">Currency</th>
                <th className="p-4 text-right">Live Audited Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02] font-sans">
              {accounts?.map((account) => (
                <tr key={account.id} className="hover:bg-white/[0.01] transition-all duration-150 group">
                  <td className="p-4 font-mono text-indigo-400 group-hover:text-indigo-300">{account.code}</td>
                  <td className="p-4 font-medium text-slate-200">{account.name}</td>
                  <td className="p-4 text-xs font-mono text-slate-400 uppercase">{account.type}</td>
                  <td className="p-4 font-mono text-slate-400">{account.currency}</td>
                  <td className="p-4 text-right font-mono text-emerald-400 font-medium">
                    ${Number(account.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
