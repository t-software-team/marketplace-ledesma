'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useLocalStorageFlag } from '@/hooks/use-local-storage-flag'

const COOKIE_NOTICE_STORAGE_KEY = 'cookie-notice-dismissed'

export function CookieNotice() {
  const dismissed = useLocalStorageFlag(COOKIE_NOTICE_STORAGE_KEY)
  const [manuallyDismissed, setManuallyDismissed] = useState(false)
  const visible = !dismissed && !manuallyDismissed

  function handleDismiss() {
    localStorage.setItem(COOKIE_NOTICE_STORAGE_KEY, '1')
    setManuallyDismissed(true)
  }

  if (!visible) return null

  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md flex-col gap-2 rounded-lg bg-surface px-4 py-3 ring-1 ring-border shadow-md sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-muted-foreground">
        Usamos cookies/analytics básicos para mejorar la experiencia. Ver más en{' '}
        <Link href="/terminos" className="font-medium text-foreground underline underline-offset-2">
          Términos y Condiciones
        </Link>
        .
      </p>
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 self-end rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground sm:self-auto"
      >
        Entendido
      </button>
    </div>
  )
}
