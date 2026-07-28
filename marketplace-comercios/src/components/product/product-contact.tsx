'use client'

import { useState } from 'react'
import { WhatsAppButton } from '@/components/shared/whatsapp-button'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'

interface QuickMessage {
  label: string
  text: (shopName: string, productName: string) => string
}

const GENERIC_MESSAGES: QuickMessage[] = [
  { label: '¿Está disponible?', text: (shop, product) => `Hola ${shop}! ¿"${product}" todavía está disponible?` },
  { label: '¿Cuál es el precio final?', text: (shop, product) => `Hola ${shop}! ¿Cuál es el precio final de "${product}"?` },
  { label: '¿Tenés stock/talles?', text: (shop, product) => `Hola ${shop}! ¿Tenés stock de "${product}"? ¿Qué talles/colores hay?` },
  { label: '¿Hacen envíos?', text: (shop, product) => `Hola ${shop}! ¿Hacen envíos con "${product}"? ¿A qué zonas?` },
  { label: 'Quiero coordinar para verlo', text: (shop, product) => `Hola ${shop}! Me interesa "${product}", ¿podemos coordinar para verlo/retirarlo?` },
]

const MESSAGES_BY_RUBRO: Record<string, QuickMessage[]> = {
  farmacias: [
    { label: '¿Tenés stock de esto?', text: (shop, product) => `Hola ${shop}! ¿Tenés stock de "${product}"?` },
    { label: '¿Hasta qué hora atienden?', text: (shop) => `Hola ${shop}! ¿Hasta qué hora atienden hoy?` },
    { label: '¿Hacen envíos a domicilio?', text: (shop, product) => `Hola ${shop}! ¿Hacen envío a domicilio de "${product}"?` },
    { label: '¿Aceptan obra social?', text: (shop, product) => `Hola ${shop}! Para "${product}", ¿aceptan obra social o descuento?` },
    { label: '¿Puedo reservarlo?', text: (shop, product) => `Hola ${shop}! ¿Podés reservarme "${product}" para retirar más tarde?` },
  ],
  almacenes: [
    { label: '¿Tenés stock de esto?', text: (shop, product) => `Hola ${shop}! ¿Tenés stock de "${product}"?` },
    { label: '¿Cuál es el precio final?', text: (shop, product) => `Hola ${shop}! ¿Cuál es el precio final de "${product}"?` },
    { label: '¿Hacen envíos?', text: (shop, product) => `Hola ${shop}! ¿Hacen envíos de "${product}"?` },
    { label: '¿Puedo pagar con transferencia?', text: (shop) => `Hola ${shop}! ¿Puedo pagar con transferencia?` },
    { label: '¿Hasta qué hora puedo retirar?', text: (shop) => `Hola ${shop}! ¿Hasta qué hora puedo pasar a retirar hoy?` },
  ],
  carnicerias: [
    { label: '¿Lo tenés disponible?', text: (shop, product) => `Hola ${shop}! ¿Tenés "${product}" disponible?` },
    { label: '¿Cuánto sale el kilo?', text: (shop, product) => `Hola ${shop}! ¿Cuánto sale el kilo de "${product}"?` },
    { label: '¿Está fresco para hoy?', text: (shop, product) => `Hola ${shop}! ¿"${product}" está fresco para hoy?` },
    { label: '¿Hacen envíos?', text: (shop) => `Hola ${shop}! ¿Hacen envíos a domicilio?` },
    { label: 'Quiero encargar una cantidad', text: (shop, product) => `Hola ${shop}! Quiero encargar "${product}", ¿me decís cantidad y precio?` },
  ],
  peluquerias: [
    { label: '¿Tenés turno hoy?', text: (shop) => `Hola ${shop}! ¿Tenés algún turno disponible hoy?` },
    { label: '¿Cuánto sale este servicio?', text: (shop, product) => `Hola ${shop}! ¿Cuánto sale "${product}"?` },
    { label: '¿Cuánto dura el turno?', text: (shop, product) => `Hola ${shop}! ¿Cuánto dura "${product}"?` },
    { label: '¿Atienden sin turno?', text: (shop) => `Hola ${shop}! ¿Atienden sin turno o hay que reservar?` },
    { label: '¿Qué formas de pago aceptan?', text: (shop) => `Hola ${shop}! ¿Qué formas de pago aceptan?` },
  ],
  talleres: [
    { label: '¿Podés revisarlo hoy?', text: (shop, product) => `Hola ${shop}! Necesito "${product}", ¿podés revisarlo hoy?` },
    { label: '¿Cuánto sale?', text: (shop, product) => `Hola ${shop}! ¿Cuánto sale "${product}"?` },
    { label: '¿Cuánto tarda el trabajo?', text: (shop, product) => `Hola ${shop}! ¿Cuánto tarda "${product}"?` },
    { label: '¿Tenés el repuesto?', text: (shop, product) => `Hola ${shop}! ¿Tenés disponible "${product}"?` },
    { label: '¿Hacen retiro a domicilio?', text: (shop) => `Hola ${shop}! ¿Hacen retiro y entrega a domicilio?` },
  ],
  'salud-y-bienestar': [
    { label: '¿Tenés turno disponible?', text: (shop) => `Hola ${shop}! ¿Tenés algún turno disponible?` },
    { label: '¿Cuánto sale la consulta?', text: (shop, product) => `Hola ${shop}! ¿Cuánto sale "${product}"?` },
    { label: '¿Atendés obra social?', text: (shop) => `Hola ${shop}! ¿Atendés con obra social?` },
    { label: '¿Cuánto dura la sesión?', text: (shop, product) => `Hola ${shop}! ¿Cuánto dura "${product}"?` },
    { label: '¿Cómo es la primera consulta?', text: (shop) => `Hola ${shop}! ¿Cómo es la primera consulta?` },
  ],
  'tienda-de-ropa': [
    { label: '¿Tenés mi talle?', text: (shop, product) => `Hola ${shop}! ¿Tenés "${product}" en mi talle?` },
    { label: '¿Qué colores hay?', text: (shop, product) => `Hola ${shop}! ¿Qué colores tenés de "${product}"?` },
    { label: '¿Puedo cambiarlo si no me queda?', text: (shop, product) => `Hola ${shop}! Si compro "${product}" y no me queda, ¿puedo cambiarlo?` },
    { label: '¿Hacen envíos?', text: (shop, product) => `Hola ${shop}! ¿Hacen envíos de "${product}"?` },
    { label: '¿Puedo probármelo antes?', text: (shop, product) => `Hola ${shop}! ¿Puedo pasar a probarme "${product}"?` },
  ],
  libreria: [
    { label: '¿Lo tenés en stock?', text: (shop, product) => `Hola ${shop}! ¿Tenés "${product}" en stock?` },
    { label: '¿Cuál es el precio?', text: (shop, product) => `Hola ${shop}! ¿Cuánto sale "${product}"?` },
    { label: '¿Podés reservarlo?', text: (shop, product) => `Hola ${shop}! ¿Podés reservarme "${product}" para retirar más tarde?` },
    { label: '¿Hacen envíos?', text: (shop, product) => `Hola ${shop}! ¿Hacen envíos de "${product}"?` },
    { label: '¿Hacen encuadernación/impresiones?', text: (shop) => `Hola ${shop}! ¿Hacen encuadernación o impresiones?` },
  ],
  alquileres: [
    { label: '¿Está disponible para alquilar?', text: (shop, product) => `Hola ${shop}! ¿"${product}" está disponible para alquilar?` },
    { label: '¿Cuánto sale por día?', text: (shop, product) => `Hola ${shop}! ¿Cuánto sale alquilar "${product}" por día?` },
    { label: '¿Qué necesito para reservar?', text: (shop, product) => `Hola ${shop}! ¿Qué necesito para reservar "${product}"?` },
    { label: '¿Piden depósito o garantía?', text: (shop) => `Hola ${shop}! ¿Piden depósito o garantía para el alquiler?` },
    { label: '¿Hacen entrega y retiro?', text: (shop) => `Hola ${shop}! ¿Hacen entrega y retiro a domicilio?` },
  ],
  comercio: [
    { label: '¿Tenés stock de esto?', text: (shop, product) => `Hola ${shop}! ¿Tenés stock de "${product}"?` },
    { label: '¿Cuál es el precio final?', text: (shop, product) => `Hola ${shop}! ¿Cuál es el precio final de "${product}"?` },
    { label: '¿Tiene garantía?', text: (shop, product) => `Hola ${shop}! ¿"${product}" tiene garantía?` },
    { label: '¿Hacen envíos?', text: (shop, product) => `Hola ${shop}! ¿Hacen envíos de "${product}"?` },
    { label: '¿Aceptan tarjeta/transferencia?', text: (shop) => `Hola ${shop}! ¿Qué formas de pago aceptan?` },
  ],
  comida: [
    { label: '¿Está disponible ahora?', text: (shop, product) => `Hola ${shop}! ¿"${product}" está disponible ahora?` },
    { label: '¿Hacen delivery?', text: (shop, product) => `Hola ${shop}! ¿Hacen delivery de "${product}"? ¿A qué zonas?` },
    { label: '¿Cuánto tarda el pedido?', text: (shop, product) => `Hola ${shop}! Si pido "${product}", ¿cuánto tarda?` },
    { label: '¿Tienen para hoy?', text: (shop, product) => `Hola ${shop}! ¿Tenés "${product}" para hoy?` },
    { label: 'Quiero hacer un pedido', text: (shop, product) => `Hola ${shop}! Quiero pedir "${product}", ¿me confirmás precio y forma de pago?` },
  ],
  concesionaria: [
    { label: '¿Sigue disponible?', text: (shop, product) => `Hola ${shop}! ¿"${product}" sigue disponible?` },
    { label: '¿Cuál es el precio final?', text: (shop, product) => `Hola ${shop}! ¿Cuál es el precio final de "${product}"?` },
    { label: '¿Aceptan usado + efectivo?', text: (shop, product) => `Hola ${shop}! Para "${product}", ¿aceptan tomar un usado como parte de pago?` },
    { label: '¿Tiene financiación?', text: (shop, product) => `Hola ${shop}! ¿"${product}" tiene alguna opción de financiación?` },
    { label: 'Quiero coordinar para verlo', text: (shop, product) => `Hola ${shop}! Me interesa "${product}", ¿podemos coordinar para verlo?` },
  ],
  lavadero: [
    { label: '¿Tenés turno hoy?', text: (shop) => `Hola ${shop}! ¿Tenés algún turno disponible hoy?` },
    { label: '¿Cuánto sale este servicio?', text: (shop, product) => `Hola ${shop}! ¿Cuánto sale "${product}"?` },
    { label: '¿Cuánto tarda?', text: (shop, product) => `Hola ${shop}! ¿Cuánto tarda "${product}"?` },
    { label: '¿Atienden sin turno?', text: (shop) => `Hola ${shop}! ¿Atienden sin turno o hay que reservar?` },
    { label: '¿Hacen retiro y entrega?', text: (shop) => `Hola ${shop}! ¿Hacen retiro y entrega a domicilio?` },
  ],
  veterinaria: [
    { label: '¿Tenés turno disponible?', text: (shop) => `Hola ${shop}! ¿Tenés algún turno disponible?` },
    { label: '¿Cuánto sale esto?', text: (shop, product) => `Hola ${shop}! ¿Cuánto sale "${product}"?` },
    { label: '¿Atienden urgencias?', text: (shop) => `Hola ${shop}! ¿Atienden urgencias o solo con turno?` },
    { label: '¿Tenés stock de esto?', text: (shop, product) => `Hola ${shop}! ¿Tenés stock de "${product}"?` },
    { label: '¿Hacen envíos?', text: (shop, product) => `Hola ${shop}! ¿Hacen envíos de "${product}"?` },
  ],
  construccion: [
    { label: '¿Tenés stock de esto?', text: (shop, product) => `Hola ${shop}! ¿Tenés stock de "${product}"?` },
    { label: '¿Cuál es el precio final?', text: (shop, product) => `Hola ${shop}! ¿Cuál es el precio final de "${product}"?` },
    { label: '¿Hacen envíos a obra?', text: (shop, product) => `Hola ${shop}! ¿Hacen envío de "${product}" a la obra?` },
    { label: '¿Hacen presupuesto?', text: (shop, product) => `Hola ${shop}! Necesito "${product}", ¿me pasás un presupuesto?` },
    { label: '¿Cuándo pueden empezar?', text: (shop, product) => `Hola ${shop}! Para "${product}", ¿cuándo podrían empezar?` },
  ],
  'servicio-tecnico': [
    { label: '¿Podés revisarlo hoy?', text: (shop, product) => `Hola ${shop}! Tengo un problema con "${product}", ¿podés revisarlo hoy?` },
    { label: '¿Cuánto sale el diagnóstico?', text: (shop) => `Hola ${shop}! ¿Cuánto sale el diagnóstico?` },
    { label: '¿Cuánto tarda la reparación?', text: (shop, product) => `Hola ${shop}! ¿Cuánto tarda la reparación de "${product}"?` },
    { label: '¿Tenés el repuesto?', text: (shop, product) => `Hola ${shop}! ¿Tenés disponible "${product}"?` },
    { label: '¿Dan garantía del arreglo?', text: (shop) => `Hola ${shop}! ¿Dan garantía sobre el arreglo?` },
  ],
}

