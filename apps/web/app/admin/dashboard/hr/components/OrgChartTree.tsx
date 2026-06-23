'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAsyncData } from '@/hooks/useAsyncData'
import { ErrorBoundary } from '@/components/error-boundary'
import { SkeletonShimmer } from '@/components/skeleton-shimmer'
import { EmptyState } from '@/components/empty-state'
import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { fetchFromProductionEngine } from '@/services/apiClient'

interface OrgNode {
  id: string
  name: string
  title: string
  children?: OrgNode[]
}

async function fetchOrgChart(): Promise<OrgNode> {
  try {
    return await fetchFromProductionEngine<OrgNode>('hr/org-chart')
  } catch (error) {
    throw new Error('Failed to load org chart')
  }
}

interface OrgNodeComponentProps {
  node: OrgNode
  level: number
  expandedNodes: Set<string>
  onToggle: (id: string) => void
}

function OrgNodeComponent({
  node,
  level,
  expandedNodes,
  onToggle,
}: OrgNodeComponentProps) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expandedNodes.has(node.id)

  return (
    <div style={{ marginLeft: `${level * 2}rem` }}>
      <div className="flex items-center gap-2 mb-2">
        {hasChildren && (
          <button
            onClick={() => onToggle(node.id)}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-6" />}

        <div className="flex-1 bg-muted/50 border border-border rounded-lg p-3 hover:bg-muted transition-colors">
          <p className="font-semibold text-foreground">{node.name}</p>
          <p className="text-xs text-muted-foreground">{node.title}</p>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children?.map((child) => (
            <OrgNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function OrgChartTree() {
  const { data, loading, error } = useAsyncData(fetchOrgChart)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['1', '2', '3']))

  const handleToggle = (id: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedNodes(newExpanded)
  }

  if (error) {
    return <ErrorBoundary error={error} />
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Organization Chart</CardTitle>
        <CardDescription>Company hierarchy and reporting structure</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <SkeletonShimmer rows={5} height="h-16" className="w-full" />
          </div>
        ) : !data ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto pb-4">
            <OrgNodeComponent
              node={data}
              level={0}
              expandedNodes={expandedNodes}
              onToggle={handleToggle}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
