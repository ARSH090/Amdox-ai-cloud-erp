'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Activity, Zap, Database, Users, Clock, TrendingUp, CheckCircle } from 'lucide-react'

interface SystemMetric {
  name: string
  status: 'healthy' | 'warning' | 'critical'
  value: string
  unit: string
  trend: number
}

interface Event {
  id: string
  timestamp: string
  type: 'info' | 'warning' | 'error' | 'success'
  message: string
}

const initialMetrics: SystemMetric[] = [
  { name: 'API Response Time', status: 'healthy', value: '124', unit: 'ms', trend: -5 },
  { name: 'Database Connections', status: 'healthy', value: '342', unit: '/500', trend: 2 },
  { name: 'Cache Hit Rate', status: 'healthy', value: '94.2', unit: '%', trend: 3 },
  { name: 'Active Sessions', status: 'healthy', value: '2,847', unit: 'users', trend: 12 },
  { name: 'Schema Deployments', status: 'warning', value: '3', unit: 'pending', trend: 0 },
  { name: 'System Uptime', status: 'healthy', value: '99.99', unit: '%', trend: 0 },
]

const mockEvents: Event[] = [
  { id: '1', timestamp: '2024-05-28 14:32:15', type: 'success', message: 'Landing page schema updated' },
  { id: '2', timestamp: '2024-05-28 14:28:42', type: 'info', message: 'Auth provider configuration changed' },
  { id: '3', timestamp: '2024-05-28 14:20:18', type: 'warning', message: 'High API response time detected' },
  { id: '4', timestamp: '2024-05-28 14:15:33', type: 'success', message: 'Dashboard layout deployed' },
  { id: '5', timestamp: '2024-05-28 14:05:12', type: 'info', message: 'Schema editor accessed' },
]

export function SystemMonitor() {
  const [metrics, setMetrics] = useState<SystemMetric[]>(initialMetrics)
  const [events, setEvents] = useState<Event[]>(mockEvents)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      setMetrics(prev =>
        prev.map(m => ({
          ...m,
          value: (Math.random() * 100 + 50).toFixed(0),
          trend: Math.floor(Math.random() * 10 - 5),
        }))
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  const getStatusIcon = (status: SystemMetric['status']) => {
    const icons: Record<SystemMetric['status'], React.ReactNode> = {
      'healthy': <CheckCircle className="h-5 w-5 text-green-500" />,
      'warning': <AlertCircle className="h-5 w-5 text-yellow-500" />,
      'critical': <AlertCircle className="h-5 w-5 text-red-500" />,
    }
    return icons[status]
  }

  const getEventColor = (type: Event['type']) => {
    const colors: Record<Event['type'], string> = {
      'info': 'text-blue-600 bg-blue-500/10',
      'warning': 'text-yellow-600 bg-yellow-500/10',
      'error': 'text-red-600 bg-red-500/10',
      'success': 'text-green-600 bg-green-500/10',
    }
    return colors[type]
  }

  const getEventLabel = (type: Event['type']) => {
    const labels: Record<Event['type'], string> = {
      'info': 'ℹ️',
      'warning': '⚠️',
      'error': '❌',
      'success': '✅',
    }
    return labels[type]
  }

  const healthyCount = metrics.filter(m => m.status === 'healthy').length
  const warningCount = metrics.filter(m => m.status === 'warning').length
  const criticalCount = metrics.filter(m => m.status === 'critical').length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">System Monitor</h1>
          <p className="text-muted-foreground mt-1">Real-time system health and events</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm text-foreground">Auto-refresh</span>
        </label>
      </div>

      {/* Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border-green-500/50 bg-green-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Healthy</p>
              <p className="text-3xl font-bold text-green-600">{healthyCount}</p>
            </div>
            <CheckCircle className="h-12 w-12 text-green-500 opacity-20" />
          </div>
        </Card>
        <Card className="p-6 border-yellow-500/50 bg-yellow-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Warnings</p>
              <p className="text-3xl font-bold text-yellow-600">{warningCount}</p>
            </div>
            <AlertCircle className="h-12 w-12 text-yellow-500 opacity-20" />
          </div>
        </Card>
        <Card className="p-6 border-red-500/50 bg-red-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Critical</p>
              <p className="text-3xl font-bold text-red-600">{criticalCount}</p>
            </div>
            <AlertCircle className="h-12 w-12 text-red-500 opacity-20" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metrics */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-semibold text-foreground">System Metrics</h2>
          <div className="grid grid-cols-2 gap-3">
            {metrics.map((metric) => (
              <Card key={metric.name} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground">{metric.name}</h3>
                    {getStatusIcon(metric.status)}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-foreground">{metric.value}</span>
                    <span className="text-xs text-muted-foreground">{metric.unit}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className={`h-3 w-3 ${metric.trend >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                    <span className={`text-xs font-medium ${metric.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metric.trend > 0 ? '+' : ''}{metric.trend}%
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-3">
          <h2 className="font-semibold text-foreground">Statistics</h2>
          <div className="space-y-3">
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Uptime</span>
                </div>
                <p className="text-xl font-bold text-foreground">45 days</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">Req/sec</span>
                </div>
                <p className="text-xl font-bold text-foreground">12.4K</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Storage</span>
                </div>
                <p className="text-xl font-bold text-foreground">847 GB</p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-muted-foreground">Active</span>
                </div>
                <p className="text-xl font-bold text-foreground">2.8K</p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Events */}
      <Card className="p-6">
        <div className="space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Events
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.map((event) => (
              <div
                key={event.id}
                className={`p-3 rounded-lg border border-border ${getEventColor(event.type)}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">{getEventLabel(event.type)}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{event.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{event.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
