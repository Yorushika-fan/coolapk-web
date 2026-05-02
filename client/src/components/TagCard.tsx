import { Link } from 'react-router'
import type { TagItem } from '@/lib/types'
import { CoolImg } from '@/components/CoolImg'

export function TagCard({ tag }: { tag: TagItem }) {
  return (
    <Link
      to={`/t/${encodeURIComponent(tag.title)}`}
      className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-150 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4)] dark:hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)]"
    >
      {tag.logo ? (
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
          <CoolImg
            src={tag.logo}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-sm">
          #
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">#{tag.title}</p>
        {typeof tag.followNum === 'number' && (
          <p className="text-xs text-muted-foreground">{tag.followNum} 关注</p>
        )}
      </div>
    </Link>
  )
}
