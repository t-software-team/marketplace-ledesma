'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import type { TreatmentTemplateDoseRow } from '@/lib/treatments/queries'

interface DoseFormValue {
  label: string
  age_weeks: string
  interval_days_after_previous: string
  is_recurring: boolean
  recurrence_interval_days: string
}

const EMPTY_DOSE: DoseFormValue = {
  label: '',
  age_weeks: '',
  interval_days_after_previous: '',
  is_recurring: false,
  recurrence_interval_days: '',
}

function fromRows(doses?: TreatmentTemplateDoseRow[]): DoseFormValue[] {
  if (!doses || doses.length === 0) return [{ ...EMPTY_DOSE }]
  return doses
    .slice()
    .sort((a, b) => a.dose_number - b.dose_number)
    .map((d) => ({
      label: d.label,
      age_weeks: d.age_weeks?.toString() ?? '',
      interval_days_after_previous: d.interval_days_after_previous?.toString() ?? '',
      is_recurring: d.is_recurring,
      recurrence_interval_days: d.recurrence_interval_days?.toString() ?? '',
    }))
}

interface TreatmentDosesEditorProps {
  initialDoses?: TreatmentTemplateDoseRow[]
}

// Editor de la secuencia de dosis de una plantilla. Serializa el array como
// JSON en un input hidden (mismo patrón que image_urls en
// product-images-field.tsx) para que el server action lo parsee.
export function TreatmentDosesEditor({ initialDoses }: TreatmentDosesEditorProps) {
  const [doses, setDoses] = useState<DoseFormValue[]>(() => fromRows(initialDoses))

  function updateDose(index: number, patch: Partial<DoseFormValue>) {
    setDoses((current) => current.map((d, i) => (i === index ? { ...d, ...patch } : d)))
  }

  function addDose() {
    setDoses((current) => [...current, { ...EMPTY_DOSE }])
  }

  function removeDose(index: number) {
    setDoses((current) => {
      const next = current.filter((_, i) => i !== index)
      return next.length === 0 ? [{ ...EMPTY_DOSE }] : next
    })
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Secuencia de dosis</label>
      <input type="hidden" name="doses" value={JSON.stringify(doses)} />

      <div className="space-y-3">
        {doses.map((dose, index) => {
          const isFirst = index === 0
          const isLast = index === doses.length - 1

          return (
            <div key={index} className="space-y-2 rounded-xl border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">Dosis {index + 1}</span>
                {doses.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Quitar dosis"
                    onClick={() => removeDose(index)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Etiqueta</label>
                  <Input
                    value={dose.label}
                    onChange={(e) => updateDose(index, { label: e.target.value })}
                    placeholder={isFirst ? '1ra dosis' : 'Refuerzo anual'}
                  />
                </div>

                {isFirst ? (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Edad recomendada (semanas)</label>
                    <Input
                      type="number"
                      min={0}
                      value={dose.age_weeks}
                      onChange={(e) => updateDose(index, { age_weeks: e.target.value })}
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Días desde la dosis anterior</label>
                    <Input
                      type="number"
                      min={0}
                      value={dose.interval_days_after_previous}
                      onChange={(e) => updateDose(index, { interval_days_after_previous: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {isLast && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-medium">
                    <Checkbox
                      checked={dose.is_recurring}
                      onCheckedChange={(checked) => updateDose(index, { is_recurring: Boolean(checked) })}
                    />
                    Esta dosis se repite indefinidamente
                  </label>
                  {dose.is_recurring && (
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Cada cuántos días</label>
                      <Input
                        type="number"
                        min={1}
                        value={dose.recurrence_interval_days}
                        onChange={(e) => updateDose(index, { recurrence_interval_days: e.target.value })}
                        className="max-w-40"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addDose}>
        <Plus className="size-4" aria-hidden />
        Agregar dosis
      </Button>
    </div>
  )
}
