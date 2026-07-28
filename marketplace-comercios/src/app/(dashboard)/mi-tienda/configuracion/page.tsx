import { redirect } from 'next/navigation'
import { getActiveCategories, getMyShop } from '@/lib/shops/queries'
import { ShopSettingsForm } from './shop-settings-form'

export default async function ShopSettingsPage() {
  const shop = await getMyShop()

  if (!shop) {
    redirect('/mi-tienda')
  }

  const categories = await getActiveCategories()

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-heading">Configuración</h1>
      <ShopSettingsForm shop={shop} categories={categories} />
    </div>
  )
}
