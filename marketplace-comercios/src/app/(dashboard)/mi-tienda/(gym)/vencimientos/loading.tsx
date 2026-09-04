import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function VencimientosLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-32 rounded" />
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-40 rounded" />
        <Skeleton className="h-3 w-full max-w-md rounded" />
      </div>

      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
              <Skeleton className="h-8 w-24 rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
