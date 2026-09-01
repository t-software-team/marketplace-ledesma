export interface AccentColorOption {
  key: string
  label: string
  swatch: string
  light: { primary: string; primaryForeground: string }
  dark: { primary: string; primaryForeground: string }
}

export const ACCENT_COLORS: AccentColorOption[] = [
  {
    key: 'violet',
    label: 'Violeta (por defecto)',
    swatch: '#7c3aed',
    light: { primary: '#7c3aed', primaryForeground: '#faf5ff' },
    dark: { primary: '#a179f2', primaryForeground: '#1b1030' },
  },
  {
    key: 'rose',
    label: 'Rosa',
    swatch: '#e11d48',
    light: { primary: '#e11d48', primaryForeground: '#fff1f2' },
    dark: { primary: '#fb7185', primaryForeground: '#4c0519' },
  },
  {
    key: 'orange',
    label: 'Naranja',
    swatch: '#ea580c',
    light: { primary: '#ea580c', primaryForeground: '#fff7ed' },
    dark: { primary: '#fb923c', primaryForeground: '#431407' },
  },
  {
    key: 'amber',
    label: 'Ámbar',
    swatch: '#d97706',
    light: { primary: '#d97706', primaryForeground: '#fffbeb' },
    dark: { primary: '#fbbf24', primaryForeground: '#451a03' },
  },
  {
    key: 'emerald',
    label: 'Verde',
    swatch: '#059669',
    light: { primary: '#059669', primaryForeground: '#ecfdf5' },
    dark: { primary: '#34d399', primaryForeground: '#022c22' },
  },
  {
    key: 'sky',
    label: 'Celeste',
    swatch: '#0284c7',
    light: { primary: '#0284c7', primaryForeground: '#f0f9ff' },
    dark: { primary: '#38bdf8', primaryForeground: '#082f49' },
  },
  {
    key: 'pink',
    label: 'Fucsia',
    swatch: '#db2777',
    light: { primary: '#db2777', primaryForeground: '#fdf2f8' },
    dark: { primary: '#f472b6', primaryForeground: '#500724' },
  },
]

export const DEFAULT_ACCENT_COLOR = 'violet'

const HEX_COLOR_RE = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/

export function isHexColor(value: string): boolean {
  return HEX_COLOR_RE.test(value)
}

export function normalizeHex(hex: string): string {
  if (hex.length === 4) {
    const [, r, g, b] = hex
    return `#${r}${r}${g}${g}${b}${b}`
  }
  return hex
}

// Luminancia relativa (WCAG) para decidir si el texto sobre el color va
// blanco o casi negro — necesario porque con un picker libre no podemos
// precalcular el par light/dark a mano como con la paleta fija.
function getContrastForeground(hex: string): string {
  const normalized = normalizeHex(hex)
  const r = parseInt(normalized.slice(1, 3), 16)
  const g = parseInt(normalized.slice(3, 5), 16)
  const b = parseInt(normalized.slice(5, 7), 16)
  const [rl, gl, bl] = [r, g, b].map((channel) => {
    const s = channel / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  const luminance = 0.2126 * rl + 0.7152 * gl + 0.0722 * bl
  return luminance > 0.55 ? '#1a1625' : '#ffffff'
}

export function getAccentColor(key: string | null | undefined): AccentColorOption {
  if (!key) return ACCENT_COLORS[0]

  const preset = ACCENT_COLORS.find((color) => color.key === key)
  if (preset) return preset

  if (isHexColor(key)) {
    const primaryForeground = getContrastForeground(key)
    return {
      key,
      label: 'Personalizado',
      swatch: key,
      light: { primary: key, primaryForeground },
      dark: { primary: key, primaryForeground },
    }
  }

  return ACCENT_COLORS[0]
}
