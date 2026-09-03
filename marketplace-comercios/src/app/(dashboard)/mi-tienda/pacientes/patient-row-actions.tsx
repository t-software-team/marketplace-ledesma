'use client'

import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { toast } from '@/components/ui/toast'
import { deletePatient } from '@/lib/patients/actions'

export function PatientRowActions({ patientId }: { patientId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      try {
        await deletePatient(patientId)
        toast.add({ title: 'Paciente eliminado', type: 'success' })
      } catch {
        toast.add({ title: 'No pudimos eliminar el paciente', type: 'error' })
      }
    })
  }

  return (
    <div className="flex shrink-0 items-center justify-center gap-1.5">
      <Button
        render={<Link href={`/mi-tienda/pacientes/${patientId}/editar`} aria-label="Editar" />}
        nativeButton={false}
        variant="outline"
        size="icon"
      >
        <Pencil className="size-4" aria-hidden />
      </Button>

      <ConfirmDialog
        trigger={<Button variant="destructive" size="icon" disabled={isPending} aria-label="Eliminar" />}
        triggerLabel={<Trash2 className="size-4" aria-hidden />}
        title="¿Eliminar este paciente?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        isConfirming={isPending}
        onConfirm={handleDelete}
      />
    </div>
  )
}