interface ProductVariant {
  id: string
  name: string
  price: number
}

interface ProductContactProps {
  shopId: string
  shopName: string
  productId: string
  productName: string
  phoneNumber: string
  rubroSlug: string | null
  variants?: ProductVariant[]
  currency?: string
}

export function ProductContact({
  shopId,
  shopName,
  productId,
  productName,
  phoneNumber,
  rubroSlug,
  variants = [],
  currency = 'ARS',
}: ProductContactProps) {
  const quickMessages = (rubroSlug && MESSAGES_BY_RUBRO[rubroSlug]) || GENERIC_MESSAGES
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const effectiveName = selectedVariant ? `${productName} - ${selectedVariant.name}` : productName
  const defaultMessage = `Hola ${shopName}, vi "${effectiveName}" en Todo Marketplace`
  const [message, setMessage] = useState(defaultMessage)
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)

  function handleSelectVariant(variant: ProductVariant | null) {
    setSelectedVariant(variant)
    setSelectedLabel(null)
    const name = variant ? `${productName} - ${variant.name}` : productName
    setMessage(`Hola ${shopName}, vi "${name}" en Todo Marketplace`)
  }

  return (
    <div className="space-y-2">
      {variants.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Elegí una opción</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => handleSelectVariant(variant)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  selectedVariant?.id === variant.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-surface text-muted-foreground hover:text-foreground'
                )}
              >
                {variant.name} · {formatPrice(variant.price, currency)}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs font-medium text-muted-foreground">Mensajes rápidos</p>
      <div className="flex flex-wrap gap-2">
        {quickMessages.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => {
              setMessage(option.text(shopName, effectiveName))
              setSelectedLabel(option.label)
            }}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              selectedLabel === option.label
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-surface text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <WhatsAppButton
        shopId={shopId}
        productId={productId}
        phoneNumber={phoneNumber}
        message={message}
        className="hidden w-full sm:flex"
      />

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 p-4 backdrop-blur-sm sm:hidden">
        <WhatsAppButton
          shopId={shopId}
          productId={productId}
          phoneNumber={phoneNumber}
          message={message}
          className="w-full"
        />
      </div>
    </div>
  )
}
