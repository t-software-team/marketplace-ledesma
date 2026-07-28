import { redirect } from 'next/navigation'
import { getActiveCategories, getMyShop } from '@/lib/shops/queries'
import { createClient } from '@/lib/supabase/server'
import { ShopSettingsForm } from './shop-settings-form'
import { VerificationDocumentCard } from './verification-document-card'

export default async function ShopSettingsPage() {
  const shop = await getMyShop()

  if (!shop) {
    redirect('/mi-tienda')
  }

  const categories = await getActiveCategories()

  let documentUrl: string | null = null
  if (shop.verification_document_url) {
    const supabase = await createClient()
    const { data: signed } = await supabase.storage
      .from('verification-docs')
      .createSignedUrl(shop.verification_document_url, 60 * 5)
    documentUrl = signed?.signedUrl ?? null
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-heading">Configuración</h1>
      <VerificationDocumentCard
        shopId={shop.id}
        verificationStatus={shop.verification_status}
        hasDocument={Boolean(shop.verification_document_url)}
        documentUrl={documentUrl}
      />
      <ShopSettingsForm shop={shop} categories={categories} />
    </div>
  )
}
