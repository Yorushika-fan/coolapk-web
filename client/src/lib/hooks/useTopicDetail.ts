import { useCallback } from 'react'
import { api } from '@/lib/api'
import { useFetch } from '@/lib/useFetch'
import type { EnvelopeResponse, TopicDetail } from '@/lib/types'

export function useTopicDetail(tag: string | undefined) {
  const fetcher = useCallback(async () => {
    if (!tag) throw new Error('Missing tag')
    const res = await api<EnvelopeResponse<TopicDetail>>(
      `/v6/topic/newTagDetail?tag=${encodeURIComponent(tag)}`,
    )
    return res.data
  }, [tag])
  return useFetch<TopicDetail>(tag ?? null, fetcher, [tag])
}
