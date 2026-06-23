'use client'

import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  unit?: string
  change?: number
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
}

export function KPICard({
  title,
  value,
  unit = '',
  change,
  icon,
  trend = 'neutral',
}: KPICardProps) {
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'
  const trendIcon = trend === 'up' ? <ArrowUp className="h-4 w-4" /> : trend === 'down' ? <ArrowDown className="h-4 w-4" /> : null

  return (
    <div className="rounded-xl border border-border bg-card p-6 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-foreground font-mono">{value}</p>
            {unit && <span className="text-muted-foreground">{unit}</span>}
          </div>
          {change !== undefined && (
            <div className={`mt-2 flex items-center gap-1 text-sm font-medium ${trendColor}`}>
              {trendIcon}
              <span>{Math.abs(change)}% from last month</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-muted p-3 text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
