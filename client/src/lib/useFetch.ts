import { useCallback, useEffect, useRef, useState } from 'react'

export type UseFetchResult<T> = {
  data: T | null
  error: Error | null
  loading: boolean
  reload: () => void
}

export function useFetch<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [tick, setTick] = useState(0)
  const inflightKey = useRef<string | null>(null)

  const reload = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    if (key === null) {
      setData(null)
      setError(null)
      setLoading(false)
      return
    }
    let cancelled = false
    inflightKey.current = key
    setLoading(true)
    setError(null)
    fetcher()
      .then((res) => {
        if (cancelled || inflightKey.current !== key) return
        setData(res)
        setError(null)
      })
      .catch((err) => {
        if (cancelled || inflightKey.current !== key) return
        setError(err instanceof Error ? err : new Error(String(err)))
      })
      .finally(() => {
        if (cancelled || inflightKey.current !== key) return
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick, ...deps])

  return { data, error, loading, reload }
}
