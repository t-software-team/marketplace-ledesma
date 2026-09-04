'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export interface QuickLogPatient {
  id: string
  name: string
  species: string | null
  owner_name: string | null
}

const ACTIONS = [
  { value: 'tratamiento', label: 'Registrar tratamiento' },
  { value: 'recordatorio', label: 'Crear recordatorio' },
  { value: 'nota', label: 'Agregar nota' },
] as const

type ActionValue = (typeof ACTIONS)[number]['value']

// Shortcut para no tener que entrar a la ficha del paciente: buscás por
// nombre (filtro client-side sobre la lista ya cargada, mismo criterio que
// el resto del dashboard vet dado que la cantidad de pacientes por comercio
// es chica), elegís qué querés cargar, y navegamos a la ficha con el query
// param que ya abre el diálogo correspondiente (?tratamiento=nuevo,
// ?recordatorio=nuevo, ?nota=nueva).
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

  function handleQueryChange(value: string) {
    setQuery(value)
    setSelectedPatient(null)
  }

  function handleGo() {
    if (!selectedPatient) return
    const param = action === 'nota' ? 'nota=nueva' : `${action}=nuevo`
    router.push(`/mi-tienda/pacientes/${selectedPatient.id}?${param}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar algo para un paciente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              blurTimeout.current = setTimeout(() => setShowSuggestions(false), 150)
            }}
            placeholder="1. Buscá el paciente por nombre..."
            className="pl-9"
          />
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

        <p className="text-xs font-medium text-muted-foreground">2. Elegí qué querés registrar</p>
        <div className="flex flex-wrap gap-2">
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
        </div>

        <Button type="button" className="w-full" disabled={!selectedPatient} onClick={handleGo}>
          {selectedPatient
            ? `${ACTIONS.find((option) => option.value === action)?.label} para ${selectedPatient.name}`
            : 'Elegí un paciente primero'}
        </Button>
      </CardContent>
    </Card>
  )
}
