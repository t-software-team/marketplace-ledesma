import Link from 'next/link'
import { Store } from 'lucide-react'

export function DashboardFooter() {
  return (
    <footer className="border-t border-border bg-surface px-4 py-4 md:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
        <span className="flex items-center gap-1.5">
          <Store className="size-3.5" aria-hidden />© {new Date().getFullYear()} Marketplace Ledesma
        </span>
        <Link href="/" className="transition-colors hover:text-foreground">
          Volver al sitio →
        </Link>
      </div>
    </footer>
  )
}
