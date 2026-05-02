import { useCallback } from 'react'
import { api } from '@/lib/api'
import { useCachedList } from '@/lib/useCachedList'
import type { CursorArgs } from '@/lib/cursor'
import type { EnvelopeResponse, FeedItem } from '@/lib/types'

export function useTopicFeed(tag: string | undefined) {
  const loader = useCallback(
    async (cursor: CursorArgs) => {
      if (!tag) return [] as FeedItem[]
      const params = new URLSearchParams({
        tag,
        listType: 'lastupdate_desc',
        page: String(cursor.page),
      })
      if (cursor.firstItem) params.set('firstItem', cursor.firstItem)
      if (cursor.lastItem) params.set('lastItem', cursor.lastItem)
      const res = await api<EnvelopeResponse<FeedItem[]>>(
        `/v6/topic/tagFeedList?${params.toString()}`,
      )
      return res.data ?? []
    },
    [tag],
  )
  return useCachedList<FeedItem>(`topic:${tag ?? ''}`, loader)
}
