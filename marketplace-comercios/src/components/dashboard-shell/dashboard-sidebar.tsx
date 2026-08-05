'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CreditCard,
  Flag,
  History,
  LayoutDashboard,
  Megaphone,
  Package,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  Tag,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'

const ICONS = {
  store: Store,
  package: Package,
  settings: Settings,
  'shield-check': ShieldCheck,
  tag: Tag,
  'credit-card': CreditCard,
  flag: Flag,
  clock: History,
  megaphone: Megaphone,
  dashboard: LayoutDashboard,
  sparkles: Sparkles,
  users: Users,
} as const

export type DashboardNavIcon = keyof typeof ICONS

export interface DashboardNavItem {
  href: string
  label: string
  icon: DashboardNavIcon
  badge?: string
}

interface SidebarNavProps {
  navItems: DashboardNavItem[]
  onNavigate?: () => void
}

export function SidebarNav({ navItems, onNavigate }: SidebarNavProps) {
  const pathname = usePathname()

  const activeHref = navItems
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href

  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {navItems.map((item) => {
        const isActive = item.href === activeHref
        const Icon = ICONS[item.icon]

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'relative flex items-center gap-2 rounded-lg py-2 pr-3 pl-4 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {isActive && (
              <span className="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-full bg-primary" />
            )}
            <Icon className={cn('size-4', isActive && 'text-primary')} aria-hidden />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-medium',
                  isActive
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {item.badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}

interface DashboardSidebarProps {
  navItems: DashboardNavItem[]
  accent?: boolean
}

export function DashboardSidebar({ navItems, accent = false }: DashboardSidebarProps) {
  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-border bg-surface md:flex',
        accent && 'border-t-4 border-t-violet-500'
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-border px-4 font-heading text-lg">
       <span className="relative hidden size-7 shrink-0 sm:block">
            <Image src="/brand/logo.png" alt="" fill className="object-contain" />
          </span>
        Proxi Marketplace
        {accent && (
          <Badge className="ml-auto bg-violet-500 text-white hover:bg-violet-500">Admin</Badge>
        )}
      </div>
      <SidebarNav navItems={navItems} />
    </aside>
  )
}
