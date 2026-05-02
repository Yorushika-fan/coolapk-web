import { useMemo } from 'react'
import DOMPurify from 'dompurify'
import { dropAnchorsToSpans, injectEmojiHTML } from '@/lib/emoji'

// Shared HTML renderer for "preview" surfaces (FeedCard, ReplyList,
// NestedReplies, user replies). Pipeline:
//
//   1. Sanitize allowing `<a>` so we can capture hashtag/at-mention classes.
//   2. Convert anchors → spans (`feed-html-link` class) so the surrounding
//      Card-as-`<Link>` doesn't end up with nested anchors.
//   3. Inject `<span class="emoji-tag">` for `[name]` tokens.
//   4. Final sanitize without `<a>`; classes preserved.
//
// Color styling lives in `index.css` under `.feed-html ...` selectors so
// it applies uniformly to both this component and FeedDetailBody.

const STAGE1_TAGS = [
  'a',
  'b',
  'br',
  'em',
  'i',
  'p',
  'span',
  'strong',
  'u',
]
const STAGE1_ATTR = ['href', 'class', 'title']

const FINAL_TAGS = ['b', 'br', 'em', 'i', 'p', 'span', 'strong', 'u']
const FINAL_ATTR = ['class', 'title']

export function FeedSnippet({
  html,
  className,
}: {
  html: string | undefined | null
  className?: string
}) {
  const safe = useMemo(() => {
    if (!html) return ''
    const stage1 = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: STAGE1_TAGS,
      ALLOWED_ATTR: STAGE1_ATTR,
    })
    const stage2 = dropAnchorsToSpans(stage1)
    const stage3 = injectEmojiHTML(stage2)
    return DOMPurify.sanitize(stage3, {
      ALLOWED_TAGS: FINAL_TAGS,
      ALLOWED_ATTR: FINAL_ATTR,
    })
  }, [html])
  if (!safe) return null
  return (
    <div
      className={'feed-html whitespace-pre-wrap break-words ' + (className ?? '')}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  )
}
