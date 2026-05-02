import { useEffect, useRef } from 'react'
import { useListCacheStore } from '@/stores/listCache'

// Restore scroll position for any page that exposes a `cacheKey` matching
// a list-cache entry. Records scrollY on unmount so the next visit
// re-enters where the user left off.
//
// `ready` lets callers gate the restore on data being mounted (otherwise
// scrollTo a y > document height clamps to 0). For cached lists the
// cached items hydrate synchronously, so RAF after `ready=true` is enough.

export function useScrollRestore(cacheKey: string, ready: boolean = true) {
  const restored = useRef(false)

  useEffect(() => {
    if (!ready || restored.current) return
    const stored =
      useListCacheStore.getState().entries[cacheKey]?.scrollY ?? 0
    if (stored > 0) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: stored, behavior: 'auto' })
      })
    }
    restored.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, ready])

  useEffect(() => {
    return () => {
      useListCacheStore.getState().setScrollY(cacheKey, window.scrollY)
    }
  }, [cacheKey])
}
