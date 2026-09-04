'use client'

import { useCallback } from 'react'

function playTone(frequency: number, durationSec: number) {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + durationSec)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + durationSec)
  } catch (err) {
    console.error('useGymCheckinSound: fallo al reproducir sonido', err)
  }
}

/**
 * Shared success/danger chimes for the kiosk and desk check-in flows. Callers
 * fire these without awaiting — playback must never delay the on-screen
 * result, and a blocked/failing AudioContext (autoplay policy, no support)
 * is swallowed inside playTone rather than surfaced.
 */
export function useGymCheckinSound() {
  const playSuccessSound = useCallback(() => playTone(880, 0.35), [])
  const playDangerSound = useCallback(() => playTone(220, 0.45), [])
  return { playSuccessSound, playDangerSound }
}
