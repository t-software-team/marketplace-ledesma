import type { MetadataRoute } from 'next'
import { getBaseUrl } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl()

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/auth/', '/login', '/registro', '/onboarding', '/olvide-password', '/actualizar-password', '/admin/', '/siguiendo', '/perfil', '/favoritos', '/contactos', '/mi-tienda'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
