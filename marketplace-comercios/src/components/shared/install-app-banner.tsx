'use client'

import { useEffect, useState } from 'react'
import { Download, Share, Smartphone, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useInstallPrompt } from '@/hooks/use-install-prompt'

const DISMISSED_KEY = 'install-app-banner-dismissed'

export function InstallAppBanner() {
  const { canInstall, isIos, promptInstall } = useInstallPrompt()
  const [showIosInstructions, setShowIosInstructions] = useState(false)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    setDismissed(window.localStorage.getItem(DISMISSED_KEY) === '1')
  }, [])

  if (!canInstall || dismissed) return null

  function handleDismiss() {
    window.localStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
  }

  async function handleInstall() {
    const result = await promptInstall()
    if (result === 'ios') setShowIosInstructions(true)
    else if (result === 'native') handleDismiss()
  }

  return (
    <>
      <div className="mx-auto mb-4 flex max-w-5xl items-center gap-3 border-b border-border bg-primary/5 px-4 py-2.5 md:px-6">
        <Smartphone className="size-4 shrink-0 text-primary" aria-hidden />
        <p className="min-w-0 flex-1 truncate text-sm text-foreground">
          Instalá Proxi en tu celular para un acceso más rápido
        </p>
        <Button size="sm" className="shrink-0 gap-1.5" onClick={handleInstall}>
          <Download className="size-3.5" aria-hidden />
          Instalar
        </Button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Cerrar"
          className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      {isIos && (
        <Dialog
          open={showIosInstructions}
          onOpenChange={(open) => {
            setShowIosInstructions(open)
            if (!open) handleDismiss()
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Instalar la app</DialogTitle>
              <DialogDescription>
                Tocá el botón <Share className="inline size-3.5" aria-hidden /> <strong>Compartir</strong>{' '}
                y elegí <strong>&quot;Agregar a inicio&quot;</strong> para instalar la app en tu pantalla de
                inicio.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
