import { Fragment, useMemo, type ReactNode } from 'react'

// Coolapk text content is peppered with `[名字]` tokens that map to images.
// The actual emoji asset URL pattern is non-public (requires login on
// /v6/emojiPicture/list, OR the static map is buried in the dex / app
// config). Rather than ship broken image references, we render each token
// as a small pill chip — visual hint that it's an emoji, no failed
// requests, no console noise.
//
// Two shapes:
//   1. `renderCoolapkText(text)` / `useCoolapkText(text)` — for plain strings
//      (FeedCard, ReplyList, etc). Returns ReactNode tree.
//   2. `injectEmojiHTML(html)` — for already-sanitized HTML strings
//      (FeedDetailBody). Replaces tokens with `<span class="emoji-tag">`
//      via regex; caller re-sanitizes.

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

// Replace [name] tokens inside a HTML string with styled chips. Caller is
// responsible for sanitizing afterward — `class` and inline styles are in
// the FeedDetailBody allowlist already.
export function injectEmojiHTML(html: string): string {
  if (!html || html.indexOf('[') === -1) return html
  return html.replace(TOKEN_RE, (_match, name: string) => {
    const safe = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    return `<span class="emoji-tag" title="emoji: ${safe}">${safe}</span>`
  })
}
