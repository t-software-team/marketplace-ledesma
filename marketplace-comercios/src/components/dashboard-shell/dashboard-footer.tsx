import { Store } from 'lucide-react'

export function DashboardFooter() {
  return (
    <footer className="border-t border-border bg-surface px-4 py-4 md:px-6">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Store className="size-3.5" aria-hidden />© {new Date().getFullYear()} Todo Marketplace
      </div>
    </footer>
  )
}
