'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function CursoSiteHeader({ contactUrl }: { contactUrl: string }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="pointer-events-none sticky top-0 z-50 px-4 pt-4">
      <div
        className={cn(
          'pointer-events-auto mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-full border border-border/70 bg-surface/80 px-3 py-2 backdrop-blur-md transition-shadow duration-300 sm:px-4',
          scrolled && 'shadow-[0_8px_30px_rgba(0,0,0,0.08)]'
        )}
      >
        <Link
          href="/curso"
          className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Image src="/brand/logo-mark.png" alt="" width={28} height={28} className="size-7" priority />
          <span className="font-heading text-base text-foreground">Proxi Academia</span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          <a
            href="#mapa"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-foreground/70 outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Programa
          </a>
          <a
            href="#profesor"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-foreground/70 outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Profesor
          </a>
        </nav>

        <Button
          size="sm"
          className="rounded-full"
          render={<a href={contactUrl} target="_blank" rel="noopener noreferrer" />}
        >
          <span className="sm:hidden">Consultar</span>
          <span className="hidden sm:inline">Consultar</span>
        </Button>
      </div>
    </header>
  )
}
