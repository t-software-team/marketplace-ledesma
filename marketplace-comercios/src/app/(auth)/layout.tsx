import Link from 'next/link'
import { Store } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div
        className="pointer-events-none absolute top-[-10%] left-1/2 -z-10 size-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <Link href="/" className="mb-8 flex items-center gap-2 font-heading text-xl">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <Store className="size-4.5 text-primary" aria-hidden />
        </span>
        Proxi Marketplace
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
