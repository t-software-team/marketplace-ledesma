import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/admin', '/mi-tienda', '/favoritos'] as const
const AUTH_PAGES = ['/login', '/registro'] as const

function isProtectedPath(path: string) {
  return PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix))
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  if (user && AUTH_PAGES.includes(path as (typeof AUTH_PAGES)[number])) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (path === '/onboarding') {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role) {
      const destination =
        profile.role === 'shop_admin'
          ? '/mi-tienda'
          : profile.role === 'superadmin'
            ? '/admin/shops'
            : '/'
      return NextResponse.redirect(new URL(destination, request.url))
    }

    return supabaseResponse
  }

  if (!isProtectedPath(path)) {
    return supabaseResponse
  }

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile?.role) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  if (path.startsWith('/admin') && profile.role !== 'superadmin') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (
    path.startsWith('/mi-tienda') &&
    profile.role !== 'shop_admin' &&
    profile.role !== 'superadmin'
  ) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (path.startsWith('/favoritos') && profile.role !== 'client') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}
