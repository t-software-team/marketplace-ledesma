'use client'

import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ContactRow {
  id: string
  created_at: string
  shops: { id: string; name: string } | null
  products: { id: string; name: string } | null
}

interface LiveContactsFeedProps {
  initialContacts: ContactRow[]
}

function formatTime(dateString: string) {
  return new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(dateString)
  )
}

export function LiveContactsFeed({ initialContacts }: LiveContactsFeedProps) {
  const [contacts, setContacts] = useState(initialContacts)
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('admin-dashboard-contacts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'shop_contacts' },
        async (payload) => {
          const { data: shop } = await supabase
            .from('shops')
            .select('id, name')
            .eq('id', payload.new.shop_id as string)
            .maybeSingle()

          const productId = payload.new.product_id as string | null
          const { data: product } = productId
            ? await supabase.from('products').select('id, name').eq('id', productId).maybeSingle()
            : { data: null }

          setContacts((current) =>
            [
              {
                id: payload.new.id as string,
                created_at: payload.new.created_at as string,
                shops: shop,
                products: product,
              },
              ...current,
            ].slice(0, 15)
          )
        }
      )
      .subscribe((status) => setIsLive(status === 'SUBSCRIBED'))

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span
          className={`size-2 rounded-full ${isLive ? 'bg-success' : 'bg-muted-foreground'}`}
          aria-hidden
        />
        <span className="text-xs text-muted-foreground">
          {isLive ? 'En vivo' : 'Conectando...'}
        </span>
      </div>

      {contacts.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Todavía no hay contactos por WhatsApp registrados.
        </p>
      ) : (
        <ul className="space-y-2">
          {contacts.map((contact) => (
            <li
              key={contact.id}
              className="flex items-start gap-2.5 rounded-lg border border-border bg-surface p-2.5 text-sm animate-in fade-in-0 slide-in-from-top-1"
            >
              <MessageCircle className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate">
                  <strong>{contact.shops?.name ?? 'Comercio eliminado'}</strong>
                  {contact.products?.name && (
                    <span className="text-muted-foreground"> · {contact.products.name}</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{formatTime(contact.created_at)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
