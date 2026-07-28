'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { dismissReport, markReportReviewed } from '@/lib/admin/actions'

interface ReportActionsProps {
  reportId: string
}

export function ReportActions({ reportId }: ReportActionsProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleMarkReviewed() {
    startTransition(async () => {
      await markReportReviewed(reportId)
      router.refresh()
    })
  }

  function handleDismiss() {
    startTransition(async () => {
      await dismissReport(reportId)
      router.refresh()
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
