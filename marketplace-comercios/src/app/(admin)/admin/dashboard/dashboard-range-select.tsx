'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const RANGE_OPTIONS = [
  { value: '7', label: 'Últimos 7 días' },
  { value: '30', label: 'Últimos 30 días' },
  { value: '90', label: 'Últimos 90 días' },
] as const

export function DashboardRangeSelect({ defaultRange }: { defaultRange: number }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleChange(value: string | null) {
    if (!value) return
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', value)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <Select<string>
      defaultValue={String(defaultRange)}
      onValueChange={(value) => handleChange(value)}
    >
      <SelectTrigger size="sm" aria-label="Rango de fechas">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {RANGE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
