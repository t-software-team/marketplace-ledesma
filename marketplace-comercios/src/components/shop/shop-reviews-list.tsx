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
    <div className="space-y-3">
      {reviews.map((review) => (
        <div key={review.id} className="rounded-lg border border-border bg-surface p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <StarRating rating={review.rating} />
              <span className="text-sm font-medium">{review.clientName}</span>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatDate(review.createdAt)}
            </span>
          </div>
          {review.comment && (
            <p className="mt-1.5 text-sm text-muted-foreground">{review.comment}</p>
          )}
        </div>
      ))}
    </div>
  )
}
