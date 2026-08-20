'use client'

import { useActionState, useEffect, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FieldError } from '@/components/shared/field-error'
import { StoryPreview, type TextPosition, type TextSize } from '@/components/feed/story-preview'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { uploadShopImage } from '@/lib/shops/upload-image'
import { createPromotion, type ActionState } from '@/lib/shops/actions'

interface CreatePromotionFormProps {
  shopId: string
  products: { id: string; name: string; image_urls: string[] }[]
  noun?: string
}

const initialState: ActionState = { error: null }

const DURATIONS = [
  { value: 1, label: '1 día' },
  { value: 2, label: '2 días' },
  { value: 3, label: '3 días' },
]

const QUICK_TEXTS = ['2x1 hoy', 'Envío gratis', 'Últimas unidades', 'Solo por hoy', 'Nuevo ingreso']

const TEXT_POSITIONS: { value: TextPosition; label: string }[] = [
  { value: 'top', label: 'Arriba' },
  { value: 'center', label: 'Centro' },
  { value: 'bottom', label: 'Abajo' },
]

const TEXT_SIZES: { value: TextSize; label: string }[] = [
  { value: 'sm', label: 'Chico' },
  { value: 'md', label: 'Medio' },
  { value: 'lg', label: 'Grande' },
]

const TEXT_COLORS = ['#ffffff', '#000000', '#7c3aed', '#facc15', '#ef4444']
const BG_COLORS = ['#000000', '#ffffff', '#7c3aed', '#0f172a', '#78350f']

