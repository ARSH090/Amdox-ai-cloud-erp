'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, Eye, Copy, Code } from 'lucide-react'

interface LandingPageSection {
  id: string
  type: 'hero' | 'features' | 'pricing' | 'testimonials' | 'faq' | 'cta'
  title: string
  content: string
  order: number
}

interface LandingPage {
  id: string
  name: string
  url: string
  status: 'published' | 'draft' | 'archived'
  createdAt: string
  sections: LandingPageSection[]
}

const mockLandingPages: LandingPage[] = [
  {
    id: 'lp-1',
    name: 'Product Launch',
    url: 'product-launch',
    status: 'published',
    createdAt: '2024-05-20',
    sections: [
      { id: 's1', type: 'hero', title: 'Hero Section', content: 'Welcome to AMDOX', order: 1 },
      { id: 's2', type: 'features', title: 'Features', content: 'Key capabilities', order: 2 },
      { id: 's3', type: 'cta', title: 'Call to Action', content: 'Start your trial', order: 3 },
    ]
  },
  {
    id: 'lp-2',
    name: 'Enterprise Solutions',
    url: 'enterprise',
    status: 'draft',
    createdAt: '2024-05-22',
    sections: [
      { id: 's4', type: 'hero', title: 'Enterprise Hero', content: 'For large organizations', order: 1 },
    ]
  },
]

const sectionTypes = [
  { type: 'hero', label: 'Hero Section', icon: '🎯' },
  { type: 'features', label: 'Features', icon: '⚡' },
  { type: 'pricing', label: 'Pricing', icon: '💰' },
  { type: 'testimonials', label: 'Testimonials', icon: '⭐' },
  { type: 'faq', label: 'FAQ', icon: '❓' },
  { type: 'cta', label: 'CTA', icon: '🚀' },
]

export function LandingPageBuilder() {
  const [pages, setPages] = useState<LandingPage[]>(mockLandingPages)
  const [selectedPage, setSelectedPage] = useState<LandingPage | null>(mockLandingPages[0])
  const [editingSection, setEditingSection] = useState<LandingPageSection | null>(null)
  const [showSectionPicker, setShowSectionPicker] = useState(false)
  const [preview, setPreview] = useState(false)

  const handleAddSection = (type: LandingPageSection['type']) => {
    if (!selectedPage) return

    const section: LandingPageSection = {
      id: `section-${Date.now()}`,
      type,
      title: `${type} Section`,
      content: '',
      order: selectedPage.sections.length + 1,
    }

    const updated = {
      ...selectedPage,
      sections: [...selectedPage.sections, section],
    }
    setSelectedPage(updated)
    const pageIndex = pages.findIndex(p => p.id === selectedPage.id)
    setPages([...pages.slice(0, pageIndex), updated, ...pages.slice(pageIndex + 1)])
    setShowSectionPicker(false)
  }

  const handleDeleteSection = (sectionId: string) => {
    if (!selectedPage) return
    const updated = {
      ...selectedPage,
      sections: selectedPage.sections.filter(s => s.id !== sectionId),
    }
    setSelectedPage(updated)
    const pageIndex = pages.findIndex(p => p.id === selectedPage.id)
    setPages([...pages.slice(0, pageIndex), updated, ...pages.slice(pageIndex + 1)])
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Landing Page Builder</h1>
          <p className="text-muted-foreground mt-1">Create dynamic landing pages without code</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Landing Page
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Pages List */}
        <div className="space-y-3">
          <h2 className="font-semibold text-foreground">Pages</h2>
          {pages.map((page) => (
            <Card
              key={page.id}
              className={`p-4 cursor-pointer transition-colors ${
                selectedPage?.id === page.id
                  ? 'bg-primary/10 border-primary'
                  : 'hover:bg-muted'
              }`}
              onClick={() => setSelectedPage(page)}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground text-sm">{page.name}</h3>
                  <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>
                    {page.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">/{page.url}</p>
                <p className="text-xs text-muted-foreground">{page.sections.length} sections</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Builder */}
        {selectedPage && (
          <div className="lg:col-span-3 space-y-6">
            {/* Header */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{selectedPage.name}</h2>
                    <p className="text-sm text-muted-foreground mt-1">/{selectedPage.url}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => setPreview(!preview)}
                    >
                      <Eye className="h-4 w-4" />
                      {preview ? 'Edit' : 'Preview'}
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {!preview ? (
              <>
                {/* Sections */}
                <Card className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">Sections</h3>
                      {!showSectionPicker && (
                        <Button
                          size="sm"
                          onClick={() => setShowSectionPicker(true)}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Section
                        </Button>
                      )}
                    </div>

                    {showSectionPicker && (
                      <div className="grid grid-cols-3 gap-2 p-4 bg-muted/30 rounded-lg">
                        {sectionTypes.map(({ type, label, icon }) => (
                          <Button
                            key={type}
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddSection(type as any)}
                            className="flex flex-col items-center gap-1 h-auto py-3"
                          >
                            <span>{icon}</span>
                            <span className="text-xs">{label}</span>
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* Section List */}
                    <div className="space-y-3">
                      {selectedPage.sections.map((section) => (
                        <div
                          key={section.id}
                          className="p-4 border border-border rounded-lg bg-muted/30"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">
                                  {sectionTypes.find(s => s.type === section.type)?.icon}
                                </span>
                                <input
                                  type="text"
                                  value={section.title}
                                  onChange={(e) => {
                                    // Update logic here
                                  }}
                                  className="font-medium bg-transparent text-foreground border-0 outline-0"
                                />
                              </div>
                              <textarea
                                value={section.content}
                                onChange={(e) => {
                                  // Update logic here
                                }}
                                placeholder="Add content..."
                                className="w-full mt-2 p-2 text-sm bg-muted text-foreground rounded border-0 outline-0"
                                rows={2}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteSection(section.id)}
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
              <Card className="p-6 space-y-8">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-foreground">Landing Page Preview</h1>
                  <p className="text-muted-foreground mt-2">See how your page will look</p>
                </div>
                {selectedPage.sections.map((section) => (
                  <div key={section.id} className="border-b border-border pb-8 last:border-0">
                    <h2 className="text-2xl font-bold text-foreground">{section.title}</h2>
                    <p className="text-muted-foreground mt-2">{section.content}</p>
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
