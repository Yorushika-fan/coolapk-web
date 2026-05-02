import type { UserProfile } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CoolImg } from '@/components/CoolImg'

// Modeled on 即刻 / Threads / modern Weibo profile hero. The cover is
// a self-contained band, the avatar overlaps it by ~50%, and the
// username + meta + bio all live in a clean body section BELOW the
// cover — no text ever competes with the cover photo for legibility.
// A full-bleed bottom gradient hides any cover edge artefacts and a
// dark-mode ring lifts the card off the page background to match
// FeedCard's elevation language.

function fmtNum(n: number | undefined): string {
  if (typeof n !== 'number') return '0'
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
    <section className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-transparent dark:shadow-[0_1px_3px_rgba(0,0,0,0.55)] dark:ring-white/[0.04]">
      {/* Cover band — self-contained. Strong bottom fade so the cover
          ends decisively and any text below sits on solid card bg. */}
      <div className="relative h-32 w-full bg-gradient-to-br from-muted to-muted-foreground/20 sm:h-40">
        {user.cover && (
          <CoolImg
            src={user.cover}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-card via-card/40 to-transparent" />
      </div>

      {/* Body — avatar overlaps cover by ~50%; identity sits fully below. */}
      <div className="px-5 pb-5 sm:px-6">
        <div className="-mt-12 flex items-end justify-between gap-3 sm:-mt-14">
          <Avatar className="h-[88px] w-[88px] shrink-0 ring-4 ring-card shadow-md sm:h-[100px] sm:w-[100px]">
            <AvatarImage src={user.userAvatar} alt={user.username} />
            <AvatarFallback className="text-xl">{initial}</AvatarFallback>
          </Avatar>
          {/* Action slot reserved for future Follow button. Empty for
              now but anchors the avatar's right edge so the layout
              doesn't shift when we add it. */}
          <div className="pb-1.5" aria-hidden />
        </div>

        {/* Identity — name + meta on the same baseline, gracefully wraps */}
        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="truncate text-[22px] font-semibold leading-tight tracking-tight text-foreground">
            {user.username}
          </h1>
          {meta && (
            <span className="truncate text-[12.5px] text-muted-foreground">
              {meta}
            </span>
          )}
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="mt-2 whitespace-pre-line break-words text-[14px] leading-relaxed text-foreground/85">
            {user.bio}
          </p>
        )}

        {/* Stats row */}
        <dl className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
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
      </div>
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
