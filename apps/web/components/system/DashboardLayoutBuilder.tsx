'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, Save, Grid3x3, Columns2, Columns3, Eye } from 'lucide-react'

interface DashboardWidget {
  id: string
  title: string
  type: 'chart' | 'metric' | 'table' | 'list' | 'custom'
  size: 'small' | 'medium' | 'large'
  order: number
  enabled: boolean
}

interface DashboardLayout {
  id: string
  name: string
  role: string
  gridColumns: number
  widgets: DashboardWidget[]
  isDefault: boolean
  lastModified: string
}

const mockLayouts: DashboardLayout[] = [
  {
    id: 'layout-1',
    name: 'Executive Dashboard',
    role: 'admin',
    gridColumns: 4,
    isDefault: true,
    lastModified: '2024-05-28',
    widgets: [
      { id: 'w1', title: 'Revenue Overview', type: 'chart', size: 'large', order: 1, enabled: true },
      { id: 'w2', title: 'YTD Performance', type: 'metric', size: 'medium', order: 2, enabled: true },
      { id: 'w3', title: 'Top Customers', type: 'table', size: 'large', order: 3, enabled: true },
      { id: 'w4', title: 'Recent Transactions', type: 'list', size: 'medium', order: 4, enabled: true },
    ]
  },
  {
    id: 'layout-2',
    name: 'Finance Dashboard',
    role: 'accountant',
    gridColumns: 3,
    isDefault: false,
    lastModified: '2024-05-27',
    widgets: [
      { id: 'w5', title: 'Ledger Summary', type: 'table', size: 'large', order: 1, enabled: true },
      { id: 'w6', title: 'Cash Position', type: 'metric', size: 'small', order: 2, enabled: true },
    ]
  },
]

const widgetTypes = [
  { type: 'chart', label: 'Chart', icon: '📊' },
  { type: 'metric', label: 'KPI Card', icon: '📈' },
  { type: 'table', label: 'Table', icon: '📋' },
  { type: 'list', label: 'List', icon: '📝' },
  { type: 'custom', label: 'Custom', icon: '⚙️' },
]

