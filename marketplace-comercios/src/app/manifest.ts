import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Todo Marketplace',
    short_name: 'Marketplace',
    description: 'Comercios locales de tu barrio',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf8fc',
    theme_color: '#7c3aed',
    orientation: 'portrait',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
      },
    ],
  }
}
