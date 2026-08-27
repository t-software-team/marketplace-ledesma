// Date helpers pinned to Argentina's civil calendar.
//
// The app serves Argentina and its servers run in UTC. Computing "today" with
// `new Date().toISOString()` yields the UTC date, which rolls over at 21:00
// local time (UTC-3) — producing off-by-one expiry dates and active/expired
// boundaries. These helpers compute the calendar day as seen in Argentina.
//
// Argentina has observed a fixed UTC-3 offset with no DST since 2009, so the
// literal '-03:00' offset is safe and keeps the math simple.
const AR_OFFSET = '-03:00'
const AR_TZ = 'America/Argentina/Buenos_Aires'

/** The calendar date of `date` as seen in Argentina, as 'YYYY-MM-DD'. */
export function argentinaDateString(date: Date = new Date()): string {
  // 'en-CA' formats as ISO-like YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: AR_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/** Today in Argentina as 'YYYY-MM-DD'. */
export function argentinaToday(): string {
  return argentinaDateString()
}

/** Today in Argentina shifted by `days`, as 'YYYY-MM-DD'. */
export function argentinaTodayPlusDays(days: number): string {
  const [y, m, d] = argentinaToday().split('-').map(Number)
  // Pure calendar-date math via UTC to avoid the host timezone leaking in.
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

/** The instant of 00:00 Argentina time today, for timestamptz comparisons. */
export function argentinaStartOfTodayUTC(): Date {
  return new Date(`${argentinaToday()}T00:00:00${AR_OFFSET}`)
}

/** Whole days from Argentina's today until `dateString` ('YYYY-MM-DD'); can be negative. */
export function daysFromArgentinaToday(dateString: string): number {
  const [ty, tm, td] = argentinaToday().split('-').map(Number)
  const [dy, dm, dd] = dateString.split('-').map(Number)
  const todayMs = Date.UTC(ty, tm - 1, td)
  const targetMs = Date.UTC(dy, dm - 1, dd)
  return Math.round((targetMs - todayMs) / (1000 * 60 * 60 * 24))
}
