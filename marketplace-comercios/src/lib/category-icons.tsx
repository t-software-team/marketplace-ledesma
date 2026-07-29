import {
  Beef,
  BookOpen,
  Car,
  Droplets,
  HeartPulse,
  Key,
  Pill,
  Scissors,
  Shirt,
  ShoppingBag,
  ShoppingBasket,
  Tag,
  UtensilsCrossed,
  Wrench,
  PawPrint,
  HardHat,
  Smartphone,
  Truck,
  Laptop,
  Music,
  type LucideIcon,
} from 'lucide-react'

export const RUBRO_ICONS: Record<string, LucideIcon> = {
  farmacias: Pill,
  almacenes: ShoppingBasket,
  carnicerias: Beef,
  peluquerias: Scissors,
  talleres: Wrench,
  'salud-y-bienestar': HeartPulse,
  'tienda-de-ropa': Shirt,
  libreria: BookOpen,
  alquileres: Key,
  comercio: ShoppingBag,
  comida: UtensilsCrossed,
  concesionaria: Car,
  lavadero: Droplets,
  veterinaria: PawPrint,
  construccion: HardHat,
  'servicio-tecnico': Smartphone,
  corralon: Truck,
  tecnologia: Laptop,
  'bandas-musicales': Music,
}

export function getRubroIcon(slug: string): LucideIcon {
  return RUBRO_ICONS[slug] ?? Tag
}

const SERVICE_RUBROS = new Set([
  'peluquerias',
  'talleres',
  'salud-y-bienestar',
  'alquileres',
  'lavadero',
  'veterinaria',
  'servicio-tecnico',
  'construccion',
  'tecnologia',
  'bandas-musicales',
])

export function isServiceRubro(slug: string | null | undefined): boolean {
  return slug ? SERVICE_RUBROS.has(slug) : false
}