export function DashboardLayoutBuilder() {
  const [layouts, setLayouts] = useState<DashboardLayout[]>(mockLayouts)
  const [selectedLayout, setSelectedLayout] = useState<DashboardLayout | null>(mockLayouts[0])
  const [isAddingWidget, setIsAddingWidget] = useState(false)
  const [newWidget, setNewWidget] = useState<Partial<DashboardWidget>>({})
  const [preview, setPreview] = useState(false)

  const handleAddWidget = () => {
    if (!selectedLayout || !newWidget.title || !newWidget.type) return

    const widget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      title: newWidget.title,
      type: newWidget.type as DashboardWidget['type'],
      size: newWidget.size || 'medium',
      order: selectedLayout.widgets.length + 1,
      enabled: true,
    }

    const updated = {
      ...selectedLayout,
      widgets: [...selectedLayout.widgets, widget],
      lastModified: new Date().toISOString().split('T')[0],
    }
    setSelectedLayout(updated)
    const layoutIndex = layouts.findIndex(l => l.id === selectedLayout.id)
    setLayouts([...layouts.slice(0, layoutIndex), updated, ...layouts.slice(layoutIndex + 1)])
    setNewWidget({})
    setIsAddingWidget(false)
  }

  const handleDeleteWidget = (widgetId: string) => {
    if (!selectedLayout) return
    const updated = {
      ...selectedLayout,
      widgets: selectedLayout.widgets.filter(w => w.id !== widgetId),
    }
    setSelectedLayout(updated)
    const layoutIndex = layouts.findIndex(l => l.id === selectedLayout.id)
    setLayouts([...layouts.slice(0, layoutIndex), updated, ...layouts.slice(layoutIndex + 1)])
  }

  const handleToggleWidget = (widgetId: string) => {
    if (!selectedLayout) return
    const updated = {
      ...selectedLayout,
      widgets: selectedLayout.widgets.map(w =>
        w.id === widgetId ? { ...w, enabled: !w.enabled } : w
      ),
    }
    setSelectedLayout(updated)
    const layoutIndex = layouts.findIndex(l => l.id === selectedLayout.id)
    setLayouts([...layouts.slice(0, layoutIndex), updated, ...layouts.slice(layoutIndex + 1)])
  }

  const handleGridColumnsChange = (columns: number) => {
    if (!selectedLayout) return
    const updated = {
      ...selectedLayout,
      gridColumns: columns,
    }
    setSelectedLayout(updated)
    const layoutIndex = layouts.findIndex(l => l.id === selectedLayout.id)
    setLayouts([...layouts.slice(0, layoutIndex), updated, ...layouts.slice(layoutIndex + 1)])
  }

  const sizeToSpan = (size: DashboardWidget['size'], gridColumns: number) => {
    if (gridColumns === 3) {
      return size === 'large' ? 3 : size === 'medium' ? 2 : 1
    }
    return size === 'large' ? 2 : 1
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Layout Builder</h1>
          <p className="text-muted-foreground mt-1">Customize dashboards by role</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Layout
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Layout List */}
        <div className="space-y-3">
          <h2 className="font-semibold text-foreground">Layouts</h2>
          {layouts.map((layout) => (
            <Card
              key={layout.id}
              className={`p-4 cursor-pointer transition-colors ${
                selectedLayout?.id === layout.id
                  ? 'bg-primary/10 border-primary'
                  : 'hover:bg-muted'
              }`}
              onClick={() => setSelectedLayout(layout)}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground text-sm">{layout.name}</h3>
                  {layout.isDefault && (
                    <Badge variant="default" className="text-xs">Default</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Role: {layout.role}</p>
                <p className="text-xs text-muted-foreground">{layout.widgets.length} widgets</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Builder */}
        {selectedLayout && (
          <div className="lg:col-span-3 space-y-6">
            {/* Header */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{selectedLayout.name}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Role: {selectedLayout.role} • {selectedLayout.widgets.length} widgets
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => setPreview(!preview)}
                  >
                    <Eye className="h-4 w-4" />
                    {preview ? 'Edit' : 'Preview'}
                  </Button>
                </div>

                {!preview && (
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm font-medium text-foreground">Grid Columns:</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={selectedLayout.gridColumns === 3 ? 'default' : 'outline'}
                        onClick={() => handleGridColumnsChange(3)}
                        className="gap-1"
                      >
                        <Columns3 className="h-4 w-4" />
                        3
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedLayout.gridColumns === 4 ? 'default' : 'outline'}
                        onClick={() => handleGridColumnsChange(4)}
                        className="gap-1"
                      >
                        <Grid3x3 className="h-4 w-4" />
                        4
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {!preview ? (
              <>
                {/* Widget Manager */}
                <Card className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">Widgets</h3>
                      {!isAddingWidget && (
                        <Button
                          size="sm"
                          onClick={() => setIsAddingWidget(true)}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Widget
                        </Button>
                      )}
                    </div>

                    {isAddingWidget && (
                      <div className="p-4 border border-border rounded-lg bg-muted/30 space-y-3">
                        <h4 className="font-medium text-foreground">Add Widget</h4>
                        <input
                          type="text"
                          placeholder="Widget title"
                          value={newWidget.title || ''}
                          onChange={(e) => setNewWidget({ ...newWidget, title: e.target.value })}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <select
                            value={newWidget.type || 'chart'}
                            onChange={(e) => setNewWidget({ ...newWidget, type: e.target.value as any })}
                            className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                          >
                            {widgetTypes.map(wt => (
                              <option key={wt.type} value={wt.type}>{wt.label}</option>
                            ))}
                          </select>
                          <select
                            value={newWidget.size || 'medium'}
                            onChange={(e) => setNewWidget({ ...newWidget, size: e.target.value as any })}
                            className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                          >
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleAddWidget} className="gap-2">
                            <Save className="h-4 w-4" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setIsAddingWidget(false)
                              setNewWidget({})
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {selectedLayout.widgets.map((widget) => (
                        <div
                          key={widget.id}
                          className="p-3 border border-border rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{widget.title}</p>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {widgetTypes.find(w => w.type === widget.type)?.icon} {widget.type}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {widget.size}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={widget.enabled}
                                  onChange={() => handleToggleWidget(widget.id)}
                                  className="w-4 h-4"
                                />
                              </label>
                              <Button size="sm" variant="ghost">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteWidget(widget.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              // Preview
              <Card className="p-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Dashboard Preview</h3>
                  <div className={`grid gap-4`} style={{
                    gridTemplateColumns: `repeat(${selectedLayout.gridColumns}, minmax(0, 1fr))`
                  }}>
                    {selectedLayout.widgets
                      .filter(w => w.enabled)
                      .map((widget) => (
                        <div
                          key={widget.id}
                          style={{
                            gridColumn: `span ${sizeToSpan(widget.size, selectedLayout.gridColumns)}`
                          }}
                          className="p-4 border border-border rounded-lg bg-muted/30 min-h-32 flex items-center justify-center text-center"
                        >
                          <div>
                            <p className="text-sm font-medium text-foreground">{widget.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{widget.type}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
