'use client'

import { Trash2 } from 'lucide-react'
import { useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { toast } from '@/components/ui/toast'
import { deleteTreatmentApplication } from '@/lib/treatments/actions'
import type { TreatmentApplicationWithStatus, TreatmentStatus } from '@/lib/treatments/queries'

const STATUS_LABELS: Record<TreatmentStatus, string> = {
  al_dia: 'Al día',
  proximo: 'Próximo',
  vencido: 'Vencido',
}

const STATUS_VARIANT: Record<TreatmentStatus, 'success' | 'warning' | 'destructive'> = {
  al_dia: 'success',
  proximo: 'warning',
  vencido: 'destructive',
}

interface TreatmentHistoryProps {
  patientId: string
  treatments: TreatmentApplicationWithStatus[]
}

export function TreatmentHistory({ patientId, treatments }: TreatmentHistoryProps) {
  const [isPending, startTransition] = useTransition()

  function handleDelete(applicationId: string) {
    startTransition(async () => {
      try {
        await deleteTreatmentApplication(applicationId, patientId)
        toast.add({ title: 'Registro eliminado', type: 'success' })
      } catch {
        toast.add({ title: 'No pudimos eliminar el registro', type: 'error' })
      }
    })
  }

  if (treatments.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay tratamientos registrados.</p>
  }

  return (
    <ul className="space-y-2">
      {treatments.map((treatment) => (
        <li
          key={treatment.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{treatment.template?.name ?? 'Plantilla eliminada'}</span>
              {treatment.dose && <Badge variant="outline">{treatment.dose.label}</Badge>}
              <Badge variant={STATUS_VARIANT[treatment.status]}>{STATUS_LABELS[treatment.status]}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Aplicado: {new Date(treatment.applied_at).toLocaleDateString('es-AR')}
              {treatment.product_name && ` · Producto: ${treatment.product_name}`}
              {treatment.next_due_at &&
                ` · Próxima dosis: ${new Date(treatment.next_due_at).toLocaleDateString('es-AR')}`}
            </p>
          </div>

          <ConfirmDialog
            trigger={<Button variant="ghost" size="icon-sm" disabled={isPending} aria-label="Eliminar" />}
            triggerLabel={<Trash2 className="size-4" aria-hidden />}
            title="¿Eliminar este registro?"
            description="Esta acción no se puede deshacer."
            confirmLabel="Eliminar"
            isConfirming={isPending}
            onConfirm={() => handleDelete(treatment.id)}
          />
        </li>
      ))}
    </ul>
  )
}
