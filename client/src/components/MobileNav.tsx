import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NAV_REGISTRY, type NavEntry } from '@/components/LeftNav'
import { useSettingsStore } from '@/stores/settings'

// Mobile-only navigation drawer. Mirrors LeftNav's entry set + active-state
// styling, but renders as a slide-in panel triggered by a hamburger in the
// Header. Hidden on `lg+` (LeftNav already covers desktop) and follows the
// same hidden-keys settings so the user can shrink the menu on mobile too.
//
// Animation: panel + backdrop are always rendered with `translate-x-full /
// 0` toggled by `open`, so opening / closing is one CSS transition (no
// unmount flash). `pointer-events-none` on the wrapper while closed
// keeps the offscreen panel from intercepting taps.

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const hiddenKeys = useSettingsStore((s) => s.hiddenNavKeys)

  // Close on route change so the drawer doesn't linger after navigating.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Esc to close, lock body scroll while open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  const isActive = (e: NavEntry): boolean => {
    if (e.to.startsWith('/p/') && e.matchSlug) {
      return pathname === `/p/${e.matchSlug}`
    }
    if (e.to === '/') return pathname === '/'
    if (e.to === '/search') return pathname.startsWith('/search')
    if (e.to === '/settings') return pathname.startsWith('/settings')
    const targetPath = e.to.split('?')[0]
    return pathname === targetPath
  }

  // Settings entry always visible — same rule as LeftNav.
  const visible = NAV_REGISTRY.filter(
    (e) => e.key === 'settings' || !hiddenKeys.includes(e.key),
  )

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="打开导航菜单"
        aria-expanded={open}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div
        className={
          'fixed inset-0 z-50 lg:hidden ' +
          (open ? 'pointer-events-auto' : 'pointer-events-none')
        }
        aria-hidden={!open}
      >
        {/* Backdrop */}
        <div
          className={
            'absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ' +
            (open ? 'opacity-100' : 'opacity-0')
          }
          onClick={() => setOpen(false)}
        />
        {/* Panel */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="主导航"
          className={
            'absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-card shadow-2xl transition-transform duration-250 ease-out ' +
            (open ? 'translate-x-0' : '-translate-x-full')
          }
        >
          <div className="flex h-14 items-center justify-between border-b border-border px-4">
            <span className="text-base font-semibold tracking-tight">
              Coolapk
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              aria-label="关闭导航"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ul className="flex-1 space-y-0.5 overflow-y-auto p-2">
            {visible.map((e) => {
              const active = isActive(e)
              return (
                <li key={e.key}>
                  <Link
                    to={e.to}
                    className={
                      'flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] transition-colors ' +
                      (active
                        ? 'bg-muted font-semibold text-foreground'
                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground')
                    }
                    aria-current={active ? 'page' : undefined}
                  >
                    <e.icon
                      className="h-[20px] w-[20px]"
                      strokeWidth={active ? 2 : 1.75}
                    />
                    <span>{e.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </>
  )
}
