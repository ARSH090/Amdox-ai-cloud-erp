'use client'

import { useState, useEffect } from 'react'

interface AsyncDataState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

export function useAsyncData<T>(
  fetchFn: () => Promise<T>,
  deps: unknown[] = []
): AsyncDataState<T> {
  const [state, setState] = useState<AsyncDataState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        const result = await fetchFn()
        if (isMounted) {
          setState({ data: result, loading: false, error: null })
        }
      } catch (err) {
        if (isMounted) {
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err : new Error('Unknown error'),
          })
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, deps)

  return state
}
