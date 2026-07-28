'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { Star, MessageSquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { deleteShopReview, upsertShopReview, type ActionState } from '@/lib/shops/actions'

interface ShopReviewDialogProps {
  shopId: string
  myReview: { id: string; rating: number; comment: string | null } | null
}

const initialState: ActionState = { error: null }

export function ShopReviewDialog({ shopId, myReview }: ShopReviewDialogProps) {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(myReview?.rating ?? 0)
  const [hoverRating, setHoverRating] = useState(0)
  const [isDeleting, startDeleteTransition] = useTransition()

  const reviewAction = upsertShopReview.bind(null, shopId)
  const [state, formAction, isPending] = useActionState(reviewAction, initialState)

  const [prevState, setPrevState] = useState(state)
  if (state !== prevState) {
    setPrevState(state)
    if (state.error === null) setOpen(false)
  }

  useEffect(() => {
    if (state === initialState) return
    if (state.error === null) {
      toast.add({ title: myReview ? 'Reseña actualizada' : '¡Gracias por tu reseña!', type: 'success' })
    } else {
      toast.add({ title: 'No pudimos guardar tu reseña', description: state.error, type: 'error' })
    }
  }, [state, myReview])

  function handleDelete() {
    startDeleteTransition(async () => {
      try {
        await deleteShopReview(shopId)
        toast.add({ title: 'Reseña eliminada', type: 'success' })
        setOpen(false)
      } catch {
        toast.add({ title: 'No pudimos eliminar tu reseña', type: 'error' })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
        <MessageSquarePlus className="size-3.5" aria-hidden />
        {myReview ? 'Editar mi reseña' : 'Dejar una reseña'}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{myReview ? 'Editar tu reseña' : 'Dejar una reseña'}</DialogTitle>
          <DialogDescription>Contale a otros usuarios tu experiencia con este comercio</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-3">
          <input type="hidden" name="rating" value={rating} />
          <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoverRating(value)}
                aria-label={`${value} estrellas`}
                className="p-0.5"
              >
                <Star
                  className={cn(
                    'size-7 transition-colors',
                    value <= (hoverRating || rating)
                      ? 'fill-warning text-warning'
                      : 'fill-transparent text-muted-foreground/40'
                  )}
                />
              </button>
            ))}
          </div>

          <Textarea
            name="comment"
            placeholder="Comentario (opcional)"
            rows={4}
            defaultValue={myReview?.comment ?? ''}
          />

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <DialogFooter className="gap-2 sm:justify-between">
            {myReview && (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive"
                disabled={isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar reseña'}
              </Button>
            )}
            <Button type="submit" disabled={isPending || rating === 0}>
              {isPending ? 'Guardando...' : myReview ? 'Guardar cambios' : 'Publicar reseña'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
