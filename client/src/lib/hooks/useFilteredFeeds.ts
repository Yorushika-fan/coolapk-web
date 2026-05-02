import { useMemo } from 'react'
import type { FeedItem } from '@/lib/types'
import { applyFeedFilters } from '@/lib/filters'
import { useSettingsStore } from '@/stores/settings'

// Apply user-configured filter rules to a feed list. Returns the kept
// items plus the count of items hidden so callers can surface a "已隐藏
// N 条" hint.
export function useFilteredFeeds<T extends FeedItem>(
  items: T[],
): { items: T[]; hiddenCount: number } {
  const filters = useSettingsStore((s) => s.filters)
  return useMemo(() => {
    const kept = applyFeedFilters(items, filters)
    return { items: kept, hiddenCount: items.length - kept.length }
  }, [items, filters])
}
