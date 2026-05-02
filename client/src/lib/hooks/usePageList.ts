import { useCallback } from 'react'
import { api } from '@/lib/api'
import { useCachedList } from '@/lib/useCachedList'
import type { CursorArgs } from '@/lib/cursor'
import type { EnvelopeResponse, FeedItem } from '@/lib/types'

// Coolapk channel page list. The upstream `url` parameter is the
// verbatim app route (`/page?url=<slug>`) which we reconstruct from
// the SPA-friendly slug we route on. Mixed feed/card payload, same
// shape as main/indexV8.

type PageEntity = FeedItem & {
  entityType?: string
  entityTemplate?: string
  entityId?: string | number
  title?: string
  entities?: unknown[]
}

export function usePageList(slug: string | undefined, title: string) {
  const loader = useCallback(
    async (cursor: CursorArgs) => {
      if (!slug) return [] as PageEntity[]
      const params = new URLSearchParams({
        page: String(cursor.page),
        title,
        url: `/page?url=${slug}`,
        firstItem: cursor.firstItem ?? '',
        lastItem: cursor.lastItem ?? '',
      })
      const res = await api<EnvelopeResponse<PageEntity[]>>(
        `/v6/page/dataList?${params.toString()}`,
      )
      return Array.isArray(res?.data) ? res.data : []
    },
    [slug, title],
  )
  return useCachedList<PageEntity>(`page:${slug ?? ''}`, loader)
}
