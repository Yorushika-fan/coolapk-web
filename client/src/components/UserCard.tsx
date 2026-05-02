import { Link } from 'react-router'
import type { UserProfile } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function UserCard({ user }: { user: UserProfile }) {
  return (
    <Link
      to={`/u/${user.uid}`}
      className="flex items-center gap-3 rounded-2xl bg-card p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-150 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4)] dark:hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)]"
    >
      <Avatar className="h-11 w-11 shrink-0">
        <AvatarImage src={user.userAvatar} alt={user.username} />
        <AvatarFallback>
          {user.username?.[0]?.toUpperCase() ?? '?'}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-[14px] font-medium text-foreground">
          {user.username}
        </p>
        {user.bio && (
          <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
            {user.bio}
          </p>
        )}
        <p className="mt-1 text-[12px] text-muted-foreground">
          <span className="tabular-nums text-foreground/85">
            {user.fans ?? 0}
          </span>
          <span> 粉丝 · </span>
          <span className="tabular-nums text-foreground/85">
            {user.feed ?? 0}
          </span>
          <span> 动态</span>
        </p>
      </div>
    </Link>
  )
}
