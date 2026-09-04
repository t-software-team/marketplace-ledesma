'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import type { TreatmentTemplateWithDoses } from '@/lib/treatments/queries'
import { TreatmentTemplateForm } from './treatment-template-form'

interface EditTreatmentTemplateDialogProps {
  template: TreatmentTemplateWithDoses
}

// El form de plantilla (con su secuencia de dosis) es largo, así que editar
// abre un modal en vez de expandir la fila dentro de la lista.
export function EditTreatmentTemplateDialog({ template }: EditTreatmentTemplateDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="icon" aria-label="Editar" />}>
        <Pencil className="size-4" aria-hidden />
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar plantilla</DialogTitle>
        </DialogHeader>
        <TreatmentTemplateForm template={template} submitLabel="Guardar cambios" />
      </DialogContent>
    </Dialog>
  )
}
