'use client'

import { useCallback, useSyncExternalStore } from 'react'

// No hace falta reaccionar a cambios de OTRAS pestañas acá (los banners que
// usan esto se dismissean desde la misma pestaña), así que el subscribe es
// un no-op — solo se usa useSyncExternalStore por su getServerSnapshot, que
// evita el mismatch de hidratación sin necesitar un setState en un efecto.
function subscribe() {
  return () => {}
}

const getServerSnapshot = () => false

/** Lee `localStorage.getItem(key) === '1'` de forma segura para SSR. */
export function useLocalStorageFlag(key: string) {
  const getSnapshot = useCallback(() => window.localStorage.getItem(key) === '1', [key])
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
