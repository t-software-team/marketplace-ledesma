/**
 * Calcula la edad legible en español a partir de una fecha de nacimiento.
 * Pura, sin mocks — testeada directamente en age.test.ts.
 */
export function calculateAge(birthDate: string | null): string | null {
  if (!birthDate) return null

  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return null

  const now = new Date()

  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()

  if (now.getDate() < birth.getDate()) {
    months -= 1
  }

  if (months < 0) {
    years -= 1
    months += 12
  }

  if (years <= 0 && months <= 0) {
    return 'menos de 1 mes'
  }

  if (years === 0) {
    return months === 1 ? '1 mes' : `${months} meses`
  }

  const yearsText = years === 1 ? '1 año' : `${years} años`

  if (months === 0) {
    return yearsText
  }

  const monthsText = months === 1 ? '1 mes' : `${months} meses`
  return `${yearsText}, ${monthsText}`
}
