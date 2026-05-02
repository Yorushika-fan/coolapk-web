import type { FeedItem } from '@/lib/types'
import type { FilterRule } from '@/stores/settings'

// Pull `#xxx#` hashtag names out of a Coolapk feed message. Two sources:
//   1. `<a class="feed-link-tag" href="/t/xxx">#xxx#</a>` anchors emitted
//      by the server.
//   2. Raw `#name#` runs in plain-text bodies (older feeds, captioned
//      images). Conservative pattern: 1-30 chars, no whitespace.
const TAG_ANCHOR_RE = /<a\b[^>]*class="[^"]*feed-link-tag[^"]*"[^>]*>(.*?)<\/a>/gi
const TAG_PLAIN_RE = /#([^\s#]{1,30})#/g

export function extractTags(html: string | undefined | null): string[] {
  if (!html) return []
  const out = new Set<string>()
  let m: RegExpExecArray | null
  TAG_ANCHOR_RE.lastIndex = 0
  while ((m = TAG_ANCHOR_RE.exec(html)) !== null) {
    const inner = m[1].replace(/<[^>]*>/g, '')
    const name = inner.replace(/^#+|#+$/g, '').trim()
    if (name) out.add(name)
  }
  TAG_PLAIN_RE.lastIndex = 0
  while ((m = TAG_PLAIN_RE.exec(html)) !== null) {
    const name = m[1].trim()
    if (name) out.add(name)
  }
  return [...out]
}

// Strip HTML for content matching. Same fallback strategy as emoji.tsx
// — DOMParser when available, regex otherwise.
function htmlToText(s: string | undefined | null): string {
  if (!s) return ''
  if (s.indexOf('<') === -1 && s.indexOf('&') === -1) return s
  if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
    return new DOMParser().parseFromString(s, 'text/html').body.textContent ?? ''
  }
  return s
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function safeRegex(pattern: string): RegExp | null {
  try {
    return new RegExp(pattern, 'i')
  } catch {
    return null
  }
}

function matchOne(rule: FilterRule, target: string): boolean {
  const v = rule.value.trim()
  if (!v) return false
  if (rule.mode === 'exact') {
    return target.toLowerCase() === v.toLowerCase()
  }
  if (rule.mode === 'fuzzy') {
    return target.toLowerCase().includes(v.toLowerCase())
  }
  if (rule.mode === 'regex') {
    const re = safeRegex(v)
    return re ? re.test(target) : false
  }
  return false
}

function ruleMatches(rule: FilterRule, item: FeedItem): boolean {
  if (!rule.enabled) return false
  if (!rule.value.trim()) return false

  if (rule.field === 'tag') {
    const tags = extractTags(item.message)
    return tags.some((t) => matchOne(rule, t))
  }

  if (rule.field === 'user') {
    // Match against username AND uid so the user can paste either.
    return (
      matchOne(rule, item.username || '') ||
      matchOne(rule, item.uid || '')
    )
  }

  if (rule.field === 'content') {
    const title = item.message_title || ''
    const body = htmlToText(item.message)
    return matchOne(rule, title) || matchOne(rule, body)
  }

  return false
}

// True if any enabled rule matches — caller filters those out.
export function isFeedFiltered(item: FeedItem, rules: FilterRule[]): boolean {
  for (const r of rules) if (ruleMatches(r, item)) return true
  return false
}

export function applyFeedFilters<T extends FeedItem>(
  items: T[],
  rules: FilterRule[],
): T[] {
  if (!rules.length) return items
  const enabled = rules.filter((r) => r.enabled && r.value.trim())
  if (!enabled.length) return items
  return items.filter((it) => !isFeedFiltered(it, enabled))
}
