'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SkeletonShimmer } from '@/components/skeleton-shimmer'
import { ErrorBoundary } from '@/components/error-boundary'
import { EmptyState } from '@/components/empty-state'
import { useAsyncData } from '@/hooks/useAsyncData'
import { fetchFromProductionEngine } from '@/services/apiClient'

interface LedgerEntry {
  id: string
  account: string
  debit: number
  credit: number
  balance: number
  status: 'balanced' | 'unbalanced'
}

async function fetchLedgerData(): Promise<LedgerEntry[]> {
  try {
    const data = await fetchFromProductionEngine<any[]>('finance/ledger')
    return data.map((acc: any) => ({
      id: acc.id,
      account: acc.name,
      debit: acc.type === 'asset' || acc.type === 'expense' ? Number(acc.balance || 0) : 0,
      credit: acc.type === 'liability' || acc.type === 'equity' || acc.type === 'revenue' ? Number(acc.balance || 0) : 0,
      balance: Number(acc.balance || 0),
      status: 'balanced',
    }))
  } catch (error) {
    throw new Error('Failed to load ledger data')
  }
}

export function FinancialLedgerTable() {
  const { data, loading, error } = useAsyncData(fetchLedgerData)

  if (error) {
    return <ErrorBoundary error={error} />
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>General Ledger</CardTitle>
        <CardDescription>Double-entry accounting transactions</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <SkeletonShimmer rows={5} height="h-10" className="w-full" />
          </div>
        ) : !data || data.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-semibold text-foreground">Account</th>
                  <th className="text-right py-3 px-2 font-semibold text-foreground">Debit</th>
                  <th className="text-right py-3 px-2 font-semibold text-foreground">Credit</th>
                  <th className="text-right py-3 px-2 font-semibold text-foreground">Balance</th>
                  <th className="text-center py-3 px-2 font-semibold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-3 px-2 text-foreground">{entry.account}</td>
                    <td className="text-right py-3 px-2 text-foreground">
                      {entry.debit.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-2 text-foreground">
                      {entry.credit.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-2 text-foreground font-semibold">
                      {entry.balance.toLocaleString()}
                    </td>
                    <td className="text-center py-3 px-2">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          entry.status === 'balanced'
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
