import { useCallback, useEffect, useRef, useState } from 'react'
import { PAGINATION_CAP, type CursorArgs } from '@/lib/cursor'
import { useListCacheStore } from '@/stores/listCache'

// Drop-in replacement for `useCursorPaginate` that keeps state in the
// global list cache. Same return shape (items / loadMore / reload /
// hasMore / loading / error) so call-sites stay almost identical; the
// cache key controls bucketing.

type ItemWithId = { id?: string | number }

type Result<T> = {
  items: T[]
  loadMore: () => void
  reload: () => void
  hasMore: boolean
  loading: boolean
  error: Error | null
}

export function useCachedList<T extends ItemWithId>(
  cacheKey: string,
  loader: (cursor: CursorArgs) => Promise<T[]>,
): Result<T> {
  const entry = useListCacheStore((s) => s.entries[cacheKey])
  const items = (entry?.items as T[] | undefined) ?? []
  const page = entry?.page ?? 0
  const hasMore = entry?.hasMore ?? true
  const loaded = entry?.loaded ?? false
  const setSnapshot = useListCacheStore((s) => s.setSnapshot)
  const appendItems = useListCacheStore((s) => s.appendItems)
  const reset = useListCacheStore((s) => s.reset)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const inflight = useRef(false)

  const fetchPage = useCallback(
    async (nextPage: number, prev: T[]) => {
      if (inflight.current) return
      if (nextPage > PAGINATION_CAP) {
        setSnapshot(cacheKey, { hasMore: false })
        return
      }
      inflight.current = true
      setLoading(true)
      setError(null)
      try {
        const firstItem = prev.length ? String(prev[0].id ?? '') : ''
        const lastItem = prev.length
          ? String(prev[prev.length - 1].id ?? '')
          : ''
        const res = await loader({ firstItem, lastItem, page: nextPage })
        const arr = Array.isArray(res) ? res : []
        if (arr.length === 0) {
          setSnapshot(cacheKey, { hasMore: false, loaded: true })
        } else if (nextPage === 1) {
          setSnapshot(cacheKey, {
            items: arr,
            page: nextPage,
            hasMore: nextPage < PAGINATION_CAP,
            loaded: true,
          })
        } else {
          appendItems(cacheKey, arr)
          setSnapshot(cacheKey, {
            page: nextPage,
            hasMore: nextPage < PAGINATION_CAP,
          })
        }
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)))
      } finally {
        setLoading(false)
        inflight.current = false
      }
    },
    [cacheKey, loader, setSnapshot, appendItems],
  )

  // Cold-start fetch only when the cache for this key is empty. Subsequent
  // mounts (return-from-detail) reuse the stored items.
  useEffect(() => {
    if (!loaded && !inflight.current && hasMore) {
      fetchPage(1, [])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey])

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return
    fetchPage(page + 1, items)
  }, [fetchPage, hasMore, items, loading, page])

  const reload = useCallback(() => {
    reset(cacheKey)
    fetchPage(1, [])
  }, [cacheKey, fetchPage, reset])

  return { items, loadMore, reload, hasMore, loading, error }
}
