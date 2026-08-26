'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function AuthBrandHeader() {
  const pathname = usePathname()
  if (pathname === '/onboarding' || pathname === '/registro') return null

  return (
    <Link href="/" className="mb-8 flex flex-col items-center gap-2">
      <span className="relative flex h-14 w-11 shrink-0 items-center justify-center">
        <Image src="/brand/logo-mark.png" alt="" fill className="object-contain" priority />
      </span>
      <span className="font-heading text-lg">Proxi Marketplace</span>
    </Link>
  )
}
