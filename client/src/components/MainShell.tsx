import { useEffect, type ReactNode } from 'react'
import { Header } from '@/components/Header'
import { LeftNav } from '@/components/LeftNav'

// Three-column shell used by every top-level page. Left nav is sticky on
// `lg+` and hidden below; content is the main flex-1 column; the optional
// right rail (used by Home for icon chip rows) stacks above content on
// small viewports and sits to the right on lg+.
//
// `scrollMode` controls scroll behavior on mount:
//   - 'top' (default) — reset to top, the right thing for fresh detail
//     pages (Feed, User, Topic, Page, Search) so navigating in always
//     starts at the page header instead of inheriting the previous
//     route's scroll offset.
//   - 'manual' — caller handles its own scroll restoration. Used by Home
//     so it can resume the cached scrollY when returning from a detail.

export function MainShell({
  children,
  rightRail,
  className,
  scrollMode = 'top',
}: {
  children: ReactNode
  rightRail?: ReactNode
  className?: string
  scrollMode?: 'top' | 'manual'
}) {
  useEffect(() => {
    if (scrollMode === 'top') {
      window.scrollTo(0, 0)
    }
  }, [scrollMode])

  return (
    <div>
      <Header />
      <main
        className={'mx-auto max-w-7xl p-4 ' + (className ?? '')}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <LeftNav />
          <div className="order-3 min-w-0 flex-1 lg:order-2">{children}</div>
          {rightRail && (
            <aside className="order-2 lg:sticky lg:top-[4.25rem] lg:order-3 lg:max-h-[calc(100vh-5rem)] lg:w-80 lg:shrink-0 lg:overflow-y-auto">
              <div className="space-y-3">{rightRail}</div>
            </aside>
          )}
        </div>
      </main>
    </div>
  )
}
