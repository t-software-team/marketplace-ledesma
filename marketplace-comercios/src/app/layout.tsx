import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { IBM_Plex_Mono, Inter, Sora } from 'next/font/google'
import { QueryProvider } from '@/components/providers/query-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Toaster } from '@/components/ui/toast'
import { AuthListener } from '@/components/shared/auth-listener'
import { ScrollToTopOnNavigate } from '@/components/shared/scroll-to-top-on-navigate'
import { getBaseUrl } from '@/lib/site-url'
import { THEME_INIT_SCRIPT } from '@/lib/theme-init-script'

import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const sora = Sora({
  variable: '--font-sora',
  subsets: ['latin'],
  weight: ['600'],
})

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex-mono',
  subsets: ['latin'],
  weight: ['400'],
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: 'Proxi Marketplace',
    template: '%s | Proxi Marketplace',
  },
  description: 'Comercios locales de tu barrio',
  openGraph: {
    type: 'website',
    siteName: 'Proxi Marketplace',
    locale: 'es_AR',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Proxi Marketplace',
  },
}

export const viewport: Viewport = {
  themeColor: '#7c3aed',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${sora.variable} ${ibmPlexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
        <ThemeProvider>
          <Toaster>
            <ScrollToTopOnNavigate />
            <AuthListener />
            <QueryProvider>{children}</QueryProvider>
          </Toaster>
        </ThemeProvider>
      </body>
    </html>
  )
}
