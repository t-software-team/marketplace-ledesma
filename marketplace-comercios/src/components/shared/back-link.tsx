import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function BackLink({ href, label = 'Volver' }: { href: string; label?: string }) {
  return (
    <Button
      render={<Link href={href} />}
      nativeButton={false}
      variant="ghost"
      size="sm"
      className="gap-1.5"
    >
      <ArrowLeft className="size-4" aria-hidden />
      {label}
    </Button>
  )
}
