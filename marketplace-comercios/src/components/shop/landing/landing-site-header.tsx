'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ScrollProgressBar } from '@/components/shop/landing/landing-scroll-progress'

export function LandingSiteHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm transition-shadow',
        scrolled && 'shadow-[0_2px_12px_rgba(0,0,0,0.06)]'
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link
          href="/landing"
          className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Image src="/brand/logo-mark.png" alt="" width={28} height={28} className="size-7" priority />
          <span className="font-heading text-lg text-foreground">Proxi</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/login"
            className="hidden rounded-md text-sm font-medium text-foreground/70 outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 sm:inline-block"
          >
            Iniciar sesión
          </Link>
          <Button size="sm" render={<Link href="/registro" />} nativeButton={false}>
            <span className="sm:hidden">Sumarme</span>
            <span className="hidden sm:inline">Sumar mi negocio</span>
          </Button>
        </nav>
      </div>
      <ScrollProgressBar />
    </header>
  )
}
