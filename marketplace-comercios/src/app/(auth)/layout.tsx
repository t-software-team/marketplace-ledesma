import Image from 'next/image'
import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-primary/[0.09] via-background to-background px-4 py-12">
      <div
        className="pointer-events-none absolute top-[-20%] left-1/2 -z-10 size-[36rem] -translate-x-1/2 rounded-full bg-primary/[0.14] blur-3xl"
        aria-hidden
      />
      <Link href="/" className="mb-8 flex flex-col items-center gap-2">
        <span className="relative flex h-14 w-11 shrink-0 items-center justify-center">
          <Image src="/brand/logo-mark.png" alt="" fill className="object-contain" priority />
        </span>
        <span className="font-heading text-lg">Proxi Marketplace</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
