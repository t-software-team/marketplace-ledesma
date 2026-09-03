import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createServiceRoleClient } from '@/server/supabase-service-role'
import { GYM_RUBRO_SLUG } from '@/lib/category-icons'
import { SelfCheckinClient } from './self-checkin-client'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ token: string }>
}

async function resolveGymByToken(token: string) {
  const service = createServiceRoleClient()
  const { data: shop } = await service
    .from('shops')
    .select('id, name, is_active, deleted_at, categories ( slug )')
    .eq('gym_self_checkin_token', token)
    .maybeSingle()

  // Invalid/rotated token, or not an active gym: 404 without revealing why.
  if (!shop || shop.deleted_at || !shop.is_active || shop.categories?.slug !== GYM_RUBRO_SLUG) {
    notFound()
  }

  return shop
}

// A public unattended screen: keep it out of search engines, and give it its
// own installable identity (name + manifest) instead of "Proxi Marketplace" —
// this is meant to be installed on the gym's own entry tablet.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params
  const shop = await resolveGymByToken(token)

  return {
    title: `Autoingreso — ${shop.name}`,
    robots: { index: false, follow: false },
    manifest: `/ingresos/${token}/manifest.webmanifest`,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: shop.name,
    },
  }
}

export default async function SelfCheckinPage({ params }: PageProps) {
  const { token } = await params
  const shop = await resolveGymByToken(token)

  return <SelfCheckinClient token={token} gymName={shop.name} />
}
