'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

const DAYS: { key: string; label: string }[] = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
]

interface DaySchedule {
  open: boolean
  from: string
  to: string
}

function parseInitialSchedule(businessHours: unknown): Record<string, DaySchedule> {
  const value =
    businessHours && typeof businessHours === 'object'
      ? (businessHours as Record<string, unknown>)
      : {}

  const schedule: Record<string, DaySchedule> = {}

  for (const { key } of DAYS) {
    const raw = value[key]
    if (typeof raw === 'string' && /^\d{2}:\d{2}-\d{2}:\d{2}$/.test(raw)) {
      const [from, to] = raw.split('-')
      schedule[key] = { open: true, from, to }
    } else {
      schedule[key] = { open: false, from: '09:00', to: '18:00' }
    }
  }

  return schedule
}

interface BusinessHoursEditorProps {
  businessHours: unknown
}

export function BusinessHoursEditor({ businessHours }: BusinessHoursEditorProps) {
  const [schedule, setSchedule] = useState(() => parseInitialSchedule(businessHours))

  const jsonValue = useMemo(() => {
    const result: Record<string, string | null> = {}
    for (const { key } of DAYS) {
      const day = schedule[key]
      result[key] = day.open ? `${day.from}-${day.to}` : null
    }
    return JSON.stringify(result)
  }, [schedule])

  function updateDay(key: string, patch: Partial<DaySchedule>) {
    setSchedule((current) => ({
      ...current,
      [key]: { ...current[key], ...patch },
    }))
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Horario de atención</label>
      <input type="hidden" name="business_hours_text" value={jsonValue} />
      <div className="space-y-1.5 rounded-lg border border-border p-3">
        {DAYS.map(({ key, label }) => {
          const day = schedule[key]
          return (
            <div key={key} className="flex flex-wrap items-center gap-2 py-1">
              <label className="flex w-28 shrink-0 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={day.open}
                  onChange={(event) => updateDay(key, { open: event.target.checked })}
                  className="size-4"
                />
                {label}
              </label>
              {day.open ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="time"
                    value={day.from}
                    onChange={(event) => updateDay(key, { from: event.target.value })}
                    className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
                  />
                  <span className="text-xs text-muted-foreground">a</span>
                  <input
                    type="time"
                    value={day.to}
                    onChange={(event) => updateDay(key, { to: event.target.value })}
                    className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
                  />
                </div>
              ) : (
                <span className={cn('text-xs text-muted-foreground')}>Cerrado</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
