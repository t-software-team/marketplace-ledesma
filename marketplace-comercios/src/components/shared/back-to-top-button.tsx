'use client'

import { ArrowUp } from 'lucide-react'
import { useEffect, useState } from 'react'

export function BackToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 600)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Volver arriba"
      className="fixed right-4 bottom-20 z-20 flex size-11 items-center justify-center rounded-full border border-border bg-surface text-foreground shadow-lg transition-transform hover:-translate-y-0.5 sm:bottom-6"
    >
      <ArrowUp className="size-5" aria-hidden />
    </button>
  )
}
