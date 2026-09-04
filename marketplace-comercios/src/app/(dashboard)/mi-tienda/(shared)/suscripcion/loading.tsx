import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function SuscripcionLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-48 rounded" />
        <Skeleton className="h-3 w-64 rounded" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-5 w-24 rounded" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-8 w-20 rounded" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, lineIndex) => (
                  <Skeleton key={lineIndex} className="h-3 w-full rounded" />
                ))}
              </div>
              <Skeleton className="h-9 w-full rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
