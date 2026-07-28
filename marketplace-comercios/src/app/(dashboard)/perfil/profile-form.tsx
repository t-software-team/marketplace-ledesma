'use client'

import Image from 'next/image'
import { useActionState, useEffect, useRef, useState } from 'react'
import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { uploadAvatar } from '@/lib/shops/upload-image'
import { updateProfile } from '@/lib/profile/actions'
import type { ActionState } from '@/lib/shops/actions'

interface ProfileFormProps {
  userId: string
  email: string
  fullName: string | null
  phone: string | null
  city: string | null
  avatarUrl: string | null
}

const initialState: ActionState = { error: null }

export function ProfileForm({ userId, email, fullName, phone, city, avatarUrl }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfile, initialState)
  const [avatar, setAvatar] = useState(avatarUrl ?? '')
  const [isUploading, setIsUploading] = useState(false)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (state.error) {
      toast.add({ title: 'No pudimos guardar tu perfil', description: state.error, type: 'error' })
    } else {
      toast.add({ title: 'Perfil actualizado', type: 'success' })
    }
  }, [state])

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const url = await uploadAvatar(userId, file)
      setAvatar(url)
    } catch (error) {
      toast.add({
        title: 'No pudimos subir la imagen',
        description: error instanceof Error ? error.message : undefined,
        type: 'error',
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="avatar_url" value={avatar} />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center gap-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border">
              {avatar ? (
                <Image src={avatar} alt="Tu foto de perfil" fill className="object-cover" sizes="64px" />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <User className="size-6" aria-hidden />
                </div>
              )}
            </div>
            <div>
              <Input type="file" accept="image/*" onChange={handleAvatarChange} disabled={isUploading} />
              <p className="mt-1 text-xs text-muted-foreground">PNG, JPEG, WEBP o GIF, máx. 3MB</p>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input id="email" value={email} disabled />
          </div>

          <div className="space-y-2">
            <label htmlFor="full_name" className="text-sm font-medium">
              Nombre
            </label>
            <Input id="full_name" name="full_name" defaultValue={fullName ?? ''} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Teléfono
              </label>
              <Input id="phone" name="phone" defaultValue={phone ?? ''} />
            </div>
            <div className="space-y-2">
              <label htmlFor="city" className="text-sm font-medium">
                Ciudad
              </label>
              <Input id="city" name="city" defaultValue={city ?? ''} />
            </div>
          </div>
        </CardContent>
      </Card>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={isPending || isUploading}>
        {isPending ? 'Guardando...' : 'Guardar cambios'}
      </Button>
    </form>
  )
}
