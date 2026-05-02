import { Link } from 'react-router'
import { Filter } from 'lucide-react'

// Tiny inline notice surfaced by feed lists when their content has been
// hidden by the user's filter rules. Kept passive (no dismiss button) —
// removing the rules in Settings is the way to make it disappear.
export function FilteredHint({ count }: { count: number }) {
  if (!count) return null
  return (
    <Link
      to="/settings"
      className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Filter className="h-3.5 w-3.5" />
      <span>
        已根据你的过滤规则隐藏 {count} 条 ·{' '}
        <span className="underline">前往设置调整</span>
      </span>
    </Link>
  )
}
