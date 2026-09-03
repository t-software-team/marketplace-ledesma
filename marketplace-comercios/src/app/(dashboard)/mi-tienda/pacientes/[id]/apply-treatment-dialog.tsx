'use client'

import { useMemo, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldError } from '@/components/shared/field-error'
import { toast } from '@/components/ui/toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { applyTreatment, type TreatmentActionState } from '@/lib/treatments/actions'
import type { TreatmentTemplateWithDoses } from '@/lib/treatments/queries'

interface ApplyTreatmentDialogProps {
  patientId: string
  templates: TreatmentTemplateWithDoses[]
  defaultOpen?: boolean
}

const initialState: TreatmentActionState = { error: null }

export function ApplyTreatmentDialog({ patientId, templates, defaultOpen = false }: ApplyTreatmentDialogProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [state, setState] = useState<TreatmentActionState>(initialState)
  const [isPending, startTransition] = useTransition()
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '')
  const fieldErrors = state.fieldErrors ?? {}

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId),
    [templates, templateId]
  )

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await applyTreatment(patientId, initialState, formData)
      setState(result)
      if (result.error) {
        toast.add({ title: 'No pudimos registrar el tratamiento', description: result.error, type: 'error' })
      } else {
        toast.add({ title: 'Tratamiento registrado', type: 'success' })
        setOpen(false)
      }
    })
  }

  if (templates.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Cargá primero una plantilla en Tratamientos para poder aplicar una.
      </p>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>Registrar tratamiento</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar tratamiento aplicado</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="template_id" className="text-sm font-medium">
              Plantilla
            </label>
            <select
              id="template_id"
              name="template_id"
              required
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm"
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <FieldError message={fieldErrors.template_id} />
          </div>

          {selectedTemplate && selectedTemplate.doses.length > 0 && (
            <div className="space-y-2">
              <label htmlFor="template_dose_id" className="text-sm font-medium">
                Dosis
              </label>
              <select
                id="template_dose_id"
                name="template_dose_id"
                className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm"
              >
                {selectedTemplate.doses.map((dose) => (
                  <option key={dose.id} value={dose.id}>
                    {dose.dose_number}. {dose.label}
                  </option>
                ))}
              </select>
              <FieldError message={fieldErrors.template_dose_id} />
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="applied_at" className="text-sm font-medium">
              Fecha de aplicación
            </label>
            <Input
              id="applied_at"
              name="applied_at"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              required
              aria-invalid={Boolean(fieldErrors.applied_at)}
            />
            <FieldError message={fieldErrors.applied_at} />
          </div>

          <div className="space-y-2">
            <label htmlFor="product_name" className="text-sm font-medium">
              Producto/lote aplicado (opcional)
            </label>
            <Input id="product_name" name="product_name" aria-invalid={Boolean(fieldErrors.product_name)} />
            <FieldError message={fieldErrors.product_name} />
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notas (opcional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="w-full rounded-lg border border-border bg-surface p-3 text-sm"
            />
            <FieldError message={fieldErrors.notes} />
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? 'Guardando...' : 'Registrar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
