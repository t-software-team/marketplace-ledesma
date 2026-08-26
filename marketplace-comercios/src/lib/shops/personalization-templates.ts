// Plantillas de tienda: layouts prearmados que el comercio elige para su tienda
// pública. En lugar de configurar sección por sección, el dueño elige una
// plantilla y solo carga qué mostrar (banner, color). El contenido reutiliza
// columnas existentes (landing_banner, accent_color); solo persistimos la clave.

export type StoreTemplateKey = 'clasica' | 'shopmore'

export interface StoreTemplate {
  key: StoreTemplateKey
  label: string
  /** Resumen corto para el selector. */
  description: string
  /** Qué incluye el layout, para orientar al comercio en el selector. */
  features: string[]
  /** Color de acento sugerido al elegir la plantilla (clave de ACCENT_COLORS). */
  accentColor: string
}

export const STORE_TEMPLATES: StoreTemplate[] = [
  {
    key: 'clasica',
    label: 'Clásica',
    description: 'El diseño tradicional: banner, servicios, galería y video.',
    features: ['Banner promocional', 'Servicios y galería', 'Video', 'Grilla de productos'],
    accentColor: 'violet',
  },
  {
    key: 'shopmore',
    label: 'Marketplace',
    description: 'Estilo tienda online: hero, categorías y destacados. Sin carrito.',
    features: ['Hero con banner propio', 'Categorías que vendés', 'Fila de destacados', 'Grilla de productos'],
    accentColor: 'violet',
  },
]

export const DEFAULT_STORE_TEMPLATE: StoreTemplateKey = 'clasica'

export function isStoreTemplateKey(value: unknown): value is StoreTemplateKey {
  return value === 'clasica' || value === 'shopmore'
}

/** Normaliza el valor crudo de la columna a una clave válida (fallback clásico). */
export function resolveStoreTemplate(value: unknown): StoreTemplateKey {
  return isStoreTemplateKey(value) ? value : DEFAULT_STORE_TEMPLATE
}
