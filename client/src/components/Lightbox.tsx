import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { CoolImg } from '@/components/CoolImg'

// Full-screen image viewer. Mounted on demand by FeedImageGrid (or any
// caller that opts in). Keyboard: ←/→ navigate, ESC close. Touch: swipe
// horizontally to advance. Click on backdrop closes; click on image
// doesn't.

export function Lightbox({
  images,
  startIndex = 0,
  onClose,
}: {
  images: string[]
  startIndex?: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(startIndex)
  const touchStartX = useRef<number | null>(null)
  const total = images.length

  const prev = useCallback(
    () => setIndex((i) => (i - 1 + total) % total),
    [total],
  )
  const next = useCallback(
    () => setIndex((i) => (i + 1) % total),
    [total],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    // Lock background scroll so the lightbox feels modal.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, prev, next])

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current
    if (start == null) return
    const dx = e.changedTouches[0].clientX - start
    touchStartX.current = null
    if (Math.abs(dx) < 40) return
    if (dx < 0) next()
    else prev()
  }

  if (total === 0) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label="图片预览"
    >
      {/* Counter — top center */}
      {total > 1 && (
        <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
          {index + 1} / {total}
        </div>
      )}

      {/* Close button — top right */}
      <button
        type="button"
        aria-label="关闭"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="absolute top-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/90 transition-colors hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Prev — left edge */}
      {total > 1 && (
        <button
          type="button"
          aria-label="上一张"
          onClick={(e) => {
            e.stopPropagation()
            prev()
          }}
          className="absolute top-1/2 left-3 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/90 transition-colors hover:bg-white/20"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Next — right edge */}
      {total > 1 && (
        <button
          type="button"
          aria-label="下一张"
          onClick={(e) => {
            e.stopPropagation()
            next()
          }}
          className="absolute top-1/2 right-3 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/90 transition-colors hover:bg-white/20"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Image */}
      <CoolImg
        key={index}
        src={images[index]}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-[92vw] object-contain"
      />
    </div>
  )
}
