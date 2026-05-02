import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

// Mirrors FeedCard's actual layout — avatar + 2 short text lines for the
// header, a single-image-style placeholder, and a footer chip row. Closer
// shape == less perceived layout shift when the real card swaps in.
export function FeedCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 pb-2">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="grid grid-cols-3 gap-1.5 pt-2">
          <Skeleton className="aspect-square rounded-md" />
          <Skeleton className="aspect-square rounded-md" />
          <Skeleton className="aspect-square rounded-md" />
        </div>
        <div className="mt-2 flex gap-5 border-t border-border pt-2">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-10" />
        </div>
      </CardContent>
    </Card>
  )
}
