export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-AR')
}

export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}
