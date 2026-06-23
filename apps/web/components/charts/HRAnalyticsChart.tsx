'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const initialDepartmentData = [
  { department: 'Sales', headcount: 24, budget: 85000 },
  { department: 'Engineering', headcount: 18, budget: 120000 },
  { department: 'Marketing', headcount: 8, budget: 45000 },
  { department: 'Operations', headcount: 12, budget: 55000 },
  { department: 'HR', headcount: 5, budget: 25000 },
]

const initialAttendanceData = [
  { name: 'Present', value: 87, fill: '#10b981' },
  { name: 'Remote', value: 8, fill: '#06b6d4' },
  { name: 'Leave', value: 5, fill: '#f59e0b' },
]

export function HeadcountByDepartment() {
  const [data, setData] = useState(initialDepartmentData)

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => 
        prev.map(d => ({
          ...d,
          headcount: Math.max(1, d.headcount + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 2))
        }))
      )
    }, 5000)
    return () => clearInterval(interval)
  }, [])
  return (
    <div className="w-full rounded-xl border border-slate-800 bg-slate-950 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-100">Headcount Distribution</h3>
        <p className="text-sm text-slate-400">Employees by department</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="department" stroke="#94a3b8" />
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
          <Bar dataKey="headcount" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function AttendanceStatus() {
  const [attData, setAttData] = useState(initialAttendanceData)

  useEffect(() => {
    const interval = setInterval(() => {
      setAttData((prev) => {
        const changes = prev.map(d => ({
          ...d,
          value: Math.max(0, d.value + Math.floor(Math.random() * 4 - 2))
        }))
        // Normalize to roughly 100%
        const total = changes.reduce((acc, curr) => acc + curr.value, 0)
        return changes.map(c => ({...c, value: Math.round((c.value / total) * 100)}))
      })
    }, 4000)
    return () => clearInterval(interval)
  }, [])
  return (
    <div className="w-full rounded-xl border border-slate-800 bg-slate-950 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-100">Today&apos;s Attendance</h3>
        <p className="text-sm text-slate-400">Employee status distribution</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={attData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {attData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#cbd5e1' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
