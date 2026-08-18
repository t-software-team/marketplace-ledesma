'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/components/ui/toast'
import { setBookingSettings } from '@/lib/turnos/actions'
import type { BookingSettings } from '@/lib/turnos/queries'

const WEEKDAYS = [
  { value: '1', label: 'Lunes' },
  { value: '2', label: 'Martes' },
  { value: '3', label: 'Miércoles' },
  { value: '4', label: 'Jueves' },
  { value: '5', label: 'Viernes' },
  { value: '6', label: 'Sábado' },
  { value: '0', label: 'Domingo' },
]

type DayRange = { open: string; close: string }
type WeeklyHours = Record<string, DayRange[]>

interface BookingSettingsFormProps {
  shopId: string
  settings: BookingSettings | null
}

export function BookingSettingsForm({ shopId, settings }: BookingSettingsFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [isEnabled, setIsEnabled] = useState(settings?.is_enabled ?? false)
  const [durationMinutes, setDurationMinutes] = useState(settings?.slot_duration_minutes ?? 30)
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHours>(
    (settings?.weekly_hours as WeeklyHours | undefined) ?? {}
  )

  function toggleDay(day: string, enabled: boolean) {
    setWeeklyHours((prev) => {
      const next = { ...prev }
      if (enabled) {
        next[day] = [{ open: '09:00', close: '18:00' }]
      } else {
        delete next[day]
      }
      return next
    })
  }

  function updateRange(day: string, field: 'open' | 'close', value: string) {
    setWeeklyHours((prev) => ({
      ...prev,
      [day]: [{ ...(prev[day]?.[0] ?? { open: '09:00', close: '18:00' }), [field]: value }],
    }))
  }

  function handleSave() {
    startTransition(async () => {
      const result = await setBookingSettings(shopId, durationMinutes, weeklyHours, isEnabled)
      if (result.error) {
        toast.add({ title: 'No pudimos guardar', description: result.error, type: 'error' })
      } else {
        toast.add({ title: 'Configuración guardada', type: 'success' })
        router.refresh()
      }
    })
  }

  return (
    <Card className="rounded-xl ring-1 ring-foreground/10">
      <CardHeader>
        <CardTitle>Disponibilidad</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Checkbox checked={isEnabled} onCheckedChange={(checked) => setIsEnabled(Boolean(checked))} />
          Aceptar turnos online
        </label>

        <div className="space-y-2">
          <label htmlFor="duration" className="text-sm font-medium">
            Duración de cada turno (minutos)
          </label>
          <Input
            id="duration"
            type="number"
            min={5}
            step={5}
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(Number(event.target.value))}
            className="max-w-40"
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">Días y horarios</p>
          {WEEKDAYS.map((day) => {
            const range = weeklyHours[day.value]?.[0]
            const enabled = Boolean(range)
            return (
              <div key={day.value} className="flex flex-wrap items-center gap-3">
                <label className="flex w-28 shrink-0 items-center gap-2 text-sm">
                  <Checkbox
                    checked={enabled}
                    onCheckedChange={(checked) => toggleDay(day.value, Boolean(checked))}
                  />
                  {day.label}
                </label>
                {enabled && range && (
                  <>
                    <Input
                      type="time"
                      value={range.open}
                      onChange={(event) => updateRange(day.value, 'open', event.target.value)}
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">a</span>
                    <Input
                      type="time"
                      value={range.close}
                      onChange={(event) => updateRange(day.value, 'close', event.target.value)}
                      className="w-32"
                    />
                  </>
                )}
              </div>
            )
          })}
        </div>

        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? 'Guardando...' : 'Guardar configuración'}
        </Button>
      </CardContent>
    </Card>
  )
}
