'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, Save, X, Eye, EyeOff } from 'lucide-react'

interface AuthProvider {
  id: string
  name: string
  type: 'email' | 'oauth' | 'saml' | 'ldap' | 'magic-link'
  enabled: boolean
  priority: number
  config: Record<string, string>
  mfaRequired: boolean
  lastUpdated: string
}

const mockProviders: AuthProvider[] = [
  {
    id: 'auth-1',
    name: 'Email & Password',
    type: 'email',
    enabled: true,
    priority: 1,
    mfaRequired: false,
    lastUpdated: '2024-05-28',
    config: {
      min_password_length: '8',
      require_uppercase: 'true',
      require_numbers: 'true',
    }
  },
  {
    id: 'auth-2',
    name: 'Google OAuth',
    type: 'oauth',
    enabled: true,
    priority: 2,
    mfaRequired: false,
    lastUpdated: '2024-05-27',
    config: {
      client_id: 'XXXXXXXXXXXXXXXX',
      client_secret: 'XXXXXXXXXXXXXXXX',
      redirect_uri: 'https://app.amdox.io/auth/callback',
    }
  },
  {
    id: 'auth-3',
    name: 'Microsoft OAuth',
    type: 'oauth',
    enabled: false,
    priority: 3,
    mfaRequired: false,
    lastUpdated: '2024-05-20',
    config: {
      client_id: '',
      client_secret: '',
      redirect_uri: 'https://app.amdox.io/auth/callback',
    }
  },
  {
    id: 'auth-4',
    name: 'SAML (Enterprise)',
    type: 'saml',
    enabled: true,
    priority: 4,
    mfaRequired: true,
    lastUpdated: '2024-05-15',
    config: {
      entity_id: 'https://app.amdox.io',
      metadata_url: 'https://idp.example.com/metadata',
      sso_url: 'https://idp.example.com/sso',
    }
  },
]

export function AuthConfigurator() {
  const [providers, setProviders] = useState<AuthProvider[]>(mockProviders)
  const [selectedProvider, setSelectedProvider] = useState<AuthProvider | null>(mockProviders[0])
  const [editingConfig, setEditingConfig] = useState<Record<string, string>>({})
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const [isEditing, setIsEditing] = useState(false)

  const handleToggleProvider = (id: string) => {
    const updated = providers.map(p =>
      p.id === id ? { ...p, enabled: !p.enabled } : p
    )
    setProviders(updated)
    if (selectedProvider?.id === id) {
      setSelectedProvider({ ...selectedProvider, enabled: !selectedProvider.enabled })
    }
  }

  const handleSaveConfig = () => {
    if (!selectedProvider) return
    const updated = {
      ...selectedProvider,
      config: editingConfig,
      lastUpdated: new Date().toISOString().split('T')[0],
    }
    setSelectedProvider(updated)
    setProviders(providers.map(p => p.id === updated.id ? updated : p))
    setIsEditing(false)
  }

  const getProviderIcon = (type: AuthProvider['type']) => {
    const icons: Record<AuthProvider['type'], string> = {
      'email': '📧',
      'oauth': '🔗',
      'saml': '🏢',
      'ldap': '💼',
      'magic-link': '✨',
    }
    return icons[type]
  }

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Authentication Configuration</h1>
          <p className="text-muted-foreground mt-1">Manage auth providers and MFA settings</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Provider
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Provider List */}
        <div className="space-y-3">
          <h2 className="font-semibold text-foreground">Providers</h2>
          {providers.map((provider) => (
            <Card
              key={provider.id}
              className={`p-4 cursor-pointer transition-colors ${
                selectedProvider?.id === provider.id
                  ? 'bg-primary/10 border-primary'
                  : 'hover:bg-muted'
              }`}
              onClick={() => setSelectedProvider(provider)}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getProviderIcon(provider.type)}</span>
                    <div>
                      <h3 className="font-medium text-foreground text-sm">{provider.name}</h3>
                      <p className="text-xs text-muted-foreground capitalize">{provider.type}</p>
                    </div>
                  </div>
                  <Badge variant={provider.enabled ? 'default' : 'secondary'}>
                    {provider.enabled ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Provider Config */}
        {selectedProvider && (
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{getProviderIcon(selectedProvider.type)}</span>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">{selectedProvider.name}</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Type: {selectedProvider.type.toUpperCase()} • Priority: {selectedProvider.priority}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedProvider.enabled}
                      onChange={() => handleToggleProvider(selectedProvider.id)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-foreground">
                      Enable this provider
                    </span>
                  </label>
                  {selectedProvider.mfaRequired && (
                    <Badge variant="default" className="gap-1">
                      🔐 MFA Required
                    </Badge>
                  )}
                </div>
              </div>
            </Card>

            {/* Configuration */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Configuration</h3>
                  {!isEditing ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingConfig(selectedProvider.config)
                        setIsEditing(true)
                      }}
                      className="gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleSaveConfig}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    {Object.entries(editingConfig).map(([key, value]) => (
                      <div key={key}>
                        <label className="text-sm font-medium text-foreground block mb-2">
                          {key.replace(/_/g, ' ').toUpperCase()}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type={showSecrets[key] ? 'text' : key.includes('secret') ? 'password' : 'text'}
                            value={value}
                            onChange={(e) => setEditingConfig({
                              ...editingConfig,
                              [key]: e.target.value
                            })}
                            className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                          />
                          {key.includes('secret') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleSecretVisibility(key)}
                            >
                              {showSecrets[key] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(selectedProvider.config).map(([key, value]) => (
                      <div key={key} className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground uppercase">
                          {key.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-foreground font-mono mt-1">
                          {key.includes('secret') ? '••••••••••••••••' : value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* MFA Settings */}
            <Card className="p-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Security</h3>
                <label className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50">
                  <input
                    type="checkbox"
                    checked={selectedProvider.mfaRequired}
                    onChange={(e) => setSelectedProvider({
                      ...selectedProvider,
                      mfaRequired: e.target.checked
                    })}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium text-foreground">Require Multi-Factor Authentication</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Users must verify with 2FA before accessing the system
                    </p>
                  </div>
                </label>
              </div>
            </Card>

            {/* Last Updated */}
            <div className="text-xs text-muted-foreground">
              Last modified: {selectedProvider.lastUpdated}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
