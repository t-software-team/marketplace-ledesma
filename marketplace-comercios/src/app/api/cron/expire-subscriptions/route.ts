import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/server/supabase-service-role'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const { error } = await supabase.rpc('expire_subscriptions')

  if (error) {
    console.error('cron expire-subscriptions: fallo al ejecutar expire_subscriptions', { error })
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
