const DAY_KEY_BY_ENGLISH: Record<string, string> = {
  Monday: 'lunes',
  Tuesday: 'martes',
  Wednesday: 'miercoles',
  Thursday: 'jueves',
  Friday: 'viernes',
  Saturday: 'sabado',
  Sunday: 'domingo',
}

function parseRange(raw: unknown): { from: string; to: string } | null {
  if (typeof raw !== 'string' || !/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(raw)) return null
  const [from, to] = raw.split('-')
  return { from, to }
}

export function getOpenStatus(
  businessHours: unknown,
  now = new Date()
): { isOpen: boolean; label: string } | null {
  if (!businessHours || typeof businessHours !== 'object') return null
  const schedule = businessHours as Record<string, unknown>

  const hasAnyConfiguredDay = Object.values(DAY_KEY_BY_ENGLISH).some((dayKey) =>
    parseRange(schedule[dayKey])
  )
  if (!hasAnyConfiguredDay) return null

  // Shops don't store a timezone, and the marketplace only operates in Argentina, so we
  // format "now" using the fixed America/Argentina/Buenos_Aires offset rather than relying
  // on the server's runtime timezone (which may differ between local dev and production).
  const parts = now.toLocaleString('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour12: false,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })

  const weekdayMatch = parts.match(/^[A-Za-z]+/)
  const timeMatch = parts.match(/(\d{2}):(\d{2})$/)
  if (!weekdayMatch || !timeMatch) return null

  const dayKey = DAY_KEY_BY_ENGLISH[weekdayMatch[0]]
  if (!dayKey) return null

  const currentTime = `${timeMatch[1]}:${timeMatch[2]}`
  const range = parseRange(schedule[dayKey])

  if (!range) {
    return { isOpen: false, label: 'Cerrado ahora' }
  }

  const isOpen = currentTime >= range.from && currentTime <= range.to
  if (isOpen) {
    return { isOpen: true, label: `Abierto · cierra a las ${range.to}` }
  }

  return { isOpen: false, label: 'Cerrado ahora' }
}
