import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/server/supabase-service-role'
import { sendEmail } from '@/lib/email/client'
import { appointmentReminderEmail } from '@/lib/email/templates'
import { formatWhenText } from '@/lib/turnos/whatsapp'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase.rpc('enqueue_appointment_reminders')

  if (error) {
    console.error('cron appointment-reminders: fallo al ejecutar enqueue_appointment_reminders', {
      error,
    })
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }

  const appointments = (data ?? []).filter((appointment) => appointment.customer_email)
  const BATCH_SIZE = 10

  for (let i = 0; i < appointments.length; i += BATCH_SIZE) {
    const batch = appointments.slice(i, i + BATCH_SIZE)
    await Promise.all(
      batch.map(async (appointment) => {
        try {
          const { subject, html } = appointmentReminderEmail(
            appointment.shop_name,
            formatWhenText(appointment.starts_at)
          )
          await sendEmail(appointment.customer_email, subject, html)
        } catch (emailError) {
          console.error('cron appointment-reminders: fallo al enviar recordatorio (best effort)', {
            appointmentId: appointment.id,
            error: emailError,
          })
        }
      })
    )
  }

  return NextResponse.json({ ok: true, sent: appointments.length })
}
