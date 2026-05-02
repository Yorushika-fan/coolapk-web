import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { MainShell } from '@/components/MainShell'
import { ChipGrid } from '@/components/cards/ChipGrid'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ErrorBanner } from '@/components/ErrorBanner'
import { Skeleton } from '@/components/ui/skeleton'
import { usePageList } from '@/lib/hooks/usePageList'
import { useScrollRestore } from '@/lib/useScrollRestore'
import { classifyCard, extractIconChipsItems } from '@/lib/entityKind'
import type { FeedItem } from '@/lib/types'

// Coolapk channel landing page. Stripped down to a single tabbed
// discovery surface: top heading + Tabs across the named chip groups
// returned by the upstream. We deliberately drop the editorial carousel
// (low signal vs noise on ad slots) and the untitled entry chips (the
// LeftNav covers the same primary-channel entries). User feed entries
// the upstream interleaves are also dropped — channels are discovery,
// not timelines.

type Entity = FeedItem & {
  entityType?: string
  entityTemplate?: string
  entityId?: string | number
  title?: string
  entities?: unknown[]
}

export default function Page() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug ?? ''
  const [searchParams] = useSearchParams()
  const title = searchParams.get('title') ?? ''

  const { items, loading, error, reload } = usePageList(slug, title)

  useScrollRestore(`page:${slug}`, items.length > 0)

  const namedGroups = useMemo(() => {
    const out: Entity[] = []
    for (const it of items as Entity[]) {
      if (it.entityType !== 'card') continue
      if (classifyCard(it.entityTemplate) !== 'iconChips') continue
      if (!it.title || it.title.length === 0) continue
      out.push(it)
    }
    return out
  }, [items])

  const [activeTab, setActiveTab] = useState<string>('')
  useEffect(() => {
    if (namedGroups.length === 0) return
    setActiveTab('tab-0')
  }, [namedGroups.length, slug])

  const showSkeleton = loading && items.length === 0

  return (
    <MainShell scrollMode="manual">
      <div className="space-y-6">
        {title && (
          <h1 className="px-1 text-[24px] font-semibold leading-tight tracking-tight text-foreground">
            {title}
          </h1>
        )}

        <ErrorBanner error={error} onRetry={reload} />

        {showSkeleton && (
          <div className="space-y-4">
            <Skeleton className="h-10 w-72" />
            <div className="grid grid-cols-4 gap-x-3 gap-y-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <Skeleton className="h-14 w-14 rounded-xl" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          </div>
        )}

        {namedGroups.length > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              {namedGroups.map((c, i) => (
                <TabsTrigger key={`tab-trigger-${i}`} value={`tab-${i}`}>
                  {c.title}
                </TabsTrigger>
              ))}
            </TabsList>
            {namedGroups.map((c, i) => (
              <TabsContent key={`tab-content-${i}`} value={`tab-${i}`}>
                <ChipGrid items={extractIconChipsItems(c)} />
              </TabsContent>
            ))}
          </Tabs>
        )}

        {!loading && namedGroups.length === 0 && !error && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            该频道暂无内容
          </p>
        )}
      </div>
    </MainShell>
  )
}
