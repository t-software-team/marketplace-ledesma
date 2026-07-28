import { Skeleton } from '@/components/ui/skeleton'

export default function ShopLoading() {
  return (
    <div className="space-y-6 pb-24">
      <div className="-mx-4 overflow-hidden rounded-xl border border-border bg-surface md:-mx-6">
        <Skeleton className="h-36 w-full rounded-none md:h-44" />
        <div className="px-4 pb-5 md:px-6">
          <div className="flex items-end gap-3">
            <Skeleton className="-mt-8 size-16 shrink-0 rounded-xl border-2 border-surface" />
            <div className="flex-1 space-y-2 pt-2">
              <Skeleton className="h-6 w-40 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
          </div>
          <Skeleton className="mt-4 h-11 w-full rounded-lg" />
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-5 w-24 rounded" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="aspect-[3/4] rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
