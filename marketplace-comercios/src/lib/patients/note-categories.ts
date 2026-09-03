import { PATIENT_NOTE_CATEGORIES, type PatientNoteCategory } from '@/lib/validations/patients'

export const NOTE_CATEGORY_LABELS: Record<PatientNoteCategory, string> = {
  consulta: 'Consulta',
  cirugia: 'Cirugía',
  analisis: 'Análisis',
  vacunacion: 'Vacunación',
  otro: 'Otro',
}

export const NOTE_CATEGORY_OPTIONS = PATIENT_NOTE_CATEGORIES.map((value) => ({
  value,
  label: NOTE_CATEGORY_LABELS[value],
}))
