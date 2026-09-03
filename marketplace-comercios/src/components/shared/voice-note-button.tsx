'use client'

import { Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VoiceNoteButtonProps {
  onStart: () => void
  disabled?: boolean
}

/**
 * Botón de dictado, puramente presentacional — el hook `useSpeechToText` y
 * el overlay viven en el componente padre (fuera del Dialog), para que
 * cerrar el diálogo mientras se escucha no desmonte el reconocimiento de voz
 * en curso. Ver `use-speech-to-text.ts` y `voice-overlay.tsx`.
 */
export function VoiceNoteButton({ onStart, disabled }: VoiceNoteButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={onStart}
      aria-label="Dictar nota por voz"
      className="gap-1.5"
    >
      <Mic className="size-4" aria-hidden />
      Dictar
    </Button>
  )
}
