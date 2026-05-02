import { useCallback } from 'react'
import { api } from '@/lib/api'
import { useFetch } from '@/lib/useFetch'
import type {
  EnvelopeResponse,
  FeedItem,
  TagItem,
  UserProfile,
} from '@/lib/types'

export type SearchType = 'feed' | 'user' | 'tag'

type ResultMap = {
  feed: FeedItem[]
  user: UserProfile[]
  tag: TagItem[]
}

export function useSearch<K extends SearchType>(q: string, type: K) {
  const fetcher = useCallback(async () => {
    const trimmed = q.trim()
    if (!trimmed) return [] as ResultMap[K]
    let path: string
    if (type === 'feed') {
      path = `/v6/search?type=feed&searchValue=${encodeURIComponent(trimmed)}&page=1`
    } else if (type === 'user') {
      path = `/v6/user/search?searchValue=${encodeURIComponent(trimmed)}`
    } else {
      path = `/v6/feed/searchTag?searchValue=${encodeURIComponent(trimmed)}`
    }
    const res = await api<EnvelopeResponse<ResultMap[K]>>(path)
    return (Array.isArray(res?.data) ? res.data : []) as ResultMap[K]
  }, [q, type])
  const key = q.trim() ? `${type}:${q.trim()}` : null
  return useFetch<ResultMap[K]>(key, fetcher, [q, type])
}
