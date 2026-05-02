import { useEffect, useMemo, useRef } from 'react'
import { MainShell } from '@/components/MainShell'
import { FeedCard } from '@/components/FeedCard'
import { FeedCardSkeleton } from '@/components/FeedCardSkeleton'
import { ErrorBanner } from '@/components/ErrorBanner'
import { FilteredHint } from '@/components/FilteredHint'
import { IconChipsRow } from '@/components/cards/IconChipsRow'
import { useHomeFeed } from '@/lib/hooks/useHomeFeed'
import { useFilteredFeeds } from '@/lib/hooks/useFilteredFeeds'
import { useScrollRestore } from '@/lib/useScrollRestore'
import { classifyCard, extractIconChipsItems } from '@/lib/entityKind'
import type { FeedItem } from '@/lib/types'

type Entity = FeedItem & {
  entityType?: string
  entityTemplate?: string
  entityId?: string | number
  title?: string
  entities?: unknown[]
}

export default function Home() {
  const { items, loadMore, hasMore, loading, error, reload } = useHomeFeed()
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Restore scroll position once cached items have rendered.
  useScrollRestore('home', items.length > 0)

  const { sidebars, feeds } = useMemo(() => {
    const sidebars: Entity[] = []
    const feeds: FeedItem[] = []
    for (const it of items as Entity[]) {
      if (it.entityType === 'feed' || !it.entityType) {
        feeds.push(it as FeedItem)
        continue
      }
      if (it.entityType === 'card') {
        const slot = classifyCard(it.entityTemplate)
        if (slot === 'iconChips') sidebars.push(it)
      }
    }
    return { sidebars, feeds }
  }, [items])

  const { items: visibleFeeds, hiddenCount } = useFilteredFeeds(feeds)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && hasMore && !loading) {
            loadMore()
            break
          }
        }
      },
      { rootMargin: '300px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, loadMore])

  const showInitialSkeletons = loading && items.length === 0

  const rightRail =
    sidebars.length > 0 ? (
      <>
        {sidebars.map((s, i) => {
          const items = extractIconChipsItems(s)
          return items.length ? (
            <IconChipsRow
              key={s.entityId ?? `sidebar-${i}`}
              items={items}
              title={s.title ?? ''}
            />
          ) : null
        })}
      </>
    ) : null

  return (
    <MainShell rightRail={rightRail} scrollMode="manual">
      <div className="space-y-3">
        <ErrorBanner error={error} onRetry={reload} />
        <FilteredHint count={hiddenCount} />
        {showInitialSkeletons &&
          Array.from({ length: 6 }).map((_, i) => <FeedCardSkeleton key={i} />)}
        {visibleFeeds.map((item) => (
          <FeedCard key={item.id} item={item} />
        ))}
        {loading && visibleFeeds.length > 0 && <FeedCardSkeleton />}
        {!hasMore && visibleFeeds.length > 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            没有更多了
          </p>
        )}
        <div ref={sentinelRef} aria-hidden className="h-4" />
      </div>
    </MainShell>
  )
}
