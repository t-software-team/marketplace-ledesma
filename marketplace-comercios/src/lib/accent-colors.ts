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

export function getAccentColor(key: string | null | undefined): AccentColorOption {
  return ACCENT_COLORS.find((color) => color.key === key) ?? ACCENT_COLORS[0]
}
