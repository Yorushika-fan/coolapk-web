import { useState } from 'react'
import { Link } from 'react-router'
import type { Reply } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ErrorBanner } from '@/components/ErrorBanner'
import { useHotReplies } from '@/lib/hooks/useHotReplies'
import { useReplyList } from '@/lib/hooks/useReplyList'
import { FeedSnippet } from '@/components/FeedSnippet'
import { relativeTime } from '@/lib/date'
import { ReplyListSkeleton } from '@/components/skeletons'

// Small chip indicating the reply was authored by the original poster
// (uid match against the feed's author). Coolapk-app convention is a
// soft amber/gold pill — distinct enough to read at a glance without
// shouting over the username.
function OPBadge() {
  return (
    <span className="ml-1 inline-flex shrink-0 items-center rounded bg-amber-500/15 px-1.5 text-[10px] font-medium leading-snug text-amber-700 dark:text-amber-400">
      楼主
    </span>
  )
}

function NestedReplies({ rows, parentUid }: { rows: Reply[]; parentUid: string }) {
  if (!rows.length) return null
  return (
    <ul className="mt-2 space-y-1 rounded-lg bg-muted/40 px-3 py-2">
      {rows.map((r) => {
        // Show "回复 @某人" prefix only when the reply is addressed at
        // someone OTHER than the parent comment author — within a single
        // top-level thread, replies to the OP-of-thread are implicit and
        // would be noisy. (Coolapk-app omits the prefix in this case.)
        const showReplyTo =
          !!r.rusername && !!r.ruid && r.ruid !== parentUid
        return (
          <li
            key={r.id}
            className="text-[13px] leading-relaxed text-foreground/90"
          >
            <Link
              to={`/u/${r.uid}`}
              className="font-medium text-foreground hover:underline"
            >
              {r.username}
            </Link>
            {r.isFeedAuthor && <OPBadge />}
            {showReplyTo && (
              <>
                <span className="text-muted-foreground"> 回复 </span>
                <Link
                  to={`/u/${r.ruid}`}
                  className="feed-html-link font-medium hover:underline"
                >
                  @{r.rusername}
                </Link>
              </>
            )}
            <span className="text-muted-foreground">: </span>
            <FeedSnippet
              html={r.message}
              className="inline text-foreground/90"
            />
          </li>
        )
      })}
    </ul>
  )
}

// At most this many child replies render inline by default; if the
// thread is bigger, show a "展开剩余" toggle. Mirrors Coolapk-app
// behavior — short threads (1-3 replies) read inline as part of the
// comment, longer ones get a collapse to keep the wall-of-text down.
const INLINE_REPLY_LIMIT = 3

function ReplyItem({ reply }: { reply: Reply }) {
  const allRows = reply.replyRows ?? []
  const totalCount = reply.replyRowsCount ?? allRows.length
  // Replies the upstream API didn't include in this batch (only the
  // first ~5 are inlined). Surfaced as a passive note since we don't
  // have a per-reply pagination endpoint wired up yet.
  const remoteHidden = Math.max(0, totalCount - allRows.length)
  const [expanded, setExpanded] = useState(false)
  const visibleRows =
    expanded || allRows.length <= INLINE_REPLY_LIMIT
      ? allRows
      : allRows.slice(0, INLINE_REPLY_LIMIT)
  const localHidden = allRows.length - visibleRows.length

  return (
    <li className="flex gap-3 border-b border-border py-3 last:border-0">
      <Link to={`/u/${reply.uid}`} className="shrink-0">
        <Avatar className="h-9 w-9">
          <AvatarImage src={reply.userAvatar} alt={reply.username} />
          <AvatarFallback>
            {reply.username?.[0]?.toUpperCase() ?? '?'}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span className="inline-flex items-baseline">
            <Link to={`/u/${reply.uid}`} className="font-medium text-foreground">
              {reply.username}
            </Link>
            {reply.isFeedAuthor && <OPBadge />}
          </span>
          <span>{relativeTime(reply.dateline)}</span>
        </div>
        <FeedSnippet
          html={reply.message}
          className="mt-1 text-sm leading-relaxed text-foreground"
        />
        {visibleRows.length > 0 && (
          <NestedReplies rows={visibleRows} parentUid={reply.uid} />
        )}
        {(localHidden > 0 || remoteHidden > 0) && (
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            {localHidden > 0 && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="hover:text-foreground hover:underline"
              >
                展开剩余 {localHidden} 条
              </button>
            )}
            {remoteHidden > 0 && (
              <span>还有 {remoteHidden} 条未加载</span>
            )}
          </div>
        )}
      </div>
    </li>
  )
}

export function ReplyList({
  id,
  kind,
}: {
  id: string
  kind: 'all' | 'latest' | 'hot'
}) {
  if (kind === 'hot') return <HotList id={id} />
  // 全部 = lastupdate_desc (Coolapk 默认排序，按"最新评论时间"，新回复会把楼层顶上来)
  // 最新 = dateline_desc (按发布时间倒序，纯时间线)
  const listType = kind === 'all' ? 'lastupdate_desc' : 'dateline_desc'
  return <PaginatedList id={id} listType={listType} />
}

function HotList({ id }: { id: string }) {
  const { data, error, loading, reload } = useHotReplies(id)
  return (
    <div>
      <ErrorBanner error={error} onRetry={reload} />
      {loading && !data && <ReplyListSkeleton count={3} />}
      {!loading && data && data.length === 0 && (
        <p className="py-4 text-sm text-muted-foreground">暂无热评</p>
      )}
      <ul>{data?.map((r) => <ReplyItem key={r.id} reply={r} />)}</ul>
    </div>
  )
}

function PaginatedList({ id, listType }: { id: string; listType: string }) {
  const { items, error, loading, hasMore, loadMore, reload } = useReplyList(
    id,
    listType,
  )
  return (
    <div>
      <ErrorBanner error={error} onRetry={reload} />
      {loading && items.length === 0 && <ReplyListSkeleton count={4} />}
      <ul>
        {items.map((r) => (
          <ReplyItem key={r.id} reply={r} />
        ))}
      </ul>
      {items.length === 0 && !loading && (
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
