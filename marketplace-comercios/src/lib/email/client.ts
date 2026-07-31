import { Resend } from 'resend'

const FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS ?? 'Proxi Marketplace <onboarding@resend.dev>'

export async function sendEmail(to: string, subject: string, html: string) {
  if (process.env.EMAILS_DISABLED === 'true') {
    console.warn('sendEmail: envíos desactivados por EMAILS_DISABLED, no se envió el email', {
      to,
      subject,
    })
    return
  }

  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.error('sendEmail: RESEND_API_KEY no está configurada, no se envió el email', {
      to,
      subject,
    })
    return
  }

  const resend = new Resend(apiKey)

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
  })

  if (error) {
    console.error('sendEmail: fallo al enviar', { to, subject, error })
  }
}
