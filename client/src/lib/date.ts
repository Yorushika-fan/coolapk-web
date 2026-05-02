// Coolapk-style relative time formatter.
//
// Accepts unix seconds or milliseconds (auto-detected via magnitude). Returns
// localized Chinese relative strings up to 7 days, then absolute MM-DD HH:mm
// for the current year, or YYYY-MM-DD for older posts. Used everywhere that
// previously called local `formatDate` helpers.

const sameYearFmt = new Intl.DateTimeFormat('zh-CN', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

const olderYearFmt = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function relativeTime(ts: number | undefined | null): string {
  if (!ts) return ''
  const ms = ts > 1e12 ? ts : ts * 1000
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return ''
  const now = Date.now()
  const diffSec = Math.floor((now - ms) / 1000)

  if (diffSec < 60) return '刚刚'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} 分钟前`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} 小时前`
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)} 天前`

  const nowYear = new Date(now).getFullYear()
  if (date.getFullYear() === nowYear) {
    try {
      return sameYearFmt.format(date)
    } catch {
      return ''
    }
  }
  try {
    return olderYearFmt.format(date)
  } catch {
    return ''
  }
}
