import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/server/supabase-service-role'
import { sendEmail } from '@/lib/email/client'
import { treatmentReminderEmail } from '@/lib/email/templates'
import { formatWhenText } from '@/lib/turnos/whatsapp'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase.rpc('enqueue_treatment_reminders')

  if (error) {
    console.error('cron treatment-reminders: fallo al ejecutar enqueue_treatment_reminders', {
      error,
    })
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }

  const applications = (data ?? []).filter((application) => application.owner_email)
  const BATCH_SIZE = 10

  for (let i = 0; i < applications.length; i += BATCH_SIZE) {
    const batch = applications.slice(i, i + BATCH_SIZE)
    await Promise.all(
      batch.map(async (application) => {
        try {
          const { subject, html } = treatmentReminderEmail(
            application.shop_name,
            application.patient_name,
            application.dose_label,
            formatWhenText(application.next_due_at)
          )
          await sendEmail(application.owner_email, subject, html)
        } catch (emailError) {
          console.error('cron treatment-reminders: fallo al enviar recordatorio (best effort)', {
            applicationId: application.id,
            error: emailError,
          })
        }
      })
    )
  }

  return NextResponse.json({ ok: true, sent: applications.length })
}
