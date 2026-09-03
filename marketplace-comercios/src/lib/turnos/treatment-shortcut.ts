/** URL del atajo "Registrar tratamiento" tras completar un turno con paciente asociado (D4). */
export function buildTreatmentShortcutUrl(patientId: string): string {
  return `/mi-tienda/pacientes/${encodeURIComponent(patientId)}?tratamiento=nuevo`
}
