import { useMemo, useState, type ImgHTMLAttributes } from 'react'
import { proxiedSrc, shouldEagerProxy } from '@/lib/imgProxy'

type ImgProps = ImgHTMLAttributes<HTMLImageElement> & { src: string; alt?: string }

export function CoolImg({ src, alt = '', ...rest }: ImgProps) {
  const eager = useMemo(() => shouldEagerProxy(src), [src])
  const [errored, setErrored] = useState(false)
  const finalSrc = eager || errored ? proxiedSrc(src) : src
  return (
    <img
      src={finalSrc}
      alt={alt}
      loading="lazy"
      onError={() => setErrored((prev) => prev || true)}
      {...rest}
    />
  )
}
