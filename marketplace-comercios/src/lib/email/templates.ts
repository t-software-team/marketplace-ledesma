import { getBaseUrl } from '@/lib/site-url'

function layout(title: string, bodyHtml: string, ctaHref?: string, ctaLabel?: string) {
  const baseUrl = getBaseUrl()
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #3a3550;">
      <p style="font-size: 13px; color: #767296; margin-bottom: 24px;">Todo Marketplace</p>
      <h1 style="font-size: 20px; margin-bottom: 12px;">${title}</h1>
      <div style="font-size: 14px; line-height: 1.6; color: #3a3550;">${bodyHtml}</div>
      ${
        ctaHref && ctaLabel
          ? `<a href="${baseUrl}${ctaHref}" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#7c3aed;color:#faf5ff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;">${ctaLabel}</a>`
          : ''
      }
    </div>
  `
}

export function shopVerificationApprovedEmail(shopName: string) {
  return {
    subject: `¡${shopName} fue verificado! ✅`,
    html: layout(
      '¡Tu comercio ya está verificado!',
      `<p>Buenas noticias: revisamos el documento que enviaste y <strong>${shopName}</strong> ya tiene el sello de verificado en Todo Marketplace.</p>
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
