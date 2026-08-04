function getBenefitLabels(noun: string, nounPlural: string): Record<string, (value: unknown) => string | null> {
  return {
    max_products: (value) =>
      value === null ? `${nounPlural} ilimitados` : `Hasta ${value} ${noun}s`,
    featured: (value) => (value ? `Destacá tus ${noun}s en el feed` : null),
    analytics: (value) => (value ? 'Estadísticas de tu tienda' : null),
    priority_support: (value) => (value ? 'Soporte prioritario' : null),
    custom_branding: (value) => (value ? 'Personalizá tu tienda pública (color, banner, servicios, video)' : null),
    promotions: (value) => (value ? 'Creá promociones destacadas en el feed' : null),
  }
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
