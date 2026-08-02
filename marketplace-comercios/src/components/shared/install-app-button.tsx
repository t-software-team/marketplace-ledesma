'use client'

import { useState } from 'react'
import { Download, Share } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useInstallPrompt } from '@/hooks/use-install-prompt'

export function InstallAppButton() {
  const { canInstall, isIos, promptInstall } = useInstallPrompt()
  const [showIosInstructions, setShowIosInstructions] = useState(false)

  if (!canInstall) return null

  async function handleClick() {
    const result = await promptInstall()
    if (result === 'ios') setShowIosInstructions(true)
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleClick}>
        <Download className="size-4" aria-hidden />
        <span>Acceso directo</span>
      </Button>
      {isIos && (
        <Dialog open={showIosInstructions} onOpenChange={setShowIosInstructions}>
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
