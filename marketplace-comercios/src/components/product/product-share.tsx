'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ShareSheet } from '@/components/shared/share-sheet'
import { cn } from '@/lib/utils'

interface ProductShareProps {
  productId: string
  title: string
  text: string
  url: string
  className?: string
}

export function ProductShare({ productId, title, text, url, className }: ProductShareProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn('gap-1.5', className)}
        onClick={() => setOpen(true)}
      >
        <Share2 className="size-4" aria-hidden />
        Compartir
      </Button>
      <ShareSheet
        open={open}
        onOpenChange={setOpen}
        url={url}
        title={title}
        text={text}
        storyImageUrl={`/producto/${productId}/story-image`}
      />
    </>
  )
}
