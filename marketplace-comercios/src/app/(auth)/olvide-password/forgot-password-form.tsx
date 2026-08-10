'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/lib/validations/auth'

export default function ForgotPasswordForm() {
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  async function onSubmit(values: ForgotPasswordFormValues) {
    await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/actualizar-password`,
    })
    setSent(true)
  }

  if (sent) {
    return (
      <div className="space-y-3 text-center">
        <h1 className="font-heading text-3xl">Revisá tu email</h1>
        <p className="text-sm text-muted-foreground">
          Si existe una cuenta con ese email, te enviamos un link para restablecer tu contraseña.
        </p>
        <Link href="/login" className="inline-block text-sm font-medium underline-offset-4 hover:underline">
          Volver a Ingresar
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="font-heading text-3xl">Olvidé mi contraseña</h1>
        <p className="text-sm text-muted-foreground">
          Ingresá tu email y te enviamos un link para restablecerla.
        </p>
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

        <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando...' : 'Enviar link'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Volver a Ingresar
        </Link>
      </p>
    </div>
  )
}
