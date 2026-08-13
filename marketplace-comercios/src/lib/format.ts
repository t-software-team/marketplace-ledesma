export function formatPrice(price: number | null, currency = 'ARS') {
  if (price == null) return 'Consultar'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatRelativeTime(date: string | Date, now: Date = new Date()) {
  const target = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - target.getTime()
  const diffSec = Math.round(diffMs / 1000)

  if (diffSec < 60) return 'ahora'

  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return `hace ${diffMin} min`

  const diffHours = Math.round(diffMin / 60)
  if (diffHours < 24) return `hace ${diffHours} h`

  const diffDays = Math.round(diffHours / 24)
  if (diffDays === 1) return 'ayer'
  if (diffDays < 7) return `hace ${diffDays} días`

  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(target)
}
