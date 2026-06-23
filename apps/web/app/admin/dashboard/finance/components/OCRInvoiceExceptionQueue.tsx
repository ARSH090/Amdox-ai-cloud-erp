'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAsyncData } from '@/hooks/useAsyncData'
import { ErrorBoundary } from '@/components/error-boundary'
import { SkeletonShimmer } from '@/components/skeleton-shimmer'
import { EmptyState } from '@/components/empty-state'
import { fetchFromProductionEngine } from '@/services/apiClient'

interface InvoiceItem {
  id: string
  po_amount: number
  receipt_amount: number
  invoice_amount: number
  matched: boolean
}

async function fetchInvoices(): Promise<InvoiceItem[]> {
  try {
    return await fetchFromProductionEngine<InvoiceItem[]>('finance/invoices')
  } catch (error) {
    throw new Error('Failed to load invoices')
  }
}

export function OCRInvoiceExceptionQueue() {
  const { data, loading, error } = useAsyncData(fetchInvoices)

  if (error) {
    return <ErrorBoundary error={error} />
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Invoice 3-Way Matching</CardTitle>
        <CardDescription>PO, Goods Receipt, and Invoice validation</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <SkeletonShimmer rows={3} height="h-20" className="w-full" />
          </div>
        ) : !data || data.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {data.map((invoice) => (
              <div
                key={invoice.id}
                className="border border-border rounded-lg p-4 hover:bg-muted/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-foreground font-mono">{invoice.id}</h4>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold font-mono ${
                      invoice.matched
                        ? 'bg-green-500/20 text-green-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {invoice.matched ? 'Matched' : 'Exception'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 font-mono text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">PO Amount</p>
                    <p className="text-foreground font-semibold">
                      ${invoice.po_amount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">GR Amount</p>
                    <p className="text-foreground font-semibold">
                      ${invoice.receipt_amount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Invoice Amount</p>
                    <p className="text-foreground font-semibold">
                      ${invoice.invoice_amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
