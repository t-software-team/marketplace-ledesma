import { Resend } from 'resend'

const FROM_EMAIL = process.env.EMAIL_FROM ?? 'Proxi <no-reply@proximarket.com.ar>'

let resendClient: Resend | null = null

function getResendClient() {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (process.env.EMAILS_DISABLED === 'true') {
    console.warn('sendEmail: envíos desactivados por EMAILS_DISABLED, no se envió el email', {
      to,
      subject,
    })
    return
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('sendEmail: RESEND_API_KEY no está configurada, no se envió el email', {
      to,
      subject,
    })
    return
  }

  const { error } = await getResendClient().emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  })

  if (error) {
    console.error('sendEmail: fallo al enviar', { to, subject, error })
  }
}
