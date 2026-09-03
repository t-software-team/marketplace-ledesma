'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VoiceOverlayProps {
  onStop: () => void
}

/**
 * Overlay de pantalla completa mientras se dicta una nota por voz — mismo
 * espíritu que el modo de voz de ChatGPT: fondo opaco (no se ve nada de
 * atrás) con el SVG animado (`public/icons/ai-voice.svg`, animación SMIL)
 * chico y centrado, no a pantalla completa.
 */
export function VoiceOverlay({ onStop }: VoiceOverlayProps) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-background">
      <div className="relative size-56 sm:size-72">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG con animación SMIL, next/image no la reproduce */}
        <img src="/icons/ai-voice.svg" alt="" className="size-full" aria-hidden />
      </div>
      <p className="text-lg font-medium text-foreground">Escuchando...</p>
      <p className="max-w-xs text-center text-sm text-muted-foreground">
        Hablá con naturalidad. Lo que digas se agrega al texto de la nota.
      </p>
      <Button variant="outline" size="lg" onClick={onStop} className="gap-2">
        <X className="size-4" aria-hidden />
        Detener
      </Button>
    </div>
  )
}
