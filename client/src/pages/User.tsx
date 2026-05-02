import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { MainShell } from '@/components/MainShell'
import { ProfileHeader } from '@/components/ProfileHeader'
import { FeedCard } from '@/components/FeedCard'
import { FeedCardSkeleton } from '@/components/FeedCardSkeleton'
import { ReplyListSkeleton } from '@/components/skeletons'
import { ErrorBanner } from '@/components/ErrorBanner'
import { FilteredHint } from '@/components/FilteredHint'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useUserProfile } from '@/lib/hooks/useUserProfile'
import { useUserFeed } from '@/lib/hooks/useUserFeed'
import { useUserReplies } from '@/lib/hooks/useUserReplies'
import { useFilteredFeeds } from '@/lib/hooks/useFilteredFeeds'
import { useScrollRestore } from '@/lib/useScrollRestore'
import { FeedSnippet } from '@/components/FeedSnippet'
import { relativeTime } from '@/lib/date'

function UserFeedTab({ uid }: { uid: string }) {
  const { items, loadMore, hasMore, loading, error, reload } = useUserFeed(uid)
  const { items: visibleItems, hiddenCount } = useFilteredFeeds(items)
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
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loading, loadMore])

  return (
    <div className="space-y-3">
      <ErrorBanner error={error} onRetry={reload} />
      <FilteredHint count={hiddenCount} />
      {loading && items.length === 0 && (
        <>
          <FeedCardSkeleton />
          <FeedCardSkeleton />
        </>
      )}
      {visibleItems.map((item) => (
        <FeedCard key={item.id} item={item} />
      ))}
      {!hasMore && visibleItems.length > 0 && (
        <p className="py-4 text-center text-xs text-muted-foreground">
          没有更多了
        </p>
      )}
      <div ref={sentinelRef} aria-hidden className="h-4" />
    </div>
  )
}

function UserRepliesTab({ uid }: { uid: string }) {
  const { items, loadMore, hasMore, loading, error, reload } =
    useUserReplies(uid)
  return (
    <div>
      <ErrorBanner error={error} onRetry={reload} />
      {loading && items.length === 0 && <ReplyListSkeleton count={4} />}
      <ul>
        {items.map((r) => (
          <li
            key={r.id}
            className="flex gap-3 border-b border-border py-3 last:border-0"
          >
            <Link to={`/u/${r.uid}`} className="shrink-0">
              <Avatar className="h-9 w-9">
                <AvatarImage src={r.userAvatar} alt={r.username} />
                <AvatarFallback>
                  {r.username?.[0]?.toUpperCase() ?? '?'}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2 text-xs text-muted-foreground">
                <Link
                  to={`/u/${r.uid}`}
                  className="font-medium text-foreground"
                >
                  {r.username}
                </Link>
                <span>{relativeTime(r.dateline)}</span>
              </div>
              <FeedSnippet
                html={r.message}
                className="mt-1 text-sm leading-relaxed text-foreground"
              />
            </div>
          </li>
        ))}
      </ul>
      {items.length === 0 && !loading && !error && (
        <p className="py-4 text-sm text-muted-foreground">暂无评论</p>
      )}
      {hasMore && items.length > 0 && (
        <div className="py-3 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? '加载中…' : '加载更多'}
          </Button>
        </div>
      )}
    </div>
  )
}

export default function User() {
  const params = useParams<{ uid: string }>()
  const uid = params.uid ?? ''
  const { data, error, loading, reload } = useUserProfile(uid)
  const [tab, setTab] = useState<'feeds' | 'replies'>('feeds')

  // Scroll position cached per-user, independent of tab. Ready once the
  // profile header has data so we don't try to scroll before content
  // exists.
  useScrollRestore(`user:${uid}`, !!data)

  return (
    <MainShell scrollMode="manual">
      <div className="space-y-4">
        <ErrorBanner error={error} onRetry={reload} />
        {loading && !data && (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-6 w-1/3" />
          </div>
        )}
        {data && <ProfileHeader user={data} />}
        {uid && (
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as 'feeds' | 'replies')}
          >
            <TabsList>
              <TabsTrigger value="feeds">动态</TabsTrigger>
              <TabsTrigger value="replies">评论</TabsTrigger>
            </TabsList>
            <TabsContent value="feeds">
              <UserFeedTab uid={uid} />
            </TabsContent>
            <TabsContent value="replies">
              <UserRepliesTab uid={uid} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MainShell>
  )
}
