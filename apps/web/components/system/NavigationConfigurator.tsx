'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, Save, X, ChevronDown, Eye } from 'lucide-react'

interface NavItem {
  id: string
  label: string
  href: string
  icon?: string
  order: number
  visible: boolean
  children?: NavItem[]
}

interface NavMenu {
  id: string
  name: string
  location: 'primary' | 'secondary' | 'footer' | 'mobile'
  items: NavItem[]
  lastUpdated: string
}

const mockMenus: NavMenu[] = [
  {
    id: 'menu-1',
    name: 'Main Navigation',
    location: 'primary',
    lastUpdated: '2024-05-28',
    items: [
      {
        id: 'nav-1',
        label: 'Dashboard',
        href: '/dashboard',
        icon: '📊',
        order: 1,
        visible: true,
        children: []
      },
      {
        id: 'nav-2',
        label: 'Products',
        href: '/products',
        icon: '📦',
        order: 2,
        visible: true,
        children: [
          { id: 'nav-2a', label: 'Finance', href: '/products/finance', order: 1, visible: true },
          { id: 'nav-2b', label: 'HR', href: '/products/hr', order: 2, visible: true },
        ]
      },
      {
        id: 'nav-3',
        label: 'Docs',
        href: '/docs',
        icon: '📖',
        order: 3,
        visible: true,
        children: []
      },
    ]
  },
  {
    id: 'menu-2',
    name: 'Footer Menu',
    location: 'footer',
    lastUpdated: '2024-05-27',
    items: [
      { id: 'nav-4', label: 'Privacy', href: '/privacy', order: 1, visible: true },
      { id: 'nav-5', label: 'Terms', href: '/terms', order: 2, visible: true },
      { id: 'nav-6', label: 'Contact', href: '/contact', order: 3, visible: true },
    ]
  },
]

export function NavigationConfigurator() {
  const [menus, setMenus] = useState<NavMenu[]>(mockMenus)
  const [selectedMenu, setSelectedMenu] = useState<NavMenu | null>(mockMenus[0])
  const [isEditing, setIsEditing] = useState(false)
  const [editingItem, setEditingItem] = useState<NavItem | null>(null)
  const [newItem, setNewItem] = useState<Partial<NavItem>>({})
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const handleAddItem = () => {
    if (!selectedMenu || !newItem.label || !newItem.href) return

    const item: NavItem = {
      id: `nav-${Date.now()}`,
      label: newItem.label,
      href: newItem.href,
      icon: newItem.icon || '🔗',
      order: selectedMenu.items.length + 1,
      visible: true,
      children: [],
    }

    const updated = {
      ...selectedMenu,
      items: [...selectedMenu.items, item],
    }
    setSelectedMenu(updated)
    const menuIndex = menus.findIndex(m => m.id === selectedMenu.id)
    setMenus([...menus.slice(0, menuIndex), updated, ...menus.slice(menuIndex + 1)])
    setNewItem({})
  }

  const handleDeleteItem = (itemId: string) => {
    if (!selectedMenu) return
    const updated = {
      ...selectedMenu,
      items: selectedMenu.items.filter(i => i.id !== itemId),
    }
    setSelectedMenu(updated)
    const menuIndex = menus.findIndex(m => m.id === selectedMenu.id)
    setMenus([...menus.slice(0, menuIndex), updated, ...menus.slice(menuIndex + 1)])
  }

  const handleToggleVisibility = (itemId: string) => {
    if (!selectedMenu) return
    const updated = {
      ...selectedMenu,
      items: selectedMenu.items.map(i =>
        i.id === itemId ? { ...i, visible: !i.visible } : i
      ),
    }
    setSelectedMenu(updated)
    const menuIndex = menus.findIndex(m => m.id === selectedMenu.id)
    setMenus([...menus.slice(0, menuIndex), updated, ...menus.slice(menuIndex + 1)])
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Navigation Configuration</h1>
          <p className="text-muted-foreground mt-1">Manage menus and navigation items</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Menu
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu List */}
        <div className="space-y-3">
          <h2 className="font-semibold text-foreground">Menus</h2>
          {menus.map((menu) => (
            <Card
              key={menu.id}
              className={`p-4 cursor-pointer transition-colors ${
                selectedMenu?.id === menu.id
                  ? 'bg-primary/10 border-primary'
                  : 'hover:bg-muted'
              }`}
              onClick={() => setSelectedMenu(menu)}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground">{menu.name}</h3>
                </div>
                <Badge variant="secondary">{menu.location}</Badge>
                <p className="text-xs text-muted-foreground">{menu.items.length} items</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Menu Editor */}
        {selectedMenu && (
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{selectedMenu.name}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Location: {selectedMenu.location} • {selectedMenu.items.length} items
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </Button>
                </div>
              </div>
            </Card>

            {/* Items */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Items</h3>
                  {!isEditing && (
                    <Button
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Item
                    </Button>
                  )}
                </div>

                {/* Add New Item Form */}
                {isEditing && (
                  <div className="p-4 border border-border rounded-lg bg-muted/30 space-y-3">
                    <h4 className="font-medium text-foreground">New Navigation Item</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Label"
                        value={newItem.label || ''}
                        onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                        className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                      />
                      <input
                        type="text"
                        placeholder="URL path"
                        value={newItem.href || ''}
                        onChange={(e) => setNewItem({ ...newItem, href: e.target.value })}
                        className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Icon (emoji)"
                      value={newItem.icon || ''}
                      onChange={(e) => setNewItem({ ...newItem, icon: e.target.value })}
                      maxLength={2}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddItem} className="gap-2">
                        <Save className="h-4 w-4" />
                        Save Item
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false)
                          setNewItem({})
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Item List */}
                <div className="space-y-2">
                  {selectedMenu.items.map((item) => (
                    <div key={item.id} className="space-y-2">
                      <div className="p-3 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <span className="text-lg">{item.icon}</span>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{item.label}</p>
                              <p className="text-xs text-muted-foreground">{item.href}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={item.visible}
                                onChange={() => handleToggleVisibility(item.id)}
                                className="w-4 h-4"
                              />
                              <span className="text-xs text-muted-foreground">Visible</span>
                            </label>
                            <Button size="sm" variant="ghost">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            {item.children && item.children.length > 0 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const newExpanded = new Set(expandedItems)
                                  if (newExpanded.has(item.id)) {
                                    newExpanded.delete(item.id)
                                  } else {
                                    newExpanded.add(item.id)
                                  }
                                  setExpandedItems(newExpanded)
                                }}
                              >
                                <ChevronDown className={`h-4 w-4 transition-transform ${
                                  expandedItems.has(item.id) ? 'rotate-180' : ''
                                }`} />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Submenu Items */}
                        {item.children && item.children.length > 0 && expandedItems.has(item.id) && (
                          <div className="mt-3 ml-8 space-y-2 border-l border-border pl-3">
                            {item.children.map((child) => (
                              <div key={child.id} className="p-2 bg-background rounded text-sm">
                                <p className="font-medium text-foreground">{child.label}</p>
                                <p className="text-xs text-muted-foreground">{child.href}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
