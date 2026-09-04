'use client'

import { useState, useTransition } from 'react'
import { MonitorSmartphone, ExternalLink, Copy, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import {
  ensureGymSelfCheckinToken,
  regenerateGymSelfCheckinToken,
} from '@/lib/gym/self-checkin-actions'

export function SelfCheckinLaunch() {
  const [url, setUrl] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const buildUrl = (token: string) => `${window.location.origin}/ingresos/${token}`

  const enable = () => {
    startTransition(async () => {
      const { token, error } = await ensureGymSelfCheckinToken()
      if (error || !token) {
        toast.add({ title: 'No pudimos abrir el autoingreso', description: error ?? undefined, type: 'error' })
        return
      }
      const next = buildUrl(token)
      setUrl(next)
      window.open(next, '_blank', 'noopener')
    })
  }

  const regenerate = () => {
    if (!window.confirm('Se generará un link nuevo y el anterior dejará de funcionar. ¿Continuar?')) return
    startTransition(async () => {
      const { token, error } = await regenerateGymSelfCheckinToken()
      if (error || !token) {
        toast.add({ title: 'No pudimos regenerar el link', description: error ?? undefined, type: 'error' })
        return
      }
      setUrl(buildUrl(token))
      toast.add({ title: 'Link regenerado', description: 'El link anterior ya no funciona.', type: 'success' })
    })
  }

  const copy = async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      toast.add({ title: 'Link copiado', type: 'success' })
    } catch {
      toast.add({ title: 'No pudimos copiar', description: 'Copialo manualmente.', type: 'error' })
    }
  }

  if (!url) {
    return (
      <Button variant="secondary" onClick={enable} disabled={isPending}>
        <MonitorSmartphone className="mr-2 size-4" aria-hidden />
        Modo autoingreso
      </Button>
    )
  }

  return (
    <div className="space-y-2 rounded-xl border border-border bg-surface p-3">
      <p className="text-sm font-medium">Pantalla de autoingreso</p>
      <p className="text-xs text-muted-foreground">
        Abrí este link en la tablet de la entrada. Los socios ingresan solos con su DNI y quedan
        registrados acá. No lo compartas públicamente.
      </p>
      <code className="block truncate rounded-lg bg-muted px-2 py-1.5 text-xs">{url}</code>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => window.open(url, '_blank', 'noopener')}>
          <ExternalLink className="mr-2 size-4" aria-hidden />
          Abrir
        </Button>
        <Button size="sm" variant="secondary" onClick={copy}>
          <Copy className="mr-2 size-4" aria-hidden />
          Copiar
        </Button>
        <Button size="sm" variant="ghost" onClick={regenerate} disabled={isPending}>
          <RefreshCw className="mr-2 size-4" aria-hidden />
          Regenerar
        </Button>
      </div>
    </div>
  )
}
