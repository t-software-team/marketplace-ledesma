/**
 * Normalizes a stored phone number into the format wa.me expects.
 * - Argentine mobile numbers need a "9" right after the "54" country code
 *   (e.g. 5493886000000) — without it wa.me can't open the link.
 * - Numbers saved without any country code (most shops in this app only
 *   entered their local number, e.g. "3886528023") are assumed to be
 *   Argentine and get "549" prepended.
 */
export function toWhatsAppNumber(rawPhone: string): string {
  let digits = rawPhone.replace(/\D/g, '')

  // Drop a leading trunk "0" (local dialing prefix) when there's no country code.
  if (!digits.startsWith('54') && digits.startsWith('0')) {
    digits = digits.slice(1)
  }

  if (digits.startsWith('54')) {
    return digits.startsWith('549') ? digits : `549${digits.slice(2)}`
  }

  return `549${digits}`
}
