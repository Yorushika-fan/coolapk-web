import type { UserProfile } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CoolImg } from '@/components/CoolImg'

// Modeled on 即刻 / Threads profile hero. Tall cover with a subtle bottom
// gradient so the avatar/name area reads cleanly regardless of cover
// brightness. Avatar overlaps the cover by 24px, ring matches card bg
// for the cutout effect. Stats row uses tabular numerals + thin
// vertical dividers (即刻 vibe) instead of a 3-column dl.

function fmtNum(n: number | undefined): string {
  if (typeof n !== 'number') return '0'
  if (n >= 100000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万'
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万'
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(n)
}

export function ProfileHeader({ user }: { user: UserProfile }) {
  const initial = user.username?.[0]?.toUpperCase() ?? '?'
  const meta = [user.level ? `Lv${user.level}` : null, user.astro, user.city]
    .filter(Boolean)
    .join(' · ')

  return (
    <section className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
      {/* Cover — taller, with bottom gradient for legibility */}
      <div className="relative h-36 w-full bg-muted sm:h-44">
        {user.cover && (
          <CoolImg
            src={user.cover}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card/40 to-transparent dark:from-card/60" />
      </div>

      {/* Avatar + identity */}
      <div className="-mt-10 flex flex-wrap items-end gap-4 px-5 sm:px-6">
        <Avatar className="h-20 w-20 ring-4 ring-card">
          <AvatarImage src={user.userAvatar} alt={user.username} />
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 pb-1.5">
          <h1 className="truncate text-[20px] font-semibold leading-tight text-foreground">
            {user.username}
          </h1>
          {meta && (
            <p className="mt-1 truncate text-[12.5px] text-muted-foreground">
              {meta}
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      {user.bio && (
        <p className="mt-3 px-5 text-[14px] leading-relaxed text-foreground/85 sm:px-6">
          {user.bio}
        </p>
      )}

      {/* Stats row */}
      <dl className="mt-4 flex items-center gap-x-6 gap-y-2 px-5 pb-5 text-[13px] sm:px-6">
        <Stat label="动态" value={user.feed} />
        <Sep />
        <Stat label="关注" value={user.follow} />
        <Sep />
        <Stat label="粉丝" value={user.fans} />
        {typeof user.be_like_num === 'number' && user.be_like_num > 0 && (
          <>
            <Sep />
            <Stat label="获赞" value={user.be_like_num} />
          </>
        )}
      </dl>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dd className="font-semibold tabular-nums text-foreground">
        {fmtNum(value)}
      </dd>
      <dt className="text-muted-foreground">{label}</dt>
    </div>
  )
}

function Sep() {
  return <span aria-hidden className="h-3 w-px bg-border" />
}
