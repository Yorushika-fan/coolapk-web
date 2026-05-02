import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ArrowLeft, MessageCircle, ThumbsUp } from 'lucide-react'
import { MainShell } from '@/components/MainShell'
import { ReplyList } from '@/components/ReplyList'
import { FeedDetailBody } from '@/components/FeedDetailBody'
import { FeedImageGrid } from '@/components/FeedImageGrid'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { FeedSnippet } from '@/components/FeedSnippet'
import { relativeTime } from '@/lib/date'
import { useFeedDetail } from '@/lib/hooks/useFeedDetail'
import type { FeedItem } from '@/lib/types'

export default function Feed() {
  const params = useParams<{ id: string }>()
  const id = params.id ?? ''
  const location = useLocation()
  const navigate = useNavigate()
  const carried = (location.state ?? null) as FeedItem | null
  const carriedItem = carried && carried.id === id ? carried : null
  // Use history-back when we got here via navigation (preserves Home's
  // cached scroll/list state). Direct deep-link → fallback to /.
  const goBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }

  const { data: env, loading } = useFeedDetail(id)
  // Server returns {status:-1, message:"需要验证码", data:{}} when iOS-mode is
  // not configured or token expired. Treat any data without `id` as captcha.
  const detail = env?.data && env.data.id ? env.data : null
  const captchaBlocked = !!env && !detail
  const captchaMessage = env?.message
  // Prefer fresh detail (full HTML body), fall back to carried list-item
  // (fast paint while loading or if detail is blocked).
  const item = detail ?? carriedItem
  // Three reply views matching Coolapk-app convention:
  //   全部 (all)    — Coolapk default ordering: lastupdate_desc, hot threads
  //                   resurface as new replies arrive
  //   热门 (hot)    — curated/server-ranked top comments
  //   最新 (latest) — strict chronological dateline_desc
  // 全部 is the default — it's what the native app opens to.
  type ReplyTab = 'all' | 'hot' | 'latest'
  const [tab, setTab] = useState<ReplyTab>('all')

  const externalUrl = `https://www.coolapk.com/feed/${id}`

  return (
    <MainShell>
      <div className="space-y-4">
        <button
          type="button"
          onClick={goBack}
          aria-label="返回"
          className="-ml-1 inline-flex h-8 items-center gap-1.5 rounded-full px-2 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>返回</span>
        </button>
        {!item && loading && (
          <div className="space-y-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        )}

        {item && (
          <article className="space-y-4">
            <header className="flex items-center gap-3">
              <Link to={`/u/${item.uid}`} className="shrink-0">
                <Avatar>
                  <AvatarImage src={item.userAvatar} alt={item.username} />
                  <AvatarFallback>
                    {item.username?.[0]?.toUpperCase() ?? '?'}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="min-w-0 flex-1 leading-tight">
                <Link
                  to={`/u/${item.uid}`}
                  className="block truncate text-sm font-medium hover:underline"
                >
                  {item.username}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {relativeTime(item.dateline)}
                </span>
              </div>
            </header>
            {item.message_title && (
              <h1 className="text-xl font-semibold leading-tight">
                {item.message_title}
              </h1>
            )}
            {item.message &&
              (detail ? (
                // Detail HTML supports anchor links (the surrounding chrome
                // is not a Link), so route through FeedDetailBody which
                // keeps clickable hashtag/at-user anchors with delegation.
                <FeedDetailBody html={item.message} />
              ) : (
                // Carried list payload — render via the shared snippet so
                // hashtags pick up the same blue color as the home cards.
                <FeedSnippet
                  html={item.message}
                  className="text-[15px] leading-[1.75] text-foreground/90"
                />
              ))}
            {item.picArr && item.picArr.length > 0 && (
              <FeedImageGrid pics={item.picArr} enableLightbox />
            )}
            <div className="flex flex-wrap items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5" />
                {item.replynum ?? 0}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ThumbsUp className="h-3.5 w-3.5" />
                {item.likenum ?? 0}
              </span>
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto"
              >
                <Button variant="outline" size="sm">
                  在 Coolapk 看完整正文 ↗
                </Button>
              </a>
            </div>
            {captchaBlocked && !carriedItem && (
              <div className="rounded-md border border-yellow-500/40 bg-yellow-500/5 p-3 text-xs text-muted-foreground">
                Feed 详情接口被网易盾反爬挡（{captchaMessage || '需要验证码'}
                ）。当前显示的是从列表带过来的摘要数据；如需完整正文请配置
                <code className="px-1">IOS_X_APP_TOKEN</code>。
              </div>
            )}
          </article>
        )}

        {!item && !loading && captchaBlocked && (
          <article className="space-y-3 rounded-md border border-border bg-muted/30 p-4">
            <h1 className="text-base font-semibold">无法加载完整正文</h1>
            <p className="text-sm text-muted-foreground">
              {captchaMessage || '当前访问需要验证码'}
              。直接访问深链且未通过列表跳转时，本站只能显示评论。如需正文，请配置
              iOS-mode（在 webapp/server/.env 里填 IOS_X_APP_TOKEN /
              IOS_X_APP_DEVICE / IOS_COOKIE，从真机 iCoolMarket 抓包获取）。
            </p>
            <a href={externalUrl} target="_blank" rel="noopener noreferrer">
              <Button>在 Coolapk 看完整正文 ↗</Button>
            </a>
          </article>
        )}

        {id && (
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as ReplyTab)}
            className="pt-2"
          >
            <TabsList>
              <TabsTrigger value="all">全部</TabsTrigger>
              <TabsTrigger value="hot">热门</TabsTrigger>
              <TabsTrigger value="latest">最新</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <ReplyList id={id} kind="all" />
            </TabsContent>
            <TabsContent value="hot">
              <ReplyList id={id} kind="hot" />
            </TabsContent>
            <TabsContent value="latest">
              <ReplyList id={id} kind="latest" />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MainShell>
  )
}
