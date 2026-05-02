import { useMemo, type MouseEvent } from 'react'
import { useNavigate } from 'react-router'
import DOMPurify from 'dompurify'
import { injectEmojiHTML } from '@/lib/emoji'

const ALLOWED_TAGS = [
  'a',
  'b',
  'br',
  'code',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'i',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  'span',
  'strong',
  'u',
  'ul',
]

const ALLOWED_ATTR = ['href', 'src', 'alt', 'title', 'class', 'target', 'rel', 'loading']

// Coolapk's HTML body uses absolute paths like `/t/<tag>?type=0`,
// `/u/<uid>`, `/feed/<id>`. We intercept clicks on those paths so SPA
// navigation kicks in instead of full-page reload (or no-op against our
// SPA's missing routes).
const SPA_INTERNAL_PREFIXES = ['/t/', '/u/', '/feed/']

export function FeedDetailBody({ html }: { html: string }) {
  const navigate = useNavigate()

  const safe = useMemo(() => {
    if (!html) return ''
    // First sanitize, then inject emoji <span>s, then sanitize again so the
    // injected tags can never widen the surface area beyond ALLOWED_*.
    const firstPass = DOMPurify.sanitize(html, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
    })
    const withEmoji = injectEmojiHTML(firstPass)
    return DOMPurify.sanitize(withEmoji, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
    })
  }, [html])

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null
    const anchor = target?.closest('a') as HTMLAnchorElement | null
    if (!anchor) return
    // Modifier-click escape hatch (open in new tab) — let the browser do it.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    const raw = anchor.getAttribute('href') || ''
    if (!raw) return
    const isInternal = SPA_INTERNAL_PREFIXES.some((p) => raw.startsWith(p))
    if (!isInternal) return
    e.preventDefault()
    // Strip the trailing `?type=0` Coolapk hashtag links carry. The path
    // tag/uid/id stays URL-encoded which is what SPA routes expect.
    const path = raw.split('?')[0]
    navigate(path)
  }

  if (!safe) return null
  // Coolapk hashtags / at-mentions / quoted-feed links all come through as
  // `<a>` tags. Color them blue (Coolapk-app convention), drop the default
  // underline, restore underline on hover so the link affordance is still
  // clear without making the body look footnote-y.
  return (
    <div
      className="feed-html break-words text-[15px] leading-[1.75] text-foreground/90"
      onClick={onClick}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  )
}
