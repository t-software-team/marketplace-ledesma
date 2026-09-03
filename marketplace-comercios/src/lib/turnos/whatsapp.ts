import { toWhatsAppNumber } from '@/lib/whatsapp'

const TIMEZONE = 'America/Argentina/Buenos_Aires'

function formatWhenText(startsAtIso: string): string {
  const date = new Date(startsAtIso)
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: TIMEZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Deep link manual (un solo click, sin envío automático) para avisarle al
 * cliente que su turno fue confirmado. Nunca se dispara solo/a.
 */
export function buildAppointmentWhatsAppLink(
  shopName: string,
  customerPhone: string,
  startsAtIso: string
): string {
  const whenText = formatWhenText(startsAtIso)
  const message = `¡Hola! Te confirmamos tu turno en ${shopName} para el ${whenText}. ¡Te esperamos!`
  return `https://wa.me/${toWhatsAppNumber(customerPhone)}?text=${encodeURIComponent(message)}`
}

export { formatWhenText }
