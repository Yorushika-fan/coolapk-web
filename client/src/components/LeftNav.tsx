import { Link, useLocation, useSearchParams } from 'react-router'
import {
  Compass,
  Home,
  Newspaper,
  Settings as SettingsIcon,
  Smartphone,
  Sparkles,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { useSettingsStore } from '@/stores/settings'

// Persistent left nav that surfaces top-level Coolapk channels. Hidden on
// viewports below `lg` (we don't have the width and the channels live in
// the right rail's icon-chip rows on smaller screens via Home).

export type NavKey =
  | 'home'
  | 'digital'
  | 'news'
  | 'worth'
  | 'activities'
  | 'search'
  | 'settings'

export type NavEntry = {
  key: NavKey
  label: string
  icon: LucideIcon
  to: string
  // For /p/:slug entries, the slug we should match against the route.
  matchSlug?: string
}

// Registry shared with Settings → 左侧菜单 panel so toggles target stable
// `key` strings instead of i18n-fragile labels.
export const NAV_REGISTRY: NavEntry[] = [
  { key: 'home', label: '首页', icon: Home, to: '/' },
  {
    key: 'digital',
    label: '数码',
    icon: Smartphone,
    to: '/p/V10_DIGITAL_HOME?title=数码',
    matchSlug: 'V10_DIGITAL_HOME',
  },
  {
    key: 'news',
    label: '热闻',
    icon: Newspaper,
    to: '/p/V8_JINRI_NEWS?title=热闻',
    matchSlug: 'V8_JINRI_NEWS',
  },
  {
    key: 'worth',
    label: '值得看',
    icon: Sparkles,
    to: '/p/V8_ZHUANTI_20180327?title=值得看',
    matchSlug: 'V8_ZHUANTI_20180327',
  },
  {
    key: 'activities',
    label: '活动',
    icon: Trophy,
    to: '/p/V11_ACTIVITIES?title=活动',
    matchSlug: 'V11_ACTIVITIES',
  },
  { key: 'search', label: '搜索', icon: Compass, to: '/search' },
  { key: 'settings', label: '设置', icon: SettingsIcon, to: '/settings' },
]

export function LeftNav() {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const hiddenKeys = useSettingsStore((s) => s.hiddenNavKeys)

  const isActive = (e: NavEntry): boolean => {
    if (e.to.startsWith('/p/') && e.matchSlug) {
      return pathname === `/p/${e.matchSlug}`
    }
    if (e.to === '/') return pathname === '/'
    if (e.to === '/search') return pathname.startsWith('/search')
    if (e.to === '/settings') return pathname.startsWith('/settings')
    // Fallback: ignore querystring
    const targetPath = e.to.split('?')[0]
    return pathname === targetPath
  }

  // Close any in-page text selection / focus state when re-clicking the
  // current page entry — but otherwise no special behavior.
  void searchParams

  // Settings entry is always shown — hiding it would strand the user
  // (no nav way back to toggle it on again).
  const visible = NAV_REGISTRY.filter(
    (e) => e.key === 'settings' || !hiddenKeys.includes(e.key),
  )

  return (
    <nav
      aria-label="主导航"
      className="hidden lg:sticky lg:top-[4.25rem] lg:order-1 lg:block lg:w-44 lg:shrink-0"
    >
      <ul className="space-y-0.5">
        {visible.map((e) => {
          const active = isActive(e)
          return (
            <li key={e.key}>
              <Link
                to={e.to}
                className={
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-colors ' +
                  (active
                    ? 'bg-card font-semibold text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4)]'
                    : 'text-muted-foreground hover:bg-card/70 hover:text-foreground')
                }
                aria-current={active ? 'page' : undefined}
              >
                <e.icon
                  className="h-[18px] w-[18px]"
                  strokeWidth={active ? 2 : 1.75}
                />
                <span>{e.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
