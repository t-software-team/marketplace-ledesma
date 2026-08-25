'use client'

import { useState } from 'react'
import { Check, Download, Link2 } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { InstagramIcon } from '@/components/shared/instagram-icon'
import { FacebookIcon } from '@/components/shared/facebook-icon'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface ShareSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Canonical product URL to share. */
  url: string
  /** Product name — used as the share sheet title. */
  title: string
  /** Pre-composed share text (name + shop + price). */
  text: string
  /** Server-generated 1080x1920 story image endpoint. */
  storyImageUrl: string
}

// Local brand glyphs — the project only ships Instagram/Facebook icons.
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.86 1.21 3.06c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35zM12.01 21.5h-.01a9.5 9.5 0 0 1-4.84-1.33l-.35-.2-3.6.94.96-3.5-.23-.36a9.46 9.46 0 0 1-1.45-5.05c0-5.24 4.27-9.5 9.52-9.5 2.54 0 4.93.99 6.73 2.79a9.44 9.44 0 0 1 2.78 6.72c0 5.24-4.27 9.5-9.5 9.5zm8.09-17.6A11.4 11.4 0 0 0 12.01.5C5.72.5.6 5.62.6 11.9c0 2.02.53 3.99 1.54 5.73L.5 23.5l6.02-1.58a11.36 11.36 0 0 0 5.48 1.4h.01c6.28 0 11.4-5.12 11.4-11.4 0-3.05-1.19-5.91-3.31-8.06z" />
    </svg>
  )
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M21.94 4.9 18.9 19.2c-.23 1.01-.83 1.26-1.68.78l-4.64-3.42-2.24 2.16c-.25.25-.46.46-.94.46l.33-4.73 8.6-7.77c.37-.33-.08-.52-.58-.19L6.42 13.4l-4.57-1.43c-.99-.31-1.01-.99.21-1.47L20.66 3.4c.82-.31 1.54.19 1.28 1.5z" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.22-6.82-5.96 6.82H1.68l7.73-8.83L1.25 2.25h6.82l4.71 6.23 5.46-6.23zm-1.16 17.52h1.83L7.01 4.13H5.03l12.05 15.64z" />
    </svg>
  )
}

interface ShareTarget {
  key: string
  label: string
  icon: React.ReactNode
  /** Circular badge background (brand color). */
  badgeClass: string
  onSelect: () => void | Promise<void>
}

export function ShareSheet({ open, onOpenChange, url, title, text, storyImageUrl }: ShareSheetProps) {
  const [copied, setCopied] = useState(false)
  const shareMessage = `${text} ${url}`

  async function copyLink(notify = true) {
    try {
      await navigator.clipboard.writeText(shareMessage)
      if (notify) {
        setCopied(true)
        toast.add({ title: 'Enlace copiado', type: 'success' })
        setTimeout(() => setCopied(false), 2000)
      }
      return true
    } catch (error) {
      console.error('ShareSheet: fallo al copiar el enlace', error)
      if (notify) toast.add({ title: 'No pudimos copiar el enlace', type: 'error' })
      return false
    }
  }

  async function fetchStoryFile() {
    const response = await fetch(storyImageUrl)
    if (!response.ok) throw new Error('story image request failed')
    const blob = await response.blob()
    return new File([blob], 'historia.png', { type: blob.type || 'image/png' })
  }

  function downloadStoryImage(file: File) {
    const href = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = href
    link.download = file.name
    link.click()
    URL.revokeObjectURL(href)
  }

  // Instagram exposes no web share intent. The only way to land in its
  // Historia/Feed/Mensaje chooser from the web is to hand it an image file via
  // the native share sheet. Everything else degrades to copy + download.
  async function shareToInstagram() {
    try {
      const file = await fetchStoryFile()

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title })
        onOpenChange(false)
        return
      }

      // Fallback (older mobile / desktop): copy the link, save the image, and
      // point the user to Instagram to post it manually.
      await copyLink(false)
      downloadStoryImage(file)
      toast.add({
        title: 'Información copiada al portapapeles',
        description: 'Guardamos la imagen: abrí Instagram y subila a tu historia',
        type: 'success',
      })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      console.error('ShareSheet: fallo al compartir en Instagram', error)
      toast.add({ title: 'No pudimos preparar la historia', type: 'error' })
    }
  }

  async function saveStoryImage() {
    try {
      downloadStoryImage(await fetchStoryFile())
      toast.add({
        title: 'Imagen guardada',
        description: 'Subila como historia desde Instagram',
        type: 'success',
      })
    } catch (error) {
      console.error('ShareSheet: fallo al guardar la imagen', error)
      toast.add({ title: 'No pudimos guardar la imagen', type: 'error' })
    }
  }

  function openIntent(intentUrl: string) {
    window.open(intentUrl, '_blank', 'noopener,noreferrer')
    onOpenChange(false)
  }

  const targets: ShareTarget[] = [
    {
      key: 'instagram',
      label: 'Historia',
      icon: <InstagramIcon className="size-6 text-white" />,
      badgeClass: 'bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5]',
      onSelect: shareToInstagram,
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      icon: <WhatsAppIcon className="size-6 text-white" />,
      badgeClass: 'bg-[#25D366]',
      onSelect: () =>
        openIntent(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`),
    },
    {
      key: 'facebook',
      label: 'Facebook',
      icon: <FacebookIcon className="size-6 text-white" />,
      badgeClass: 'bg-[#1877F2]',
      onSelect: () =>
        openIntent(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`),
    },
    {
      key: 'telegram',
      label: 'Telegram',
      icon: <TelegramIcon className="size-6 text-white" />,
      badgeClass: 'bg-[#229ED9]',
      onSelect: () =>
        openIntent(
          `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
        ),
    },
    {
      key: 'x',
      label: 'X',
      icon: <XIcon className="size-5 text-white" />,
      badgeClass: 'bg-black',
      onSelect: () =>
        openIntent(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
        ),
    },
    {
      key: 'save',
      label: 'Guardar',
      icon: <Download className="size-6 text-foreground" />,
      badgeClass: 'bg-muted',
      onSelect: saveStoryImage,
    },
    {
      key: 'copy',
      label: copied ? 'Copiado' : 'Copiar enlace',
      icon: copied ? (
        <Check className="size-6 text-foreground" />
      ) : (
        <Link2 className="size-6 text-foreground" />
      ),
      badgeClass: 'bg-muted',
      onSelect: () => copyLink(true),
    },
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="gap-0 rounded-t-2xl pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-border" aria-hidden />
        <SheetHeader className="items-center pb-2 text-center">
          <SheetTitle>Compartir producto</SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-4 gap-x-2 gap-y-4 px-4 pt-1">
          {targets.map((target) => (
            <button
              key={target.key}
              type="button"
              onClick={target.onSelect}
              className="flex flex-col items-center gap-1.5 rounded-xl py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
            >
              <span
                className={cn(
                  'flex size-12 items-center justify-center rounded-full shadow-sm',
                  target.badgeClass
                )}
              >
                {target.icon}
              </span>
              {target.label}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
