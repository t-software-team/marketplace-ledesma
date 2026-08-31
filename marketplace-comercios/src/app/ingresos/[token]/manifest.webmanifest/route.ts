import { createServiceRoleClient } from '@/server/supabase-service-role'
import { GYM_RUBRO_SLUG } from '@/lib/category-icons'

export const dynamic = 'force-dynamic'

type RouteParams = {
  params: Promise<{ token: string }>
}

/**
 * Per-gym Web App Manifest for the public self check-in screen. Scoped to
 * /ingresos/[token] (not the root app) so installing it on the entry tablet
 * puts a shortcut named after the gym — not "Proxi Marketplace" — that opens
 * straight into the kiosk, full-screen.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { token } = await params

  const service = createServiceRoleClient()
  const { data: shop } = await service
    .from('shops')
    .select('id, name, is_active, deleted_at, categories ( slug )')
    .eq('gym_self_checkin_token', token)
    .maybeSingle()

  if (!shop || shop.deleted_at || !shop.is_active || shop.categories?.slug !== GYM_RUBRO_SLUG) {
    return new Response('Not found', { status: 404 })
  }

  const scope = `/ingresos/${token}`
  const manifest = {
    name: `${shop.name} — Autoingreso`,
    short_name: 'Autoingreso',
    description: `Pantalla de autoingreso de socios de ${shop.name}`,
    start_url: scope,
    scope,
    display: 'standalone',
    background_color: '#17131f',
    theme_color: '#17131f',
    orientation: 'portrait',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }

  return new Response(JSON.stringify(manifest), {
    headers: { 'Content-Type': 'application/manifest+json' },
  })
}
