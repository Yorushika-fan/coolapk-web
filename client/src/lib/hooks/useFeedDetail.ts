import { useCallback } from 'react'
import { apiPostForm } from '@/lib/api'
import { useFetch } from '@/lib/useFetch'
import type { EnvelopeResponse, FeedItem } from '@/lib/types'

export function useFeedDetail(id: string | undefined) {
  const fetcher = useCallback(async () => {
    if (!id) throw new Error('Missing feed id')
    const res = await apiPostForm<EnvelopeResponse<FeedItem>>(
      '/v6/feed/detail',
      { id },
    )
    // Pass through the envelope so the page can detect captcha-blocked
    // responses ({status:-1, message:"需要验证码", data:{}}) explicitly.
    return res
  }, [id])
  return useFetch<EnvelopeResponse<FeedItem>>(id ?? null, fetcher, [id])
}
