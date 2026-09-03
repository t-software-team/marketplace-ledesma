import { NextResponse } from 'next/server'
import { getGymPaymentsForExport, getMyShopId } from '@/lib/gym/queries'
import { getGymBenefits } from '@/lib/shops/queries'
import { resolveGymReportRange } from '@/lib/gym/report-range'
import { toCsv } from '@/lib/csv'

const METHOD_LABEL: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  mercadopago: 'Mercado Pago',
}

const STATUS_LABEL: Record<string, string> = {
  paid: 'Pagado',
  pending: 'Pendiente',
  failed: 'Fallido',
  voided: 'Anulado',
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
}

export async function GET(request: Request) {
  const shopId = await getMyShopId()
  if (!shopId) return new NextResponse('No autorizado', { status: 401 })

  const benefits = await getGymBenefits(shopId)
  if (!benefits.exportCsv) {
    return new NextResponse('Exportar es una función del Plan Gimnasio', { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const { from, to } = resolveGymReportRange(searchParams.get('from'), searchParams.get('to'))
  const search = searchParams.get('search') ?? undefined

  const payments = await getGymPaymentsForExport(shopId, { from, to, search })

  const rows: string[][] = [
    ['Fecha', 'Socio', 'Método', 'Monto', 'Estado', 'Motivo de anulación'],
    ...payments.map((p) => [
      formatDateTime(p.paid_at ?? p.created_at),
      p.member_name ?? '',
      METHOD_LABEL[p.method] ?? p.method,
      String(p.amount),
      STATUS_LABEL[p.status] ?? p.status,
      p.void_reason ?? '',
    ]),
  ]

  const csv = toCsv(rows)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="caja-${from}_a_${to}.csv"`,
    },
  })
}
