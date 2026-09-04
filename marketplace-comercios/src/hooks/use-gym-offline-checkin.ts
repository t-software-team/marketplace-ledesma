'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getGymOfflineRoster,
  syncOfflineGymCheckins,
  type GymOfflineRosterEntry,
} from '@/lib/gym/self-checkin-actions'
import {
  saveOfflineRoster,
  getOfflineRoster,
  enqueueOfflineCheckin,
  getOfflineQueue,
  removeFromOfflineQueue,
} from '@/lib/gym/offline-db'

const ROSTER_REFRESH_MS = 10 * 60 * 1000

type LocalMatch =
  | { kind: 'not_found' }
  | { kind: 'ambiguous' }
  | { kind: 'single'; firstName: string }

/**
 * Keeps the kiosk's offline roster cache fresh, queues check-in attempts made
 * while disconnected, and flushes that queue once connectivity returns. The
 * local roster match is only ever used to decide what to show the person at
 * the door immediately — the real outcome is always re-resolved server-side
 * at sync time (see resolveSelfCheckin), so a stale cache can't wrongly
 * admit or deny someone; it can only delay the confirmation.
 */
export function useGymOfflineCheckin(token: string) {
  const [roster, setRoster] = useState<GymOfflineRosterEntry[]>([])
  // Always starts true to match the server-rendered markup (no `navigator` on
  // the server); the real value is synced right after mount in the effect
  // below, once hydration has already reconciled against the SSR output.
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)

  const refreshQueueCount = useCallback(async () => {
    try {
      const queue = await getOfflineQueue(token)
      setPendingCount(queue.length)
    } catch (err) {
      console.error('useGymOfflineCheckin: fallo al leer la cola local', err)
    }
  }, [token])

  const refreshRoster = useCallback(async () => {
    try {
      const fresh = await getGymOfflineRoster(token)
      if (fresh.length > 0) {
        await saveOfflineRoster(token, fresh)
        setRoster(fresh)
      }
    } catch {
      // No network or the request failed — keep serving whatever is cached.
    }
  }, [token])

  const flushQueue = useCallback(async () => {
    try {
      const queue = await getOfflineQueue(token)
      if (queue.length === 0) return
      const outcomes = await syncOfflineGymCheckins(token, queue)
      await removeFromOfflineQueue(
        token,
        outcomes.map((o) => o.clientId)
      )
      await refreshQueueCount()
    } catch {
      // Still offline, or the sync call itself failed — leave the queue
      // intact for the next reconnect/interval attempt.
    }
  }, [token, refreshQueueCount])

  useEffect(() => {
    setIsOnline(navigator.onLine)

    // Kick off the initial load/sync inside an async IIFE rather than as bare
    // effect-body statements — the state updates all happen after an await,
    // never synchronously while the effect itself is running.
    void (async () => {
      try {
        const cached = await getOfflineRoster(token)
        setRoster(cached)
      } catch (err) {
        console.error('useGymOfflineCheckin: fallo al leer el padrón local', err)
      }
      await refreshQueueCount()
      await refreshRoster()
      await flushQueue()
    })()

    const handleOnline = () => {
      setIsOnline(true)
      void refreshRoster()
      void flushQueue()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const interval = setInterval(() => {
      void refreshRoster()
      void flushQueue()
    }, ROSTER_REFRESH_MS)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [token, refreshRoster, flushQueue, refreshQueueCount])

  const matchLocal = useCallback(
    (digits: string): LocalMatch => {
      const matches = roster.filter(
        (m) => m.phone_digits.length >= digits.length && m.phone_digits.endsWith(digits)
      )
      if (matches.length === 0) return { kind: 'not_found' }
      if (matches.length > 1) return { kind: 'ambiguous' }
      return { kind: 'single', firstName: matches[0].first_name }
    },
    [roster]
  )

  const enqueue = useCallback(
    async (digits: string) => {
      const entry = {
        clientId: crypto.randomUUID(),
        digits,
        checkedInAt: new Date().toISOString(),
      }
      await enqueueOfflineCheckin(token, entry)
      await refreshQueueCount()
    },
    [token, refreshQueueCount]
  )

  return { isOnline, pendingCount, matchLocal, enqueue }
}
