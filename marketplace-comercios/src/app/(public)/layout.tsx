import { BottomNav, PublicHeader, PublicMain } from '@/components/shared/public-header'

// Sin lectura de cookies: la sesión del header se resuelve en el cliente
// (`useHeaderAuth`), así este layout no fuerza a dinámicas todas las páginas
// públicas que envuelve y el ISR de producto/tienda/feed puede tener efecto.
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <PublicHeader />
      <PublicMain>{children}</PublicMain>
      <BottomNav />
    </div>
  )
}
