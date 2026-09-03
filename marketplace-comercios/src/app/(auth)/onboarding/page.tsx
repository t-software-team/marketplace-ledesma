import { RoleSelector } from './role-selector'

export default function OnboardingPage() {
  return (
    <div className="mx-auto w-full max-w-lg space-y-6 px-4 py-2">
      <div className="text-center">
        <h1 className="text-2xl font-heading">¿Qué querés hacer?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Elegí cómo vas a usar el marketplace
        </p>
      </div>

      <RoleSelector />
    </div>
  )
}
