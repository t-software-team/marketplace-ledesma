'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { getBaseUrl } from '@/lib/site-url'
import { PromotionStoryDialog, type StoryPromotion } from './promotion-story-dialog'
import type { TextPosition, TextSize } from './story-preview'

interface Promotion {
  id: string
  image_url: string
  text: string | null
  expires_at: string
  text_position: string
  text_size: string
  text_color: string
  bg_color: string
  shops: {
    id: string
    name: string
    slug: string
    logo_url: string | null
    whatsapp_number: string
    verification_status: string
  } | null
  products: { id: string; name: string } | null
}

export function PromotionsRow({ promotions }: { promotions: Promotion[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  // Group consecutively by shop so each shop only shows one card in the row,
  // and opening it plays through all of that shop's active promos in a row
  // (like tapping an IG story ring) before moving on to the next shop.
  const stories: StoryPromotion[] = promotions
    .filter((promotion): promotion is Promotion & { shops: NonNullable<Promotion['shops']> } =>
      Boolean(promotion.shops)
    )
    .sort((a, b) => a.shops.id.localeCompare(b.shops.id))
    .map((promotion) => ({
      id: promotion.id,
      shopId: promotion.shops.id,
      imageUrl: promotion.image_url,
      text: promotion.text,
      shopName: promotion.shops.name,
      shopSlug: promotion.shops.slug,
      shopLogoUrl: promotion.shops.logo_url,
      shopWhatsapp: promotion.shops.whatsapp_number,
      isVerified: promotion.shops.verification_status === 'verified',
      productName: promotion.products?.name,
      shopUrl: `${getBaseUrl()}/tienda/${promotion.shops.slug}`,
      textPosition: (promotion.text_position as TextPosition) || 'bottom',
      textSize: (promotion.text_size as TextSize) || 'md',
      textColor: promotion.text_color || '#ffffff',
      bgColor: promotion.bg_color || '#000000',
    }))

  const shopCards = stories.filter(
    (story, index) => stories.findIndex((item) => item.shopId === story.shopId) === index
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <Sparkles className="size-3.5 text-primary" aria-hidden />
        Promociones
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {shopCards.map((story) => (
          <button
            key={story.shopId}
            type="button"
            onClick={() => setActiveIndex(stories.findIndex((item) => item.shopId === story.shopId))}
            className="relative aspect-[9/16] w-28 shrink-0 overflow-hidden rounded-xl border border-border bg-muted text-left transition-transform hover:scale-[1.02]"
          >
            <Image
              src={story.imageUrl}
              alt={`Promoción de ${story.shopName}`}
              fill
              className="object-cover"
              sizes="112px"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <p className="truncate text-xs font-medium text-white">{story.shopName}</p>
            </div>
          </button>
        ))}
      </div>

      {activeIndex !== null && (
        <PromotionStoryDialog
          open={activeIndex !== null}
          onOpenChange={(open) => !open && setActiveIndex(null)}
          promotions={stories}
          activeIndex={activeIndex}
          onIndexChange={setActiveIndex}
        />
      )}
    </div>
  )
}
