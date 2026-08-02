// Proveedor actual: Brevo (API REST, sin SDK). Se migró desde Resend porque Resend
// exige verificar un dominio propio por DNS para enviar a destinatarios arbitrarios,
// mientras que Brevo permite verificar un sender individual (una casilla de email)
// sin necesidad de dominio propio.
//
// Resend queda documentado para retomarlo en una próxima campaña, cuando haya
// dominio propio verificado:
//   import { Resend } from 'resend'
//   const resend = new Resend(process.env.RESEND_API_KEY)
//   await resend.emails.send({ from: FROM_ADDRESS, to, subject, html })

const FROM_EMAIL = process.env.EMAIL_FROM ?? 'noreply@proxi.com'
const FROM_NAME = 'Proxi Marketplace'
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

export async function sendEmail(to: string, subject: string, html: string) {
  if (process.env.EMAILS_DISABLED === 'true') {
    console.warn('sendEmail: envíos desactivados por EMAILS_DISABLED, no se envió el email', {
      to,
      subject,
    })
    return
  }

  const apiKey = process.env.EMAIL_PASS

  if (!apiKey) {
    console.error('sendEmail: EMAIL_PASS (API key de Brevo) no está configurada, no se envió el email', {
      to,
      subject,
    })
    return
  }

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { email: FROM_EMAIL, name: FROM_NAME },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('sendEmail: fallo al enviar', { to, subject, error })
  }
}
