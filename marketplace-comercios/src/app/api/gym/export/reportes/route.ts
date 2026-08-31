import { NextResponse } from 'next/server'
import { getGymAccessLogForRange, getMyShopId, GYM_ACCESS_SOURCE_LABEL } from '@/lib/gym/queries'
import { getGymBenefits } from '@/lib/shops/queries'
import { resolveGymReportRange } from '@/lib/gym/report-range'
import { toCsv } from '@/lib/csv'

const OUTCOME_LABEL: Record<string, string> = {
  allowed: 'Ingresó',
  denied_expired: 'Denegado (vencida)',
  denied_not_found: 'Denegado (sin socio)',
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

  const log = await getGymAccessLogForRange(shopId, from, to)

  const rows: string[][] = [
    ['Fecha', 'Resultado', 'Origen', 'Socio / referencia'],
    ...log.map((row) => [
      formatDateTime(row.checked_in_at),
      OUTCOME_LABEL[row.outcome] ?? row.outcome,
      GYM_ACCESS_SOURCE_LABEL[row.source] ?? row.source,
      row.member_name ?? (row.attempted_ref ? `Nº ${row.attempted_ref}` : ''),
    ]),
  ]

  const csv = toCsv(rows)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="reporte-${from}_a_${to}.csv"`,
    },
  })
}
