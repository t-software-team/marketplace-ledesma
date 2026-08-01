'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { UserRound } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { PaginationControls } from '@/components/shared/pagination-controls'
import type { getUsersDirectory } from '@/lib/admin/queries'

type UserEntry = Awaited<ReturnType<typeof getUsersDirectory>>[number]

const PAGE_SIZE = 15

const ROLE_BADGE: Record<string, { label: string; variant: 'default' | 'outline' | 'success' | 'warning' }> = {
  client: { label: 'Cliente', variant: 'outline' },
  shop_admin: { label: 'Comerciante', variant: 'default' },
  superadmin: { label: 'Superadmin', variant: 'warning' },
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-AR')
}

function formatRelativeTime(date: string | null) {
  if (!date) return 'Nunca inició sesión'

  const diffMs = Date.now() - new Date(date).getTime()
  const diffSeconds = Math.round(diffMs / 1000)
  const diffMinutes = Math.round(diffSeconds / 60)
  const diffHours = Math.round(diffMinutes / 60)
  const diffDays = Math.round(diffHours / 24)

  if (diffSeconds < 60) return 'hace instantes'
  if (diffMinutes < 60) return `hace ${diffMinutes} minuto${diffMinutes === 1 ? '' : 's'}`
  if (diffHours < 24) return `hace ${diffHours} hora${diffHours === 1 ? '' : 's'}`
  if (diffDays < 30) return `hace ${diffDays} día${diffDays === 1 ? '' : 's'}`

  const diffMonths = Math.round(diffDays / 30)
  if (diffMonths < 12) return `hace ${diffMonths} mes${diffMonths === 1 ? '' : 'es'}`

  const diffYears = Math.round(diffDays / 365)
  return `hace ${diffYears} año${diffYears === 1 ? '' : 's'}`
}

export function UsersTable({ users }: { users: UserEntry[] }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return users
    return users.filter(
      (user) =>
        (user.full_name ?? '').toLowerCase().includes(query) ||
        (user.email ?? '').toLowerCase().includes(query)
    )
  }, [users, search])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageUsers = filteredUsers.slice(start, start + PAGE_SIZE)

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  return (
    <div className="space-y-3">
      <Input
        value={search}
        onChange={(event) => handleSearchChange(event.target.value)}
        placeholder="Buscar por nombre o email..."
        aria-label="Buscar usuarios"
        className="max-w-sm"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Ciudad</TableHead>
            <TableHead>Registrado</TableHead>
            <TableHead>Última actividad</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageUsers.map((user) => {
            const roleBadge = user.role ? ROLE_BADGE[user.role] : null
            const name = user.full_name ?? 'Sin nombre'
            const isShopAdmin = user.role === 'shop_admin'

            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {user.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatar_url}
                        alt=""
                        width={24}
                        height={24}
                        className="size-6 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex size-6 items-center justify-center rounded-full bg-muted">
                        <UserRound className="size-3.5 text-muted-foreground" aria-hidden />
                      </span>
                    )}
                    {isShopAdmin ? (
                      <Link href="/admin/shops" className="hover:underline">
                        {name}
                      </Link>
                    ) : (
                      <span>{name}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.email ?? 'Sin email'}</TableCell>
                <TableCell>
                  {roleBadge ? (
                    <Badge variant={roleBadge.variant}>{roleBadge.label}</Badge>
                  ) : (
                    <span className="text-muted-foreground">Sin rol</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{user.city ?? 'Sin ciudad'}</TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {formatDate(user.created_at)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {formatRelativeTime(user.last_sign_in_at)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      <PaginationControls
        page={currentPage}
        totalPages={totalPages}
        totalCount={filteredUsers.length}
        onPrevious={() => setPage(currentPage - 1)}
        onNext={() => setPage(currentPage + 1)}
      />
    </div>
  )
}
