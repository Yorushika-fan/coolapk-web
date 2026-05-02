import {
  createContext,
  useContext,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

// Tabs styling follows the Twitter / Threads / 即刻 convention: a thin
// bottom border across the strip, with the active trigger getting a short
// underline accent under the label only (not the full button width). The
// look is calmer than pill-style and reads as more editorial — the right
// vibe for content discovery surfaces.

type TabsCtx = {
  value: string
  setValue: (v: string) => void
}

const TabsContext = createContext<TabsCtx | null>(null)

export function Tabs({
  value,
  onValueChange,
  className,
  children,
}: {
  value: string
  onValueChange: (v: string) => void
  className?: string
  children: ReactNode
}) {
  return (
    <TabsContext.Provider value={{ value, setValue: onValueChange }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn(
        'scrollbar-thin flex w-full items-center gap-1 overflow-x-auto border-b border-border',
        className,
      )}
      {...rest}
    />
  )
}

export function TabsTrigger({
  value: val,
  className,
  children,
}: {
  value: string
  className?: string
  children: ReactNode
}) {
  const ctx = useContext(TabsContext)
  if (!ctx) return null
  const active = ctx.value === val
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => ctx.setValue(val)}
      className={cn(
        'relative shrink-0 whitespace-nowrap px-4 py-3 text-[14px] transition-colors',
        active
          ? 'font-semibold text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-foreground'
          : 'font-medium text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({
  value: val,
  className,
  children,
}: {
  value: string
  className?: string
  children: ReactNode
}) {
  const ctx = useContext(TabsContext)
  if (!ctx || ctx.value !== val) return null
  return (
    <div role="tabpanel" className={cn('pt-5', className)}>
      {children}
    </div>
  )
}
