import { Skeleton } from '@/components/ui/skeleton'

export default function ProductLoading() {
  return (
    <div className="space-y-6 pb-24">
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-xl" />

        <div className="space-y-4">
          <Skeleton className="h-3 w-24 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-3/4 rounded" />
            <Skeleton className="h-6 w-28 rounded" />
          </div>
          <Skeleton className="h-16 w-full rounded" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-32 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
