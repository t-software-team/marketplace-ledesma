import type { DashboardNavItem } from '@/components/dashboard-shell/dashboard-sidebar'
import { isVeterinariaRubro } from '@/lib/category-icons'

const GYM_STAFF_NAV_ITEMS: DashboardNavItem[] = [
  { href: '/mi-tienda/ingresos', label: 'Ingresos', icon: 'login' },
  { href: '/mi-tienda/socios', label: 'Socios', icon: 'users' },
]

const VET_STAFF_NAV_ITEMS: DashboardNavItem[] = [
  { href: '/mi-tienda/turnos', label: 'Turnos', icon: 'calendar' },
  { href: '/mi-tienda/pacientes', label: 'Pacientes', icon: 'paw' },
  { href: '/mi-tienda/tratamientos', label: 'Tratamientos', icon: 'syringe' },
]

/**
 * Resolves the scoped-down nav a staff member sees, based on the shop's
 * rubro. Staff never gets the owner's full nav (caja completa, planes,
 * reportes, personalizar, suscripción, configuración, equipo) — only the
 * day-to-day sections relevant to their rubro.
 */
export function resolveStaffNavItems(rubroSlug: string | null): DashboardNavItem[] {
  return isVeterinariaRubro(rubroSlug) ? VET_STAFF_NAV_ITEMS : GYM_STAFF_NAV_ITEMS
}

/** Root href a staff member lands on — the first item of their scoped nav. */
export function resolveStaffRootHref(rubroSlug: string | null): string {
  return resolveStaffNavItems(rubroSlug)[0].href
}
