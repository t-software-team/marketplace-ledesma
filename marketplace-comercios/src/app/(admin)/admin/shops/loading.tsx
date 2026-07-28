import { Skeleton } from '@/components/ui/skeleton'

export default function AdminShopsLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-32 rounded" />
        <Skeleton className="h-4 w-56 rounded" />
      </div>

      <Skeleton className="h-9 w-full rounded-lg" />

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
