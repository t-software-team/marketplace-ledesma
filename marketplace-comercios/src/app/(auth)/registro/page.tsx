import { Suspense } from 'react'
import RegisterForm from './registro-form'

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Cargando...</div>}>
      <RegisterForm />
    </Suspense>
  )
}
