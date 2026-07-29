'use client'

import { useActionState, useState } from 'react'
import { Flag } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { reportShop, type ActionState } from '@/lib/shops/actions'

interface ReportShopDialogProps {
  shopId: string
}

const REASON_LABELS = {
  fake_product: 'Producto falso',
  scam: 'Estafa',
  inappropriate: 'Contenido inapropiado',
  closed_permanently: 'Cerrado permanentemente',
  other: 'Otro',
} as const

const initialState: ActionState = { error: null }

function ReportShopForm({ shopId }: { shopId: string }) {
  const reportAction = reportShop.bind(null, shopId)
  const [state, formAction, isPending] = useActionState(reportAction, initialState)
  const submitted = state !== initialState && state.error === null

  if (submitted) {
    return (
      <p className="text-sm text-muted-foreground">Gracias, revisaremos tu reporte.</p>
    )
  }

  return (
    <form action={formAction} className="space-y-3">
      <Select name="reason" defaultValue="Otro">
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Elegí un motivo" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(REASON_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Textarea name="comment" placeholder="Comentario (opcional)" rows={4} />

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Enviando...' : 'Enviar reporte'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function ReportShopDialog({ shopId }: ReportShopDialogProps) {
  const [open, setOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      setFormKey((key) => key + 1)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" />}
      >
        <Flag className="size-3.5" aria-hidden />
        Reportar comercio
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reportar comercio</DialogTitle>
          <DialogDescription>
            Contanos qué pasó, un superadmin va a revisar tu reporte
          </DialogDescription>
        </DialogHeader>

        <ReportShopForm key={formKey} shopId={shopId} />
      </DialogContent>
    </Dialog>
  )
}
