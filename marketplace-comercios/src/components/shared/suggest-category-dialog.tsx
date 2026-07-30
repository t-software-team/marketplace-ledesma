'use client'

import { useActionState, useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { suggestCategory, type ActionState } from '@/lib/shops/actions'

interface SuggestCategoryDialogProps {
  parentId: string | null
  existingNames: string[]
  noun?: string
}

const initialState: ActionState = { error: null }

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export function SuggestCategoryDialog({
  parentId,
  existingNames,
  noun = 'subcategoría',
}: SuggestCategoryDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [errorShownForName, setErrorShownForName] = useState<string | null>(null)
  const suggestAction = suggestCategory
  const [state, formAction, isPending] = useActionState(suggestAction, initialState)

  const [prevState, setPrevState] = useState(state)
  if (state !== prevState) {
    setPrevState(state)
    if (state.error === null && state.warning) {
      setOpen(false)
      setName('')
      setErrorShownForName(null)
    } else if (state.error) {
      setErrorShownForName(name)
    }
  }

  useEffect(() => {
    if (state.error === null && state.warning) {
      toast.add({ title: state.warning, type: 'success' })
    }
  }, [state])

  // The error stays tied to the name that produced it — as soon as the user
  // edits the text, it no longer applies and shouldn't linger on screen.
  const visibleError = errorShownForName === name ? state.error : null

  const matches = useMemo(() => {
    const normalized = normalize(name)
    if (normalized.length < 2) return []
    return existingNames.filter((existing) => normalize(existing).includes(normalized)).slice(0, 5)
  }, [name, existingNames])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button type="button" variant="outline" size="sm" className="gap-1.5" />}
        nativeButton={true}
      >
        <Plus className="size-3.5" aria-hidden />
        Sugerir {noun}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Sugerir {noun}</DialogTitle>
          <DialogDescription>
            La va a revisar el equipo de Todo Marketplace antes de estar disponible.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="parent_id" value={parentId ?? ''} />
          <Input
            name="name"
            placeholder={`Ej: ${noun === 'rubro' ? 'Lavadero' : 'Sushi'}`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            autoComplete="off"
          />

          {matches.length > 0 && (
            <div className="rounded-lg border border-warning bg-warning/20 p-2.5 text-xs text-warning-foreground">
              <p className="font-medium">¿Ya existe algo parecido?</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {matches.map((match) => (
                  <li key={match}>{match}</li>
                ))}
              </ul>
            </div>
          )}

          {visibleError && <p className="text-sm text-destructive">{visibleError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Enviando...' : 'Enviar sugerencia'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
