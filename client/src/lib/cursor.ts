import { useCallback, useEffect, useRef, useState } from 'react'

export const PAGINATION_CAP = 20

export type CursorArgs = {
  firstItem?: string
  lastItem?: string
  page: number
}

export type UseCursorPaginateResult<T> = {
  items: T[]
  loadMore: () => void
  reload: () => void
  hasMore: boolean
  loading: boolean
  error: Error | null
}

type ItemWithId = { id?: string | number }

export function useCursorPaginate<T extends ItemWithId>(
  loader: (cursor: CursorArgs) => Promise<T[]>,
  resetKey: string = '',
): UseCursorPaginateResult<T> {
  const [items, setItems] = useState<T[]>([])
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const inflight = useRef<boolean>(false)
  const lastKey = useRef<string>(resetKey)

  const fetchPage = useCallback(
    async (nextPage: number, prev: T[]) => {
      if (inflight.current) return
      if (nextPage > PAGINATION_CAP) {
        setHasMore(false)
        return
      }
      inflight.current = true
      setLoading(true)
      setError(null)
      try {
        const firstItem = prev.length ? String(prev[0].id ?? '') : ''
        const lastItem = prev.length ? String(prev[prev.length - 1].id ?? '') : ''
        const res = await loader({ firstItem, lastItem, page: nextPage })
        const arr = Array.isArray(res) ? res : []
        if (arr.length === 0) {
          setHasMore(false)
        } else {
          setItems((cur) => (nextPage === 1 ? arr : [...cur, ...arr]))
          setPage(nextPage)
          if (nextPage >= PAGINATION_CAP) setHasMore(false)
        }
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)))
      } finally {
        setLoading(false)
        inflight.current = false
      }
    },
    [loader],
  )

  useEffect(() => {
    if (lastKey.current !== resetKey) {
      lastKey.current = resetKey
      setItems([])
      setPage(1)
      setHasMore(true)
      setError(null)
    }
    if (items.length === 0 && hasMore && !inflight.current) {
      fetchPage(1, [])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return
    fetchPage(page + 1, items)
  }, [fetchPage, hasMore, items, loading, page])

  const reload = useCallback(() => {
    setItems([])
    setPage(1)
    setHasMore(true)
    setError(null)
    fetchPage(1, [])
  }, [fetchPage])

  return { items, loadMore, reload, hasMore, loading, error }
}
