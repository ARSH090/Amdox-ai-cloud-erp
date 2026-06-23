"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// In a real scenario, this would use apiClient
const fetchAPInvoices = async () => {
  return [
    { id: '1', vendor: 'Dell Technologies', invoiceNumber: 'INV-DELL-001', amount: 45000, status: 'PENDING', dueDate: '2026-07-01' },
    { id: '2', vendor: 'AWS', invoiceNumber: 'INV-AWS-882', amount: 12500, status: 'PAID', dueDate: '2026-06-15' },
    { id: '3', vendor: 'Cisco', invoiceNumber: 'INV-CSC-991', amount: 8000, status: 'OVERDUE', dueDate: '2026-06-01' },
  ];
};

export default function AccountsPayablePage() {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['ap-invoices'],
    queryFn: fetchAPInvoices,
  });

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Accounts Payable</h1>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
          New Invoice
        </button>
      </div>

      <div className="border rounded-md overflow-hidden bg-background">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground uppercase text-xs">
            <tr>
              <th className="px-6 py-3 font-medium">Invoice #</th>
              <th className="px-6 py-3 font-medium">Vendor</th>
              <th className="px-6 py-3 font-medium">Amount</th>
              <th className="px-6 py-3 font-medium">Due Date</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">Loading invoices...</td>
              </tr>
            ) : (
              invoices?.map((inv) => (
                <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{inv.invoiceNumber}</td>
                  <td className="px-6 py-4">{inv.vendor}</td>
                  <td className="px-6 py-4 font-mono">${inv.amount.toLocaleString()}</td>
                  <td className="px-6 py-4">{inv.dueDate}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      inv.status === 'PAID' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      inv.status === 'OVERDUE' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-primary hover:underline font-medium text-sm">Review</button>
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
