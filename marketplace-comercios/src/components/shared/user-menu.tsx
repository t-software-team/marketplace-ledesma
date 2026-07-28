'use client'

import Link from 'next/link'
import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from '@/lib/auth/actions'

interface UserMenuProps {
  userEmail: string
  userFullName: string | null
  userAvatarUrl: string | null
}

function getInitials(fullName: string | null, email: string) {
  if (fullName) {
    const parts = fullName.trim().split(/\s+/)
    const initials = parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('')
    if (initials) return initials
  }
  return email[0]?.toUpperCase() ?? '?'
}

export function UserMenu({ userEmail, userFullName, userAvatarUrl }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Menú de cuenta" />
        }
        nativeButton={true}
      >
        <Avatar>
          {userAvatarUrl && <AvatarImage src={userAvatarUrl} alt={userFullName ?? userEmail} />}
          <AvatarFallback>{getInitials(userFullName, userEmail)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="font-medium text-foreground">{userFullName ?? 'Usuario'}</span>
          <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/perfil" />}>
          <User className="size-4" aria-hidden />
          Mi perfil
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/siguiendo" />}>Siguiendo</DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/contactos" />}>Mis contactos</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={
            <form action={signOut} className="w-full">
              <button type="submit" className="w-full text-left">
                Cerrar sesión
              </button>
            </form>
          }
          variant="destructive"
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
