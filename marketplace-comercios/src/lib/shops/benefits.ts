function getBenefitLabels(noun: string, nounPlural: string): Record<string, (value: unknown) => string | null> {
  return {
    max_products: (value) =>
      value === null ? `${nounPlural} ilimitados` : `Hasta ${value} ${noun}s`,
    featured: (value) => (value ? `Destacá tus ${noun}s en el feed` : null),
    analytics: (value) => (value ? 'Estadísticas de tu tienda' : null),
    priority_support: (value) => (value ? 'Soporte prioritario' : null),
    custom_branding: (value) => (value ? 'Personalizá tu tienda pública (color, banner, servicios, video)' : null),
    promotions: (value) => (value ? 'Creá promociones destacadas en el feed' : null),
    verified_badge: (value) => (value ? 'Ícono de comercio verificado en tu perfil' : null),
  }
}

interface BenefitsFormInput {
  benefits_max_products?: string
  benefits_max_videos?: string
  benefits_featured: boolean
  benefits_analytics: boolean
  benefits_priority_support: boolean
  benefits_custom_branding: boolean
  benefits_promotions: boolean
  benefits_verified_badge: boolean
}

/** Arma el JSON de `subscription_plans.benefits` a partir de los campos
 * tipados del formulario de admin (checkboxes + números), en vez de que el
 * superadmin escriba el JSON a mano. Los numéricos vacíos se omiten (el
 * plan no trae ese beneficio); si se cargan, `null` en la UI equivale a
 * "sin límite" para los consumidores de `getBenefitLines`. */
export function buildBenefitsFromForm(input: BenefitsFormInput): Record<string, unknown> {
  const benefits: Record<string, unknown> = {
    featured: input.benefits_featured,
    analytics: input.benefits_analytics,
    priority_support: input.benefits_priority_support,
    custom_branding: input.benefits_custom_branding,
    promotions: input.benefits_promotions,
    verified_badge: input.benefits_verified_badge,
  }

  if (input.benefits_max_products) benefits.max_products = Number(input.benefits_max_products)
  if (input.benefits_max_videos) benefits.max_videos = Number(input.benefits_max_videos)

  return benefits
}

export function getBenefitLines(benefits: unknown, noun: string, nounPlural: string): string[] {
  if (!benefits || typeof benefits !== 'object') return []

  const labels = getBenefitLabels(noun, nounPlural)

  return Object.entries(benefits as Record<string, unknown>)
    .map(([key, value]) => {
      const formatter = labels[key]
      if (formatter) return formatter(value)
      if (value === false || value === null || value === undefined) return null
      return `${key}: ${value}`
    })
    .filter((line): line is string => Boolean(line))
}
