import { Skeleton } from '@/components/ui/skeleton'

export default function TurnosConfiguracionLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-64 rounded" />
        <Skeleton className="h-3 w-full max-w-lg rounded" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full rounded-lg" />
        ))}
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
    </div>
  )
}
