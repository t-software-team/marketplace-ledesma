'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface SpeechRecognitionResultLike {
  isFinal: boolean
  0: { transcript: string }
}

interface SpeechRecognitionEventLike {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}

interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: unknown) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/**
 * Dictado por voz usando la Web Speech API nativa del navegador (Chrome/Edge;
 * Safari tiene soporte parcial). No hay servicio externo de por medio — todo
 * corre en el cliente. `onTranscript` recibe el texto final reconocido en
 * cada tanda (no interino), para que el caller decida cómo insertarlo.
 */
const SILENCE_TIMEOUT_MS = 3000

export function useSpeechToText(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const onTranscriptRef = useRef(onTranscript)
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  useEffect(() => {
    // Detección de feature solo-cliente: `window` no existe en SSR, así que
    // el estado inicial (false) debe coincidir con el render del servidor y
    // recién actualizarse acá, después del mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSupported(getSpeechRecognitionConstructor() !== null)
  }, [])

  const clearSilenceTimeout = useCallback(() => {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current)
  }, [])

  const stop = useCallback(() => {
    clearSilenceTimeout()
    recognitionRef.current?.stop()
  }, [clearSilenceTimeout])

  const resetSilenceTimeout = useCallback(() => {
    clearSilenceTimeout()
    silenceTimeoutRef.current = setTimeout(() => {
      recognitionRef.current?.stop()
    }, SILENCE_TIMEOUT_MS)
  }, [clearSilenceTimeout])

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionConstructor()
    if (!Ctor) return

    const recognition = new Ctor()
    recognition.lang = 'es-AR'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event) => {
      // Cualquier resultado (interino o final) cuenta como "sigue hablando",
      // así que reinicia el corte por silencio. Solo el texto final se
      // agrega a la nota.
      resetSilenceTimeout()
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          onTranscriptRef.current(result[0].transcript.trim())
        }
      }
    }
    recognition.onerror = () => {
      clearSilenceTimeout()
      setIsListening(false)
    }
    recognition.onend = () => {
      clearSilenceTimeout()
      setIsListening(false)
    }

    recognitionRef.current = recognition
    setIsListening(true)
    recognition.start()
    resetSilenceTimeout()
  }, [clearSilenceTimeout, resetSilenceTimeout])

  useEffect(() => {
    return () => {
      clearSilenceTimeout()
      recognitionRef.current?.stop()
    }
  }, [clearSilenceTimeout])

  return { isListening, isSupported, start, stop }
}
