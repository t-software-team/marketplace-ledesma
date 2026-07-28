import type { Metadata } from 'next'
import { IBM_Plex_Mono, Inter, Sora } from 'next/font/google'
import { QueryProvider } from '@/components/providers/query-provider'
import { Toaster } from '@/components/ui/toast'
import { AuthListener } from '@/components/shared/auth-listener'
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
  title: 'Todo Marketplace',
  description: 'Comercios locales de tu barrio',
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
    >
      <body className="flex min-h-screen flex-col">
        <Toaster>
          <AuthListener />
          <QueryProvider>{children}</QueryProvider>
        </Toaster>
      </body>
    </html>
  )
}
