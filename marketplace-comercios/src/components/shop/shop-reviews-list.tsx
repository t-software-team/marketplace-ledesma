import { StarRating } from '@/components/shared/star-rating'

interface ShopReview {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  clientName: string
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(dateString)
  )
}

export function ShopReviewsList({ reviews }: { reviews: ShopReview[] }) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
        Todavía no hay reseñas. ¡Sé el primero en dejar una!
      </p>
    )
  }

  return (
    <div className="divide-y divide-border">
      {reviews.map((review) => (
        <div key={review.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
            {review.clientName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium">{review.clientName}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDate(review.createdAt)}
              </span>
            </div>
            <StarRating rating={review.rating} />
            {review.comment && (
              <p className="pt-0.5 text-sm text-muted-foreground">{review.comment}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
