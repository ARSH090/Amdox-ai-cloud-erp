'use client'

import { TrendingUp, DollarSign, Users, AlertCircle, Zap, Target } from 'lucide-react'

export function ExecutiveKPIGrid() {
  const kpis = [
    {
      title: 'Total Company Revenue',
      value: '$1.28M',
      unit: 'YTD',
      change: 18.5,
      trend: 'up' as const,
      color: 'emerald',
      icon: DollarSign,
    },
    {
      title: 'Operational Efficiency',
      value: '94.2%',
      unit: 'Performance Score',
      change: 5.2,
      trend: 'up' as const,
      color: 'cyan',
      icon: Zap,
    },
    {
      title: 'Total Active Users',
      value: '1,247',
      unit: 'Employees',
      change: 12.3,
      trend: 'up' as const,
      color: 'violet',
      icon: Users,
    },
    {
      title: 'Target Achievement',
      value: '108%',
      unit: 'of Q4 Goal',
      change: 8.1,
      trend: 'up' as const,
      color: 'amber',
      icon: Target,
    },
    {
      title: 'Cash Position',
      value: '$487K',
      unit: 'Available',
      change: 3.7,
      trend: 'up' as const,
      color: 'lime',
      icon: TrendingUp,
    },
    {
      title: 'Risk Alerts',
      value: '3',
      unit: 'Pending Review',
      change: -40,
      trend: 'down' as const,
      color: 'red',
      icon: AlertCircle,
    },
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
      cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
      violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
      amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
      lime: { bg: 'bg-lime-500/10', text: 'text-lime-400', border: 'border-lime-500/20' },
      red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
    }
    return colors[color] || colors.emerald
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpis.map((kpi) => {
        const colorClasses = getColorClasses(kpi.color)
        const Icon = kpi.icon
        
        return (
          <div
            key={kpi.title}
            className={`rounded-xl border border-slate-800 ${colorClasses.bg} bg-slate-950 p-6 backdrop-blur-sm transition-all hover:border-slate-700 hover:shadow-lg`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  {kpi.title}
                </p>
                <div className="mt-3 flex items-baseline gap-2">
                  <p className={`text-3xl font-bold ${colorClasses.text}`}>
                    {kpi.value}
                  </p>
                  {kpi.unit && (
                    <p className="text-xs text-slate-500">{kpi.unit}</p>
                  )}
                </div>
              </div>
              <div className={`p-2 rounded-lg ${colorClasses.bg} border ${colorClasses.border}`}>
                <Icon className={`h-6 w-6 ${colorClasses.text}`} />
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className={`text-sm font-semibold ${kpi.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {kpi.trend === 'up' ? '↑' : '↓'} {Math.abs(kpi.change)}%
                </span>
              </div>
              <span className="text-xs text-slate-500">
                {kpi.trend === 'up' ? 'vs last period' : 'decline'}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
