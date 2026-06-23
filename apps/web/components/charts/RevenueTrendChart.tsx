'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'

const initialData = [
  { month: 'Jan', revenue: 45000, target: 40000 },
  { month: 'Feb', revenue: 52000, target: 45000 },
  { month: 'Mar', revenue: 48000, target: 48000 },
  { month: 'Apr', revenue: 61000, target: 50000 },
  { month: 'May', revenue: 55000, target: 52000 },
  { month: 'Jun', revenue: 67000, target: 55000 },
]

export function RevenueTrendChart() {
  const [data, setData] = useState(initialData)

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => 
        prev.map(d => ({
          ...d,
          revenue: d.revenue + (Math.random() * 2000 - 1000)
        }))
      )
    }, 3000)
    return () => clearInterval(interval)
  }, [])
  return (
    <div className="w-full rounded-xl border border-slate-800 bg-slate-950 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Revenue Trend</h3>
          <p className="text-sm text-slate-400">Last 6 months performance</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-emerald-400">+12.5%</p>
          <p className="text-xs text-slate-400">vs last period</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="month" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
          <Tooltip 
            formatter={(value: number) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, undefined]}
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#cbd5e1' }}
          />
          <Legend />
          <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#colorRevenue)" strokeWidth={2} />
          <Line type="monotone" dataKey="target" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
