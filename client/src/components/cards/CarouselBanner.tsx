import { useEffect, useRef, useState } from 'react'
import { CoolImg } from '@/components/CoolImg'
import { Card } from '@/components/ui/card'
import { resolveCoolapkLink } from '@/lib/coolapkLink'

// Auto-rotating banner — Coolapk uses this for activity ads / editorial
// highlights. Cycles every 5s, pauses on hover or touch (mobile users
// get a chance to read), respects manual scroll-snap drags via
// scrollLeft sync. Dots underneath give a position indicator.

type Item = { pic: string; title: string; url: string }

const ROTATE_MS = 5000

export function CarouselBanner({
  items,
  title,
}: {
  items: Item[]
  title: string
}) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Array<HTMLDivElement | null>>([])

  // Auto-advance.
  useEffect(() => {
    if (paused || items.length <= 1) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length)
    }, ROTATE_MS)
    return () => window.clearInterval(id)
  }, [paused, items.length])

  // Sync scroll position to the active index.
  useEffect(() => {
    const track = trackRef.current
    const child = itemRefs.current[index]
    if (!track || !child) return
    track.scrollTo({
      left: child.offsetLeft - track.offsetLeft,
      behavior: 'smooth',
    })
  }, [index])

  // Track manual scroll drags so the dots stay in sync.
  const onScroll = () => {
    const track = trackRef.current
    if (!track) return
    const center = track.scrollLeft + track.clientWidth / 2
    let closest = 0
    let closestDist = Infinity
    itemRefs.current.forEach((el, i) => {
      if (!el) return
      const mid = el.offsetLeft - track.offsetLeft + el.clientWidth / 2
      const dist = Math.abs(mid - center)
      if (dist < closestDist) {
        closestDist = dist
        closest = i
      }
    })
    if (closest !== index) setIndex(closest)
  }

  return (
    <Card
      className="overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {title && (
        <div className="px-4 pt-3 text-[13px] font-medium text-muted-foreground">
          {title}
        </div>
      )}
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="scrollbar-thin flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 py-3"
      >
        {items.map((it, i) => {
          const href = resolveCoolapkLink(it.url)
          const Inner = (
            <div className="aspect-[9/2] w-full overflow-hidden rounded-md bg-muted">
              <CoolImg
                src={it.pic}
                alt={it.title}
                className="h-full w-full object-cover"
              />
            </div>
          )
          return (
            <div
              key={`${it.pic}-${i}`}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              className="w-full shrink-0 snap-start"
            >
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                  title={it.title}
                >
                  {Inner}
                </a>
              ) : (
                Inner
              )}
              {it.title && (
                <p className="mt-1.5 line-clamp-1 text-[12.5px] text-muted-foreground">
                  {it.title}
                </p>
              )}
            </div>
          )
        })}
      </div>
      {items.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pb-3">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Slide ${i + 1}`}
              className={
                'h-1.5 rounded-full transition-all ' +
                (i === index
                  ? 'w-4 bg-foreground/70'
                  : 'w-1.5 bg-foreground/20 hover:bg-foreground/40')
              }
            />
          ))}
        </div>
      )}
    </Card>
  )
}
