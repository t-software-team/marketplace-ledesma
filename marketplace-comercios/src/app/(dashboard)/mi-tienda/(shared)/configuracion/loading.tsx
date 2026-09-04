import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function ConfiguracionLoading() {
  return (
    <div className="max-w-2xl space-y-4">
      <Skeleton className="h-7 w-40 rounded" />

      <Card>
        <CardContent className="space-y-3 pt-6">
          <Skeleton className="h-4 w-48 rounded" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </CardContent>
      </Card>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
