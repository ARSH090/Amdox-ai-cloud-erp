'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAsyncData } from '@/hooks/useAsyncData'
import { ErrorBoundary } from '@/components/error-boundary'
import { SkeletonShimmer } from '@/components/skeleton-shimmer'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { fetchFromProductionEngine } from '@/services/apiClient'

interface PendingPO {
  id: string
  vendor: string
  amount: number
  items: number
}

interface HMACKey {
  id: string
  key: string
}

async function fetchPendingPOs(): Promise<PendingPO[]> {
  try {
    return await fetchFromProductionEngine<PendingPO[]>('supply-chain/pending-pos')
  } catch (error) {
    throw new Error('Failed to load pending POs')
  }
}

async function fetchHMACKeys(): Promise<HMACKey[]> {
  try {
    return await fetchFromProductionEngine<HMACKey[]>('supply-chain/hmac-keys')
  } catch (error) {
    throw new Error('Failed to load HMAC keys')
  }
}

export function VendorOrderTriggerWizard() {
  const { data: pendingPOs, loading: poLoading, error: poError } =
    useAsyncData(fetchPendingPOs)
  const { data: hmacKeys, loading: hmacLoading, error: hmacError } =
    useAsyncData(fetchHMACKeys)

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['step1', 'step2'])
  )
  const [selectedVendor, setSelectedVendor] = useState<string>('')
  const [triggering, setTriggering] = useState(false)

  const handleTriggerOrders = async () => {
    const selectedPO = pendingPOs?.find(po => po.vendor === selectedVendor)
    if (!selectedPO) return
    setTriggering(true)
    try {
      await fetchFromProductionEngine('supply-chain/purchase-orders', {
        method: 'POST',
        idempotencyKey: 'idemp-' + selectedPO.id + '-' + Date.now(),
        bodyData: {
          vendorId: '00000000-0000-0000-0000-000000000000',
          orderNumber: selectedPO.id,
          currency: 'USD',
          items: []
        }
      })
      alert(`Purchase order ${selectedPO.id} triggered successfully via enterprise API!`)
    } catch (e: any) {
      alert(`Purchase order trigger failed: ${e.message}`)
    } finally {
      setTriggering(false)
    }
  }

  const handleToggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  if (poError || hmacError) {
    return <ErrorBoundary error={poError || hmacError} />
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Vendor Order Trigger Wizard</CardTitle>
        <CardDescription>Multi-step approval chain for PO submission</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {poLoading || hmacLoading ? (
          <div className="space-y-4">
            <SkeletonShimmer rows={3} height="h-16" className="w-full" />
          </div>
        ) : (
          <>
            {/* Step 1: Pending POs */}
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => handleToggleSection('step1')}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 text-left">
                  <span className="font-semibold text-foreground">Step 1:</span>
                  <span className="text-foreground">Pending PO Drafts</span>
                </div>
                {expandedSections.has('step1') ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>

              {expandedSections.has('step1') && (
                <div className="border-t border-border p-4 space-y-3">
                  {!pendingPOs || pendingPOs.length === 0 ? (
                    <EmptyState />
                  ) : (
                    pendingPOs.map((po) => (
                      <div
                        key={po.id}
                        className="border border-border rounded p-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-foreground">
                              {po.id}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {po.vendor} • {po.items} items
                            </p>
                          </div>
                          <p className="font-mono font-semibold text-foreground">
                            ${po.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Vendor Selection */}
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => handleToggleSection('step2')}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 text-left">
                  <span className="font-semibold text-foreground">Step 2:</span>
                  <span className="text-foreground">Vendor Selection</span>
                </div>
                {expandedSections.has('step2') ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>

              {expandedSections.has('step2') && (
                <div className="border-t border-border p-4">
                  <select
                    value={selectedVendor}
                    onChange={(e) => setSelectedVendor(e.target.value)}
                    className="w-full px-3 py-2 bg-input border border-input rounded text-foreground"
                  >
                    <option value="">Select a vendor...</option>
                    {pendingPOs?.map((po) => (
                      <option key={po.vendor} value={po.vendor}>
                        {po.vendor}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Step 3: Approval Chain & HMAC Keys */}
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => handleToggleSection('step3')}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 text-left">
                  <span className="font-semibold text-foreground">Step 3:</span>
                  <span className="text-foreground">Approval Chain & HMAC Keys</span>
                </div>
                {expandedSections.has('step3') ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>

              {expandedSections.has('step3') && (
                <div className="border-t border-border p-4 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-3">
                      Validation Keys
                    </p>
                    <div className="space-y-2 font-mono text-sm">
                      {hmacKeys?.map((k) => (
                        <div
                          key={k.id}
                          className="bg-muted rounded px-3 py-2 border border-border text-foreground break-all"
                        >
                          {k.key}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 4: Trigger Confirmation */}
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => handleToggleSection('step4')}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 text-left">
                  <span className="font-semibold text-foreground">Step 4:</span>
                  <span className="text-foreground">Trigger Confirmation</span>
                </div>
                {expandedSections.has('step4') ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>

              {expandedSections.has('step4') && (
                <div className="border-t border-border p-4">
                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded p-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        Selected Vendor
                      </p>
                      <p className="font-semibold text-foreground">
                        {selectedVendor || 'None selected'}
                      </p>
                    </div>
                    <Button
                      disabled={!selectedVendor || triggering}
                      onClick={handleTriggerOrders}
                      className="w-full"
                    >
                      {triggering ? 'Triggering...' : 'Trigger Vendor Orders'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
