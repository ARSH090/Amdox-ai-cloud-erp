"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';

const fetchPayrollRuns = async () => {
  return [
    { id: '1', period: 'June 2026', totalGross: 450000, totalNet: 310000, status: 'PROCESSING', executedBy: 'System' },
    { id: '2', period: 'May 2026', totalGross: 450000, totalNet: 310000, status: 'COMPLETED', executedBy: 'Jane Doe' },
    { id: '3', period: 'April 2026', totalGross: 445000, totalNet: 308000, status: 'COMPLETED', executedBy: 'Jane Doe' },
  ];
};

export default function PayrollPage() {
  const { data: payrolls, isLoading } = useQuery({
    queryKey: ['payroll-runs'],
    queryFn: fetchPayrollRuns,
  });

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Payroll Runs</h1>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
          Run Payroll
        </button>
      </div>

      <div className="border rounded-md overflow-hidden bg-background">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground uppercase text-xs">
            <tr>
              <th className="px-6 py-3 font-medium">Period</th>
              <th className="px-6 py-3 font-medium">Total Gross</th>
              <th className="px-6 py-3 font-medium">Total Net</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Executed By</th>
              <th className="px-6 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">Loading payroll runs...</td>
              </tr>
            ) : (
              payrolls?.map((run) => (
                <tr key={run.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{run.period}</td>
                  <td className="px-6 py-4 font-mono">${run.totalGross.toLocaleString()}</td>
                  <td className="px-6 py-4 font-mono font-bold">${run.totalNet.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      run.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      run.status === 'FAILED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{run.executedBy}</td>
                  <td className="px-6 py-4 space-x-3">
                    <button className="text-primary hover:underline font-medium text-sm">View Payslips</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
