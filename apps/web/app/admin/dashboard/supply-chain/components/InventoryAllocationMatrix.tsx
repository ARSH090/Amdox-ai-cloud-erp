'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAsyncData } from '@/hooks/useAsyncData'
import { ErrorBoundary } from '@/components/error-boundary'
import { SkeletonShimmer } from '@/components/skeleton-shimmer'
import { EmptyState } from '@/components/empty-state'
import { AlertCircle } from 'lucide-react'
import { fetchFromProductionEngine } from '@/services/apiClient'

interface InventoryData {
  sku: string
  warehouseA: number
  warehouseB: number
  warehouseC: number
  reorderPoint: number
}

async function fetchInventory(): Promise<InventoryData[]> {
  try {
    return await fetchFromProductionEngine<InventoryData[]>('supply-chain/inventory')
  } catch (error) {
    throw new Error('Failed to load inventory')
  }
}

function getInventoryColor(
  value: number,
  reorderPoint: number
): string {
  if (value < reorderPoint * 0.5) {
    return 'bg-red-500/40'
  }
  if (value < reorderPoint) {
    return 'bg-yellow-500/40'
  }
  return 'bg-green-500/20'
}

function getTextColor(value: number, reorderPoint: number): string {
  if (value < reorderPoint * 0.5) {
    return 'text-red-300'
  }
  if (value < reorderPoint) {
    return 'text-yellow-300'
  }
  return 'text-green-300'
}

export function InventoryAllocationMatrix() {
  const { data, loading, error } = useAsyncData(fetchInventory)

  if (error) {
    return <ErrorBoundary error={error} />
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Inventory Allocation Matrix</CardTitle>
        <CardDescription>Stock levels by SKU and warehouse location</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <SkeletonShimmer rows={5} height="h-12" className="w-full" />
          </div>
        ) : !data || data.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">SKU</th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">
                    Warehouse A
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">
                    Warehouse B
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">
                    Warehouse C
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">
                    Total
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => {
                  const total =
                    item.warehouseA + item.warehouseB + item.warehouseC
                  const belowReorder = [
                    item.warehouseA,
                    item.warehouseB,
                    item.warehouseC,
                  ].some((qty) => qty < item.reorderPoint)

                  return (
                    <tr key={item.sku} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 px-4 font-mono text-foreground">
                        {item.sku}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div
                          className={`inline-block rounded px-3 py-1 font-mono font-semibold ${getInventoryColor(
                            item.warehouseA,
                            item.reorderPoint
                          )} ${getTextColor(item.warehouseA, item.reorderPoint)}`}
                        >
                          {item.warehouseA}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div
                          className={`inline-block rounded px-3 py-1 font-mono font-semibold ${getInventoryColor(
                            item.warehouseB,
                            item.reorderPoint
                          )} ${getTextColor(item.warehouseB, item.reorderPoint)}`}
                        >
                          {item.warehouseB}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div
                          className={`inline-block rounded px-3 py-1 font-mono font-semibold ${getInventoryColor(
                            item.warehouseC,
                            item.reorderPoint
                          )} ${getTextColor(item.warehouseC, item.reorderPoint)}`}
                        >
                          {item.warehouseC}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-foreground font-mono">
                        {total}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {belowReorder ? (
                          <AlertCircle className="h-5 w-5 text-yellow-500 mx-auto" />
                        ) : (
                          <div className="h-5 w-5 rounded-full bg-green-500/50 mx-auto" />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
