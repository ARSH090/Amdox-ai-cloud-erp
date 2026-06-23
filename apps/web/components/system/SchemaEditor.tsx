'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, Save, X, Copy, Download } from 'lucide-react'

interface SchemaField {
  id: string
  name: string
  type: 'string' | 'number' | 'boolean' | 'json' | 'array'
  required: boolean
  description: string
}

interface Schema {
  id: string
  name: string
  version: string
  fields: SchemaField[]
  lastModified: string
  status: 'active' | 'draft' | 'archived'
}

const mockSchemas: Schema[] = [
  {
    id: 'schema-1',
    name: 'landing_page_schema',
    version: '1.2.0',
    status: 'active',
    lastModified: '2024-05-28',
    fields: [
      { id: 'f1', name: 'hero_title', type: 'string', required: true, description: 'Hero section title' },
      { id: 'f2', name: 'hero_subtitle', type: 'string', required: true, description: 'Hero subtitle' },
      { id: 'f3', name: 'cta_buttons', type: 'array', required: true, description: 'CTA button configuration' },
      { id: 'f4', name: 'featured_sections', type: 'json', required: false, description: 'Dynamic sections' },
    ]
  },
  {
    id: 'schema-2',
    name: 'navigation_items',
    version: '1.0.0',
    status: 'active',
    lastModified: '2024-05-27',
    fields: [
      { id: 'n1', name: 'label', type: 'string', required: true, description: 'Menu label' },
      { id: 'n2', name: 'href', type: 'string', required: true, description: 'Navigation URL' },
      { id: 'n3', name: 'icon', type: 'string', required: false, description: 'Icon name' },
      { id: 'n4', name: 'children', type: 'array', required: false, description: 'Submenu items' },
    ]
  },
  {
    id: 'schema-3',
    name: 'tenant_auth_providers',
    version: '2.1.0',
    status: 'active',
    lastModified: '2024-05-26',
    fields: [
      { id: 'a1', name: 'provider_type', type: 'string', required: true, description: 'Auth provider name' },
      { id: 'a2', name: 'enabled', type: 'boolean', required: true, description: 'Enable/disable provider' },
      { id: 'a3', name: 'config', type: 'json', required: true, description: 'Provider configuration' },
    ]
  },
]

export function SchemaEditor() {
  const [schemas, setSchemas] = useState<Schema[]>(mockSchemas)
  const [selectedSchema, setSelectedSchema] = useState<Schema | null>(mockSchemas[0])
  const [editingField, setEditingField] = useState<SchemaField | null>(null)
  const [newField, setNewField] = useState<Partial<SchemaField>>({})
  const [showNewField, setShowNewField] = useState(false)

  const handleAddField = () => {
    if (!selectedSchema || !newField.name || !newField.type) return

    const field: SchemaField = {
      id: `field-${Date.now()}`,
      name: newField.name,
      type: newField.type as SchemaField['type'],
      required: newField.required || false,
      description: newField.description || '',
    }

    const updated = {
      ...selectedSchema,
      fields: [...selectedSchema.fields, field],
      lastModified: new Date().toISOString().split('T')[0],
    }
    setSelectedSchema(updated)
    const schemaIndex = schemas.findIndex(s => s.id === selectedSchema.id)
    setSchemas([...schemas.slice(0, schemaIndex), updated, ...schemas.slice(schemaIndex + 1)])
    setNewField({})
    setShowNewField(false)
  }

  const handleDeleteField = (fieldId: string) => {
    if (!selectedSchema) return
    const updated = {
      ...selectedSchema,
      fields: selectedSchema.fields.filter(f => f.id !== fieldId),
      lastModified: new Date().toISOString().split('T')[0],
    }
    setSelectedSchema(updated)
    const schemaIndex = schemas.findIndex(s => s.id === selectedSchema.id)
    setSchemas([...schemas.slice(0, schemaIndex), updated, ...schemas.slice(schemaIndex + 1)])
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Schema Editor</h1>
          <p className="text-muted-foreground mt-1">Manage database schemas without redeployment</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Schema
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schema List */}
        <div className="space-y-3">
          <h2 className="font-semibold text-foreground">Schemas</h2>
          {schemas.map((schema) => (
            <Card
              key={schema.id}
              className={`p-4 cursor-pointer transition-colors ${
                selectedSchema?.id === schema.id
                  ? 'bg-primary/10 border-primary'
                  : 'hover:bg-muted'
              }`}
              onClick={() => setSelectedSchema(schema)}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground">{schema.name}</h3>
                  <Badge variant={schema.status === 'active' ? 'default' : 'secondary'}>
                    {schema.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">v{schema.version}</p>
                <p className="text-xs text-muted-foreground">{schema.fields.length} fields</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Schema Details */}
        {selectedSchema && (
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{selectedSchema.name}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Version {selectedSchema.version} • Modified {selectedSchema.lastModified}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-2">
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Fields */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Fields ({selectedSchema.fields.length})</h3>
                  {!showNewField && (
                    <Button
                      size="sm"
                      onClick={() => setShowNewField(true)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Field
                    </Button>
                  )}
                </div>

                {/* Field List */}
                <div className="space-y-3">
                  {selectedSchema.fields.map((field) => (
                    <div
                      key={field.id}
                      className="p-4 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-foreground">{field.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {field.type}
                            </Badge>
                            {field.required && (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                          {field.description && (
                            <p className="text-sm text-muted-foreground">{field.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingField(field)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteField(field.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add New Field Form */}
                {showNewField && (
                  <div className="p-4 border border-border rounded-lg bg-muted/30 space-y-4">
                    <h4 className="font-medium text-foreground">New Field</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Field name"
                        value={newField.name || ''}
                        onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                        className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                      />
                      <select
                        value={newField.type || 'string'}
                        onChange={(e) => setNewField({ ...newField, type: e.target.value as any })}
                        className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="json">JSON</option>
                        <option value="array">Array</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      placeholder="Description"
                      value={newField.description || ''}
                      onChange={(e) => setNewField({ ...newField, description: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    />
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newField.required || false}
                        onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-foreground">Required field</span>
                    </label>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddField} className="gap-2">
                        <Save className="h-4 w-4" />
                        Save Field
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowNewField(false)
                          setNewField({})
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
