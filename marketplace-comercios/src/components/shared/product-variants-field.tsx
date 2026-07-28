'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Variant {
  name: string
  price: string
}

interface ProductVariantsFieldProps {
  initialVariants?: { name: string; price: number }[]
  noun?: string
}

export function ProductVariantsField({
  initialVariants = [],
  noun = 'producto',
}: ProductVariantsFieldProps) {
  const [variants, setVariants] = useState<Variant[]>(
    initialVariants.map((v) => ({ name: v.name, price: String(v.price) }))
  )

  const serialized = JSON.stringify(
    variants
      .filter((v) => v.name.trim() && v.price.trim())
      .map((v) => ({ name: v.name.trim(), price: v.price }))
  )

  function updateVariant(index: number, field: keyof Variant, value: string) {
    setVariants((current) =>
      current.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    )
  }

  function removeVariant(index: number) {
    setVariants((current) => current.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Opciones con precio propio{' '}
        <span className="font-normal text-muted-foreground">(opcional)</span>
      </label>
      <p className="text-xs text-muted-foreground">
        Si tu {noun} tiene variantes con precios distintos (ej. &quot;Corte&quot; $3000,
        &quot;Corte + barba&quot; $5000), cargalas acá en vez de crear un {noun} por cada una. Si
        las cargás, se usa el precio de arriba como referencia general.
      </p>
      <input type="hidden" name="variants" value={serialized} />

      {variants.length > 0 && (
        <div className="space-y-2">
          {variants.map((variant, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                placeholder="Nombre (ej: Corte + barba)"
                value={variant.name}
                onChange={(event) => updateVariant(index, 'name', event.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Precio"
                value={variant.price}
                onChange={(event) => updateVariant(index, 'price', event.target.value)}
                className="w-28"
              />
              <button
                type="button"
                onClick={() => removeVariant(index)}
                aria-label="Quitar opción"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setVariants((current) => [...current, { name: '', price: '' }])}
      >
        <Plus className="size-4" aria-hidden />
        Agregar opción
      </Button>
    </div>
  )
}
