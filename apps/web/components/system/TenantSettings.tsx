'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, Save, X, Globe, Lock, Bell, Users } from 'lucide-react'

interface Tenant {
  id: string
  name: string
  domain: string
  status: 'active' | 'suspended' | 'trial'
  plan: 'starter' | 'professional' | 'enterprise'
  users: number
  createdAt: string
  features: {
    sso: boolean
    customBranding: boolean
    advancedReporting: boolean
    apiAccess: boolean
    supportLevel: 'community' | 'priority' | 'dedicated'
  }
}

const mockTenants: Tenant[] = [
  {
    id: 'tenant-1',
    name: 'Acme Corporation',
    domain: 'acme.amdox.io',
    status: 'active',
    plan: 'enterprise',
    users: 2500,
    createdAt: '2024-01-15',
    features: {
      sso: true,
      customBranding: true,
      advancedReporting: true,
      apiAccess: true,
      supportLevel: 'dedicated',
    }
  },
  {
    id: 'tenant-2',
    name: 'TechStart Inc',
    domain: 'techstart.amdox.io',
    status: 'active',
    plan: 'professional',
    users: 150,
    createdAt: '2024-03-20',
    features: {
      sso: true,
      customBranding: true,
      advancedReporting: true,
      apiAccess: false,
      supportLevel: 'priority',
    }
  },
  {
    id: 'tenant-3',
    name: 'Local Shop',
    domain: 'localshop.amdox.io',
    status: 'trial',
    plan: 'starter',
    users: 10,
    createdAt: '2024-05-20',
    features: {
      sso: false,
      customBranding: false,
      advancedReporting: false,
      apiAccess: false,
      supportLevel: 'community',
    }
  },
]

