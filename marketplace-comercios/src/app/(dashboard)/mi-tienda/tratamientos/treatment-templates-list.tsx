'use client'

import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import type { TreatmentTemplateWithDoses } from '@/lib/treatments/queries'
import { EditTreatmentTemplateDialog } from './edit-treatment-template-dialog'
import { DeleteTreatmentTemplateButton } from './treatment-row-actions'

const TYPE_LABELS: Record<string, string> = {
  vacuna: 'Vacuna',
  desparasitacion: 'Desparasitación',
}

const SPECIES_LABELS: Record<string, string> = {
  perro: 'Perro',
  gato: 'Gato',
  otro: 'Otro',
}

interface TreatmentTemplatesListProps {
  templates: TreatmentTemplateWithDoses[]
}

export function TreatmentTemplatesList({ templates }: TreatmentTemplatesListProps) {
  if (templates.length === 0) {
    return <EmptyState message="Todavía no cargaste ninguna plantilla de tratamiento." />
  }

  return (
    <div className="space-y-3">
      {templates.map((template) => (
        <div
          key={template.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{template.name}</span>
              <Badge variant="outline">{TYPE_LABELS[template.type] ?? template.type}</Badge>
              {template.species && (
                <Badge variant="outline">{SPECIES_LABELS[template.species] ?? template.species}</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {template.doses.length} dosis
              {template.doses.length > 0 && ` · ${template.doses.map((d) => d.label).join(' → ')}`}
            </p>
          </div>
          <div className="flex shrink-0 items-center justify-center gap-1.5">
            <EditTreatmentTemplateDialog template={template} />
            <DeleteTreatmentTemplateButton templateId={template.id} />
          </div>
        </div>
      ))}
    </div>
  )
}