export function CreatePromotionForm({ shopId, products, noun = 'producto' }: CreatePromotionFormProps) {
  const [state, formAction, isPending] = useActionState(createPromotion, initialState)
  const [imageUrl, setImageUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [duration, setDuration] = useState(1)
  const [text, setText] = useState('')
  const [textPosition, setTextPosition] = useState<TextPosition>('bottom')
  const [textSize, setTextSize] = useState<TextSize>('md')
  const [textColor, setTextColor] = useState('#ffffff')
  const [bgColor, setBgColor] = useState('#000000')
  const [productId, setProductId] = useState('')
  const fieldErrors = state.fieldErrors ?? {}

  const selectedProduct = products.find((product) => product.id === productId)

  useEffect(() => {
    if (state.error) {
      toast.add({ title: 'No pudimos crear la promoción', description: state.error, type: 'error' })
    }
  }, [state])

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setIsUploading(true)
    setUploadError(null)
    try {
      const url = await uploadShopImage('shop-promotions', shopId, file)
      setImageUrl(url)
    } catch (error) {
      console.error('CreatePromotionForm: fallo al subir imagen', { error })
      setUploadError(error instanceof Error ? error.message : 'No pudimos subir la imagen')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="grid gap-6 sm:grid-cols-[220px_1fr]">
      <div className="space-y-2">
        <p className="text-sm font-medium">Vista previa</p>
        <StoryPreview
          className="max-w-[220px]"
          imageUrl={imageUrl || null}
          text={text}
          productName={selectedProduct?.name}
          textPosition={textPosition}
          textSize={textSize}
          textColor={textColor}
          bgColor={bgColor}
        />
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="image_url" value={imageUrl} />
        <input type="hidden" name="text_position" value={textPosition} />
        <input type="hidden" name="text_size" value={textSize} />
        <input type="hidden" name="text_color" value={textColor} />
        <input type="hidden" name="bg_color" value={bgColor} />

        <div className="space-y-2">
          <label className="text-sm font-medium">Imagen de la promo</label>

          {selectedProduct && selectedProduct.image_urls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedProduct.image_urls.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setImageUrl(url)}
                  className={cn(
                    'relative size-14 shrink-0 overflow-hidden rounded-lg border-2 bg-muted',
                    imageUrl === url ? 'border-primary' : 'border-transparent'
                  )}
                >
                  <Image
                    src={url}
                    alt="Vista previa de la promoción"
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </button>
              ))}
              <label
                className={cn(
                  'flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border bg-muted text-muted-foreground',
                  isUploading && 'pointer-events-none opacity-60'
                )}
              >
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                {isUploading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <ImagePlus className="size-4" aria-hidden />
                )}
              </label>
            </div>
          )}

          {(!selectedProduct || selectedProduct.image_urls.length === 0) &&
            (imageUrl ? (
              <div className="relative size-20 overflow-hidden rounded-lg border border-border bg-muted">
                <Image
                  src={imageUrl}
                  alt="Vista previa de la promoción"
                  fill
                  className="object-cover"
                  sizes="80px"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  aria-label="Quitar imagen"
                  className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background"
                >
                  <X className="size-3" aria-hidden />
                </button>
              </div>
            ) : (
              <label
                className={cn(
                  'flex h-20 w-full max-w-[180px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-muted text-center',
                  isUploading && 'pointer-events-none opacity-60'
                )}
              >
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                {isUploading ? (
                  <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
                ) : (
                  <>
                    <ImagePlus className="size-5 text-muted-foreground" aria-hidden />
                    <span className="px-3 text-xs font-medium text-muted-foreground">
                      Subir imagen
                    </span>
                  </>
                )}
              </label>
            ))}
          {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
          <FieldError message={fieldErrors.image_url} />
        </div>

        <div className="space-y-2">
          <label htmlFor="text" className="text-sm font-medium">
            Texto <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TEXTS.map((quickText) => (
              <button
                key={quickText}
                type="button"
                onClick={() => setText(quickText)}
                className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {quickText}
              </button>
            ))}
          </div>
          <Textarea
            id="text"
            name="text"
            rows={3}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Ej: 2x1 en todos los cortes esta semana"
          />
          <FieldError message={fieldErrors.text} />
        </div>

        {text && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Posición del texto</label>
              <div className="flex gap-2">
                {TEXT_POSITIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTextPosition(option.value)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm transition-colors',
                      textPosition === option.value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-surface text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tamaño del texto</label>
              <div className="flex gap-2">
                {TEXT_SIZES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTextSize(option.value)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm transition-colors',
                      textSize === option.value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-surface text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Color del texto</label>
                <div className="flex flex-wrap items-center gap-2">
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setTextColor(color)}
                      aria-label={`Color de texto ${color}`}
                      style={{ backgroundColor: color }}
                      className={cn(
                        'size-6 shrink-0 rounded-full border-2',
                        textColor === color ? 'border-primary' : 'border-border'
                      )}
                    />
                  ))}
                  <input
                    type="color"
                    value={textColor}
                    onChange={(event) => setTextColor(event.target.value)}
                    aria-label="Elegir otro color de texto"
                    className="size-6 shrink-0 cursor-pointer rounded-full border border-border bg-transparent p-0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Color de fondo</label>
                <div className="flex flex-wrap items-center gap-2">
                  {BG_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setBgColor(color)}
                      aria-label={`Color de fondo ${color}`}
                      style={{ backgroundColor: color }}
                      className={cn(
                        'size-6 shrink-0 rounded-full border-2',
                        bgColor === color ? 'border-primary' : 'border-border'
                      )}
                    />
                  ))}
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(event) => setBgColor(event.target.value)}
                    aria-label="Elegir otro color de fondo"
                    className="size-6 shrink-0 cursor-pointer rounded-full border border-border bg-transparent p-0"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {products.length > 0 && (
          <div className="space-y-2">
            <label htmlFor="product_id" className="text-sm font-medium">
              Vincular a un {noun} <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <select
              id="product_id"
              name="product_id"
              value={productId}
              onChange={(event) => {
                setProductId(event.target.value)
                const product = products.find((item) => item.id === event.target.value)
                if (product?.image_urls[0]) setImageUrl(product.image_urls[0])
              }}
              className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Ninguno</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Duración</label>
          <input type="hidden" name="duration_days" value={duration} />
          <div className="flex gap-2">
            {DURATIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDuration(option.value)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-colors',
                  duration === option.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-surface text-muted-foreground hover:text-foreground'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <FieldError message={fieldErrors.duration_days} />
        </div>

        <Button type="submit" disabled={isPending || isUploading || !imageUrl} className="w-full">
          {isPending ? 'Creando...' : 'Crear promoción'}
        </Button>
      </form>
    </div>
  )
}
