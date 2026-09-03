import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/server/supabase-service-role'
import { sendEmail } from '@/lib/email/client'
import { patientReminderEmail } from '@/lib/email/templates'
import { formatWhenText } from '@/lib/turnos/whatsapp'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase.rpc('enqueue_patient_reminders')

  if (error) {
    console.error('cron patient-reminders: fallo al ejecutar enqueue_patient_reminders', {
      error,
    })
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }

  const reminders = (data ?? []).filter((reminder) => reminder.owner_email)
  const BATCH_SIZE = 10

  for (let i = 0; i < reminders.length; i += BATCH_SIZE) {
    const batch = reminders.slice(i, i + BATCH_SIZE)
    await Promise.all(
      batch.map(async (reminder) => {
        try {
          const { subject, html } = patientReminderEmail(
            reminder.shop_name,
            reminder.patient_name,
            reminder.label,
            formatWhenText(reminder.due_at)
          )
          await sendEmail(reminder.owner_email, subject, html)
        } catch (emailError) {
          console.error('cron patient-reminders: fallo al enviar recordatorio (best effort)', {
            reminderId: reminder.id,
            error: emailError,
          })
        }
      })
    )
  }

  return NextResponse.json({ ok: true, sent: reminders.length })
}
