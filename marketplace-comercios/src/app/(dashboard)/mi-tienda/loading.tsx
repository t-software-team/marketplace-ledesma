import { Skeleton } from '@/components/ui/skeleton'

export default function MyShopLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <Skeleton className="h-28 w-full rounded-none sm:h-36" />
        <div className="flex flex-wrap items-end justify-between gap-3 px-4 pb-4">
          <div className="flex items-end gap-3">
            <Skeleton className="-mt-8 size-16 shrink-0 rounded-full border-4 border-surface sm:size-20" />
            <div className="space-y-2 pb-0.5">
              <Skeleton className="h-6 w-40 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
          </div>
        </div>
      </div>

      <Skeleton className="h-20 w-full rounded-xl" />

      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-20 rounded-xl" />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="aspect-square rounded-xl" />
        ))}
      </div>
    </div>
  )
}
