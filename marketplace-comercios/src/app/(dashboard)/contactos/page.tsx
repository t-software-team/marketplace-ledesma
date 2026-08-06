import Image from 'next/image'
import Link from 'next/link'
import { Store } from 'lucide-react'
import { BackLink } from '@/components/shared/back-link'
import { EmptyState } from '@/components/shared/empty-state'
import { getMyContactHistory } from '@/lib/shops/queries'

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(dateString)
  )
}

export default async function ContactsPage() {
  const contacts = await getMyContactHistory()

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      <BackLink href="/" />
      <h1 className="text-2xl font-heading">Mis contactos</h1>
      <p className="text-sm text-muted-foreground">
        Comercios a los que le escribiste por WhatsApp desde el marketplace
      </p>

      {contacts.length === 0 ? (
        <EmptyState message="Todavía no contactaste a ningún comercio por WhatsApp." />
      ) : (
        <div className="divide-y divide-border">
          {contacts.map((contact) => (
            <Link
              key={contact.id}
              href={`/tienda/${contact.shops!.slug}`}
              className="flex items-center gap-3 py-3 transition-colors first:pt-0 last:pb-0 hover:opacity-70"
            >
              <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-muted">
                {contact.shops!.logo_url ? (
                  <Image
                    src={contact.shops!.logo_url}
                    alt={contact.shops!.name}
                    fill
                    className="object-cover"
                    sizes="44px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <Store className="size-4" aria-hidden />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{contact.shops!.name}</p>
                {contact.products?.name && (
                  <p className="truncate text-xs text-muted-foreground">{contact.products.name}</p>
                )}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDate(contact.created_at)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
