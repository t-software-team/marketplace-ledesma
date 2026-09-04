import { Cat, Dog, PawPrint, type LucideIcon, type LucideProps } from 'lucide-react'

// Devuelve el ícono representativo para una especie de paciente.
// Fallback a PawPrint para especies no mapeadas (ej. "otro") o nulas.
export function getSpeciesIcon(species: string | null | undefined): LucideIcon {
  const normalized = species?.trim().toLowerCase()

  if (normalized === 'perro') return Dog
  if (normalized === 'gato') return Cat

  return PawPrint
}

// Componente wrapper para usar en JSX sin disparar la regla
// `react-hooks/static-components` (evita seleccionar dinámicamente un
// componente y asignarlo a una variable con mayúscula en cada render).
export function SpeciesIcon({
  species,
  ...props
}: { species: string | null | undefined } & LucideProps) {
  const normalized = species?.trim().toLowerCase()

  if (normalized === 'perro') return <Dog {...props} />
  if (normalized === 'gato') return <Cat {...props} />

  return <PawPrint {...props} />
}
