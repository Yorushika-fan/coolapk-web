// Resolve a Coolapk-internal route reference into a navigation target.
// Three outcomes:
//   - spa:      SPA route we own (e.g. /t/<tag>, /u/<uid>, /feed/<id>)
//   - external: open https://www.coolapk.com/... or the verbatim https URL
//   - none:     nothing actionable; render as static text
//
// Coolapk's chip entities (`iconLinkGridCard`, `iconMiniScrollCard`) include
// an `entityType` we use to upgrade product/topic entries with no `/t/`
// url to a SPA topic route, since products and same-named topics share
// content surfaces in our app.

const SPA_PREFIXES = ['/t/', '/u/', '/feed/', '/p/']

export type ResolvedLink =
  | { kind: 'spa'; path: string }
  | { kind: 'external'; href: string }
  | { kind: 'none' }

export function resolveLink(
  rawUrl: string | null | undefined,
  options?: { entityType?: string; title?: string },
): ResolvedLink {
  const url = (rawUrl ?? '').trim()

  // `/page?url=<slug>[&...]` is Coolapk's channel-page convention. Map to
  // our SPA `/p/<slug>` route, carrying the entry's title if available so
  // the page can render its header without a roundtrip.
  if (url.startsWith('/page?url=')) {
    const tail = url.slice('/page?url='.length)
    const slug = tail.split('&')[0]
    if (slug) {
      const titleSuffix = options?.title
        ? `?title=${encodeURIComponent(options.title)}`
        : ''
      return { kind: 'spa', path: `/p/${slug}${titleSuffix}` }
    }
  }

  // Direct SPA-mapped path.
  if (url && SPA_PREFIXES.some((p) => url.startsWith(p))) {
    return { kind: 'spa', path: url.split('?')[0] }
  }

  // Verbatim https / http external link.
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return { kind: 'external', href: url }
  }

  // Promotion: topic/product entities → SPA topic page (uses title).
  const et = options?.entityType
  const title = options?.title
  if ((et === 'topic' || et === 'product') && title) {
    return { kind: 'spa', path: `/t/${encodeURIComponent(title)}` }
  }

  // Remaining internal paths (e.g. /page?url=..., /product/<id>, /apk/<pkg>)
  // belong to the Coolapk app routes that we don't render — fall back to
  // the web origin which has its own renderer.
  if (url.startsWith('/')) {
    return { kind: 'external', href: `https://www.coolapk.com${url}` }
  }
  if (url.startsWith('#')) {
    const cleaned = url.slice(1)
    if (cleaned.startsWith('/')) {
      return {
        kind: 'external',
        href: `https://www.coolapk.com${cleaned}`,
      }
    }
  }
  return { kind: 'none' }
}

// Back-compat wrapper for callers that just want a string URL (mostly the
// CarouselBanner with title-less ad slots).
export function resolveCoolapkLink(raw: string | undefined | null): string {
  const r = resolveLink(raw)
  if (r.kind === 'external') return r.href
  if (r.kind === 'spa') return r.path
  return ''
}
