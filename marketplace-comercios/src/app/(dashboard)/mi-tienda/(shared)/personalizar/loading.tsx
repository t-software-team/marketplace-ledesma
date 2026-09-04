import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function PersonalizarLoading() {
  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-48 rounded" />
          <Skeleton className="h-3 w-full max-w-md rounded" />
        </div>
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  )
}
