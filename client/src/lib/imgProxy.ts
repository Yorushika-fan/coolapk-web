// Hosts where direct browser GETs are reliably WAF-blocked. The Coolapk
// Tencent EdgeOne CDN returns 567 + HTML error page when the request has a
// Referer/Origin header (browser default), even though `curl` without those
// headers gets 200. We pre-route such hosts through our /img proxy so the
// devtools network tab stays clean and there's no broken-image flicker.
const EAGER_PROXY_HOSTS = [
  'image.coolapk.com',
  'avatar.coolapk.com',
  'static.coolapk.com',
  's.coolapk.com',
]

export function shouldEagerProxy(src: string): boolean {
  if (!src) return false
  try {
    const host = new URL(src, window.location.origin).hostname.toLowerCase()
    return EAGER_PROXY_HOSTS.includes(host)
  } catch {
    return false
  }
}

export function proxiedSrc(src: string): string {
  return `/img?u=${encodeURIComponent(src)}`
}
