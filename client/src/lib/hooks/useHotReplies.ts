import { useCallback } from 'react'
import { api } from '@/lib/api'
import { useFetch } from '@/lib/useFetch'
import type { EnvelopeResponse, Reply } from '@/lib/types'

export function useHotReplies(id: string | undefined) {
  const fetcher = useCallback(async () => {
    if (!id) return [] as Reply[]
    const res = await api<EnvelopeResponse<Reply[]>>(
      `/v6/feed/hotReplyList?id=${encodeURIComponent(id)}`,
    )
    return Array.isArray(res?.data) ? res.data : []
  }, [id])
  return useFetch<Reply[]>(id ? `hot:${id}` : null, fetcher, [id])
}
