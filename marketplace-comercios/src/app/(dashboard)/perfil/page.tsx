import { redirect } from 'next/navigation'
import { BackLink } from '@/components/shared/back-link'
import { getMyProfile } from '@/lib/profile/queries'
import { ProfileForm } from './profile-form'

export default async function ProfilePage() {
  const profile = await getMyProfile()

  if (!profile) {
    redirect('/login')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      <BackLink href="/" />
      <h1 className="text-2xl font-heading">Mi perfil</h1>
      <ProfileForm
        userId={profile.id}
        email={profile.email}
        fullName={profile.full_name}
        phone={profile.phone}
        city={profile.city}
        avatarUrl={profile.avatar_url}
      />
    </div>
  )
}
