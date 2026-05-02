import { Link } from 'react-router'
import { CoolImg } from '@/components/CoolImg'
import { resolveLink } from '@/lib/coolapkLink'
import type { SimpleEntry } from '@/lib/entityKind'

// Single icon + label tile, used by both the horizontal IconChipsRow and
// the grid-mode ChipGrid (channel pages). Routes via resolveLink so
// topic / product entries land on the SPA topic page; channel pages on
// /p/<slug>; everything else opens a new tab against coolapk.com.

export function ChipEntry({ item }: { item: SimpleEntry }) {
  const link = resolveLink(item.url, {
    entityType: item.entityType,
    title: item.title,
  })

  const Inner = (
    <div className="flex w-full flex-col items-center gap-1.5">
      <div className="h-14 w-14 overflow-hidden rounded-xl bg-muted">
        {item.pic ? (
          <CoolImg
            src={item.pic}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            {item.title.slice(0, 1)}
          </div>
        )}
      </div>
      <span className="line-clamp-1 w-full text-center text-[11.5px] text-foreground/85">
        {item.title}
      </span>
    </div>
  )

  if (link.kind === 'spa') {
    return (
      <Link to={link.path} title={item.title} className="block">
        {Inner}
      </Link>
    )
  }
  if (link.kind === 'external') {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        title={item.title}
        className="block"
      >
        {Inner}
      </a>
    )
  }
  return <div>{Inner}</div>
}
