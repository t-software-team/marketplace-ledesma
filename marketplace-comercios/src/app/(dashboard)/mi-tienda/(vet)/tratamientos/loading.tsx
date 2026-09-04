import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function TratamientosLoading() {
  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-32 rounded" />
        <Skeleton className="h-3 w-full max-w-lg rounded" />
      </div>

      <Skeleton className="h-20 w-full rounded-xl" />

      <Card className="rounded-xl ring-1 ring-foreground/10">
        <CardHeader>
          <Skeleton className="h-5 w-32 rounded" />
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
