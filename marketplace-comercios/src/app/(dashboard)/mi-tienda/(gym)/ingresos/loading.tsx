import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function IngresosLoading() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-28 rounded" />
          <Skeleton className="h-3 w-80 rounded" />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-9 w-full rounded-lg" />
        </CardContent>
      </Card>

      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
