import { NextResponse } from 'next/server'
import { getAvailableSlots } from '@/lib/turnos/queries'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const shopId = searchParams.get('shopId')
  const date = searchParams.get('date')

  if (!shopId || !date) {
    return NextResponse.json({ error: 'shopId y date son requeridos' }, { status: 400 })
  }

  const slots = await getAvailableSlots(shopId, date)

  return NextResponse.json({ slots })
}
