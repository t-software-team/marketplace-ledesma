'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Store, LayoutDashboard, Tag, CreditCard, Flag, Clock3 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { searchShopsByName } from '@/lib/admin/actions/shops'

export const COMMAND_PALETTE_OPEN_EVENT = 'admin-command-palette:open'

interface StaticTarget {
  id: string
  label: string
  href: string
  icon: typeof LayoutDashboard
}

const STATIC_TARGETS: StaticTarget[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { id: 'shops', label: 'Comercios', href: '/admin/shops', icon: Store },
  { id: 'categorias', label: 'Categorías', href: '/admin/categorias', icon: Tag },
  { id: 'subscripciones', label: 'Suscripciones', href: '/admin/subscripciones', icon: CreditCard },
  { id: 'reportes', label: 'Reportes', href: '/admin/reportes', icon: Flag },
  { id: 'auditoria', label: 'Auditoría', href: '/admin/auditoria', icon: Clock3 },
]

interface ShopResult {
  id: string
  name: string
}

interface ResultItem {
  key: string
  label: string
  href: string
  icon: typeof LayoutDashboard
}

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [shopResults, setShopResults] = useState<ShopResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef(0)

  const closePalette = useCallback(() => {
    setOpen(false)
    setQuery('')
    setShopResults([])
    setSelectedIndex(0)
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    function handleOpenEvent() {
      setOpen(true)
    }

    window.addEventListener(COMMAND_PALETTE_OPEN_EVENT, handleOpenEvent)
    return () => window.removeEventListener(COMMAND_PALETTE_OPEN_EVENT, handleOpenEvent)
  }, [])

  const trimmedQuery = query.trim()

  useEffect(() => {
    if (!open || trimmedQuery.length < 2) return

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      const requestId = ++requestIdRef.current
      setIsSearching(true)

      searchShopsByName(trimmedQuery)
        .then((results) => {
          if (requestIdRef.current !== requestId) return
          setShopResults(results)
        })
        .catch((error) => {
          console.error('CommandPalette: fallo al buscar comercios', { query: trimmedQuery, error })
        })
        .finally(() => {
          if (requestIdRef.current !== requestId) return
          setIsSearching(false)
        })
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [trimmedQuery, open])

  const searching = isSearching && trimmedQuery.length >= 2

  const filteredStaticTargets = useMemo(() => {
    const trimmed = trimmedQuery.toLowerCase()
    if (!trimmed) return STATIC_TARGETS
    return STATIC_TARGETS.filter((target) => target.label.toLowerCase().includes(trimmed))
  }, [trimmedQuery])

  const results: ResultItem[] = useMemo(() => {
    const staticItems: ResultItem[] = filteredStaticTargets.map((target) => ({
      key: `section-${target.id}`,
      label: target.label,
      href: target.href,
      icon: target.icon,
    }))

    const shopItems: ResultItem[] =
      trimmedQuery.length >= 2
        ? shopResults.map((shop) => ({
            key: `shop-${shop.id}`,
            label: shop.name,
            href: `/admin/shops/${shop.id}`,
            icon: Store,
          }))
        : []

    return [...staticItems, ...shopItems]
  }, [filteredStaticTargets, shopResults, trimmedQuery])

  // Reinicia la selección cuando cambia la lista de resultados, directo en
  // el body del render (patrón documentado de React) en vez de un efecto.
  const [selectionResetKey, setSelectionResetKey] = useState<string>('')
  const currentResetKey = `${results.length}:${trimmedQuery}`
  if (currentResetKey !== selectionResetKey) {
    setSelectionResetKey(currentResetKey)
    setSelectedIndex(0)
  }

  const handleSelect = useCallback(
    (item: ResultItem) => {
      router.push(item.href)
      closePalette()
    },
    [router, closePalette]
  )

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelectedIndex((current) => (results.length === 0 ? 0 : (current + 1) % results.length))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelectedIndex((current) =>
        results.length === 0 ? 0 : (current - 1 + results.length) % results.length
      )
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const selected = results[selectedIndex]
      if (selected) handleSelect(selected)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      closePalette()
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          closePalette()
        } else {
          setOpen(true)
        }
      }}
    >
      <DialogContent className="max-w-lg gap-3 p-0 sm:max-w-lg" showCloseButton={false}>
        <DialogHeader className="sr-only">
          <DialogTitle>Paleta de comandos</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b px-3 py-2.5">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar comercios o ir a una sección..."
            className="h-8 border-none px-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="max-h-80 overflow-y-auto px-2 pb-2">
          {results.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              {searching ? 'Buscando...' : 'Sin resultados'}
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {results.map((item, index) => {
                const Icon = item.icon
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                        index === selectedIndex
                          ? 'bg-accent text-accent-foreground'
                          : 'text-foreground hover:bg-accent/50'
                      }`}
                    >
                      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
          {searching && shopResults.length === 0 && (
            <p className="px-2 pt-1 text-xs text-muted-foreground">Buscando comercios...</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
