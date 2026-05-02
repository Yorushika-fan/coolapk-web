import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

// Floating "回到顶部" pill — appears after the user scrolls past 400px,
// fixed bottom-right with safe-area inset for mobile. Smooth-scrolls
// home on click. Mounted once globally in App.tsx.

const SHOW_AFTER_PX = 400

export function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      type="button"
      aria-label="回到顶部"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={
        // bottom-20 on mobile clears the fixed `MobileBottomNav` (h-14)
        // plus a small breathing gap; lg+ falls back to bottom-5.
        'fixed right-5 bottom-20 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.18)] lg:bottom-5 dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.7)] ' +
        (visible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-2 opacity-0')
      }
    >
      <ArrowUp className="h-4 w-4" strokeWidth={2} />
    </button>
  )
}
