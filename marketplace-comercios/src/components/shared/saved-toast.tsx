'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from '@/components/ui/toast'

const MESSAGES: Record<string, string> = {
  created: 'Creado con éxito',
  updated: 'Actualizado con éxito',
}

export function SavedToast({ paramName = 'saved' }: { paramName?: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const value = searchParams.get(paramName)

  useEffect(() => {
    if (!value) return

    toast.add({ title: MESSAGES[value] ?? 'Cambios guardados', type: 'success' })

    const params = new URLSearchParams(searchParams.toString())
    params.delete(paramName)
    const query = params.toString()
    router.replace(query ? `?${query}` : window.location.pathname, { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return null
}