export function TenantSettings() {
  const [tenants, setTenants] = useState<Tenant[]>(mockTenants)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(mockTenants[0])
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Tenant>>({})

  const handleEditTenant = () => {
    if (!selectedTenant) return
    setEditData({ ...selectedTenant })
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    if (!selectedTenant || !editData.name) return
    const updated = {
      ...selectedTenant,
      ...editData,
    } as Tenant
    setSelectedTenant(updated)
    const tenantIndex = tenants.findIndex(t => t.id === selectedTenant.id)
    setTenants([...tenants.slice(0, tenantIndex), updated, ...tenants.slice(tenantIndex + 1)])
    setIsEditing(false)
    setEditData({})
  }

  const handleToggleFeature = (feature: keyof Tenant['features']) => {
    if (!selectedTenant) return
    const updated = {
      ...selectedTenant,
      features: {
        ...selectedTenant.features,
        [feature]: !selectedTenant.features[feature],
      }
    }
    setSelectedTenant(updated)
    const tenantIndex = tenants.findIndex(t => t.id === selectedTenant.id)
    setTenants([...tenants.slice(0, tenantIndex), updated, ...tenants.slice(tenantIndex + 1)])
  }

  const getPlanColor = (plan: Tenant['plan']) => {
    const colors: Record<Tenant['plan'], string> = {
      'starter': 'bg-blue-500/10 text-blue-700',
      'professional': 'bg-purple-500/10 text-purple-700',
      'enterprise': 'bg-amber-500/10 text-amber-700',
    }
    return colors[plan]
  }

  const getStatusColor = (status: Tenant['status']) => {
    const colors: Record<Tenant['status'], string> = {
      'active': 'bg-green-500/10 text-green-700',
      'trial': 'bg-blue-500/10 text-blue-700',
      'suspended': 'bg-red-500/10 text-red-700',
    }
    return colors[status]
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tenant Management</h1>
          <p className="text-muted-foreground mt-1">Manage customer tenants and subscriptions</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Tenant
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tenant List */}
        <div className="space-y-3">
          <h2 className="font-semibold text-foreground">Tenants</h2>
          {tenants.map((tenant) => (
            <Card
              key={tenant.id}
              className={`p-4 cursor-pointer transition-colors ${
                selectedTenant?.id === tenant.id
                  ? 'bg-primary/10 border-primary'
                  : 'hover:bg-muted'
              }`}
              onClick={() => setSelectedTenant(tenant)}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground text-sm">{tenant.name}</h3>
                  <Badge className={getPlanColor(tenant.plan)} variant="secondary">
                    {tenant.plan}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{tenant.domain}</p>
                <div className="flex items-center justify-between pt-2">
                  <Badge className={getStatusColor(tenant.status)} variant="secondary">
                    {tenant.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{tenant.users} users</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Tenant Details */}
        {selectedTenant && (
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{selectedTenant.name}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{selectedTenant.domain}</p>
                  </div>
                  {!isEditing && (
                    <Button
                      size="sm"
                      onClick={handleEditTenant}
                      className="gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-3 p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(selectedTenant.status)}>
                      {selectedTenant.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Plan</p>
                    <Badge className={getPlanColor(selectedTenant.plan)}>
                      {selectedTenant.plan}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Users</p>
                    <p className="font-bold text-foreground">{selectedTenant.users}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm text-foreground">{selectedTenant.createdAt}</p>
                  </div>
                </div>
              </div>
            </Card>

            {!isEditing ? (
              <>
                {/* Features */}
                <Card className="p-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground">Features</h3>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50">
                        <input
                          type="checkbox"
                          checked={selectedTenant.features.sso}
                          onChange={() => handleToggleFeature('sso')}
                          className="w-4 h-4"
                        />
                        <div>
                          <p className="font-medium text-foreground">Single Sign-On (SSO)</p>
                          <p className="text-xs text-muted-foreground">SAML 2.0 support</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50">
                        <input
                          type="checkbox"
                          checked={selectedTenant.features.customBranding}
                          onChange={() => handleToggleFeature('customBranding')}
                          className="w-4 h-4"
                        />
                        <div>
                          <p className="font-medium text-foreground">Custom Branding</p>
                          <p className="text-xs text-muted-foreground">Logo, colors, domain</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50">
                        <input
                          type="checkbox"
                          checked={selectedTenant.features.advancedReporting}
                          onChange={() => handleToggleFeature('advancedReporting')}
                          className="w-4 h-4"
                        />
                        <div>
                          <p className="font-medium text-foreground">Advanced Reporting</p>
                          <p className="text-xs text-muted-foreground">Custom reports & exports</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50">
                        <input
                          type="checkbox"
                          checked={selectedTenant.features.apiAccess}
                          onChange={() => handleToggleFeature('apiAccess')}
                          className="w-4 h-4"
                        />
                        <div>
                          <p className="font-medium text-foreground">API Access</p>
                          <p className="text-xs text-muted-foreground">REST API for integrations</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </Card>

                {/* Support Level */}
                <Card className="p-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground">Support Level</h3>
                    <select
                      value={selectedTenant.features.supportLevel}
                      onChange={(e) => handleToggleFeature('supportLevel' as any)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    >
                      <option value="community">Community (Email)</option>
                      <option value="priority">Priority (24h response)</option>
                      <option value="dedicated">Dedicated (1h response)</option>
                    </select>
                  </div>
                </Card>
              </>
            ) : (
              <>
                {/* Edit Form */}
                <Card className="p-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Edit Tenant</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground block mb-2">
                          Tenant Name
                        </label>
                        <input
                          type="text"
                          value={editData.name || ''}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground block mb-2">
                          Domain
                        </label>
                        <input
                          type="text"
                          value={editData.domain || ''}
                          onChange={(e) => setEditData({ ...editData, domain: e.target.value })}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground block mb-2">
                          Plan
                        </label>
                        <select
                          value={editData.plan || 'starter'}
                          onChange={(e) => setEditData({ ...editData, plan: e.target.value as any })}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        >
                          <option value="starter">Starter</option>
                          <option value="professional">Professional</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground block mb-2">
                          Status
                        </label>
                        <select
                          value={editData.status || 'active'}
                          onChange={(e) => setEditData({ ...editData, status: e.target.value as any })}
                          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        >
                          <option value="active">Active</option>
                          <option value="trial">Trial</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveEdit} className="gap-2">
                        <Save className="h-4 w-4" />
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false)
                          setEditData({})
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
