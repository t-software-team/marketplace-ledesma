import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { isVeterinariaRubro } from '@/lib/category-icons'
import { getMyShop } from '@/lib/shops/queries'
import { getTreatmentTemplatesWithDoses } from '@/lib/treatments/queries'
import { SuggestedTemplatesList } from './suggested-templates-list'
import { TreatmentTemplateForm } from './treatment-template-form'
import { TreatmentTemplatesList } from './treatment-templates-list'

export default async function TratamientosPage() {
  const shop = await getMyShop()

  if (!shop) {
    redirect('/mi-tienda')
  }

  if (!isVeterinariaRubro(shop.categories?.slug)) {
    redirect('/mi-tienda')
  }

  const templates = await getTreatmentTemplatesWithDoses(shop.id)

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-heading">Tratamientos</h1>
        <p className="text-xs text-muted-foreground">
          Definí el catálogo de vacunas y desparasitaciones de tu comercio, con su secuencia de dosis.
        </p>
      </div>

      <SuggestedTemplatesList />

      <Card className="rounded-xl ring-1 ring-foreground/10">
        <CardHeader>
          <CardTitle>Nueva plantilla</CardTitle>
        </CardHeader>
        <CardContent>
          <TreatmentTemplateForm submitLabel="Agregar plantilla" />
        </CardContent>
      </Card>

      <TreatmentTemplatesList templates={templates} />
    </div>
  )
}
