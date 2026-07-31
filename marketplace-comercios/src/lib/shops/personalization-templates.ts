export interface PersonalizationTemplate {
  key: string
  label: string
  description: string
  accentColor: string
  banner?: {
    title: string
    subtitle: string
  }
}

export const PERSONALIZATION_TEMPLATES: PersonalizationTemplate[] = [
  {
    key: 'elegante',
    label: 'Elegante',
    description: 'Violeta, enfocada en tus servicios',
    accentColor: 'violet',
  },
  {
    key: 'vibrante',
    label: 'Vibrante',
    description: 'Naranja, con banner de promo',
    accentColor: 'orange',
    banner: {
      title: '20% off en tu primera compra',
      subtitle: 'Aprovechá antes de que se termine',
    },
  },
  {
    key: 'minimal',
    label: 'Minimal',
    description: 'Celeste, con foco en el video',
    accentColor: 'sky',
  },
]
