'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { startSubscriptionCheckout, type ActionState } from '@/lib/shops/actions'

interface SubscribeButtonProps {
  planId: string
  label: string
}

const initialState: ActionState = { error: null }

export function SubscribeButton({ planId, label }: SubscribeButtonProps) {
  const action = startSubscriptionCheckout.bind(null, planId)
  const [state, formAction, isPending] = useActionState(action, initialState)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (state.error) {
      toast.add({ title: 'No pudimos iniciar el pago', description: state.error, type: 'error' })
    }
  }, [state])

  return (
    <form action={formAction}>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Conectando con GalioPay...' : label}
      </Button>
      {state.error && <p className="mt-2 text-xs text-destructive">{state.error}</p>}
    </form>
  )
}
