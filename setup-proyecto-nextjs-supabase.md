# Setup del proyecto — Next.js + Supabase + Zustand

## 1. Creación del proyecto

```bash
npx create-next-app@latest marketplace-comercios \
  --typescript --tailwind --app --src-dir --import-alias "@/*"

cd marketplace-comercios

npx shadcn@latest init
npx shadcn@latest add button card input select badge dialog tabs avatar textarea dropdown-menu sheet skeleton toast

npm install @supabase/supabase-js @supabase/ssr
npm install zustand @tanstack/react-query
npm install react-hook-form zod @hookform/resolvers
npm install qrcode.react
npm install lucide-react
```

---

## 2. Estructura de carpetas

```
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                 # feed público (Server Component)
│   │   ├── tienda/[slug]/page.tsx   # perfil público de shop
│   │   └── producto/[id]/page.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── registro/page.tsx
│   │   └── onboarding/page.tsx      # elegir cliente / shop
│   ├── (dashboard)/
│   │   ├── mi-tienda/
│   │   │   ├── page.tsx             # overview + estado subscripción
│   │   │   ├── productos/page.tsx
│   │   │   └── configuracion/page.tsx
│   │   └── favoritos/page.tsx       # dashboard del cliente
│   ├── (admin)/
│   │   └── admin/
│   │       ├── shops/page.tsx       # aprobar verificación
│   │       ├── categorias/page.tsx
│   │       └── subscripciones/page.tsx
│   ├── layout.tsx
│   └── globals.css                  # tokens de color pastel acá
│
├── components/
│   ├── ui/                          # shadcn (autogenerado, no tocar a mano)
│   ├── shared/
│   │   ├── verified-stamp.tsx
│   │   ├── featured-ribbon.tsx
│   │   ├── whatsapp-button.tsx
│   │   ├── product-card.tsx
│   │   ├── shop-card.tsx
│   │   └── category-filter.tsx
│   ├── feed/
│   ├── dashboard/
│   └── admin/
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # cliente para Client Components
│   │   ├── server.ts                # cliente para Server Components/Actions
│   │   └── middleware.ts
│   ├── validations/                 # schemas zod (shop, producto, etc.)
│   └── utils.ts
│
├── stores/                          # Zustand — SOLO estado de UI
│   ├── use-filters-store.ts         # categoría/búsqueda/ubicación seleccionada
│   └── use-onboarding-store.ts      # pasos del wizard "crear tienda"
│
├── hooks/                           # React Query — estado de servidor
│   ├── use-products.ts
│   ├── use-shops.ts
│   └── use-subscriptions.ts
│
├── types/
│   └── database.types.ts            # generado con supabase-cli
│
└── middleware.ts                    # protección de rutas por rol
```

---

## 3. Clientes de Supabase

```ts
// lib/supabase/client.ts — para Client Components
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```ts
// lib/supabase/server.ts — para Server Components y Server Actions
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

Generar los tipos de la base automáticamente (evita desincronización entre schema SQL y TypeScript):

```bash
npx supabase gen types typescript --project-id TU_PROJECT_ID > src/types/database.types.ts
```

---

## 4. Middleware — protección de rutas por rol

```ts
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createServerClient(/* ...igual que server.ts... */)

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  if (path.startsWith('/admin') || path.startsWith('/mi-tienda') || path.startsWith('/favoritos')) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (path.startsWith('/admin') && profile?.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    if (!profile?.role) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/mi-tienda/:path*', '/favoritos/:path*'],
}
```

---

## 5. Store de Zustand — solo estado de UI

```ts
// stores/use-filters-store.ts
import { create } from 'zustand'

interface FiltersState {
  categoryId: string | null
  searchQuery: string
  userLocation: { lat: number; lng: number } | null
  setCategory: (id: string | null) => void
  setSearch: (q: string) => void
  setLocation: (loc: { lat: number; lng: number } | null) => void
}

export const useFiltersStore = create<FiltersState>((set) => ({
  categoryId: null,
  searchQuery: '',
  userLocation: null,
  setCategory: (id) => set({ categoryId: id }),
  setSearch: (q) => set({ searchQuery: q }),
  setLocation: (loc) => set({ userLocation: loc }),
}))
```

---

## 6. React Query — estado de servidor

```ts
// hooks/use-products.ts
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useFiltersStore } from '@/stores/use-filters-store'

export function useProductsFeed() {
  const { categoryId, searchQuery, userLocation } = useFiltersStore()
  const supabase = createClient()

  return useQuery({
    queryKey: ['products-feed', categoryId, searchQuery, userLocation],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_products_feed', {
        user_lat: userLocation?.lat ?? null,
        user_lng: userLocation?.lng ?? null,
        p_category_id: categoryId,
        p_search: searchQuery || null,
      })
      if (error) throw error
      return data
    },
  })
}
```

---

## 7. Variables de entorno

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://tuproyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key   # solo server-side, nunca NEXT_PUBLIC_
```

---

## 8. Orden sugerido de implementación

1. Crear proyecto Supabase, correr el SQL completo (tablas, RLS, función `get_products_feed`).
2. Generar `database.types.ts`.
3. Auth: login/registro + trigger `handle_new_user` + pantalla de onboarding (rol null → elegir).
4. Feed público (Server Component) consumiendo `get_products_feed`.
5. Perfil público de shop + botón WhatsApp + mapa + QR.
6. Dashboard shop admin: crear shop, cargar productos e imágenes a Storage.
7. Panel superadmin: categorías, aprobar verificación, aprobar subscripciones.
8. Favoritos del cliente.

Este orden prioriza tener algo navegable y demostrable (feed + perfil de shop) antes de construir los paneles de administración.
