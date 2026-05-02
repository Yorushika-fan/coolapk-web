import type { TopicDetail } from '@/lib/types'
import { CoolImg } from '@/components/CoolImg'

// Compact header strip for the /t/:tag page. Mirrors Coolapk's tag detail
// hero — square logo + name + counts + optional description. Used by
// products-as-tags too (small米15 etc.) so logo is always shown.

function fmtNum(n: number | undefined): string {
  if (typeof n !== 'number') return '0'
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万'
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(n)
}

export function TopicHeader({ topic }: { topic: TopicDetail }) {
  const followCount =
    topic.follow_num_txt && topic.follow_num_txt.length > 0
      ? topic.follow_num_txt
      : fmtNum(topic.follow_num)
  const feedCount = fmtNum(topic.feed_num)

  return (
    <section className="rounded-2xl bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-muted sm:h-20 sm:w-20">
          {topic.logo ? (
            <CoolImg
              src={topic.logo}
              alt={topic.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-muted-foreground">
              {topic.title?.[0] ?? '#'}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <h1 className="truncate text-[18px] font-semibold leading-tight text-foreground sm:text-[20px]">
            #{topic.title}#
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
            <span>
              <span className="tabular-nums text-foreground">{followCount}</span>{' '}
              关注
            </span>
            <span>
              <span className="tabular-nums text-foreground">{feedCount}</span>{' '}
              动态
            </span>
          </div>
        </div>
      </div>
      {topic.description && (
        <p className="mt-3 whitespace-pre-wrap break-words text-[14px] leading-relaxed text-foreground/85">
          {topic.description}
        </p>
      )}
    </section>
  )
}
