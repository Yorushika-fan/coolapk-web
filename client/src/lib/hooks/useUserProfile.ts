import { useCallback } from 'react'
import { api } from '@/lib/api'
import { useFetch } from '@/lib/useFetch'
import type { EnvelopeResponse, UserProfile } from '@/lib/types'

export function useUserProfile(uid: string | undefined) {
  const fetcher = useCallback(async () => {
    if (!uid) throw new Error('Missing uid')
    const res = await api<EnvelopeResponse<UserProfile>>(
      `/v6/user/space?uid=${encodeURIComponent(uid)}`,
    )
    return res.data
  }, [uid])
  return useFetch<UserProfile>(uid ?? null, fetcher, [uid])
}
