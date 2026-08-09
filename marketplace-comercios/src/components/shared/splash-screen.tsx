'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

const SPLASH_DURATION_MS = 1000

export function SplashScreen() {
  const [visible, setVisible] = useState(true)
  const [fadingOut, setFadingOut] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadingOut(true), SPLASH_DURATION_MS)
    const hideTimer = setTimeout(() => setVisible(false), SPLASH_DURATION_MS + 300)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-background transition-opacity duration-300 ${
        fadingOut ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      aria-hidden="true"
    >
      <div className="relative h-28 w-28 animate-in zoom-in-75 fade-in duration-500 ease-out">
        <Image src="/brand/logo.png" alt="" fill sizes="112px" className="object-contain" priority />
      </div>
      <span className="animate-in fade-in slide-in-from-bottom-2 font-heading text-xl font-semibold text-foreground duration-500 delay-150 fill-mode-both">
        Proxi Marketplace
      </span>
    </div>
  )
}
