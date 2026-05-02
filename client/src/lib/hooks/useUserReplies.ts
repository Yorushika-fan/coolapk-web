import { useCallback } from 'react'
import { api } from '@/lib/api'
import { useCachedList } from '@/lib/useCachedList'
import type { CursorArgs } from '@/lib/cursor'
import type { EnvelopeResponse, Reply } from '@/lib/types'

// Coolapk's user/replyList is page-only paginated (no cursor params),
// so we ignore firstItem/lastItem and feed only `page` upstream.
export function useUserReplies(uid: string | undefined) {
  const loader = useCallback(
    async (cursor: CursorArgs) => {
      if (!uid) return [] as Reply[]
      const qs = new URLSearchParams({
        uid,
        page: String(cursor.page),
      }).toString()
      const res = await api<EnvelopeResponse<Reply[]>>(
        `/v6/user/replyList?${qs}`,
      )
      return Array.isArray(res?.data) ? res.data : []
    },
    [uid],
  )
  return useCachedList<Reply>(`userReplies:${uid ?? ''}`, loader)
}
