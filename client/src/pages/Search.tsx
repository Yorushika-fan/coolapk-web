import { useSearchParams } from 'react-router'
import { MainShell } from '@/components/MainShell'
import { FeedCard } from '@/components/FeedCard'
import { FeedCardSkeleton } from '@/components/FeedCardSkeleton'
import { UserCard } from '@/components/UserCard'
import { TagCard } from '@/components/TagCard'
import { ErrorBanner } from '@/components/ErrorBanner'
import { FilteredHint } from '@/components/FilteredHint'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  UserCardListSkeleton,
  TagCardListSkeleton,
} from '@/components/skeletons'
import { useSearch, type SearchType } from '@/lib/hooks/useSearch'
import { useFilteredFeeds } from '@/lib/hooks/useFilteredFeeds'
import { useMemo } from 'react'
import type { FeedItem, TagItem, UserProfile } from '@/lib/types'

function FeedResults({ q }: { q: string }) {
  const { data, error, loading, reload } = useSearch<'feed'>(q, 'feed')
  const arr = useMemo(() => data ?? [], [data])
  const { items: visible, hiddenCount } = useFilteredFeeds(arr)
  const showSkeletons = loading && (!data || data.length === 0)
  return (
    <div>
      <ErrorBanner error={error} onRetry={reload} />
      <FilteredHint count={hiddenCount} />
      {showSkeletons && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <FeedCardSkeleton key={i} />
          ))}
        </div>
      )}
      {!loading && (!data || data.length === 0) && !error && (
        <p className="py-4 text-sm text-muted-foreground">没有结果</p>
      )}
      <div className="space-y-3">
        {visible.map((item: FeedItem) => (
          <FeedCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

function UserResults({ q }: { q: string }) {
  const { data, error, loading, reload } = useSearch<'user'>(q, 'user')
  const showSkeletons = loading && (!data || data.length === 0)
  return (
    <div>
      <ErrorBanner error={error} onRetry={reload} />
      {showSkeletons && <UserCardListSkeleton count={4} />}
      {!loading && (!data || data.length === 0) && !error && (
        <p className="py-4 text-sm text-muted-foreground">没有结果</p>
      )}
      <div className="space-y-2">
        {data?.map((u: UserProfile) => <UserCard key={u.uid} user={u} />)}
      </div>
    </div>
  )
}

function TagResults({ q }: { q: string }) {
  const { data, error, loading, reload } = useSearch<'tag'>(q, 'tag')
  const showSkeletons = loading && (!data || data.length === 0)
  return (
    <div>
      <ErrorBanner error={error} onRetry={reload} />
      {showSkeletons && <TagCardListSkeleton count={4} />}
      {!loading && (!data || data.length === 0) && !error && (
        <p className="py-4 text-sm text-muted-foreground">没有结果</p>
      )}
      <div className="space-y-2">
        {data?.map((t: TagItem) => <TagCard key={t.id} tag={t} />)}
      </div>
    </div>
  )
}

export default function Search() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const type = (params.get('type') as SearchType) || 'feed'

  const setType = (next: SearchType) => {
    const p = new URLSearchParams(params)
    p.set('type', next)
    if (q) p.set('q', q)
    setParams(p, { replace: true })
  }

  return (
    <MainShell>
      <div className="space-y-3">
        {!q && (
          <p className="py-4 text-sm text-muted-foreground">
            在顶部搜索框输入关键词开始搜索。
          </p>
        )}
        {q && (
          <>
            <p className="text-sm text-muted-foreground">
              「<span className="font-medium text-foreground">{q}</span>」的搜索结果
            </p>
            <Tabs value={type} onValueChange={(v) => setType(v as SearchType)}>
              <TabsList>
                <TabsTrigger value="feed">动态</TabsTrigger>
                <TabsTrigger value="user">用户</TabsTrigger>
                <TabsTrigger value="tag">话题</TabsTrigger>
              </TabsList>
              <TabsContent value="feed">
                <FeedResults q={q} />
              </TabsContent>
              <TabsContent value="user">
                <UserResults q={q} />
              </TabsContent>
              <TabsContent value="tag">
                <TagResults q={q} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </MainShell>
  )
}
