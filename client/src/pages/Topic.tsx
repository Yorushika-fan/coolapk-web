import { useEffect, useRef } from 'react'
import { useParams } from 'react-router'
import { MainShell } from '@/components/MainShell'
import { TopicHeader } from '@/components/TopicHeader'
import { FeedCard } from '@/components/FeedCard'
import { FeedCardSkeleton } from '@/components/FeedCardSkeleton'
import { ErrorBanner } from '@/components/ErrorBanner'
import { FilteredHint } from '@/components/FilteredHint'
import { Skeleton } from '@/components/ui/skeleton'
import { useTopicDetail } from '@/lib/hooks/useTopicDetail'
import { useTopicFeed } from '@/lib/hooks/useTopicFeed'
import { useFilteredFeeds } from '@/lib/hooks/useFilteredFeeds'
import { useScrollRestore } from '@/lib/useScrollRestore'

export default function Topic() {
  const params = useParams<{ tag: string }>()
  const tag = params.tag ? decodeURIComponent(params.tag) : ''

  const {
    data: topic,
    error: topicError,
    loading: topicLoading,
    reload: reloadTopic,
  } = useTopicDetail(tag)
  const {
    items,
    loadMore,
    hasMore,
    loading,
    error,
    reload,
  } = useTopicFeed(tag)
  const { items: visibleItems, hiddenCount } = useFilteredFeeds(items)

  // Restore scroll once topic feed has hydrated from cache (no flicker
  // for cached returns; fresh visits land at top via MainShell default).
  useScrollRestore(`topic:${tag}`, items.length > 0)

  const sentinelRef = useRef<HTMLDivElement | null>(null)
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

  return (
    <MainShell scrollMode="manual">
      <div className="space-y-3">
        <ErrorBanner error={topicError} onRetry={reloadTopic} />
        {topicLoading && !topic && (
          <div className="rounded-2xl bg-card p-5">
            <div className="flex items-start gap-4">
              <Skeleton className="h-16 w-16 shrink-0 rounded-2xl sm:h-20 sm:w-20" />
              <div className="flex-1 space-y-2 pt-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </div>
        )}
        {topic && <TopicHeader topic={topic} />}

        <ErrorBanner error={error} onRetry={reload} />
        <FilteredHint count={hiddenCount} />
        {loading && items.length === 0 &&
          Array.from({ length: 3 }).map((_, i) => (
            <FeedCardSkeleton key={i} />
          ))}
        {visibleItems.map((item) => (
          <FeedCard key={item.id} item={item} />
        ))}
        {loading && visibleItems.length > 0 && <FeedCardSkeleton />}
        {!hasMore && visibleItems.length > 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            没有更多了
          </p>
        )}
        {!loading && items.length === 0 && !error && topic && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            该话题下暂无动态
          </p>
        )}
        <div ref={sentinelRef} aria-hidden className="h-4" />
      </div>
    </MainShell>
  )
}
