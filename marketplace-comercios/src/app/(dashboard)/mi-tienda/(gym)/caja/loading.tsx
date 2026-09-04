import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function CajaLoading() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-24 rounded" />
          <Skeleton className="h-3 w-72 rounded" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-2 px-3 pt-4 sm:px-6 sm:pt-6">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-6 w-16 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-9 w-full rounded-lg" />
        </CardContent>
      </Card>

      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
