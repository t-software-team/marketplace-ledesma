'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'

interface PriceInputProps {
  id?: string
  name?: string
  value?: string
  defaultValue?: string | number | null
  onChange?: (rawValue: string) => void
  placeholder?: string
  className?: string
  'aria-invalid'?: boolean
}

function formatThousands(raw: string) {
  if (!raw) return ''
  return new Intl.NumberFormat('es-AR').format(Number(raw))
}

export function PriceInput({
  id,
  name,
  value,
  defaultValue,
  onChange,
  placeholder,
  className,
  ...rest
}: PriceInputProps) {
  const isControlled = value !== undefined
  const [internalRaw, setInternalRaw] = useState(() => String(defaultValue ?? ''))
  const raw = isControlled ? (value ?? '') : internalRaw
  const displayValue = formatThousands(raw)

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const digitsOnly = event.target.value.replace(/\D/g, '')
    if (!isControlled) setInternalRaw(digitsOnly)
    onChange?.(digitsOnly)
  }

  return (
    <>
      {name && <input type="hidden" name={name} value={raw} />}
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
        {...rest}
      />
    </>
  )
}
