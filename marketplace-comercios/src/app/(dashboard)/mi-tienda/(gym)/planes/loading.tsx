import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function PlanesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-24 rounded" />
        <Skeleton className="h-3 w-full max-w-lg rounded" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-24 rounded" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </CardContent>
      </Card>

      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
