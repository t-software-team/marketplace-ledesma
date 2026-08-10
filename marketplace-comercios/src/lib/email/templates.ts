import { getBaseUrl } from '@/lib/site-url'

const COLOR_BG = '#faf8fc'
const COLOR_SURFACE = '#ffffff'
const COLOR_FOREGROUND = '#3a3550'
const COLOR_MUTED = '#767296'
const COLOR_BORDER = '#e6e1ed'
const COLOR_PRIMARY = '#7c3aed'
const COLOR_PRIMARY_FOREGROUND = '#faf5ff'

function layout(title: string, bodyHtml: string, ctaHref?: string, ctaLabel?: string) {
  const baseUrl = getBaseUrl()
  const font = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

  return `
  <!doctype html>
  <html lang="es">
    <body style="margin:0; padding:0; background:${COLOR_BG}; font-family:${font};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR_BG}; padding:32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background:${COLOR_SURFACE}; border:1px solid ${COLOR_BORDER}; border-radius:16px; overflow:hidden;">
              <tr>
                <td style="padding:28px 32px 0 32px;">
                  <table role="presentation" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="vertical-align:middle;">
                        <img src="${baseUrl}/brand/logo.png" alt="Proxi" width="28" height="28" style="display:block; border-radius:8px;" />
                      </td>
                      <td style="vertical-align:middle; padding-left:10px;">
                        <span style="font-size:15px; font-weight:600; color:${COLOR_FOREGROUND};">Proxi Marketplace</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:24px 32px 8px 32px;">
                  <h1 style="margin:0 0 12px 0; font-size:20px; line-height:1.3; color:${COLOR_FOREGROUND};">${title}</h1>
                  <div style="font-size:14px; line-height:1.6; color:${COLOR_FOREGROUND};">${bodyHtml}</div>
                  ${
                    ctaHref && ctaLabel
                      ? `<a href="${baseUrl}${ctaHref}" style="display:inline-block; margin-top:20px; padding:12px 22px; background:${COLOR_PRIMARY}; color:${COLOR_PRIMARY_FOREGROUND}; text-decoration:none; border-radius:10px; font-size:14px; font-weight:600;">${ctaLabel}</a>`
                      : ''
                  }
                </td>
              </tr>
              <tr>
                <td style="padding:24px 32px 28px 32px;">
                  <hr style="border:none; border-top:1px solid ${COLOR_BORDER}; margin:0 0 16px 0;" />
                  <p style="margin:0; font-size:12px; line-height:1.5; color:${COLOR_MUTED};">
                    Recibiste este email porque tenés un comercio en Proxi Marketplace.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `
}

export function clientWelcomeEmail() {
  return {
    subject: '¡Bienvenido a Proxi Marketplace! 🎉',
    html: layout(
      '¡Creaste tu cuenta!',
      `<p>Ya podés descubrir comercios y productos cerca tuyo, contactar por WhatsApp en un toque y guardar tus favoritos.</p>
       <p>Gracias por sumarte a Proxi.</p>`
    ),
  }
}

export function shopVerificationApprovedEmail(shopName: string) {
  return {
    subject: `¡${shopName} fue verificado! ✅`,
    html: layout(
      '¡Tu comercio ya está verificado!',
      `<p>Buenas noticias: revisamos el documento que enviaste y <strong>${shopName}</strong> ya tiene el sello de verificado en Proxi Marketplace.</p>
       <p>Esto genera más confianza en tus clientes potenciales.</p>`,
      '/mi-tienda',
      'Ver mi tienda'
    ),
  }
}

export function shopVerificationRejectedEmail(shopName: string) {
  return {
    subject: `No pudimos verificar ${shopName}`,
    html: layout(
      'Tu verificación no fue aprobada',
      `<p>Revisamos el documento que enviaste para <strong>${shopName}</strong>, pero no pudimos aprobarlo esta vez.</p>
       <p>Podés volver a subir un documento (habilitación, DNI del titular, factura de servicios) desde la configuración de tu tienda.</p>`,
      '/mi-tienda/configuracion',
      'Subir otro documento'
    ),
  }
}

export function subscriptionApprovedEmail(shopName: string, planName: string) {
  return {
    subject: `Tu suscripción está activa 🎉`,
    html: layout(
      '¡Tu suscripción ya está activa!',
      `<p>Confirmamos el pago del plan <strong>${planName}</strong> para <strong>${shopName}</strong>.</p>
       <p>Ya podés destacar productos, habilitar reseñas de clientes y mejorar tu posicionamiento en el feed.</p>`,
      '/mi-tienda',
      'Ir a mi tienda'
    ),
  }
}

export function subscriptionRejectedEmail(shopName: string, reason: string) {
  return {
    subject: `No pudimos confirmar tu pago`,
    html: layout(
      'Tu suscripción no fue aprobada',
      `<p>Revisamos el comprobante de pago para <strong>${shopName}</strong>, pero no pudimos confirmarlo.</p>
       <p><strong>Motivo:</strong> ${reason}</p>
       <p>Podés intentar de nuevo desde la sección de suscripción.</p>`,
      '/mi-tienda/suscripcion',
      'Ver planes'
    ),
  }
}

export function shopSuspendedEmail(shopName: string, reason: string) {
  return {
    subject: `Tu comercio ${shopName} fue suspendido`,
    html: layout(
      'Tu comercio fue suspendido',
      `<p><strong>${shopName}</strong> dejó de mostrarse en el feed y en el marketplace.</p>
       <p><strong>Motivo:</strong> ${reason}</p>
       <p>Si creés que es un error, respondé este email o contactanos para resolverlo.</p>`,
      '/mi-tienda',
      'Ir a mi tienda'
    ),
  }
}

export function shopReactivatedEmail(shopName: string) {
  return {
    subject: `¡${shopName} volvió a estar activo!`,
    html: layout(
      'Tu comercio fue reactivado',
      `<p><strong>${shopName}</strong> ya vuelve a mostrarse en el feed y en el marketplace.</p>`,
      '/mi-tienda',
      'Ir a mi tienda'
    ),
  }
}
