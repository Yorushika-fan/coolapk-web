import { Skeleton } from '@/components/ui/skeleton'

// Tab-switch loading affordances. Mirror the visual mass of the real card
// so the layout doesn't reflow on data arrival.

export function ReplyItemSkeleton() {
  return (
    <div className="flex gap-3 border-b border-border py-3 last:border-0">
      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2 pt-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    </div>
  )
}

export function ReplyListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <ul>
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <ReplyItemSkeleton />
        </li>
      ))}
    </ul>
  )
}

export function UserCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
      <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  )
}

export function UserCardListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <UserCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function TagCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
      <Skeleton className="h-10 w-10 shrink-0 rounded-md" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

export function TagCardListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <TagCardSkeleton key={i} />
      ))}
    </div>
  )
}
