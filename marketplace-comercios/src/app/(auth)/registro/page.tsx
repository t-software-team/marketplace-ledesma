'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { registerSchema, type RegisterFormValues } from '@/lib/validations/auth'
import { GoogleButton } from '@/components/auth/google-button'

export default function RegisterPage() {
  const router = useRouter()
  const [authError, setAuthError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(values: RegisterFormValues) {
    setAuthError(null)

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    })

    if (error) {
      setAuthError(error.message)
      return
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session) {
      router.push('/onboarding')
      router.refresh()
      return
    }

    setAuthError(
      'Te enviamos un email de confirmación. Revisá tu bandeja para continuar.'
    )
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="font-heading text-3xl">Crear cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Registrate para comprar o vender en el marketplace
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
          {errors.fullName && (
            <p className="text-xs text-destructive">{errors.fullName.message}</p>
          )}
        </div>

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
          <label htmlFor="password" className="text-sm font-medium">
            Contraseña
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
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        {authError && <p className="text-sm text-muted-foreground">{authError}</p>}

        <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creando cuenta...' : 'Registrarse'}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">o</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton next="/onboarding" />

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Ingresá
        </Link>
      </p>
    </div>
  )
}
