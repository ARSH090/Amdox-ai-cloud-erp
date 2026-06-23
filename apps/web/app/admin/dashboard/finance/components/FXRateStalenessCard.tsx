'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useAsyncData } from '@/hooks/useAsyncData'
import { ErrorBoundary } from '@/components/error-boundary'
import { SkeletonShimmer } from '@/components/skeleton-shimmer'
import { fetchFromProductionEngine } from '@/services/apiClient'

interface FXRate {
  pair: string
  rate: number
  staleness: number // hours
}

async function fetchFXRates(): Promise<FXRate[]> {
  try {
    return await fetchFromProductionEngine<FXRate[]>('finance/rates')
  } catch (error) {
    throw new Error('Failed to load FX rates')
  }
}

export function FXRateStalenessCard() {
  const { data, loading, error } = useAsyncData(fetchFXRates)

  if (error) {
    return <ErrorBoundary error={error} />
  }

  const isStale = data?.some((r) => r.staleness > 24)

  return (
    <Card className="col-span-1">
      <CardContent className="pt-6">
        <style jsx>{`
          @keyframes blink {
            0%, 49%, 100% {
              opacity: 1;
            }
            50%, 99% {
              opacity: 0.5;
            }
          }
          .animate-stale-blink {
            animation: blink 2s infinite;
          }
        `}</style>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">FX Rates</h3>
            <div className="flex items-center gap-2">
              {loading ? (
                <div className="w-3 h-3 rounded-full bg-muted" />
              ) : (
                <div
                  className={`w-3 h-3 rounded-full ${
                    isStale
                      ? 'bg-red-500 animate-stale-blink'
                      : 'bg-green-500'
                  }`}
                />
              )}
              <span className="text-xs text-muted-foreground">
                {loading ? 'Loading...' : isStale ? 'Stale' : 'Fresh'}
              </span>
            </div>
          </div>

          {loading ? (
            <SkeletonShimmer rows={4} height="h-6" />
          ) : (
            <div className="space-y-2 font-mono text-sm">
              {data?.map((rate) => (
                <div
                  key={rate.pair}
                  className="flex justify-between items-center text-foreground/90"
                >
                  <span>{rate.pair}</span>
                  <span className="font-semibold">{rate.rate.toFixed(4)}</span>
                  <span className="text-xs text-muted-foreground">
                    {rate.staleness}h
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
