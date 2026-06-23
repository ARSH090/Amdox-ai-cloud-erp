'use client'

import { KPICard } from '@/components/charts/KPICard'
import { RevenueTrendChart } from '@/components/charts/RevenueTrendChart'
import { DepartmentBudgetChart } from '@/components/charts/DepartmentBudgetChart'
import { InventoryTrendChart } from '@/components/charts/InventoryTrendChart'
import { ExecutiveKPIGrid } from '@/components/charts/ExecutiveKPIGrid'
import { BusinessIntelligenceDashboard } from '@/components/charts/BusinessIntelligenceDashboard'
import { TrendingUp, DollarSign, Users, AlertCircle } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Executive Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Real-time KPI monitoring and business intelligence analytics
        </p>
      </div>

      <ExecutiveKPIGrid />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueTrendChart />
        <BusinessIntelligenceDashboard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DepartmentBudgetChart />
        <InventoryTrendChart />
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Financial Health Summary</h3>
          <p className="text-sm text-muted-foreground">Key metrics across all modules</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Operating Margin</p>
            <p className="mt-2 text-2xl font-bold text-emerald-400 font-mono">24.5%</p>
            <p className="text-xs text-muted-foreground mt-1 font-mono">↑ 2.3% from last quarter</p>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Cash Conversion</p>
            <p className="mt-2 text-2xl font-bold text-cyan-400 font-mono">89%</p>
            <p className="text-xs text-muted-foreground mt-1 font-mono">↑ 3.1% improvement</p>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Days Payable</p>
            <p className="mt-2 text-2xl font-bold text-violet-400 font-mono">45 days</p>
            <p className="text-xs text-muted-foreground mt-1 font-mono">Optimal payment cycle</p>
          </div>
        </div>
      </div>
    </div>
  )
}
