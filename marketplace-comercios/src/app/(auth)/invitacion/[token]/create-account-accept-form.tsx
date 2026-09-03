'use client'

import { useState, useTransition } from 'react'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { acceptInviteSchema, type AcceptInviteFormValues } from '@/lib/validations/auth'
import { acceptGymStaffInviteNewAccountAndRedirect } from '@/lib/gym/staff-actions'

export function CreateAccountAcceptForm({ token, email }: { token: string; email: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInviteFormValues>({ resolver: zodResolver(acceptInviteSchema) })

  function onSubmit(values: AcceptInviteFormValues) {
    setError(null)
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set('fullName', values.fullName)
        formData.set('password', values.password)
        const result = await acceptGymStaffInviteNewAccountAndRedirect(token, formData)
        if (result?.error) setError(result.error)
      } catch (err) {
        if (isRedirectError(err)) throw err
        console.error('CreateAccountAcceptForm: fallo inesperado al aceptar', err)
        setError('Algo salió mal. Probá de nuevo.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input id="email" value={email} disabled className="h-11" />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="fullName" className="text-sm font-medium">
          Nombre completo
        </label>
        <Input
          id="fullName"
          autoComplete="name"
          placeholder="Tu nombre"
          className="h-11"
          aria-invalid={!!errors.fullName}
          {...register('fullName')}
        />
        {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Elegí una contraseña
        </label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            className="h-11 pr-10"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="h-11 w-full" disabled={isPending}>
        {isPending ? 'Creando cuenta...' : 'Crear cuenta y aceptar invitación'}
      </Button>
    </form>
  )
}
