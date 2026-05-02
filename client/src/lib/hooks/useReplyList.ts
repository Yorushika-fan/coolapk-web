import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import { PAGINATION_CAP } from '@/lib/cursor'
import type { EnvelopeResponse, Reply } from '@/lib/types'

export type UseReplyListResult = {
  items: Reply[]
  loading: boolean
  error: Error | null
  hasMore: boolean
  loadMore: () => void
  reload: () => void
}

export function useReplyList(
  id: string | undefined,
  listType: string = 'lastupdate_desc',
): UseReplyListResult {
  const [items, setItems] = useState<Reply[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const inflight = useRef(false)

  const fetchPage = useCallback(
    async (n: number, accumulate: boolean) => {
      if (!id) return
      if (inflight.current) return
      if (n > PAGINATION_CAP) {
        setHasMore(false)
        return
      }
      inflight.current = true
      setLoading(true)
      setError(null)
      try {
        const qs = new URLSearchParams({
          id,
          listType,
          page: String(n),
        }).toString()
        const res = await api<EnvelopeResponse<Reply[]>>(
          `/v6/feed/replyList?${qs}`,
        )
        const arr = Array.isArray(res?.data) ? res.data : []
        if (arr.length === 0) {
          setHasMore(false)
          if (!accumulate) setItems([])
        } else {
          setItems((cur) => (accumulate ? [...cur, ...arr] : arr))
          setPage(n)
          if (n >= PAGINATION_CAP) setHasMore(false)
        }
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)))
      } finally {
        setLoading(false)
        inflight.current = false
      }
    },
    [id, listType],
  )

  useEffect(() => {
    setItems([])
    setPage(1)
    setHasMore(true)
    setError(null)
    if (id) fetchPage(1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, listType])

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return
    fetchPage(page + 1, true)
  }, [fetchPage, hasMore, loading, page])

  const reload = useCallback(() => {
    setItems([])
    setPage(1)
    setHasMore(true)
    fetchPage(1, false)
  }, [fetchPage])

  return { items, loading, error, hasMore, loadMore, reload }
}
