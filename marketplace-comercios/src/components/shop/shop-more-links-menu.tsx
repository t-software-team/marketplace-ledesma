'use client'

import { Globe, MoreHorizontal } from 'lucide-react'
import { InstagramIcon } from '@/components/shared/instagram-icon'
import { FacebookIcon } from '@/components/shared/facebook-icon'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ShopMoreLinksMenuProps {
  instagramUrl: string | null
  facebookUrl: string | null
  websiteUrl: string | null
}

export function ShopMoreLinksMenu({ instagramUrl, facebookUrl, websiteUrl }: ShopMoreLinksMenuProps) {
  if (!instagramUrl && !facebookUrl && !websiteUrl) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="icon" aria-label="Más links" />}
        nativeButton={true}
      >
        <MoreHorizontal className="size-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {instagramUrl && (
          <DropdownMenuItem
            render={<a href={instagramUrl} target="_blank" rel="noopener noreferrer" />}
          >
            <InstagramIcon className="size-4" />
            Instagram
          </DropdownMenuItem>
        )}
        {facebookUrl && (
          <DropdownMenuItem render={<a href={facebookUrl} target="_blank" rel="noopener noreferrer" />}>
            <FacebookIcon className="size-4" />
            Facebook
          </DropdownMenuItem>
        )}
        {websiteUrl && (
          <DropdownMenuItem render={<a href={websiteUrl} target="_blank" rel="noopener noreferrer" />}>
            <Globe className="size-4" />
            Sitio web
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
