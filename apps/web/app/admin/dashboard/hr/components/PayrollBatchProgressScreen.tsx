'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAsyncData } from '@/hooks/useAsyncData'
import { ErrorBoundary } from '@/components/error-boundary'
import { SkeletonShimmer } from '@/components/skeleton-shimmer'
import { useState, useEffect } from 'react'
import { fetchFromProductionEngine } from '@/services/apiClient'

interface PayrollMetrics {
  totalRecords: number
  processedRecords: number
  processingSpeed: number
  pdfQueuedCount: number
  pdfTotalCount: number
  estimatedMinutesRemaining: number
  activeWorkers: number
}

async function fetchPayrollMetrics(): Promise<PayrollMetrics> {
  try {
    return await fetchFromProductionEngine<PayrollMetrics>('hr/payroll-metrics')
  } catch (error) {
    throw new Error('Failed to load payroll metrics')
  }
}

export function PayrollBatchProgressScreen() {
  const { data, loading, error } = useAsyncData(fetchPayrollMetrics)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (data) {
      const percent = (data.processedRecords / data.totalRecords) * 100
      setProgress(percent)
    }
  }, [data])

  if (error) {
    return <ErrorBoundary error={error} />
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Payroll Batch Processing</CardTitle>
        <CardDescription>Real-time Gross-to-Net calculation progress</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <SkeletonShimmer rows={1} height="h-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SkeletonShimmer rows={2} height="h-12" className="w-full" />
              <SkeletonShimmer rows={2} height="h-12" className="w-full" />
              <SkeletonShimmer rows={2} height="h-12" className="w-full" />
              <SkeletonShimmer rows={2} height="h-12" className="w-full" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  Processing Progress
                </span>
                <span className="text-sm text-muted-foreground font-mono">
                  {data?.processedRecords?.toLocaleString()} / {data?.totalRecords?.toLocaleString()} records
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-mono">
                {progress.toFixed(1)}% complete
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Processing Speed</p>
                <p className="text-2xl font-bold text-foreground font-mono">
                  {data?.processingSpeed}
                </p>
                <p className="text-xs text-muted-foreground">records/sec</p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">PDF Queue</p>
                <p className="text-2xl font-bold text-foreground font-mono">
                  {data?.pdfQueuedCount?.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  of {data?.pdfTotalCount?.toLocaleString()}
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Time Remaining</p>
                <p className="text-2xl font-bold text-foreground font-mono">
                  {data?.estimatedMinutesRemaining}m
                </p>
                <p className="text-xs text-muted-foreground">estimate</p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Active Workers</p>
                <p className="text-2xl font-bold text-foreground font-mono">
                  {data?.activeWorkers}
                </p>
                <p className="text-xs text-muted-foreground">threads</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
