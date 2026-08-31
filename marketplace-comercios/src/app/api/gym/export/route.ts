import { NextResponse } from 'next/server'
import { getGymMembers, getMyShopId } from '@/lib/gym/queries'
import { getGymBenefits } from '@/lib/shops/queries'
import { toCsv } from '@/lib/csv'

const STATUS_LABEL: Record<string, string> = {
  active: 'Vigente',
  expired: 'Vencido',
  archived: 'Baja',
}

export async function GET() {
  const shopId = await getMyShopId()
  if (!shopId) return new NextResponse('No autorizado', { status: 401 })

  const benefits = await getGymBenefits(shopId)
  if (!benefits.exportCsv) {
    return new NextResponse('Exportar es una función del Plan Gimnasio', { status: 403 })
  }

  const members = await getGymMembers(shopId, { limit: 5000 })

  const rows: string[][] = [
    ['Nombre', 'Documento', 'Teléfono', 'Email', 'Estado', 'Vencimiento'],
    ...members.map((m) => [
      m.full_name,
      m.document ?? '',
      m.phone ?? '',
      m.email ?? '',
      STATUS_LABEL[m.status] ?? m.status,
      m.expires_at ?? '',
    ]),
  ]

  const csv = toCsv(rows)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="socios.csv"',
    },
  })
}
