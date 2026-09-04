import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function ReportesLoading() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-24 rounded" />
          <Skeleton className="h-3 w-56 rounded" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-9 w-full rounded-lg" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-2 px-4 pt-5">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-6 w-14 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-2 px-4 pt-5">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-5 w-10 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <Skeleton className="h-4 w-56 rounded" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </CardContent>
      </Card>
    </div>
  )
}
