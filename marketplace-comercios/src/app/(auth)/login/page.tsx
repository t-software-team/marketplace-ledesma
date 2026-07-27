import { Suspense } from 'react'
import LoginForm from './login-form'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Cargando...</div>}>
      <LoginForm />
    </Suspense>
  )
}
