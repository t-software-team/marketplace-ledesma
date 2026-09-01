'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt: () => Promise<void>
}

function isIosSafari() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isIos = /iPad|iPhone|iPod/.test(ua)
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)
  return isIos && isSafari
}

// UA no cambia durante la sesión, así que no hace falta suscribirse a nada.
function subscribeNever() {
  return () => {}
}

function getServerSnapshotFalse() {
  return false
}

function isStandalone() {
  if (typeof window === 'undefined') return false
  const nav = navigator as Navigator & { standalone?: boolean }
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true
}

function subscribeStandalone(onChange: () => void) {
  if (typeof window === 'undefined') return () => {}
  const mql = window.matchMedia('(display-mode: standalone)')
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

/**
 * Shared install-prompt state (beforeinstallprompt capture + iOS detection +
 * standalone detection + SW registration) so multiple UI surfaces (header
 * button, feed banner) can offer "install" without duplicating the listeners.
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installedByEvent, setInstalledByEvent] = useState(false)
  const isIos = useSyncExternalStore(subscribeNever, isIosSafari, getServerSnapshotFalse)
  const standalone = useSyncExternalStore(subscribeStandalone, isStandalone, getServerSnapshotFalse)
  const installed = standalone || installedByEvent

  useEffect(() => {
    // Nunca registrar el SW en desarrollo: su cache de navegaciones
    // (staleWhileRevalidate) pelea con el Hot Reload de Turbopack y puede
    // servir HTML viejo o disparar recargas repetidas contra el dev server.
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Registration failure is non-fatal — the app still works, it just
        // won't be installable.
      })
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    function handleAppInstalled() {
      setInstalledByEvent(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const canInstall = !installed && (Boolean(deferredPrompt) || isIos)

  async function promptInstall(): Promise<'native' | 'ios' | 'unavailable'> {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
      return 'native'
    }
    if (isIos) return 'ios'
    return 'unavailable'
  }

  return { canInstall, isIos, hasNativePrompt: Boolean(deferredPrompt), installed, promptInstall }
}
