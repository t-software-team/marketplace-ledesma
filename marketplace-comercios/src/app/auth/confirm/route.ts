import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

// token_hash + verifyOtp en vez de exchangeCodeForSession: el flujo PKCE de
// /auth/callback depende de una cookie (code_verifier) guardada en el
// navegador que inició el registro/reset — si el usuario abre el link del
// mail en OTRO dispositivo o navegador (muy común: se registra en la compu,
// confirma desde el mail del celular), el intercambio falla siempre con
// "No pudimos confirmar tu sesión". verifyOtp con token_hash no depende de
// ninguna cookie previa, funciona en cualquier dispositivo.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const rawNext = searchParams.get('next') ?? '/'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/'

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        if (!profile?.role) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }

        if (next === '/') {
          const roleDestination =
            profile.role === 'shop_admin'
              ? '/mi-tienda'
              : profile.role === 'superadmin'
                ? '/admin/dashboard'
                : '/'
          return NextResponse.redirect(`${origin}${roleDestination}`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
