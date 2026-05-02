import { Card } from '@/components/ui/card'
import { ChipEntry } from '@/components/cards/ChipEntry'
import type { SimpleEntry } from '@/lib/entityKind'

// Compact icon + caption row. Used for the home side rail (lg+) and
// channel "secondary nav" rows where horizontal scroll is the right
// affordance. For tabbed channel pages see <ChipGrid>.

export function IconChipsRow({
  items,
  title,
}: {
  items: SimpleEntry[]
  title: string
}) {
  return (
    <Card className="overflow-hidden">
      {title && (
        <div className="px-4 pt-3 text-[13px] font-medium text-muted-foreground">
          {title}
        </div>
      )}
      <div className="scrollbar-thin flex gap-3 overflow-x-auto px-4 py-3">
        {items.map((it, i) => (
          <div key={`${it.title}-${i}`} className="w-16 shrink-0">
            <ChipEntry item={it} />
          </div>
        ))}
      </div>
    </Card>
  )
}
