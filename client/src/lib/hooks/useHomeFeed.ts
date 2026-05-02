import { useCallback } from 'react'
import { api } from '@/lib/api'
import { useCachedList } from '@/lib/useCachedList'
import type { CursorArgs } from '@/lib/cursor'
import type { EnvelopeResponse, FeedItem } from '@/lib/types'

// Same mixed feed/card shape as channel pages — Home is a channel-like
// surface backed by /v6/main/indexV8.
type HomeEntity = FeedItem & {
  entityType?: string
  entityTemplate?: string
  entityId?: string | number
  title?: string
  entities?: unknown[]
}

export function useHomeFeed() {
  const loader = useCallback(async (cursor: CursorArgs) => {
    const qs = new URLSearchParams({
      page: String(cursor.page),
      firstItem: cursor.firstItem ?? '',
      lastItem: cursor.lastItem ?? '',
    }).toString()
    const res = await api<EnvelopeResponse<HomeEntity[]>>(
      `/v6/main/indexV8?${qs}`,
    )
    return Array.isArray(res?.data) ? res.data : []
  }, [])
  return useCachedList<HomeEntity>('home', loader)
}
