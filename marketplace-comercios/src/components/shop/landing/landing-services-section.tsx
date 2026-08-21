'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { LandingService } from './landing-sections-types'

interface LandingServicesSectionProps {
  services: LandingService[]
  setServices: React.Dispatch<React.SetStateAction<LandingService[]>>
  visible: boolean
}

export function LandingServicesSection({ services, setServices, visible }: LandingServicesSectionProps) {
  function addService() {
    if (services.length >= 6) return
    setServices((current) => [...current, { name: '', description: '' }])
  }

  function updateService(index: number, patch: Partial<LandingService>) {
    setServices((current) =>
      current.map((service, i) => (i === index ? { ...service, ...patch } : service))
    )
  }

  function removeService(index: number) {
    setServices((current) => current.filter((_, i) => i !== index))
  }

  return (
    <div className={cn('space-y-4 rounded-xl border border-border p-4 lg:p-5', !visible && 'hidden')}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Servicios destacados</p>
          <p className="text-xs text-muted-foreground">
            Mostralos como tarjetas antes de tus productos. Hasta 6.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              services.length >= 6 ? 'bg-amber-500/15 text-amber-600' : 'bg-muted text-muted-foreground'
            )}
          >
            {services.length}/6
          </span>
          {services.length < 6 && (
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addService}>
              <Plus className="size-3.5" aria-hidden />
              Agregar
            </Button>
          )}
        </div>
      </div>

      {services.length === 0 ? (
        <button
          type="button"
          onClick={addService}
          className="flex w-full flex-col items-center gap-1.5 rounded-lg border border-dashed border-border py-8 text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          <Plus className="size-5" aria-hidden />
          <span className="text-sm">Agregá tu primer servicio</span>
        </button>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((service, index) => (
            <div
              key={index}
              className="group relative space-y-2 rounded-lg border border-border bg-surface p-3 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                  {index + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 group-focus-within:opacity-100"
                  onClick={() => removeService(index)}
                  aria-label="Quitar servicio"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </Button>
              </div>
              <Input
                placeholder="Nombre del servicio"
                value={service.name}
                onChange={(event) => updateService(index, { name: event.target.value })}
                maxLength={60}
              />
              <Input
                placeholder="Descripción breve (opcional)"
                value={service.description}
                onChange={(event) => updateService(index, { description: event.target.value })}
                maxLength={200}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
