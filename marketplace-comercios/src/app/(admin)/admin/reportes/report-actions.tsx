'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { dismissReport, markReportReviewed } from '@/lib/admin/actions'

interface ReportActionsProps {
  reportId: string
}

export function ReportActions({ reportId }: ReportActionsProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleMarkReviewed() {
    startTransition(async () => {
      try {
        await markReportReviewed(reportId)
        toast.add({ title: 'Reporte marcado como revisado', type: 'success' })
        router.refresh()
      } catch {
        toast.add({ title: 'No pudimos actualizar el reporte', type: 'error' })
      }
    })
  }

  function handleDismiss() {
    startTransition(async () => {
      try {
        await dismissReport(reportId)
        toast.add({ title: 'Reporte descartado', type: 'success' })
        router.refresh()
      } catch {
        toast.add({ title: 'No pudimos descartar el reporte', type: 'error' })
      }
    })
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={isPending} onClick={handleMarkReviewed}>
        Marcar revisado
      </Button>
      <Button size="sm" variant="outline" disabled={isPending} onClick={handleDismiss}>
        Descartar
      </Button>
    </div>
  )
}
