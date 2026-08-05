'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DashboardNavItem } from './dashboard-sidebar'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const SEGMENT_LABELS: Record<string, string> = {
  nuevo: 'Nuevo',
  nueva: 'Nueva',
  editar: 'Editar',
}

function labelForSegment(segment: string) {
  if (UUID_REGEX.test(segment)) return null
  return SEGMENT_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1)
}

interface Crumb {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  navItems: DashboardNavItem[]
  rootHref: string
  rootLabel: string
  className?: string
}

export function Breadcrumbs({ navItems, rootHref, rootLabel, className }: BreadcrumbsProps) {
  const pathname = usePathname()

  if (pathname === rootHref) return null

  const topLevel = navItems.find(
    (item) => item.href !== rootHref && pathname.startsWith(item.href)
  )
  if (!topLevel) return null

  const rest = pathname
    .slice(topLevel.href.length)
    .split('/')
    .filter(Boolean)

  const crumbs: Crumb[] = [
    { label: rootLabel, href: rootHref },
    { label: topLevel.label, href: rest.length > 0 ? topLevel.href : undefined },
  ]

  let acc = topLevel.href
  rest.forEach((segment, index) => {
    acc += `/${segment}`
    const label = labelForSegment(segment)
    if (!label) return
    const isLast = index === rest.length - 1
    crumbs.push({ label, href: isLast ? undefined : acc })
  })

  return (
    <nav aria-label="Breadcrumb" className={cn('flex min-w-0 items-center gap-1 text-sm', className)}>
      {crumbs.map((crumb, index) => (
        <span key={index} className="flex min-w-0 items-center gap-1">
          {index > 0 && <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />}
          {crumb.href ? (
            <Link href={crumb.href} className="truncate text-muted-foreground hover:text-foreground">
              {crumb.label}
            </Link>
          ) : (
            <span className="truncate font-medium text-foreground" aria-current="page">
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
