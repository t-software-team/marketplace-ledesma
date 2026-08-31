import { addDaysToDate, argentinaToday, daysFromArgentinaToday } from '@/lib/timezone'
import { GYM_REPORT_MAX_DAYS } from '@/lib/gym/queries'

function isValidDate(v: string | null | undefined): v is string {
  return Boolean(v && /^\d{4}-\d{2}-\d{2}$/.test(v))
}

/**
 * Clamps arbitrary from/to query params into a valid, bounded date range
 * ('YYYY-MM-DD'). Shared by the reports page and its CSV export route so
 * both apply the exact same rules — a mismatch here would let the export
 * silently cover a different window than what's on screen.
 */
export function resolveGymReportRange(
  fromParam: string | null | undefined,
  toParam: string | null | undefined
) {
  const today = argentinaToday()

  let to = isValidDate(toParam) && toParam <= today ? toParam : today
  let from = isValidDate(fromParam) ? fromParam : addDaysToDate(to, -29)

  if (from > to) [from, to] = [to, from]
  // Clamp to the max window, anchored on `to` (keep the most recent days).
  if (daysFromArgentinaToday(from) < daysFromArgentinaToday(to) - (GYM_REPORT_MAX_DAYS - 1)) {
    from = addDaysToDate(to, -(GYM_REPORT_MAX_DAYS - 1))
  }
  return { from, to }
}
