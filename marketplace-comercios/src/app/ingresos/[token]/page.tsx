import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createServiceRoleClient } from '@/server/supabase-service-role'
import { GYM_RUBRO_SLUG } from '@/lib/category-icons'
import { SelfCheckinClient } from './self-checkin-client'

export const dynamic = 'force-dynamic'

// A public unattended screen: keep it out of search engines.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

type PageProps = {
  params: Promise<{ token: string }>
}

export default async function SelfCheckinPage({ params }: PageProps) {
  const { token } = await params

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

  return <SelfCheckinClient token={token} gymName={shop.name} />
}
