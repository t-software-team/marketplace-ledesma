import { AuthBrandHeader } from './auth-brand-header'

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
      <AuthBrandHeader />
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
