'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'

export function SociosSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get('q') ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    setValue(searchParams.get('q') ?? '')
  }, [searchParams])

  function handleChange(next: string) {
    setValue(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams)
      if (next.trim()) {
        params.set('q', next.trim())
      } else {
        params.delete('q')
      }
      const query = params.toString()
      router.push(`/mi-tienda/socios${query ? `?${query}` : ''}`)
    }, 300)
  }

  return (
    <Input
      value={value}
      onChange={(event) => handleChange(event.target.value)}
      placeholder="Buscar por nombre o documento..."
      aria-label="Buscar socios"
      className="max-w-sm"
    />
  )
}
