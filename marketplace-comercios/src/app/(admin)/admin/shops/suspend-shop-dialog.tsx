'use client'

import { Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

export function SuspendShopDialog({
  open,
  onOpenChange,
  selectedCount,
  reason,
  onReasonChange,
  isPending,
  onSuspend,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCount: number
  reason: string
  onReasonChange: (value: string) => void
  isPending: boolean
  onSuspend: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5 text-destructive" />}>
        <Ban className="size-3.5" aria-hidden />
        Suspender
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Suspender {selectedCount} comercio{selectedCount === 1 ? '' : 's'}
          </DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="Motivo de la suspensión"
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          rows={3}
          aria-label="Motivo de suspensión"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={isPending || reason.trim().length < 5}
            onClick={onSuspend}
          >
            {isPending ? 'Suspendiendo...' : 'Suspender'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
