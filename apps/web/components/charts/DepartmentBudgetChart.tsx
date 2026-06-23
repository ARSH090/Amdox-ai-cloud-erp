'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

const initialData = [
  { department: 'Sales', allocated: 125000, spent: 98000, remaining: 27000 },
  { department: 'Engineering', allocated: 180000, spent: 165000, remaining: 15000 },
  { department: 'Marketing', allocated: 85000, spent: 72000, remaining: 13000 },
  { department: 'Operations', allocated: 95000, spent: 88000, remaining: 7000 },
  { department: 'HR', allocated: 60000, spent: 52000, remaining: 8000 },
]

const COLORS = ['#06b6d4', '#f59e0b']

export function DepartmentBudgetChart() {
  const [data, setData] = useState(initialData)

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => 
        prev.map(d => ({
          ...d,
          spent: d.spent + (Math.random() * 500 - 100),
          remaining: d.allocated - (d.spent + (Math.random() * 500 - 100))
        }))
      )
    }, 4000)
    return () => clearInterval(interval)
  }, [])
  return (
    <div className="w-full rounded-xl border border-slate-800 bg-slate-950 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-100">Department Budget Status</h3>
        <p className="text-sm text-slate-400">Allocated vs Spent</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="department" stroke="#94a3b8" />
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
          <Bar dataKey="allocated" fill="#06b6d4" radius={[8, 8, 0, 0]} />
          <Bar dataKey="spent" fill="#f59e0b" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
