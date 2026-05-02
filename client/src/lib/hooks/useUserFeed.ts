import { useCallback } from 'react'
import { api } from '@/lib/api'
import { useCachedList } from '@/lib/useCachedList'
import type { CursorArgs } from '@/lib/cursor'
import type { EnvelopeResponse, FeedItem } from '@/lib/types'

export function useUserFeed(uid: string | undefined) {
  const loader = useCallback(
    async (cursor: CursorArgs) => {
      if (!uid) return [] as FeedItem[]
      const qs = new URLSearchParams({
        uid,
        firstItem: cursor.firstItem ?? '',
        lastItem: cursor.lastItem ?? '',
      }).toString()
      const res = await api<EnvelopeResponse<FeedItem[]>>(
        `/v6/user/feedList?${qs}`,
      )
      return Array.isArray(res?.data) ? res.data : []
    },
    [uid],
  )
  return useCachedList<FeedItem>(`userFeed:${uid ?? ''}`, loader)
}
