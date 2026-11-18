import { useCallback, useEffect, useState } from 'react'

interface DataState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useData<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<DataState<T>>({ data: null, loading: true, error: null })
  const [version, setVersion] = useState(0)

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    fetcher()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message })
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, ...deps])

  return { ...state, reload }
}
