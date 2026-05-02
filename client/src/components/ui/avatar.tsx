import {
  useMemo,
  useState,
  type HTMLAttributes,
  type ImgHTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'
import { proxiedSrc, shouldEagerProxy } from '@/lib/imgProxy'

export function Avatar({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted',
        className,
      )}
      {...rest}
    />
  )
}

export function AvatarImage({
  className,
  src,
  alt = '',
  ...rest
}: ImgHTMLAttributes<HTMLImageElement>) {
  // For known-blocked CDN hosts (avatar.coolapk.com WAFs browser requests
  // because Referer/Origin are present) we go straight to /img proxy.
  // Other hosts try direct, then fall back to proxy on error, then hide.
  const eager = useMemo(() => (src ? shouldEagerProxy(String(src)) : false), [src])
  const [stage, setStage] = useState<'first' | 'proxy' | 'failed'>('first')
  if (!src || stage === 'failed') return null
  const useProxy = eager || stage === 'proxy'
  const finalSrc = useProxy ? proxiedSrc(String(src)) : String(src)
  return (
    <img
      src={finalSrc}
      alt={alt}
      onError={() =>
        setStage((prev) => {
          // direct → proxy → give up. eager skips the direct attempt.
          if (prev === 'first') return eager ? 'failed' : 'proxy'
          return 'failed'
        })
      }
      // AvatarImage is mounted BEFORE AvatarFallback in JSX (`<Image />`
      // then `<Fallback />`), so by DOM order the fallback would naturally
      // stack on top. Explicit z-10 forces image above; on error we
      // return null and the fallback (z-0) becomes visible.
      className={cn('absolute inset-0 z-10 h-full w-full object-cover', className)}
      {...rest}
    />
  )
}

export function AvatarFallback({
  className,
  children,
}: {
  className?: string
  children?: ReactNode
}) {
  return (
    <div
      className={cn(
        'absolute inset-0 flex items-center justify-center bg-muted text-xs text-muted-foreground',
        className,
      )}
    >
      {children}
    </div>
  )
}
