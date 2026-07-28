import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  starClassName?: string
  className?: string
}

export function StarRating({ rating, starClassName, className }: StarRatingProps) {
  return (
    <div className={cn('flex items-center gap-0.5', className)} aria-label={`${rating} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={cn(
            'size-4',
            value <= Math.round(rating)
              ? 'fill-warning text-warning'
              : 'fill-transparent text-muted-foreground/40',
            starClassName
          )}
          aria-hidden
        />
      ))}
    </div>
  )
}
