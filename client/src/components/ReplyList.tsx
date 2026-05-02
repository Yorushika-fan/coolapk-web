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

function NestedReplies({ rows }: { rows: Reply[] }) {
  if (!rows.length) return null
  return (
    <ul className="mt-2 space-y-1 rounded-lg bg-muted/40 px-3 py-2">
      {rows.map((r) => (
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
          <span className="text-muted-foreground">: </span>
          <FeedSnippet
            html={r.message}
            className="inline text-foreground/90"
          />
        </li>
      ))}
    </ul>
  )
}

function ReplyItem({ reply }: { reply: Reply }) {
  const [open, setOpen] = useState(false)
  const childCount = reply.replyRowsCount ?? reply.replyRows?.length ?? 0
  const rows = reply.replyRows ?? []
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
        <div className="flex items-baseline gap-2 text-xs text-muted-foreground">
          <Link to={`/u/${reply.uid}`} className="font-medium text-foreground">
            {reply.username}
          </Link>
          <span>{relativeTime(reply.dateline)}</span>
        </div>
        <FeedSnippet
          html={reply.message}
          className="mt-1 text-sm leading-relaxed text-foreground"
        />
        {childCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 h-7 px-2 text-xs text-muted-foreground"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? '收起' : `查看 ${childCount} 条回复`}
          </Button>
        )}
        {open && <NestedReplies rows={rows} />}
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
