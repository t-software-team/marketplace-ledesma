import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Se agotó la cuota gratuita de Vercel Image Optimization (5,000
    // transformaciones/mes), lo que rompía imágenes en producción con 402.
    // unoptimized desactiva el resize/conversión del lado de Vercel y sirve
    // el archivo original; <Image> sigue dando lazy loading, fill, sizes.
    unoptimized: true,
    // Fewer, coarser width buckets than the Next.js defaults. The app's
    // avatar/logo/thumbnail images (product-card, shop headers, feed, etc.)
    // are requested at many close-but-different declared sizes (32-200px);
    // a sparse imageSizes list makes more of them collapse onto the same
    // generated width, cutting Vercel Image Optimization transformations
    // for the same source image reused across pages. Values chosen to
    // cover the actual sizes= usages in src/components and src/app.
    imageSizes: [40, 64, 96, 128, 256],
    deviceSizes: [640, 828, 1200, 1920],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
    ],
  },
}

export default nextConfig
