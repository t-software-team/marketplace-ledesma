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