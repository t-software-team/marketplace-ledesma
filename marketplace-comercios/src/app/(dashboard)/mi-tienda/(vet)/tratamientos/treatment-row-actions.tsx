'use client'

import { Trash2 } from 'lucide-react'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { toast } from '@/components/ui/toast'
import { deleteTreatmentTemplate } from '@/lib/treatments/actions'

interface DeleteTreatmentTemplateButtonProps {
  templateId: string
}

export function DeleteTreatmentTemplateButton({ templateId }: DeleteTreatmentTemplateButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteTreatmentTemplate(templateId)
        toast.add({ title: 'Plantilla eliminada', type: 'success' })
      } catch {
        toast.add({ title: 'No pudimos eliminar la plantilla', type: 'error' })
      }
    })
  }

  return (
    <ConfirmDialog
      trigger={<Button variant="destructive" size="icon" disabled={isPending} aria-label="Eliminar" />}
      triggerLabel={<Trash2 className="size-4" aria-hidden />}
      title="¿Eliminar esta plantilla?"
      description="Esta acción no se puede deshacer."
      confirmLabel="Eliminar"
      isConfirming={isPending}
      onConfirm={handleDelete}
    />
  )
}
