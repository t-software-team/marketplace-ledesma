'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { PawPrint, Search } from 'lucide-react'
import { useEffect, useRef, useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { PatientRow } from '@/lib/patients/queries'
import { PatientRowActions } from './patient-row-actions'

function formatOwner(patient: PatientRow) {
  return [patient.owner_name, patient.owner_phone].filter(Boolean).join(' · ') || '—'
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

export function PatientsList({ patients, search }: { patients: PatientRow[]; search?: string }) {
  const router = useRouter()
  const [query, setQuery] = useState(search ?? '')
  const [, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

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

      {patients.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No encontramos pacientes que coincidan con &quot;{query}&quot;.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:hidden">
            {patients.map((patient) => (
              <Card key={patient.id}>
                <CardContent className="flex items-center justify-between gap-2 p-3">
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <PatientAvatar patient={patient} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{patient.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[patient.species, patient.breed].filter(Boolean).join(' · ') || 'Sin especie'}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{formatOwner(patient)}</p>
                    </div>
                  </div>
                  <PatientRowActions patientId={patient.id} />
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
                {patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2.5">
                        <PatientAvatar patient={patient} />
                        {patient.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {[patient.species, patient.breed].filter(Boolean).join(' · ') || '—'}
                    </TableCell>
                    <TableCell>{formatOwner(patient)}</TableCell>
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
