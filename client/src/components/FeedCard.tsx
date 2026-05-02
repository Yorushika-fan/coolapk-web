import { Link, useNavigate } from 'react-router'
import { MessageCircle, Repeat2, ThumbsUp, type LucideIcon } from 'lucide-react'
import type { FeedItem } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FeedImageGrid } from '@/components/FeedImageGrid'
import { FeedSnippet } from '@/components/FeedSnippet'
import { relativeTime } from '@/lib/date'

// Designed against 即刻 / Threads / modern Weibo. Borderless surface, soft
// elevation via `bg-card` + shadow that lifts on hover. Generous Chinese
// typography (line-height 1.75 for body), explicit visual rhythm between
// header / title / body / gallery / footer. Stat icons sized to read at
// arm's length, no border-t separator (the spacing alone disambiguates).
//
// Outer surface is a div, not an `<a>`: avatar + username remain real
// `<Link>` (right-click "open in new tab" works for profiles, mobile long-
// press preserves native menus), and the whole-card click is wired via
// onClick + Enter handler. Fixes nested-anchor warnings + cuts mistap
// surface on small screens.

export function FeedCard({ item }: { item: FeedItem }) {
  const navigate = useNavigate()
  const pics =
    item.picArr && item.picArr.length
      ? item.picArr
      : item.pic
        ? [item.pic]
        : []
  const stop = (e: React.MouseEvent) => e.stopPropagation()
  const initial = item.username?.[0]?.toUpperCase() ?? '?'
  const showFooter =
    (item.replynum ?? 0) > 0 ||
    (item.likenum ?? 0) > 0 ||
    (item.forwardnum ?? 0) > 0
  const goDetail = () => navigate(`/feed/${item.id}`, { state: item })
  // Suppress card-level click when the user is selecting text — drag-
  // selecting reads as a click on mouseup and would otherwise navigate
  // away mid-quote.
  const onCardClick = (e: React.MouseEvent) => {
    const sel = window.getSelection?.()
    if (sel && sel.toString().length > 0) return
    if ((e.target as HTMLElement).closest('a, button, [role="button"]')) return
    goDetail()
  }
  const onCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      goDetail()
    }
  }

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`查看 ${item.username || ''} 的动态详情`}
      onClick={onCardClick}
      onKeyDown={onCardKeyDown}
      className="group block cursor-pointer rounded-2xl bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-transparent transition-all duration-150 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)] focus-visible:outline-none focus-visible:ring-foreground/20 dark:shadow-[0_1px_3px_rgba(0,0,0,0.55)] dark:ring-white/[0.04] dark:hover:shadow-[0_10px_28px_-8px_rgba(0,0,0,0.7)] dark:hover:ring-white/[0.08] sm:p-5"
    >
      {/* Author block */}
      <div className="flex items-start gap-3">
        <Link to={`/u/${item.uid}`} onClick={stop} className="shrink-0">
          <Avatar className="h-11 w-11">
            <AvatarImage src={item.userAvatar} alt={item.username} />
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1 leading-tight">
          <Link
            to={`/u/${item.uid}`}
            onClick={stop}
            className="block truncate text-[14px] font-medium text-foreground hover:underline"
          >
            {item.username}
          </Link>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] leading-snug text-muted-foreground">
            <span>{relativeTime(item.dateline)}</span>
            {item.device_title && (
              <>
                <span aria-hidden className="text-muted-foreground/60">
                  ·
                </span>
                <span>来自</span>
                <span className="text-foreground/70">{item.device_title}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Title */}
      {item.message_title && (
        <h3 className="mt-3 text-[15.5px] font-semibold leading-snug tracking-tight text-foreground">
          {item.message_title}
        </h3>
      )}

      {/* Body */}
      {item.message && (
        <FeedSnippet
          html={item.message}
          className={
            (item.message_title ? 'mt-2 ' : 'mt-3 ') +
            'line-clamp-4 text-[15px] leading-[1.75] text-foreground/90'
          }
        />
      )}

      {/* Image gallery */}
      {pics.length > 0 && (
        <div className="mt-3">
          <FeedImageGrid pics={pics} />
        </div>
      )}

      {/* Stats footer */}
      {showFooter && (
        <div className="mt-3 flex items-center gap-7 text-[13px] text-muted-foreground">
          {(item.replynum ?? 0) > 0 && (
            <Stat icon={MessageCircle} count={item.replynum} />
          )}
          {(item.likenum ?? 0) > 0 && (
            <Stat icon={ThumbsUp} count={item.likenum} />
          )}
          {(item.forwardnum ?? 0) > 0 && (
            <Stat icon={Repeat2} count={item.forwardnum ?? 0} />
          )}
        </div>
      )}
    </div>
  )
}

function Stat({ icon: Icon, count }: { icon: LucideIcon; count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 transition-colors group-hover:text-foreground/70">
      <Icon className="h-[15px] w-[15px]" strokeWidth={1.75} />
      <span className="tabular-nums">{count}</span>
    </span>
  )
}
