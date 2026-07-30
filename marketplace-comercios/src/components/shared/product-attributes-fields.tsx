'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface AttributeDef {
  id: string
  key: string
  label: string
  type: string
  options: unknown
}

interface ProductAttributesFieldsProps {
  attributeDefs: AttributeDef[]
  initialValues?: Record<string, string | string[]>
}

function getContrastColor(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#000000' : '#ffffff'
}

function MultiColorField({
  label,
  options,
  value,
  onToggle,
}: {
  label: string
  options: { label: string; hex: string }[]
  value: string[]
  onToggle: (hex: string) => void
}) {
  function labelFor(hex: string) {
    return options.find((option) => option.hex.toLowerCase() === hex.toLowerCase())?.label ?? hex
  }

  return (
    <div className="space-y-2.5">
      <p className="text-xs text-muted-foreground">
        Podés elegir varios colores — tocá cada uno que tenga disponible.
      </p>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((hex) => (
            <span
              key={hex}
              className="flex items-center gap-1.5 rounded-full border border-border bg-surface py-1 pr-1 pl-2.5 text-xs font-medium"
            >
              <span
                className="size-3 shrink-0 rounded-full border border-border/60"
                style={{ backgroundColor: hex }}
              />
              {labelFor(hex)}
              <button
                type="button"
                onClick={() => onToggle(hex)}
                aria-label={`Quitar ${labelFor(hex)}`}
                className="flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {options.map((color) => {
          const selected = value.includes(color.hex)
          return (
            <button
              key={color.hex}
              type="button"
              onClick={() => onToggle(color.hex)}
              aria-label={color.label}
              aria-pressed={selected}
              title={color.label}
              style={{ backgroundColor: color.hex }}
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-transform',
                selected ? 'border-primary scale-105' : 'border-border'
              )}
            >
              {selected && (
                <Check className="size-3.5" style={{ color: getContrastColor(color.hex) }} strokeWidth={3} />
              )}
            </button>
          )
        })}
        <input
          type="color"
          onChange={(event) => onToggle(event.target.value)}
          aria-label={`Elegir otro color para ${label}`}
          title="Otro color"
          className="size-8 shrink-0 cursor-pointer rounded-full border border-border bg-transparent p-0"
        />
      </div>
    </div>
  )
}

export function ProductAttributesFields({
  attributeDefs,
  initialValues = {},
}: ProductAttributesFieldsProps) {
  const [values, setValues] = useState<Record<string, string | string[]>>(initialValues)

  if (attributeDefs.length === 0) return null

  function setValue(key: string, value: string | string[]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function toggleMultiValue(key: string, option: string) {
    setValues((current) => {
      const existing = current[key]
      const list = Array.isArray(existing) ? existing : []
      const next = list.includes(option) ? list.filter((v) => v !== option) : [...list, option]
      return { ...current, [key]: next }
    })
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name="attributes" value={JSON.stringify(values)} />
      {attributeDefs.map((attribute) => {
        const options = Array.isArray(attribute.options) ? (attribute.options as string[]) : []
        const value = values[attribute.key]

        return (
          <div key={attribute.id} className="space-y-2">
            <label className="text-sm font-medium">{attribute.label}</label>

            {attribute.type === 'multiselect' && (
              <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                  const selected = Array.isArray(value) && value.includes(option)
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleMultiValue(attribute.key, option)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-sm transition-colors',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-surface text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            )}

            {attribute.type === 'select' && (
              <div className="flex flex-wrap gap-2">
                {options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setValue(attribute.key, option)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm transition-colors',
                      value === option
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-surface text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {(attribute.type === 'text' || attribute.type === 'number') && (
              <Input
                type={attribute.type === 'number' ? 'number' : 'text'}
                value={typeof value === 'string' ? value : ''}
                onChange={(event) => setValue(attribute.key, event.target.value)}
                placeholder={attribute.label}
              />
            )}

            {attribute.type === 'multicolor' && (
              <MultiColorField
                label={attribute.label}
                options={(attribute.options as { label: string; hex: string }[] | null) ?? []}
                value={Array.isArray(value) ? value : []}
                onToggle={(hex) => toggleMultiValue(attribute.key, hex)}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
