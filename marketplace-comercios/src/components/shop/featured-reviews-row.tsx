import { Quote } from 'lucide-react'
import { StarRating } from '@/components/shared/star-rating'

interface ShopReview {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  clientName: string
}

export function FeaturedReviewsRow({
  reviews,
  isFeatured,
}: {
  reviews: ShopReview[]
  isFeatured: boolean
}) {
  if (!isFeatured) return null

  const topReviews = reviews
    .filter((review) => Boolean(review.comment && review.comment.trim()))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 2)

  if (topReviews.length === 0) return null

  return (
    <section className="grid gap-3 sm:grid-cols-2">
      {topReviews.map((review) => (
        <div key={review.id} className="relative rounded-xl border border-border bg-surface p-3.5">
          <Quote className="size-4 text-primary/40" aria-hidden />
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{review.comment}</p>
          <div className="mt-2 flex items-center gap-2">
            <StarRating rating={review.rating} />
            <span className="text-xs font-medium">{review.clientName}</span>
          </div>
        </div>
      ))}
    </section>
  )
}
