'use client'

import { Delete, Check } from 'lucide-react'

interface NumberPadProps {
  value: string
  onChange: (next: string) => void
  onSubmit: () => void
  /** Hard cap on how many digits can be entered. */
  maxLength?: number
  disabled?: boolean
  /** Disables only the confirm key (e.g. not enough digits yet). */
  submitDisabled?: boolean
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const

const keyBase =
  'flex items-center justify-center rounded-2xl min-h-[4.25rem] sm:min-h-[5.25rem] ' +
  'font-mono text-3xl sm:text-4xl font-semibold select-none touch-manipulation ' +
  'transition-[transform,background-color] duration-100 active:scale-95 ' +
  'disabled:opacity-30 disabled:active:scale-100'

/**
 * Large on-screen numeric keypad for unattended / touch surfaces (kiosk, tablet).
 * Renders no native input, so the OS keyboard never opens. Theme-aware via
 * design tokens: wrap in a `.dark` scope to render on a dark surface.
 */
export function NumberPad({
  value,
  onChange,
  onSubmit,
  maxLength = 15,
  disabled = false,
  submitDisabled = false,
}: NumberPadProps) {
  const press = (digit: string) => {
    if (disabled || value.length >= maxLength) return
    onChange(value + digit)
  }

  const backspace = () => {
    if (disabled || value.length === 0) return
    onChange(value.slice(0, -1))
  }

  return (
    <div className="grid w-full max-w-sm grid-cols-3 gap-3">
      {DIGITS.map((digit) => (
        <button
          key={digit}
          type="button"
          onClick={() => press(digit)}
          disabled={disabled}
          aria-label={digit}
          className={`${keyBase} bg-surface text-foreground ring-1 ring-border hover:ring-primary/50`}
        >
          {digit}
        </button>
      ))}

      <button
        type="button"
        onClick={backspace}
        disabled={disabled || value.length === 0}
        aria-label="Borrar"
        className={`${keyBase} bg-surface text-muted-foreground ring-1 ring-border hover:ring-primary/50`}
      >
        <Delete className="size-7 sm:size-8" aria-hidden />
      </button>

      <button
        type="button"
        onClick={() => press('0')}
        disabled={disabled}
        aria-label="0"
        className={`${keyBase} bg-surface text-foreground ring-1 ring-border hover:ring-primary/50`}
      >
        0
      </button>

      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || submitDisabled}
        aria-label="Confirmar"
        className={`${keyBase} bg-primary text-primary-foreground`}
      >
        <Check className="size-8 sm:size-9" aria-hidden />
      </button>
    </div>
  )
}
