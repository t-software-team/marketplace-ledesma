'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useMemo, useState, useTransition } from 'react'
import { Ban, CircleCheck, UserRound } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { BulkActionsBar } from '@/components/shared/bulk-actions-bar'
import { PaginationControls } from '@/components/shared/pagination-controls'
import { toast } from '@/components/ui/toast'
import { useRowSelection } from '@/hooks/use-row-selection'
import { banUser, bulkBanUsers, bulkUnbanUsers, unbanUser } from '@/lib/admin/actions/users'
import type { ActionState } from '@/lib/admin/actions/shared'
import type { getUsersDirectory } from '@/server/admin-users-directory'

type UserEntry = Awaited<ReturnType<typeof getUsersDirectory>>[number]

const PAGE_SIZE = 15

const ROLE_BADGE: Record<string, { label: string; variant: 'default' | 'outline' | 'success' | 'warning' }> = {
  client: { label: 'Cliente', variant: 'outline' },
  shop_admin: { label: 'Comerciante', variant: 'default' },
  superadmin: { label: 'Superadmin', variant: 'warning' },
}

const initialBanState: ActionState = { error: null }

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
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

function UserRowActions({ user }: { user: UserEntry }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const banAction = banUser.bind(null, user.id)
  const [state, formAction, isBanning] = useActionState(banAction, initialBanState)

  const [prevState, setPrevState] = useState(state)
  if (state !== prevState) {
    setPrevState(state)
    if (state.error === null) setOpen(false)
  }

  useEffect(() => {
    if (state === initialBanState) return
    if (state.error === null) {
      toast.add({ title: 'Usuario baneado', type: 'success' })
      router.refresh()
    } else {
      toast.add({ title: 'No pudimos banear al usuario', description: state.error, type: 'error' })
    }
  }, [state, router])

  function handleUnban() {
    startTransition(async () => {
      try {
        await unbanUser(user.id)
        toast.add({ title: 'Usuario reactivado', type: 'success' })
        router.refresh()
      } catch {
        toast.add({ title: 'No pudimos reactivar al usuario', type: 'error' })
      }
    })
  }

  if (user.role === 'superadmin') {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  if (user.is_banned) {
    return (
      <Button variant="outline" size="sm" className="gap-1.5" disabled={isPending} onClick={handleUnban}>
        <CircleCheck className="size-3.5" aria-hidden />
        {isPending ? 'Reactivando...' : 'Reactivar'}
      </Button>
    )
  }

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5 text-destructive" onClick={() => setOpen(true)}>
        <Ban className="size-3.5" aria-hidden />
        Banear
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Banear a {user.full_name ?? user.email ?? 'este usuario'}</DialogTitle>
          </DialogHeader>
          <form action={formAction} className="space-y-3">
            <Textarea name="reason" placeholder="Motivo del baneo" rows={3} required aria-label="Motivo del baneo" />
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="destructive" disabled={isBanning}>
                {isBanning ? 'Baneando...' : 'Banear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function UsersTable({ users }: { users: UserEntry[] }) {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  const [banOpen, setBanOpen] = useState(false)
  const [reason, setReason] = useState('')

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

  const { selected, selectedIds, isAllSelected, toggle, toggleAll, clear } = useRowSelection(
    pageUsers.map((user) => user.id)
  )

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleBulkBan() {
    startTransition(async () => {
      const { banned, failed } = await bulkBanUsers(selectedIds, reason)
      if (banned > 0) {
        toast.add({ title: `${banned} usuarios baneados`, type: 'success' })
      }
      if (failed > 0) {
        toast.add({ title: `${failed} usuarios no se pudieron banear`, type: 'error' })
      }
      setBanOpen(false)
      setReason('')
      clear()
      router.refresh()
    })
  }

  function handleBulkUnban() {
    startTransition(async () => {
      const { unbanned, failed } = await bulkUnbanUsers(selectedIds)
      if (unbanned > 0) {
        toast.add({ title: `${unbanned} usuarios reactivados`, type: 'success' })
      }
      if (failed > 0) {
        toast.add({ title: `${failed} usuarios no se pudieron reactivar`, type: 'error' })
      }
      clear()
      router.refresh()
    })
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

      <BulkActionsBar count={selected.size} onClear={clear}>
        <Dialog open={banOpen} onOpenChange={setBanOpen}>
          <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5 text-destructive" />}>
            <Ban className="size-3.5" aria-hidden />
            Banear
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>
                Banear {selected.size} usuario{selected.size === 1 ? '' : 's'}
              </DialogTitle>
            </DialogHeader>
            <Textarea
              placeholder="Motivo del baneo"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              aria-label="Motivo del baneo"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setBanOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                disabled={isPending || reason.trim().length < 5}
                onClick={handleBulkBan}
              >
                {isPending ? 'Baneando...' : 'Banear'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="outline" size="sm" className="gap-1.5" disabled={isPending} onClick={handleBulkUnban}>
          <CircleCheck className="size-3.5" aria-hidden />
          Reactivar
        </Button>
      </BulkActionsBar>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={toggleAll}
                aria-label="Seleccionar todos los usuarios de esta página"
              />
            </TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Ciudad</TableHead>
            <TableHead>Registrado</TableHead>
            <TableHead>Última actividad</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageUsers.map((user) => {
            const roleBadge = user.role ? ROLE_BADGE[user.role] : null
            const name = user.full_name ?? 'Sin nombre'
            const isShopAdmin = user.role === 'shop_admin'

            return (
              <TableRow key={user.id}>
                <TableCell onClick={(event) => event.stopPropagation()}>
                  <Checkbox
                    checked={selected.has(user.id)}
                    onCheckedChange={() => toggle(user.id)}
                    aria-label={`Seleccionar ${name}`}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2.5">
                    <Avatar size="sm">
                      <AvatarImage src={user.avatar_url ?? undefined} alt="" />
                      <AvatarFallback>
                        {user.full_name ? getInitials(user.full_name) : <UserRound className="size-3.5" aria-hidden />}
                      </AvatarFallback>
                    </Avatar>
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
                  <div className="flex flex-wrap items-center gap-1.5">
                    {roleBadge ? (
                      <Badge variant={roleBadge.variant}>{roleBadge.label}</Badge>
                    ) : (
                      <span className="text-muted-foreground">Sin rol</span>
                    )}
                    {user.is_banned && <Badge variant="destructive">Baneado</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.city ?? 'Sin ciudad'}</TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {formatDate(user.created_at)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {formatRelativeTime(user.last_sign_in_at)}
                </TableCell>
                <TableCell className="text-right">
                  <UserRowActions user={user} />
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
