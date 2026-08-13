'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface ConfirmDialogProps {
  /** Omit when using controlled mode (`open`/`onOpenChange`) — e.g. when the
   * thing that opens this dialog can't be the dialog's own trigger, like a
   * menu item whose parent menu closes on click and would take the dialog
   * down with it. */
  trigger?: React.ReactElement
  triggerLabel?: React.ReactNode
  title: string
  description?: string
  confirmLabel?: string
  isConfirming?: boolean
  onConfirm: () => void
  triggerNativeButton?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ConfirmDialog({
  trigger,
  triggerLabel,
  title,
  description,
  confirmLabel = 'Confirmar',
  isConfirming = false,
  onConfirm,
  triggerNativeButton = true,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: ConfirmDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : uncontrolledOpen
  const setOpen = isControlled ? (onOpenChangeProp ?? (() => {})) : setUncontrolledOpen

  function handleConfirm() {
    onConfirm()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && (
        <DialogTrigger render={trigger} nativeButton={triggerNativeButton}>
          {triggerLabel}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isConfirming}>
            {isConfirming ? 'Procesando...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
