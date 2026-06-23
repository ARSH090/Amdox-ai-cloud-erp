'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const initialData = [
  { week: 'W1', units: 1200, reorderPoint: 800 },
  { week: 'W2', units: 1100, reorderPoint: 800 },
  { week: 'W3', units: 900, reorderPoint: 800 },
  { week: 'W4', units: 950, reorderPoint: 800 },
  { week: 'W5', units: 1050, reorderPoint: 800 },
  { week: 'W6', units: 1200, reorderPoint: 800 },
]

export function InventoryTrendChart() {
  const [data, setData] = useState(initialData)

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => 
        prev.map(d => ({
          ...d,
          units: Math.max(0, d.units + Math.floor(Math.random() * 60 - 30))
        }))
      )
    }, 3500)
    return () => clearInterval(interval)
  }, [])
  return (
    <div className="w-full rounded-xl border border-slate-800 bg-slate-950 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-100">Inventory Levels</h3>
        <p className="text-sm text-slate-400">Stock levels vs Reorder threshold</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="week" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#cbd5e1' }}
          />
          <Legend />
          <Line type="monotone" dataKey="units" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 4 }} />
          <Line type="monotone" dataKey="reorderPoint" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
