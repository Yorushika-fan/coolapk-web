import { ChipEntry } from '@/components/cards/ChipEntry'
import type { SimpleEntry } from '@/lib/entityKind'

// Responsive grid of icon chips. Used by channel pages (Page.tsx) where
// we want to surface every entry in a tab without forcing horizontal
// scroll. Columns: 4 → 5 → 6 → 7 across viewport breakpoints so chip
// width stays within the 56-72px sweet spot.

export function ChipGrid({ items }: { items: SimpleEntry[] }) {
  if (!items.length) return null
  return (
    <div className="grid grid-cols-4 gap-x-3 gap-y-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7">
      {items.map((it, i) => (
        <ChipEntry key={`${it.title}-${i}`} item={it} />
      ))}
    </div>
  )
}
