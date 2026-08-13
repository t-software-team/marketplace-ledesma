'use client'

import Link from 'next/link'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { signIn } from '@/lib/auth/actions'
import { loginSchema, type LoginFormValues } from '@/lib/validations/auth'
import { GoogleButton } from '@/components/auth/google-button'

export default function LoginForm() {
  const searchParams = useSearchParams()
  const [authError, setAuthError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  function onSubmit(values: LoginFormValues) {
    setAuthError(null)

    startTransition(async () => {
      try {
        const result = await signIn(values.email, values.password, searchParams.get('next'))

        if (result?.error) {
          setAuthError(result.error)
        }
      } catch (err) {
        if (isRedirectError(err)) {
          toast.add({ title: '¡Bienvenido de nuevo!', type: 'success' })
        }
        throw err
      }
    })
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="font-heading text-3xl">Ingresar</h1>
        <p className="text-sm text-muted-foreground">Accedé a tu cuenta del marketplace</p>
      </div>

      <GoogleButton next={searchParams.get('next') ?? '/'} />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">o</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            className="h-11"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">
              Contraseña
            </label>
            <Link
              href="/olvide-password"
              className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
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
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {authError && <p className="text-sm text-destructive">{authError}</p>}
        {searchParams.get('error') === 'auth' && (
          <p className="text-sm text-destructive">
            No pudimos confirmar tu sesión. Intentá de nuevo.
          </p>
        )}

        <Button type="submit" className="h-11 w-full" disabled={isPending}>
          {isPending ? 'Ingresando...' : 'Ingresar'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        ¿No tenés cuenta?{' '}
        <Link href="/registro" className="font-medium text-foreground underline-offset-4 hover:underline">
          Registrate
        </Link>
      </p>
    </div>
  )
}
