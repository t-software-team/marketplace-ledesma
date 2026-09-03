import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/server/supabase-service-role'

export interface AppointmentRow {
  id: string
  shop_id: string
  starts_at: string
  ends_at: string
  status: string
  origin: string
  hold_expires_at: string | null
  customer_name: string | null
  customer_phone: string | null
  customer_email: string | null
  created_at: string
}

export interface AppointmentFilters {
  status?: string
}

export async function getShopAppointments(
  shopId: string,
  filters: AppointmentFilters = {}
): Promise<AppointmentRow[]> {
  const supabase = await createClient()

  // Best-effort: cancela turnos pending cuyo hold de 3h ya venció, así el
  // panel no los muestra como "pendientes" indefinidamente. No bloquea la
  // lectura si falla.
  try {
    await createServiceRoleClient().rpc('expire_pending_holds', { p_shop_id: shopId })
  } catch (error) {
    console.error('getShopAppointments: fallo al expirar holds vencidos (best effort)', { shopId, error })
  }

  let query = supabase
    .from('appointments')
    .select(
      'id, shop_id, starts_at, ends_at, status, origin, hold_expires_at, customer_name, customer_phone, customer_email, created_at'
    )
    .eq('shop_id', shopId)

  if (filters.status) {
    query = query.eq(
      'status',
      filters.status as
        | 'pending'
        | 'confirmed'
        | 'rejected'
        | 'cancelled'
        | 'completed'
        | 'no_show'
        | 'blocked'
    )
  }

  const { data, error } = await query.order('starts_at', { ascending: true }).limit(200)

  if (error) {
    console.error('getShopAppointments: fallo al leer turnos', { shopId, error })
    return []
  }

  return data ?? []
}

export interface BookingSettings {
  shop_id: string
  slot_duration_minutes: number
  weekly_hours: unknown
  is_enabled: boolean
  timezone: string
}

export async function getBookingSettings(shopId: string): Promise<BookingSettings | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('shop_booking_settings')
    .select('shop_id, slot_duration_minutes, weekly_hours, is_enabled, timezone')
    .eq('shop_id', shopId)
    .maybeSingle()

  if (error) {
    console.error('getBookingSettings: fallo al leer configuración', { shopId, error })
    return null
  }

  return data
}

export interface AvailableSlot {
  starts_at: string
  ends_at: string
}

export async function getAvailableSlots(shopId: string, date: string): Promise<AvailableSlot[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_available_slots', {
    p_shop_id: shopId,
    p_date: date,
  })

  if (error) {
    console.error('getAvailableSlots: fallo al leer disponibilidad', { shopId, date, error })
    return []
  }

  return data ?? []
}

export interface AppointmentStats {
  pendingCount: number
  upcomingConfirmedCount: number
  requestedLast30: number
  confirmationRate: number | null
  noShowRate: number | null
  series: { date: string; turnos: number }[]
}

export async function getShopAppointmentStats(shopId: string, days = 14): Promise<AppointmentStats> {
  const supabase = await createClient()
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const sinceSeries = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  sinceSeries.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('appointments')
    .select('status, starts_at, created_at, origin')
    .eq('shop_id', shopId)
    .gte('created_at', since30.toISOString())

  if (error) {
    console.error('getShopAppointmentStats: fallo al leer turnos', { shopId, error })
    return {
      pendingCount: 0,
      upcomingConfirmedCount: 0,
      requestedLast30: 0,
      confirmationRate: null,
      noShowRate: null,
      series: [],
    }
  }

  const rows = data ?? []

  // Pendientes y confirmados futuros son estado actual, no acotado a 30 días.
  const { count: pendingCount } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', shopId)
    .eq('status', 'pending')

  const { count: upcomingConfirmedCount } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', shopId)
    .eq('status', 'confirmed')
    .gte('starts_at', new Date().toISOString())

  // Tasa de confirmación: de las solicitudes online que ya se resolvieron
  // (no quedaron pending), cuántas terminaron confirmadas/completadas/no-show
  // vs. rechazadas o canceladas.
  const resolvedOnline = rows.filter(
    (r) => r.origin === 'online' && ['confirmed', 'completed', 'no_show', 'rejected', 'cancelled'].includes(r.status)
  )
  const confirmedOrFurther = resolvedOnline.filter((r) =>
    ['confirmed', 'completed', 'no_show'].includes(r.status)
  ).length
  const confirmationRate = resolvedOnline.length > 0 ? Math.round((confirmedOrFurther / resolvedOnline.length) * 100) : null

  // No-show: de los turnos que ya pasaron su hora y se resolvieron (completed
  // o no_show), qué porcentaje no se presentó.
  const settledPast = rows.filter((r) => ['completed', 'no_show'].includes(r.status))
  const noShowRate =
    settledPast.length > 0
      ? Math.round((settledPast.filter((r) => r.status === 'no_show').length / settledPast.length) * 100)
      : null

  const counts = new Map<string, number>()
  for (let i = 0; i < days; i++) {
    const date = new Date(sinceSeries)
    date.setDate(date.getDate() + i)
    counts.set(date.toISOString().slice(0, 10), 0)
  }
  for (const row of rows) {
    const day = row.created_at.slice(0, 10)
    if (counts.has(day)) counts.set(day, (counts.get(day) ?? 0) + 1)
  }

  return {
    pendingCount: pendingCount ?? 0,
    upcomingConfirmedCount: upcomingConfirmedCount ?? 0,
    requestedLast30: rows.length,
    confirmationRate,
    noShowRate,
    series: Array.from(counts.entries()).map(([date, count]) => ({
      date: new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit' }).format(new Date(date)),
      turnos: count,
    })),
  }
}

/** Próximos turnos pendientes/confirmados para el dashboard de veterinaria — mismo patrón de lectura que getShopAppointments, acotado a futuro y a un puñado de filas. */
export async function getShopUpcomingAppointments(shopId: string, limit = 5): Promise<AppointmentRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('appointments')
    .select(
      'id, shop_id, starts_at, ends_at, status, origin, hold_expires_at, customer_name, customer_phone, customer_email, created_at'
    )
    .eq('shop_id', shopId)
    .in('status', ['pending', 'confirmed'])
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('getShopUpcomingAppointments: fallo al leer próximos turnos', { shopId, error })
    return []
  }

  return data ?? []
}

/** Historial de turnos de un paciente para su ficha — mismo patrón de lectura que getShopAppointments, filtrado por patient_id y ordenado desc. */
export async function getPatientAppointments(patientId: string): Promise<AppointmentRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('appointments')
    .select(
      'id, shop_id, starts_at, ends_at, status, origin, hold_expires_at, customer_name, customer_phone, customer_email, created_at'
    )
    .eq('patient_id', patientId)
    .order('starts_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('getPatientAppointments: fallo al leer historial de turnos', { patientId, error })
    return []
  }

  return data ?? []
}

/** Público: config mínima para saber si el comercio tiene turnos habilitados. Usa service role porque el visitante no está autenticado. */
export async function getPublicBookingSettings(shopId: string): Promise<BookingSettings | null> {
  const supabase = createServiceRoleClient()

  const { data, error } = await supabase
    .from('shop_booking_settings')
    .select('shop_id, slot_duration_minutes, weekly_hours, is_enabled, timezone')
    .eq('shop_id', shopId)
    .maybeSingle()

  if (error) {
    console.error('getPublicBookingSettings: fallo al leer configuración', { shopId, error })
    return null
  }

  return data
}
