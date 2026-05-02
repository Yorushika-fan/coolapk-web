import type { FeedItem } from '@/lib/types'
import { FeedCard } from '@/components/FeedCard'
import { CarouselBanner } from '@/components/cards/CarouselBanner'
import { IconChipsRow } from '@/components/cards/IconChipsRow'
import {
  classifyCard,
  extractCarouselItems,
  extractIconChipsItems,
} from '@/lib/entityKind'

// Inline-list dispatcher — used wherever a single entity should fall into
// its own card. Home.tsx no longer uses this (it pulls carousels + chips
// out into a side-rail layout); kept for any future page that wants the
// flat one-column treatment.

type EntityLike = {
  entityType?: string
  entityTemplate?: string
  entityId?: string | number
  id?: string | number
  title?: string
  url?: string
  entities?: unknown[]
}

export function EntityCardRenderer({ entity }: { entity: EntityLike }) {
  const et = entity.entityType
  if (et === 'feed') {
    return <FeedCard item={entity as unknown as FeedItem} />
  }
  if (et === 'card') {
    const slot = classifyCard(entity.entityTemplate)
    if (slot === 'carousel') {
      const items = extractCarouselItems(entity)
      if (!items.length) return null
      return <CarouselBanner items={items} title={entity.title ?? ''} />
    }
    if (slot === 'iconChips') {
      const items = extractIconChipsItems(entity)
      if (!items.length) return null
      return <IconChipsRow items={items} title={entity.title ?? ''} />
    }
    return null
  }
  return null
}
