'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookUser, Download, Share, Shield, Store, User, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useInstallPrompt } from '@/hooks/use-install-prompt'
import { signOut } from '@/lib/auth/actions'

interface UserMenuProps {
  userEmail: string
  userFullName: string | null
  userAvatarUrl: string | null
  profileRole?: string | null
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

export function UserMenu({ userEmail, userFullName, userAvatarUrl, profileRole }: UserMenuProps) {
  const { canInstall, isIos, promptInstall } = useInstallPrompt()
  const [showIosInstructions, setShowIosInstructions] = useState(false)

  async function handleInstallClick() {
    const result = await promptInstall()
    if (result === 'ios') setShowIosInstructions(true)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-lg"
              className="rounded-full"
              aria-label="Menú de cuenta"
            />
          }
          nativeButton={true}
        >
          <Avatar className="size-9">
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
          {profileRole === 'shop_admin' && (
            <DropdownMenuItem render={<Link href="/mi-tienda" />} className="sm:hidden">
              <Store className="size-4" aria-hidden />
              Mi tienda
            </DropdownMenuItem>
          )}
          {profileRole === 'superadmin' && (
            <DropdownMenuItem render={<Link href="/admin/shops" />} className="sm:hidden">
              <Shield className="size-4" aria-hidden />
              Admin
            </DropdownMenuItem>
          )}
          <DropdownMenuItem render={<Link href="/perfil" />}>
            <User className="size-4" aria-hidden />
            Mi perfil
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/siguiendo" />}>
          <Users className="size-4" aria-hidden />
          Siguiendo
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/contactos" />}>
          <BookUser className="size-4" aria-hidden />
          Mis contactos
          </DropdownMenuItem>
          {canInstall && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleInstallClick}>
                <Download className="size-4" aria-hidden />
                Instalar app
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => signOut()}>
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {isIos && (
        <Dialog open={showIosInstructions} onOpenChange={setShowIosInstructions}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Instalar la app</DialogTitle>
              <DialogDescription>
                Tocá el botón <Share className="inline size-3.5" aria-hidden /> <strong>Compartir</strong>{' '}
                y elegí <strong>&quot;Agregar a inicio&quot;</strong> para instalar la app en tu pantalla de
                inicio.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
