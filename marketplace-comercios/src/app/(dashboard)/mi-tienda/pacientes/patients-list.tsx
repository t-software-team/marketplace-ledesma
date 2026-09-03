'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { PawPrint, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { WhatsAppButton } from '@/components/shared/whatsapp-button'
import type { ShopReminderAlerts } from '@/lib/patients/alerts'
import {
  deriveSpeciesOptions,
  derivePatientAlertBadge,
  filterPatients,
  type PatientStatusFilter,
} from '@/lib/patients/list-filters'
import type { PatientRow } from '@/lib/patients/queries'
import { PatientRowActions } from './patient-row-actions'

const ALL_SPECIES_VALUE = 'todas'

const STATUS_FILTER_OPTIONS: { value: PatientStatusFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'vencido', label: 'Vencido' },
  { value: 'proximo', label: 'Próximo' },
  { value: 'al_dia', label: 'Al día' },
]

function PatientAlertBadge({ alerts }: { alerts: ShopReminderAlerts | undefined }) {
  const badge = derivePatientAlertBadge(alerts)
  if (!badge) return null
  return <Badge variant={badge.variant}>{badge.label}</Badge>
}

function formatOwner(patient: PatientRow) {
  return [patient.owner_name, patient.owner_phone].filter(Boolean).join(' · ') || '—'
}

function OwnerWhatsAppButton({ patient }: { patient: PatientRow }) {
  if (!patient.owner_phone) return null
  return (
    <WhatsAppButton
      phoneNumber={patient.owner_phone}
      message={`Hola ${patient.owner_name ?? ''}, te contactamos por ${patient.name}`}
      iconOnly
      variant="outline"
    />
  )
}

function PatientAvatar({ patient, size = 36 }: { patient: PatientRow; size?: number }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full bg-muted"
      style={{ width: size, height: size }}
    >
      {patient.photo_url ? (
        <Image
          src={patient.photo_url}
          alt={patient.name}
          fill
          className="object-cover"
          sizes={`${size}px`}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <PawPrint className="size-4" aria-hidden />
        </div>
      )}
    </div>
  )
}

export function PatientsList({
  patients,
  search,
  alertsMap,
}: {
  patients: PatientRow[]
  search?: string
  alertsMap: Record<string, ShopReminderAlerts>
}) {
  const router = useRouter()
  const [query, setQuery] = useState(search ?? '')
  const [, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [statusFilter, setStatusFilter] = useState<PatientStatusFilter>('todos')
  const [speciesFilter, setSpeciesFilter] = useState<string | null>(null)

  const speciesOptions = useMemo(() => deriveSpeciesOptions(patients), [patients])

  const filteredPatients = useMemo(
    () => filterPatients(patients, alertsMap, { statusFilter, speciesFilter }),
    [patients, alertsMap, statusFilter, speciesFilter]
  )

  function handleSearchChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams()
      if (value.trim()) params.set('q', value.trim())
      startTransition(() => {
        router.push(
          params.size > 0 ? `/mi-tienda/pacientes?${params.toString()}` : '/mi-tienda/pacientes'
        )
      })
    }, 400)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por paciente o dueño..."
          value={query}
          onChange={(event) => handleSearchChange(event.target.value)}
          className="pl-9"
          aria-label="Buscar paciente"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as PatientStatusFilter)}
        >
          <SelectTrigger aria-label="Filtrar por estado" className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={speciesFilter ?? ALL_SPECIES_VALUE}
          onValueChange={(value) => setSpeciesFilter(value === ALL_SPECIES_VALUE ? null : value)}
        >
          <SelectTrigger aria-label="Filtrar por especie" className="w-40">
            <SelectValue placeholder="Especie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SPECIES_VALUE}>Todas las especies</SelectItem>
            {speciesOptions.map((species) => (
              <SelectItem key={species} value={species}>
                {species}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredPatients.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {patients.length === 0
            ? `No encontramos pacientes que coincidan con "${query}".`
            : 'Ningún paciente coincide con los filtros seleccionados.'}
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:hidden">
            {filteredPatients.map((patient) => (
              <Card key={patient.id}>
                <CardContent className="flex items-center justify-between gap-2 p-3">
                  <Link
                    href={`/mi-tienda/pacientes/${patient.id}`}
                    className="flex min-w-0 flex-1 items-center gap-2.5"
                  >
                    <PatientAvatar patient={patient} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-medium">{patient.name}</p>
                        <PatientAlertBadge alerts={alertsMap[patient.id]} />
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {[patient.species, patient.breed].filter(Boolean).join(' · ') || 'Sin especie'}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{formatOwner(patient)}</p>
                    </div>
                  </Link>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <OwnerWhatsAppButton patient={patient} />
                    <PatientRowActions patientId={patient.id} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Especie / raza</TableHead>
                  <TableHead>Dueño</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/mi-tienda/pacientes/${patient.id}`}
                        className="flex items-center gap-2.5 hover:underline"
                      >
                        <PatientAvatar patient={patient} />
                        {patient.name}
                        <PatientAlertBadge alerts={alertsMap[patient.id]} />
                      </Link>
                    </TableCell>
                    <TableCell>
                      {[patient.species, patient.breed].filter(Boolean).join(' · ') || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {formatOwner(patient)}
                        <OwnerWhatsAppButton patient={patient} />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <PatientRowActions patientId={patient.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
