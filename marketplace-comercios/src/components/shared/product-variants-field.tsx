'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PriceInput } from '@/components/shared/price-input'

interface Variant {
  name: string
  price: string
}

interface ProductVariantsFieldProps {
  initialVariants?: { name: string; price: number }[]
  noun?: string
  isService?: boolean
}

export function ProductVariantsField({
  initialVariants = [],
  noun = 'producto',
  isService = false,
}: ProductVariantsFieldProps) {
  const example = isService
    ? { a: 'Corte', aPrice: '3000', b: 'Corte + barba', bPrice: '5000' }
    : { a: 'Talle S', aPrice: '8000', b: 'Talle L', bPrice: '9000' }
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
        Si tu {noun} tiene variantes con precios distintos (ej. &quot;{example.a}&quot; $
        {example.aPrice}, &quot;{example.b}&quot; ${example.bPrice}), cargalas acá en vez de crear
        un {noun} por cada una. Si las cargás, se usa el precio de arriba como referencia general.
      </p>
      <input type="hidden" name="variants" value={serialized} />

      {variants.length > 0 && (
        <div className="space-y-2">
          {variants.map((variant, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                placeholder={`Nombre (ej: ${example.b})`}
                value={variant.name}
                onChange={(event) => updateVariant(index, 'name', event.target.value)}
                className="flex-1"
              />
              <PriceInput
                placeholder="Precio"
                value={variant.price}
                onChange={(rawValue) => updateVariant(index, 'price', rawValue)}
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
