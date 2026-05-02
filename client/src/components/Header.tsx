import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { Moon, Search as SearchIcon, Sun, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useThemeStore } from '@/stores/theme'

// Scroll-direction-aware sticky: scroll-down hides the bar, scroll-up
// brings it back. Threshold of 12px on each axis avoids the bar flapping
// during sub-pixel scroll wheel jitter; staying within 80px of the top
// always keeps it visible so the page header is the first thing on a new
// route. Convention follows Twitter / 即刻 / modern Weibo.
function useHideOnScroll(): boolean {
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    let lastY = window.scrollY
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        const y = window.scrollY
        const dy = y - lastY
        if (y < 80) setHidden(false)
        else if (dy > 12) setHidden(true)
        else if (dy < -12) setHidden(false)
        lastY = y
        raf = 0
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return hidden
}

export function Header() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const isDark = useThemeStore((s) => s.isDark)
  const toggle = useThemeStore((s) => s.toggle)
  const [q, setQ] = useState<string>(params.get('q') ?? '')
  const [mobileOpen, setMobileOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const hidden = useHideOnScroll()

  useEffect(() => {
    if (mobileOpen) inputRef.current?.focus()
  }, [mobileOpen])

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const value = q.trim()
    if (!value) return
    navigate(`/search?q=${encodeURIComponent(value)}&type=feed`)
    setMobileOpen(false)
  }

  // Twitter / 即刻 convention: tapping the logo while already on home
  // scrolls back to the top of the timeline instead of being a no-op.
  const onLogoClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (pathname === '/') {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <header
      className={
        'sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur transition-transform duration-200 ' +
        (hidden && !mobileOpen ? '-translate-y-full' : 'translate-y-0')
      }
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
        <Link
          to="/"
          onClick={onLogoClick}
          className={`text-base font-semibold tracking-tight ${mobileOpen ? 'hidden sm:inline' : ''}`}
          aria-label="Coolapk Home"
        >
          Coolapk
        </Link>

        <form
          onSubmit={onSubmit}
          className={`flex max-w-md flex-1 items-center ${mobileOpen ? 'flex' : 'hidden sm:flex'} sm:mx-auto`}
          role="search"
        >
          <Input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索动态、用户、话题…"
            aria-label="Search"
            className="w-full"
          />
        </form>

        {!mobileOpen && <div className="flex-1 sm:hidden" />}

        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close search' : 'Open search'}
          aria-pressed={mobileOpen}
        >
          {mobileOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <SearchIcon className="h-4 w-4" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label="Toggle dark mode"
          aria-pressed={isDark}
        >
          {isDark ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </header>
  )
}
