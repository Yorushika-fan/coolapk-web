import { useState, type MouseEvent } from 'react'
import { CoolImg } from '@/components/CoolImg'
import { Lightbox } from '@/components/Lightbox'

// Adaptive image grid that mirrors the Coolapk Android client's feed-card
// layout rules. Single image is rendered uncropped at its natural aspect
// (capped height) — this is the most-tested path because tall screenshot
// posts and meme-format wide images both look bad with object-cover. Two
// images get a 2-column 4:3 lockup. Three images get the Twitter / Weibo
// "1 big left + 2 stacked right" treatment so the row reads as a single
// composition rather than three orphan squares. Four images get a 2x2
// grid. Five+ fall back to a 3-column square grid with a "+N" overlay
// capping at 9 cells.
//
// Used by FeedCard (timeline thumbnails — clicks bubble to the card link
// to open the detail page) and by Feed detail (passes enableLightbox so
// clicks open a fullscreen viewer instead).

export function FeedImageGrid({
  pics,
  enableLightbox = false,
}: {
  pics: string[]
  enableLightbox?: boolean
}) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  if (!pics || pics.length === 0) return null

  const open = (i: number) => (e: MouseEvent) => {
    if (!enableLightbox) return
    e.preventDefault()
    e.stopPropagation()
    setLightboxIdx(i)
  }
  const cellCursor = enableLightbox ? 'cursor-zoom-in' : ''

  let grid: React.ReactNode

  if (pics.length === 1) {
    grid = (
      <div
        onClick={open(0)}
        className={`overflow-hidden rounded-lg border border-border/60 bg-muted ${cellCursor}`}
      >
        <CoolImg
          src={pics[0]}
          alt=""
          className="block max-h-[480px] w-full object-contain"
        />
      </div>
    )
  } else if (pics.length === 2) {
    grid = (
      <div className="grid grid-cols-2 gap-1.5">
        {pics.map((src, i) => (
          <div
            key={`${src}-${i}`}
            onClick={open(i)}
            className={`aspect-[4/3] overflow-hidden rounded-md bg-muted ${cellCursor}`}
          >
            <CoolImg src={src} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    )
  } else if (pics.length === 3) {
    // Twitter / Weibo classic: large hero on the left, two stacked on the
    // right. Total height matches a 4:3 single image, so the row keeps a
    // consistent rhythm with the 1- and 2-image variants.
    grid = (
      <div className="grid aspect-[4/3] grid-cols-2 grid-rows-2 gap-1.5">
        <div
          onClick={open(0)}
          className={`row-span-2 overflow-hidden rounded-md bg-muted ${cellCursor}`}
        >
          <CoolImg src={pics[0]} alt="" className="h-full w-full object-cover" />
        </div>
        <div
          onClick={open(1)}
          className={`overflow-hidden rounded-md bg-muted ${cellCursor}`}
        >
          <CoolImg src={pics[1]} alt="" className="h-full w-full object-cover" />
        </div>
        <div
          onClick={open(2)}
          className={`overflow-hidden rounded-md bg-muted ${cellCursor}`}
        >
          <CoolImg src={pics[2]} alt="" className="h-full w-full object-cover" />
        </div>
      </div>
    )
  } else {
    const display = pics.slice(0, 9)
    const overflow = pics.length - display.length
    const cols = pics.length === 4 ? 'grid-cols-2' : 'grid-cols-3'
    grid = (
      <div className={`grid gap-1.5 ${cols}`}>
        {display.map((src, i) => {
          const isLast = i === display.length - 1
          const showBadge = overflow > 0 && isLast
          return (
            <div
              key={`${src}-${i}`}
              onClick={open(i)}
              className={`relative aspect-square overflow-hidden rounded-md bg-muted ${cellCursor}`}
            >
              <CoolImg src={src} alt="" className="h-full w-full object-cover" />
              {showBadge && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-base font-semibold text-white">
                  +{overflow}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <>
      {grid}
      {lightboxIdx != null && (
        <Lightbox
          images={pics}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </>
  )
}
