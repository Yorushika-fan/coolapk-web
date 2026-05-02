// Classification + data extraction helpers for Coolapk's `entityType=card`
// templates that appear in /v6/main/indexV8 alongside user feeds. Shared
// between Home.tsx (which separates them into a side-rail layout) and
// EntityCardRenderer.tsx (which renders them inline elsewhere).

type EntityLike = {
  entityType?: string
  entityTemplate?: string
  entities?: unknown[]
}

type Inner = Record<string, unknown>

export type CardSlot = 'carousel' | 'iconChips' | null

export function classifyCard(template: string | undefined | null): CardSlot {
  const tpl = template ?? ''
  if (!tpl) return null
  if (tpl.startsWith('imageCarouselCard') || tpl === 'imageScrollCard') {
    return 'carousel'
  }
  // The whole iconXxxCard family collapses to the same horizontal-row
  // visual treatment in our app — Coolapk uses subtle variations
  // (long-title, button-styled, tabbed) but they all share `entities[]`
  // with `pic`+`title`+`url` fields, so IconChipsRow handles them.
  if (
    tpl === 'iconLinkGridCard' ||
    tpl === 'iconMiniScrollCard' ||
    tpl === 'iconLinkScrollCard' ||
    tpl === 'iconScrollCard' ||
    tpl === 'iconGridCard' ||
    tpl === 'iconLongTitleGridCard' ||
    tpl === 'iconButtonGridCard' ||
    tpl === 'iconTabLinkGridCard'
  ) {
    return 'iconChips'
  }
  return null
}

export type SimpleEntry = {
  pic: string
  title: string
  url: string
  entityType?: string
}

export function extractCarouselItems(entity: EntityLike): SimpleEntry[] {
  const inner = (entity.entities ?? []) as Inner[]
  return inner
    .filter(
      (e) =>
        typeof e['pic'] === 'string' && (e['pic'] as string).length > 0,
    )
    .map((e) => ({
      pic: e['pic'] as string,
      title: (e['title'] as string) ?? '',
      url: (e['url'] as string) ?? '',
      entityType: (e['entityType'] as string) ?? undefined,
    }))
}

export function extractIconChipsItems(entity: EntityLike): SimpleEntry[] {
  const inner = (entity.entities ?? []) as Inner[]
  return inner
    .map((e) => ({
      pic:
        (e['logo'] as string) ||
        (e['pic'] as string) ||
        (e['icon'] as string) ||
        '',
      title: (e['title'] as string) ?? '',
      url: (e['url'] as string) ?? '',
      entityType: (e['entityType'] as string) ?? undefined,
    }))
    .filter((e) => e.title)
}
