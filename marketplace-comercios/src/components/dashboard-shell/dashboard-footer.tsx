import { MessageCircle, Store } from 'lucide-react'
import { toWhatsAppNumber } from '@/lib/whatsapp'

const SUPPORT_PHONE = toWhatsAppNumber('+54 9 3886528023')
const SUPPORT_URL = `https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent('Hola, necesito ayuda con Todo Marketplace')}`

export function DashboardFooter() {
  return (
    <footer className="border-t border-border bg-surface px-4 py-4 md:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center gap-2 text-xs text-muted-foreground sm:flex-row sm:gap-4">
        <span className="flex items-center gap-1.5">
          <Store className="size-3.5" aria-hidden />© {new Date().getFullYear()} Todo Marketplace - Christian
          Toscano
        </span>
        <a
          href={SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 font-medium text-primary hover:underline"
        >
          <MessageCircle className="size-3.5" aria-hidden />
          ¿Necesitás ayuda? Escribinos
        </a>
      </div>
    </footer>
  )
}
