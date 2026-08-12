'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import {
  startSubscriptionCheckout,
  startMercadoPagoCheckout,
  type ActionState,
} from '@/lib/shops/actions'

interface SubscribeButtonProps {
  planId: string
  label: string
  provider?: 'galiopay' | 'mercadopago'
  variant?: 'default' | 'outline'
}

const initialState: ActionState = { error: null }

const PROVIDER_LABELS: Record<'galiopay' | 'mercadopago', string> = {
  galiopay: 'Conectando con GalioPay...',
  mercadopago: 'Conectando con Mercado Pago...',
}

export function SubscribeButton({
  planId,
  label,
  provider = 'galiopay',
  variant = 'default',
}: SubscribeButtonProps) {
  const boundAction = provider === 'mercadopago' ? startMercadoPagoCheckout : startSubscriptionCheckout
  const action = boundAction.bind(null, planId)
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
      <Button type="submit" variant={variant} className="w-full" disabled={isPending}>
        {isPending ? PROVIDER_LABELS[provider] : label}
      </Button>
      {state.error && <p className="mt-2 text-xs text-destructive">{state.error}</p>}
    </form>
  )
}
