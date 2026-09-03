'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/shared/status-badge'
import type { getSubscriptionPlans } from '@/lib/admin/queries'
import { PlanRowActions } from './plan-row-actions'

type Plan = Awaited<ReturnType<typeof getSubscriptionPlans>>[number]

type RubroGroup = {
  key: string
  label: string
  categoryId: string | null
  plans: Plan[]
}

function formatMoney(price: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(price)
}

const APPLIES_TO_LABEL: Record<string, string> = {
  all: 'Todos',
  product: 'Productos',
  service: 'Servicios',
}

export function PlansTable({ plans }: { plans: Plan[] }) {
  const [search, setSearch] = useState('')

  const groups = useMemo<RubroGroup[]>(() => {
    const query = search.trim().toLowerCase()
    const filtered = query ? plans.filter((p) => p.name.toLowerCase().includes(query)) : plans

    const byRubro = new Map<string, RubroGroup>()
    for (const plan of filtered) {
      const key = plan.category_id ?? 'general'
      if (!byRubro.has(key)) {
        byRubro.set(key, {
          key,
          label: plan.category_id ? (plan.category_name ?? 'Rubro') : 'Comercios (general)',
          categoryId: plan.category_id ?? null,
          plans: [],
        })
      }
      byRubro.get(key)!.plans.push(plan)
    }

    // "Comercios (general)" first, then category rubros alphabetically.
    return [...byRubro.values()].sort((a, b) => {
      if (a.categoryId === null) return -1
      if (b.categoryId === null) return 1
      return a.label.localeCompare(b.label, 'es')
    })
  }, [plans, search])

  return (
    <div className="space-y-6">
      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar por nombre..."
        aria-label="Buscar planes"
        className="max-w-sm"
      />

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay planes que coincidan.</p>
      ) : (
        groups.map((group) => (
          <section key={group.key} className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">
                {group.label}
                <span className="ml-2 font-normal text-muted-foreground">({group.plans.length})</span>
              </h2>
              {group.categoryId && (
                <Link
                  href={`/admin/planes/nueva?rubro=${group.categoryId}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  + Nuevo plan
                </Link>
              )}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Aplica a</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell className="font-mono">{formatMoney(plan.price)}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {plan.duration_days} días
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {group.categoryId ? '—' : (APPLIES_TO_LABEL[plan.applies_to] ?? plan.applies_to)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={plan.is_active ? 'active' : 'none'}
                        label={plan.is_active ? 'Activo' : 'Inactivo'}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <PlanRowActions planId={plan.id} planName={plan.name} isActive={plan.is_active} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        ))
      )}
    </div>
  )
}
