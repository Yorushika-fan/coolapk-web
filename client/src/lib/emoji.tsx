import { Fragment, useMemo, type ReactNode } from 'react'
import { EMOJI_MAP } from '@/lib/emojiMap'

// Coolapk text content is peppered with `[名字]` tokens. The 108-emoji
// canonical set ships as PNG assets under `/public/emoji/<index>.png` —
// extracted from the official Android v16.2.0 client (R.array.coolapk_
// emotion_array + matching res/drawable-v1 assets). `EMOJI_MAP` is the
// name → array-index lookup used to compose the URL. Tokens whose name
// isn't in the canonical set fall back to a small gray pill chip that
// shows the original bracketed text — these are typically prose like
// `[原文已删除]`, not real emoji.
//
// Two shapes:
//   1. `renderCoolapkText(text)` / `useCoolapkText(text)` — for plain strings
//      (FeedCard, ReplyList, etc). Returns ReactNode tree with `<img>` tags.
//   2. `injectEmojiHTML(html)` — for already-sanitized HTML strings
//      (FeedSnippet, FeedDetailBody). Replaces tokens via regex; caller
//      re-sanitizes (the `<img class="emoji-img">` shape is in both
//      allowlists).

// Token grammar: `[name]` where name is any non-bracket, non-newline, 1-12
// chars. Conservative — Coolapk feeds also use bracketed prose like
// `[原文已删除]` (5 chars, no spaces). 12-char cap keeps that as a chip too;
// acceptable visual outcome.
const TOKEN_RE = /\[([^\[\]\n\s]{1,12})\]/g

// Coolapk's `message` field on indexV8 / replyList items is HTML — hashtag
// links (`<a class="feed-link-tag">#xxx#</a>`), at-mentions, etc. Stripping
// to plain text is the right preview behavior; the FeedDetail page renders
// full HTML via FeedDetailBody.
function stripHtml(s: string): string {
  if (s.indexOf('<') === -1 && s.indexOf('&') === -1) return s
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    // Best-effort regex fallback (SSR / non-browser).
    return s
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
  }
  const doc = new DOMParser().parseFromString(s, 'text/html')
  return doc.body.textContent ?? ''
}

export function renderCoolapkText(text: string | null | undefined): ReactNode {
  if (!text) return null
  const plain = stripHtml(text)
  // Fast path — no emoji brackets after strip.
  if (plain.indexOf('[') === -1) return plain

  const out: ReactNode[] = []
  let lastIdx = 0
  let m: RegExpExecArray | null
  TOKEN_RE.lastIndex = 0
  while ((m = TOKEN_RE.exec(plain)) !== null) {
    const start = m.index
    const end = start + m[0].length
    if (start > lastIdx) out.push(plain.slice(lastIdx, start))
    const name = m[1]
    out.push(<EmojiPill key={`${start}-${name}`} name={name} />)
    lastIdx = end
  }
  if (lastIdx < plain.length) out.push(plain.slice(lastIdx))
  return out.map((node, i) => <Fragment key={i}>{node}</Fragment>)
}

export function useCoolapkText(text: string | null | undefined): ReactNode {
  return useMemo(() => renderCoolapkText(text), [text])
}

function EmojiPill({ name }: { name: string }) {
  const idx = EMOJI_MAP[name]
  if (idx !== undefined) {
    return (
      <img
        src={`/emoji/${idx}.png`}
        alt={name}
        title={name}
        loading="lazy"
        decoding="async"
        className="emoji-img"
      />
    )
  }
  return (
    <span
      className="emoji-tag mx-0.5 inline-block rounded bg-secondary/60 px-1 py-0 text-[0.78em] leading-[1.4] text-muted-foreground align-baseline"
      title={`emoji: ${name}`}
    >
      {name}
    </span>
  )
}

// Convert `<a [class=...] href=...>...</a>` into
// `<span class="<orig> feed-html-link">...</span>`. Used by FeedSnippet
// (card / reply previews) so the body markup keeps hashtag/at-mention
// classes for color styling without nesting anchors inside the outer
// `<Link>` that wraps card surfaces.
export function dropAnchorsToSpans(html: string): string {
  if (!html || html.indexOf('<a') === -1) return html
  return html
    .replace(/<a\b([^>]*)>/gi, (_match, attrs) => {
      const m = String(attrs).match(/class\s*=\s*"([^"]*)"/i)
      const cls = (m ? `${m[1]} ` : '') + 'feed-html-link'
      return `<span class="${cls}">`
    })
    .replace(/<\/a>/gi, '</span>')
}

// Replace [name] tokens inside a HTML string. Known names render as a
// `<img class="emoji-img" src="/emoji/<idx>.png">`; unknown names keep
// the gray pill chip. Caller re-sanitizes — both `<img>` and the pill
// shape are in the FeedSnippet / FeedDetailBody allowlists.
export function injectEmojiHTML(html: string): string {
  if (!html || html.indexOf('[') === -1) return html
  return html.replace(TOKEN_RE, (_match, name: string) => {
    const safe = name
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
    const idx = EMOJI_MAP[name]
    if (idx !== undefined) {
      return `<img class="emoji-img" src="/emoji/${idx}.png" alt="${safe}" title="${safe}" loading="lazy" />`
    }
    return `<span class="emoji-tag" title="emoji: ${safe}">${safe}</span>`
  })
}
