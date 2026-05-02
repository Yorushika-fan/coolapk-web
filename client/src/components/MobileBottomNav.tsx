import { Link, useLocation } from 'react-router'
import { NAV_REGISTRY, type NavEntry, type NavKey } from '@/components/LeftNav'
import { useSettingsStore } from '@/stores/settings'

// Mobile-only bottom tab bar. Replaces an earlier slide-in drawer that ran
// into stacking-context issues inside the sticky Header. Convention is
// what every native app does: 4-5 thumb-reachable destinations at the
// bottom of the viewport.
//
// We have 7 nav entries total — too many for a comfortable bar — so we
// always pin three (首页 / 搜索 / 设置) and fill the remaining two slots
// with whichever non-priority channels the user hasn't hidden in their
// settings. That keeps the most useful destinations one tap away while
// honoring the per-user nav-visibility config.

const PRIORITY: NavKey[] = ['home', 'search', 'settings']
const MAX_SLOTS = 5

export function MobileBottomNav() {
  const { pathname } = useLocation()
  const hiddenKeys = useSettingsStore((s) => s.hiddenNavKeys)

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

  // Settings is exempt from the hide-keys filter — it must stay reachable.
  const visible = NAV_REGISTRY.filter(
    (e) => e.key === 'settings' || !hiddenKeys.includes(e.key),
  )

  const home = visible.find((e) => e.key === 'home')
  const search = visible.find((e) => e.key === 'search')
  const settings = visible.find((e) => e.key === 'settings')!
  const fillers = visible
    .filter((e) => !PRIORITY.includes(e.key))
    .slice(0, MAX_SLOTS - [home, search, settings].filter(Boolean).length)

  // Layout order: home → channels → search → settings.
  const slots: NavEntry[] = []
  if (home) slots.push(home)
  slots.push(...fillers)
  if (search) slots.push(search)
  slots.push(settings)

  return (
    <nav
      aria-label="底部导航"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex h-14 max-w-7xl items-stretch">
        {slots.map((e) => {
          const active = isActive(e)
          return (
            <li key={e.key} className="flex-1">
              <Link
                to={e.to}
                aria-current={active ? 'page' : undefined}
                className={
                  'flex h-full flex-col items-center justify-center gap-0.5 transition-colors ' +
                  (active
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground active:text-foreground')
                }
              >
                <e.icon
                  className="h-[20px] w-[20px]"
                  strokeWidth={active ? 2.25 : 1.75}
                />
                <span
                  className={
                    'text-[11px] leading-none ' +
                    (active ? 'font-semibold' : 'font-medium')
                  }
                >
                  {e.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
