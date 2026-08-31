import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/supabase/server'
import { getGymStaffInvitePreview } from '@/lib/gym/staff-actions'
import { AcceptInviteButton } from './accept-invite-button'
import { CreateAccountAcceptForm } from './create-account-accept-form'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ token: string }>
}

export default async function InvitacionPage({ params }: PageProps) {
  const { token } = await params
  const preview = await getGymStaffInvitePreview(token)

  if (preview.status === 'invalid') {
    return (
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-2xl">Invitación no válida</h1>
        <p className="text-sm text-muted-foreground">
          Este link ya se usó, se revocó, o no existe. Pedile al dueño del gimnasio que te mande una
          invitación nueva.
        </p>
      </div>
    )
  }

  const user = await getAuthUser()
  if (!user) {
    if (!preview.hasAccount) {
      // No separate signup-confirmation email: clicking this invite link
      // (sent by us to invitedEmail) already proves ownership of the inbox.
      return (
        <div className="space-y-6 text-center">
          <div className="space-y-1.5">
            <h1 className="font-heading text-2xl">Invitación de {preview.shopName}</h1>
            <p className="text-sm text-muted-foreground">
              Creá tu cuenta para sumarte y empezar a registrar ingresos, dar de alta socios y renovar
              membresías en <strong>{preview.shopName}</strong>.
            </p>
          </div>
          <CreateAccountAcceptForm token={token} email={preview.invitedEmail} />
        </div>
      )
    }

    const next = encodeURIComponent(`/invitacion/${token}`)
    const email = encodeURIComponent(preview.invitedEmail)
    redirect(`/login?next=${next}&email=${email}`)
  }

  const emailMatches = user.email?.toLowerCase() === preview.invitedEmail.toLowerCase()

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl">Invitación de {preview.shopName}</h1>
        <p className="text-sm text-muted-foreground">
          Vas a poder registrar ingresos, dar de alta socios y renovar membresías en{' '}
          <strong>{preview.shopName}</strong>.
        </p>
      </div>

      {emailMatches ? (
        <AcceptInviteButton token={token} />
      ) : (
        <p className="text-sm text-destructive">
          Esta invitación es para {preview.invitedEmail}. Iniciá sesión con ese email para aceptarla —
          estás conectado como {user.email}.
        </p>
      )}
    </div>
  )
}
