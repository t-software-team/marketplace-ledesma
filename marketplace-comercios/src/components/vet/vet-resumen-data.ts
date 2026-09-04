import { headers } from 'next/headers'
import { getShopPatientAlertsMap, getShopReminderAlerts } from '@/lib/patients/alerts'
import {
  getMonthlyTreatmentCount,
  getShopActivityFeed,
  getWeeklyCompletedAppointments,
  getWeeklyNewPatients,
  getWeeklyRevenue,
  groupPatientsBySpecies,
} from '@/lib/patients/dashboard-queries'
import { getShopPatients, getShopPatientsCount } from '@/lib/patients/queries'
import { getShopUpcomingAppointments } from '@/lib/turnos/queries'
import { hasVerifiedBadge } from '@/lib/shops/badge'
import { getShopFollowStats, getMyShop } from '@/lib/shops/queries'
import type { VetResumenProps } from './vet-resumen'

type Shop = NonNullable<Awaited<ReturnType<typeof getMyShop>>>

/** Junta y arma todo lo que necesita VetResumen: turnos, alertas, pacientes,
 * tendencias e ingresos. Separado de page.tsx para que ese archivo no tenga
 * que cargar con la composición de datos de cada rubro. */
export async function getVetResumenProps(shop: Shop): Promise<VetResumenProps> {
  const [
    upcomingAppointments,
    treatmentAlerts,
    patientsCount,
    followerCount,
    patientAlertsMap,
    patients,
    weeklyCompletedAppointments,
    monthlyTreatmentCount,
    weeklyNewPatients,
    weeklyRevenue,
    activityFeed,
  ] = await Promise.all([
    getShopUpcomingAppointments(shop.id),
    getShopReminderAlerts(shop.id),
    getShopPatientsCount(shop.id),
    getShopFollowStats(shop.id),
    getShopPatientAlertsMap(shop.id),
    getShopPatients(shop.id),
    getWeeklyCompletedAppointments(shop.id),
    getMonthlyTreatmentCount(shop.id),
    getWeeklyNewPatients(shop.id),
    getWeeklyRevenue(shop.id),
    getShopActivityFeed(shop.id),
  ])

  const patientNameById = new Map(patients.map((patient) => [patient.id, patient.name]))
  const speciesBreakdown = groupPatientsBySpecies(patients)
  const alertedPatients = Object.entries(patientAlertsMap)
    .map(([patientId, alerts]) => ({
      id: patientId,
      name: patientNameById.get(patientId) ?? 'Paciente',
      ...alerts,
    }))
    .sort((a, b) => b.overdue - a.overdue || b.upcoming - a.upcoming)

  const headersList = await headers()
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host')
  const protocol = headersList.get('x-forwarded-proto') ?? 'http'
  const shopUrl = `${protocol}://${host}/tienda/${shop.slug}`

  return {
    shopName: shop.name,
    logoUrl: shop.logo_url,
    coverUrl: shop.cover_url,
    shopSlug: shop.slug,
    shopUrl,
    isVerified: hasVerifiedBadge(shop),
    verificationStatus: shop.verification_status,
    isPaused: shop.is_paused,
    pausedReason: shop.paused_reason,
    upcomingAppointments,
    treatmentAlerts,
    alertedPatients,
    patients: patients.map((patient) => ({
      id: patient.id,
      name: patient.name,
      species: patient.species,
      owner_name: patient.owner_name,
    })),
    patientsCount,
    speciesBreakdown,
    weeklyCompletedAppointments,
    monthlyTreatmentCount,
    weeklyNewPatients,
    weeklyRevenue,
    activityFeed,
    profileViews: shop.profile_views,
    whatsappClicks: shop.whatsapp_clicks,
    followerCount,
  }
}
