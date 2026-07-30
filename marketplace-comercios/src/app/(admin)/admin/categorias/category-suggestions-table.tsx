'use client'

import { useState, useTransition } from 'react'
import { useActionState } from 'react'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { StatusBadge } from '@/components/shared/status-badge'
import { toast } from '@/components/ui/toast'
import {
  approveCategorySuggestion,
  rejectCategorySuggestion,
  type ActionState,
} from '@/lib/admin/actions'
import type { getCategorySuggestions } from '@/lib/admin/queries'

type Suggestion = Awaited<ReturnType<typeof getCategorySuggestions>>[number]

const initialState: ActionState = { error: null }

function RejectDialog({ suggestionId }: { suggestionId: string }) {
  const [open, setOpen] = useState(false)
  const rejectAction = rejectCategorySuggestion.bind(null, suggestionId)
  const [state, formAction, isPending] = useActionState(rejectAction, initialState)

  const [prevState, setPrevState] = useState(state)
  if (state !== prevState) {
    setPrevState(state)
    if (state.error === null) setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5 text-destructive" />}>
        <X className="size-3.5" aria-hidden />
        Rechazar
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rechazar sugerencia</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <Textarea name="reason" placeholder="Motivo del rechazo" rows={3} required minLength={5} />
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? 'Rechazando...' : 'Rechazar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function CategorySuggestionsTable({ suggestions }: { suggestions: Suggestion[] }) {
  const [isPending, startTransition] = useTransition()

  function handleApprove(id: string) {
    startTransition(async () => {
      try {
        await approveCategorySuggestion(id)
        toast.add({ title: 'Categoría creada', type: 'success' })
      } catch {
        toast.add({ title: 'No pudimos aprobar la sugerencia', type: 'error' })
      }
    })
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre sugerido</TableHead>
          <TableHead>Rubro padre</TableHead>
          <TableHead>Comercio</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {suggestions.map((suggestion) => (
          <TableRow key={suggestion.id}>
            <TableCell className="font-medium">{suggestion.name}</TableCell>
            <TableCell className="text-muted-foreground">
              {suggestion.parent?.name ?? 'Rubro nuevo (sin padre)'}
            </TableCell>
            <TableCell className="text-muted-foreground">{suggestion.shops?.name ?? '—'}</TableCell>
            <TableCell>
              <StatusBadge status={suggestion.status} />
              {suggestion.status === 'rejected' && suggestion.rejection_reason && (
                <p className="mt-0.5 text-xs text-muted-foreground">{suggestion.rejection_reason}</p>
              )}
            </TableCell>
            <TableCell className="text-right">
              {suggestion.status === 'pending' && (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={isPending}
                    onClick={() => handleApprove(suggestion.id)}
                  >
                    <Check className="size-3.5" aria-hidden />
                    Aprobar
                  </Button>
                  <RejectDialog suggestionId={suggestion.id} />
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
