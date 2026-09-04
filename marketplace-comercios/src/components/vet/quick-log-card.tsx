'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface QuickLogPatient {
  id: string
  name: string
  species: string | null
  owner_name: string | null
}

const ACTIONS = [
  { value: 'tratamiento', label: 'Tratamiento' },
  { value: 'recordatorio', label: 'Recordatorio' },
  { value: 'nota', label: 'Nota' },
] as const

type ActionValue = (typeof ACTIONS)[number]['value']

// Shortcut para no tener que entrar a la ficha del paciente: buscás por
// nombre (filtro client-side sobre la lista ya cargada, mismo criterio que
// el resto del dashboard vet dado que la cantidad de pacientes por comercio
// es chica). Progressive disclosure: los chips de acción y el botón de
// confirmar solo aparecen una vez elegido un paciente, para no mostrar todo
// el flujo de una mientras el usuario todavía está buscando.
export function QuickLogCard({ patients }: { patients: QuickLogPatient[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<QuickLogPatient | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [action, setAction] = useState<ActionValue>('tratamiento')
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const suggestions = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term || selectedPatient) return []
    return patients.filter((patient) => patient.name.toLowerCase().includes(term)).slice(0, 6)
  }, [patients, query, selectedPatient])

  function handleSelect(patient: QuickLogPatient) {
    setSelectedPatient(patient)
    setQuery(patient.name)
    setShowSuggestions(false)
  }

  function handleClear() {
    setSelectedPatient(null)
    setQuery('')
  }

  function handleGo() {
    if (!selectedPatient) return
    const param = action === 'nota' ? 'nota=nueva' : `${action}=nuevo`
    router.push(`/mi-tienda/pacientes/${selectedPatient.id}?${param}`)
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setSelectedPatient(null)
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            blurTimeout.current = setTimeout(() => setShowSuggestions(false), 150)
          }}
          placeholder="Registrar algo para un paciente..."
          className="pl-9"
          disabled={Boolean(selectedPatient)}
        />
        {selectedPatient && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Elegir otro paciente"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-surface shadow-md">
            {suggestions.map((patient) => (
              <li key={patient.id}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    if (blurTimeout.current) clearTimeout(blurTimeout.current)
                    handleSelect(patient)
                  }}
                  className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <span className="font-medium">{patient.name}</span>
                  {patient.owner_name && (
                    <span className="text-xs text-muted-foreground">Dueño: {patient.owner_name}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedPatient && (
        <div className="flex flex-wrap items-center gap-2">
          {ACTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={action === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAction(option.value)}
            >
              {option.label}
            </Button>
          ))}
          <Button type="button" size="sm" variant="ghost" className="ml-auto" onClick={handleGo}>
            Ir →
          </Button>
        </div>
      )}
    </div>
  )
}
