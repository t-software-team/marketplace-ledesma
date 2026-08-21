'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logAdminAction } from './shared'

export async function markReportReviewed(reportId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('shop_reports')
    .update({ status: 'reviewed', reviewed_by: user?.id ?? null })
    .eq('id', reportId)

  if (error) {
    console.error('markReportReviewed: fallo al actualizar reporte', { reportId, error })
    throw new Error('No pudimos actualizar el reporte')
  }

  await logAdminAction(supabase, 'report_reviewed', 'shop_reports', reportId)

  revalidatePath('/admin/reportes')
}

export async function dismissReport(reportId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('shop_reports')
    .update({ status: 'dismissed', reviewed_by: user?.id ?? null })
    .eq('id', reportId)

  if (error) {
    console.error('dismissReport: fallo al descartar reporte', { reportId, error })
    throw new Error('No pudimos descartar el reporte')
  }

  await logAdminAction(supabase, 'report_dismissed', 'shop_reports', reportId)

  revalidatePath('/admin/reportes')
}

async function bulkUpdateReportStatus(
  reportIds: string[],
  status: 'reviewed' | 'dismissed'
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('shop_reports')
    .update({ status, reviewed_by: user?.id ?? null })
    .in('id', reportIds)

  if (error) {
    console.error('bulkUpdateReportStatus: fallo al actualizar reportes', { reportIds, status, error })
    throw new Error('No pudimos actualizar los reportes seleccionados')
  }

  const action = status === 'reviewed' ? 'report_reviewed' : 'report_dismissed'
  for (const reportId of reportIds) {
    await logAdminAction(supabase, action, 'shop_reports', reportId)
  }

  revalidatePath('/admin/reportes')
}

export async function bulkMarkReportsReviewed(reportIds: string[]) {
  await bulkUpdateReportStatus(reportIds, 'reviewed')
}

export async function bulkDismissReports(reportIds: string[]) {
  await bulkUpdateReportStatus(reportIds, 'dismissed')
}
