import { useMemo, useState } from 'react'

export function useRowSelection<T extends string>(visibleIds: T[]) {
  const [selected, setSelected] = useState<Set<T>>(new Set())

  const isAllSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id))
  const isSomeSelected = selected.size > 0

  function toggle(id: T) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected((current) => {
      if (visibleIds.every((id) => current.has(id))) {
        const next = new Set(current)
        visibleIds.forEach((id) => next.delete(id))
        return next
      }
      const next = new Set(current)
      visibleIds.forEach((id) => next.add(id))
      return next
    })
  }

  function clear() {
    setSelected(new Set())
  }

  const selectedIds = useMemo(() => Array.from(selected), [selected])

  return { selected, selectedIds, isAllSelected, isSomeSelected, toggle, toggleAll, clear }
}
