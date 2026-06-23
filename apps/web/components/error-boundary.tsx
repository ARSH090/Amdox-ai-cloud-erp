import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface ErrorBoundaryProps {
  error: Error | null
  onRetry?: () => void
}

export function ErrorBoundary({ error, onRetry }: ErrorBoundaryProps) {
  if (!error) return null

  return (
    <Alert variant="destructive" className="flex items-start gap-3">
      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <AlertDescription>
          {error.message || 'An error occurred while loading data.'}
        </AlertDescription>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-sm underline hover:no-underline text-primary"
          >
            Retry
          </button>
        )}
      </div>
    </Alert>
  )
}
