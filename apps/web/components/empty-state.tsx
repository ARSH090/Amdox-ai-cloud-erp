interface EmptyStateProps {
  message?: string
}

export function EmptyState({
  message = 'COLLECTION PARTITION EMPTY: Awaiting Live Datastore Aggregation',
}: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center h-[200px] text-center">
      <div className="text-muted-foreground font-mono text-sm">
        [ {message} ]
      </div>
    </div>
  )
}
