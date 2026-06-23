'use client'

import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const initialDivisionData = [
  { name: 'Finance', value: 35, color: '#10b981' },
  { name: 'Operations', value: 28, color: '#06b6d4' },
  { name: 'Sales', value: 22, color: '#8b5cf6' },
  { name: 'HR & Admin', value: 15, color: '#f59e0b' },
]

const initialPerformanceData = [
  { department: 'Finance', actual: 95, target: 90 },
  { department: 'Operations', actual: 88, target: 85 },
  { department: 'Sales', actual: 102, target: 95 },
  { department: 'HR', actual: 92, target: 90 },
]

export function BusinessIntelligenceDashboard() {
  const [divData, setDivData] = useState(initialDivisionData)
  const [perfData, setPerfData] = useState(initialPerformanceData)

  useEffect(() => {
    const interval = setInterval(() => {
      setDivData((prev) => 
        prev.map(d => ({
          ...d,
          value: Math.max(5, d.value + Math.floor(Math.random() * 4 - 2))
        }))
      )
      setPerfData((prev) => 
        prev.map(d => ({
          ...d,
          actual: Math.max(60, Math.min(120, d.actual + Math.floor(Math.random() * 6 - 3)))
        }))
      )
    }, 4500)
    return () => clearInterval(interval)
  }, [])
  return (
    <div className="w-full rounded-xl border border-slate-800 bg-slate-950 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-100">Business Intelligence</h3>
        <p className="text-sm text-slate-400">Department performance breakdown</p>
      </div>

      <div className="space-y-8">
        {/* Revenue Distribution */}
        <div>
          <p className="text-sm font-semibold text-slate-300 mb-4">Revenue Distribution by Division</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={divData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {divData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#cbd5e1' }}
                formatter={(value) => `${value}%`}
              />
              <Legend 
                wrapperStyle={{
                  paddingTop: '20px',
                  color: '#cbd5e1',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Performance vs Target */}
        <div>
          <p className="text-sm font-semibold text-slate-300 mb-4">Department Performance vs Target</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={perfData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="department" stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#cbd5e1' }}
                formatter={(value) => `${value}%`}
              />
              <Bar dataKey="actual" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="target" fill="#06b6d4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-800">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-400 uppercase">Top Performer</p>
            <p className="mt-1 text-lg font-semibold text-emerald-400">Sales (102%)</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase">Needs Attention</p>
            <p className="mt-1 text-lg font-semibold text-amber-400">Operations (88%)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
