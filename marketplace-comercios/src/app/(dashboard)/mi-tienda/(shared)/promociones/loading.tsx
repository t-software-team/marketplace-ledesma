import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function PromocionesLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-32 rounded" />
        <Skeleton className="h-3 w-full max-w-lg rounded" />
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Skeleton className="h-5 w-32 rounded" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="aspect-square w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
