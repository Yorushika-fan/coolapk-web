import { Button } from '@/components/ui/button'

export function ErrorBanner({
  error,
  onRetry,
}: {
  error: Error | null
  onRetry?: () => void
}) {
  if (!error) return null
  return (
    <div
      role="alert"
      className="my-4 flex items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      <span className="truncate">{error.message || '出错了，请稍后重试'}</span>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          重试
        </Button>
      )}
    </div>
  )
}
