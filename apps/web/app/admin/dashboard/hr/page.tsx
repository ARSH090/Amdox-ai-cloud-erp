// apps/web/app/admin/dashboard/hr/page.tsx
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchFromProductionEngine } from '../../../../services/apiClient';

interface Employee {
  id: string;
  employeeNumber: string;
  fullName: string;
  email: string;
  jobTitle: string;
  employmentType: string;
  baseSalary: number;
}

export default function RealTimeHrPayrollDashboard() {
  const [batchMetrics, setBatchMetrics] = useState<{ id: string; count: number } | null>(null);

  // 1. Live dataset generation pulling directly from active PostgreSQL schemas
  const { data: workforce, isLoading } = useQuery<Employee[]>({
    queryKey: ['live-workforce-registry'],
    queryFn: () => fetchFromProductionEngine<Employee[]>('hr/employees'),
  });

  // 2. Trigger asynchronous payroll processing across Redis BullMQ distributed worker groups
  const dispatchPayrollRunMutation = useMutation({
    mutationFn: (payrollConfig: any) =>
      fetchFromProductionEngine('hr/payroll-run', {
        method: 'POST',
        bodyData: payrollConfig,
      }),
    onSuccess: (response: any) => {
      setBatchMetrics({
        id: response.batchTrackingId,
        count: response.recordsQueuedCount,
      });
    },
  });

  const handleTriggerPayroll = () => {
    dispatchPayrollRunMutation.mutate({
      periodName: 'May 2026 Run Cycle',
      startDate: '2026-05-01',
      endDate: '2026-05-31',
    });
  };

  if (isLoading) {
    return <div className="p-8 text-white font-mono text-xs animate-pulse">CONNECTING TO LIVE PERSONNEL RECORDS...</div>;
  }

  return (
    <main className="p-8 bg-[#030712] min-h-screen text-white space-y-8">
      <div>
        <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest block mb-1">[ HUMAN_RESOURCES // BATCH_ENGINE ]</span>
        <h1 className="text-3xl font-light tracking-tight">Workforce Operational Center</h1>
      </div>

      {/* BullMQ Task Progress Monitoring Controls View Layout */}
      <div className="p-6 border border-white/[0.04] bg-[#0B0F19] rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Asynchronous Payroll Generation Cluster</h3>
          <p className="text-xs text-slate-400">Processes global gross-to-net allocations using decoupled job queues with an execution SLA threshold of under 5 minutes.</p>
        </div>
        <button
          onClick={handleTriggerPayroll}
          disabled={dispatchPayrollRunMutation.isPending}
          className="bg-indigo-600 hover:bg-indigo-500 font-medium text-sm tracking-wide px-6 py-3 rounded-xl transition-all duration-300 disabled:opacity-40 hover:shadow-[0_0_25px_rgba(79,70,229,0.25)] flex items-center gap-2"
        >
          {dispatchPayrollRunMutation.isPending ? 'ENQUEUING JOBS...' : 'EXECUTE CONCURRENT BATCH RUN'}
        </button>
      </div>

      {batchMetrics && (
        <div className="p-6 border border-emerald-500/20 bg-emerald-500/5 text-xs font-mono rounded-xl space-y-2">
          <p className="text-emerald-400 font-bold">[ BULLMQ_BATCH_PROVISIONED_OK ]</p>
          <p className="text-slate-300">MASTER CLUSTER POOL BATCH ID: <span className="text-white">{batchMetrics.id}</span></p>
          <p className="text-slate-300">THREADS ENQUEUED ON REDIS CORE: <span className="text-indigo-400 font-bold">{batchMetrics.count} PERSONNEL RECORDS</span></p>
        </div>
      )}

      {/* Active Workforce Database Grid Section View */}
      <div className="border border-white/[0.04] bg-[#0B0F19] rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/[0.04] bg-white/[0.01] text-xs font-mono text-slate-400 uppercase tracking-wider">
              <th className="p-4">Employee ID</th>
              <th className="p-4">Full Legal Name</th>
              <th className="p-4">Corporate Role Title</th>
              <th className="p-4">Classification</th>
              <th className="p-4 text-right">Contracted Base Salary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            {workforce?.map((staff) => (
              <tr key={staff.id} className="hover:bg-white/[0.01] transition-colors duration-150">
                <td className="p-4 font-mono text-indigo-400 text-xs">{staff.employeeNumber}</td>
                <td className="p-4 font-medium">{staff.fullName}</td>
                <td className="p-4 text-slate-300 text-xs">{staff.jobTitle}</td>
                <td className="p-4"><span className="text-[10px] font-mono tracking-wider bg-slate-900 border border-white/5 text-slate-400 px-2 py-0.5 rounded uppercase">{staff.employmentType}</span></td>
                <td className="p-4 text-right font-mono text-slate-300">${Number(staff.baseSalary).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
