import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Briefcase, Check, MessageCircle, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GalleryCarousel } from '@/components/shop/landing/apple-cards-carousel'
import { LandingFaqSection } from '@/components/shop/landing/landing-faq-section'
import { FadeIn } from '@/components/shop/landing/landing-fade-in'
import { LandingSiteHeader } from '@/components/shop/landing/landing-site-header'
import { ImageWithSkeleton } from '@/components/shop/landing/landing-image-skeleton'
import { SocialCount } from '@/components/shop/landing/landing-social-count'
import { BackToTop } from '@/components/shop/landing/landing-back-to-top'

export const metadata: Metadata = {
  title: 'Sumá tu negocio a Proxi',
  description:
    'Proxi es la vidriera digital de los comercios de barrio: gente cerca tuyo te encuentra, te elige y te escribe directo por WhatsApp. Sin comisión por venta.',
}

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground">
      <LandingSiteHeader />
      <main>
        <Hero />
        <SocialProof />
        <Features />
        <ForWhom />
        <HowItWorks />
        <GymSection />
        <LandingFaqSection />
        <FinalCta />
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  )
}

function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
      <div className="motion-safe:animate-[hero-rise_0.6s_ease-out]">
        <h1 className="text-balance font-heading text-4xl leading-[1.08] text-foreground sm:text-5xl lg:text-6xl">
          Tu vidriera digital, a un mensaje de distancia.
        </h1>
        <p className="mt-5 max-w-lg text-lg text-foreground/70">
          Proxi le muestra tu comercio a la gente que ya está buscando cerca. Vos publicás tu
          catálogo, ellos te escriben directo por WhatsApp — sin comisión por venta, sin
          intermediarios.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            size="lg"
            className="min-h-11"
            render={<Link href="/registro" />}
            nativeButton={false}
          >
            Sumar mi negocio gratis
          </Button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-md text-sm font-medium text-foreground/70 outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Ver el feed de comercios →
          </Link>
        </div>
      </div>

      <div className="relative motion-safe:animate-[hero-rise_0.7s_ease-out_0.1s_backwards]">
        <div
          className="absolute -inset-8 -z-10 rounded-full bg-primary/[0.14] blur-3xl"
          aria-hidden
        />
        <BrowserFrame>
          <ImageWithSkeleton
            src="/landing/feed.webp"
            alt="Feed público de Proxi Marketplace, con comercios cercanos organizados por categoría"
            width={2000}
            height={1852}
            className="w-full"
            sizes="(max-width: 1024px) 100vw, 600px"
            priority
          />
        </BrowserFrame>
      </div>
    </section>
  )
}

function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[0_2px_16px_rgba(0,0,0,0.08)]">
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-2.5">
        <span className="size-2 rounded-full bg-border" aria-hidden />
        <span className="size-2 rounded-full bg-border" aria-hidden />
        <span className="size-2 rounded-full bg-border" aria-hidden />
      </div>
      {children}
    </div>
  )
}

const SOCIAL_PROOF_LOGOS = [
  { src: '/landing/logo-kioto.webp', name: 'Kioto' },
  { src: '/landing/logo-coketas.webp', name: 'Coketas Novedades' },
  { src: '/landing/logo-inefable.webp', name: 'Inefable' },
  { src: '/landing/logo-ikemarkia.webp', name: 'IKEMARKIA' },
  { src: '/landing/logo-m3d.webp', name: 'M3D' },
  { src: '/landing/logo-celeste-shop.webp', name: 'Celeste Shop' },
  { src: '/landing/logo-ele7studio.webp', name: 'ele7studio' },
] as const

function SocialProof() {
  return (
    <section className="border-t border-border">
      <FadeIn className="mx-auto max-w-6xl py-10">
        <SocialCount value={50} label="comercios ya están en Proxi" />
        <div
          className="group mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
        >
          <div className="flex w-max animate-[marquee_28s_linear_infinite] items-center gap-16 group-hover:[animation-play-state:paused] motion-reduce:animate-none">
            {[...SOCIAL_PROOF_LOGOS, ...SOCIAL_PROOF_LOGOS].map((logo, index) => (
              <Image
                key={`${logo.name}-${index}`}
                src={logo.src}
                alt={logo.name}
                width={470}
                height={164}
                className="h-14 w-auto shrink-0 opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0 sm:h-16"
                sizes="180px"
              />
            ))}
          </div>
        </div>
      </FadeIn>
    </section>
  )
}

function Features() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl space-y-20 px-5 py-16 sm:space-y-28 sm:px-8 sm:py-24">
        <FeatureRow
          title="No sos un resultado más en una lista."
          body="Proxi verifica cada comercio antes de mostrarlo. La gente encuentra lo que busca por categoría y cercanía, no un mapa genérico lleno de ruido."
          align="left"
        >
          <div className="w-full max-w-xs space-y-2 rounded-2xl border border-border bg-surface p-3">
            {[
              { src: '/landing/logo-kioto.webp', name: 'Kioto' },
              { src: '/landing/logo-coketas.webp', name: 'Coketas Novedades' },
            ].map((shop) => (
              <Image
                key={shop.name}
                src={shop.src}
                alt={shop.name}
                width={470}
                height={164}
                className="w-full rounded-lg"
                sizes="320px"
              />
            ))}
          </div>
        </FeatureRow>

        <FeatureRow
          title="El contacto es directo, siempre."
          body="Nada de carritos ni checkouts que no existen: cuando alguien se interesa, te escribe por WhatsApp y cerrás vos la venta, como ya lo hacés hoy."
          align="right"
          fullWidth
        >
          <GalleryCarousel
            items={[
              {
                src: '/landing/tienda-kioto.webp',
                title: 'Kioto',
                category: 'Tienda de ropa',
                width: 754,
                height: 1644,
              },
              {
                src: '/landing/tienda-coketas.webp',
                title: 'Coketas Novedades',
                category: 'Accesorios para dama',
                width: 754,
                height: 1644,
              },
              {
                src: '/landing/tienda-m3d.webp',
                title: 'M3D',
                category: 'Diseño e impresión 3D',
                width: 752,
                height: 1644,
              },
            ]}
          />
        </FeatureRow>

        <FeatureRow
          title="Cada producto, con su ficha completa."
          body="Fotos, precio, talles y stock actualizado: la gente ve todo lo que necesita antes de escribirte, y con un toque arranca la conversación por WhatsApp."
          align="left"
        >
          <ProductDetailCard />
        </FeatureRow>

        <FeatureRow
          title="Hablás vos, sin intermediarios."
          body="Sin chatbots ni pasos de más: el mensaje llega directo a tu WhatsApp y cerrás la venta como ya lo hacés hoy."
          align="right"
        >
          <WhatsappChatCard />
        </FeatureRow>

        <FeatureRow
          title="Empezás gratis, mejorás cuando te sirve."
          body="Cargá tu tienda y tus primeros productos sin pagar nada. Si tu negocio crece, subís de plan para tener más catálogo, destacados y estadísticas."
          align="left"
        >
          <div className="w-full max-w-xs rounded-2xl border border-border bg-surface p-5">
            <p className="text-sm text-foreground/60">Tu plan</p>
            <p className="mt-1 font-heading text-2xl text-foreground">Free</p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground/70">Productos cargados</span>
                <span className="font-mono text-foreground">8 / 15</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[53%] rounded-full bg-primary" />
              </div>
            </div>
          </div>
        </FeatureRow>
      </div>
    </section>
  )
}

function FeatureRow({
  title,
  body,
  align,
  fullWidth = false,
  children,
}: {
  title: string
  body: string
  align: 'left' | 'right'
  fullWidth?: boolean
  children: React.ReactNode
}) {
  return (
    <FadeIn
      className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-16 ${
        align === 'right' ? 'lg:[&>*:first-child]:order-2' : ''
      }`}
    >
      <div>
        <h2 className="text-balance font-heading text-2xl text-foreground sm:text-3xl">{title}</h2>
        <p className="mt-3 max-w-md text-foreground/70">{body}</p>
      </div>
      <div className={fullWidth ? 'w-full' : 'flex justify-center lg:justify-start'}>{children}</div>
    </FadeIn>
  )
}

function ProductDetailCard() {
  return (
    <div className="w-full max-w-xs overflow-hidden rounded-2xl border border-border bg-surface">
      <Image
        src="/landing/producto-detalle.webp"
        alt="Ficha de producto en Proxi, con foto, precio, descripción y talles disponibles"
        width={750}
        height={1642}
        className="w-full"
        sizes="320px"
      />
    </div>
  )
}

function WhatsappChatCard() {
  return (
    <div className="w-full max-w-xs rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MessageCircle className="size-4" aria-hidden />
        </div>
        <p className="text-sm font-medium">Kioto</p>
      </div>
      <div className="mt-3 space-y-2 text-left">
        <div className="ml-auto w-fit max-w-[85%] rounded-xl rounded-tr-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
          Hola! ¿Tenés el corset urban en talle M?
        </div>
        <div className="w-fit max-w-[85%] rounded-xl rounded-tl-sm bg-muted px-3 py-2 text-sm">
          Sí! Te lo separo 🙌
        </div>
      </div>
    </div>
  )
}

const COMERCIO_CATEGORIES = [
  'Indumentaria',
  'Gastronomía',
  'Tecnología',
  'Decoración',
  'Almacenes',
  'Regalería',
] as const

const SERVICIO_CATEGORIES = [
  'Peluquería y estética',
  'Reparaciones y oficios',
  'Clases y profesores',
  'Profesionales',
  'Eventos',
  'Gimnasios',
] as const

function ForWhom() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance font-heading text-2xl text-foreground sm:text-3xl">
            Para vidrieras y para servicios.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-foreground/70">
            No hace falta vender productos para estar en Proxi. Si atendés gente cerca tuyo,
            tenés lugar.
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Store className="size-5" aria-hidden />
            </div>
            <p className="mt-4 font-heading text-lg text-foreground">Comercios</p>
            <p className="mt-1 text-sm text-foreground/70">Un catálogo de productos con precio y foto.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {COMERCIO_CATEGORIES.map((category) => (
                <span
                  key={category}
                  className="rounded-full bg-muted px-3 py-1 text-xs text-foreground/80"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Briefcase className="size-5" aria-hidden />
            </div>
            <p className="mt-4 font-heading text-lg text-foreground">Prestadores de servicios</p>
            <p className="mt-1 text-sm text-foreground/70">Un listado de lo que hacés, sin stock ni precio fijo.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SERVICIO_CATEGORIES.map((category) => (
                <span
                  key={category}
                  className="rounded-full bg-muted px-3 py-1 text-xs text-foreground/80"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

const GYM_CAPABILITIES = [
  'Socios con sus membresías y estado de pago, todo en un lugar',
  'Cobrá cuotas y llevá tu caja del día',
  'Avisos automáticos de vencimientos, antes de que se te escapen',
  'Autoingreso en una tablet o celular en la entrada, de uso exclusivo para tus socios',
  'Cada ingreso queda registrado automáticamente, sin que nadie tenga que anotarlo',
  'Sumá a tu equipo con roles y permisos propios',
  'Reportes de ingresos y asistencia para ver cómo viene el mes',
] as const

function GymSection() {
  return (
    <section className="border-t border-border bg-primary/[0.04]">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <FadeIn className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance font-heading text-2xl text-foreground sm:text-3xl">
            ¿Tenés un gimnasio? Proxi también lleva tu día a día.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-foreground/70">
            Además de tu vidriera pública, sumás herramientas pensadas para gestionar un gimnasio
            real, no solo un catálogo de productos.
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="mt-10">
          <BrowserFrame>
            <ImageWithSkeleton
              src="/landing/socios.webp"
              alt="Panel de Socios en Proxi: lista de socios del gimnasio con su estado (activo/vencido), vencimiento y acciones para renovar"
              width={2000}
              height={1478}
              className="w-full"
              sizes="(max-width: 1024px) 100vw, 1152px"
            />
          </BrowserFrame>
        </FadeIn>

        <FadeIn className="mt-14 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <ul className="space-y-3">
              {GYM_CAPABILITIES.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/80">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="relative flex w-full max-w-[420px] items-center justify-center pb-4">
              <div className="absolute left-0 w-[38%] -translate-x-1 translate-y-3 -rotate-6 overflow-hidden rounded-[1.5rem] border border-border shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <Image
                  src="/landing/autoingreso-exito.webp"
                  alt="Pantalla de bienvenida: 'Hernán, ¡bienvenido/a! Ingreso registrado, a entrenar!'"
                  width={1196}
                  height={1818}
                  className="w-full"
                  sizes="160px"
                />
              </div>
              <div className="absolute right-0 w-[38%] translate-x-1 translate-y-3 rotate-6 overflow-hidden rounded-[1.5rem] border border-border shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <Image
                  src="/landing/autoingreso-error.webp"
                  alt="Pantalla de error: 'No te encontramos. Revisá el número o pasá por recepción.'"
                  width={1196}
                  height={1818}
                  className="w-full"
                  sizes="160px"
                />
              </div>
              <div className="relative w-[54%] overflow-hidden rounded-[2rem] border border-border bg-surface p-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.08)]">
                <Image
                  src="/landing/autoingreso.webp"
                  alt="Pantalla de autoingreso: el socio escribe los últimos 4 dígitos de su celular para marcar su entrada al gimnasio"
                  width={1196}
                  height={1818}
                  className="w-full rounded-[1.6rem]"
                  sizes="230px"
                />
              </div>
            </div>
            <p className="max-w-[340px] text-center text-xs text-foreground/60">
              Dejalo en una tablet o celular en la entrada, de uso exclusivo para tus socios: cada
              ingreso queda registrado solo.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

const STEPS = [
  {
    number: '1',
    title: 'Creá tu tienda',
    body: 'Registrate, elegí tu rubro y personalizá tu perfil con logo y colores en minutos.',
  },
  {
    number: '2',
    title: 'Cargá tu catálogo',
    body: 'Sumá tus productos o servicios con fotos y precio. Podés editarlo cuando quieras.',
  },
  {
    number: '3',
    title: 'La gente te encuentra',
    body: 'Aparecés en el feed por cercanía y categoría. Te escriben directo por WhatsApp.',
  },
] as const

function HowItWorks() {
  return (
    <section className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <FadeIn>
          <h2 className="text-balance font-heading text-2xl text-foreground sm:text-3xl">
            Cómo funciona
          </h2>
        </FadeIn>
        <div className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {STEPS.map((step, index) => (
            <FadeIn key={step.number} delay={index * 0.1}>
              <span className="font-heading text-3xl text-primary">{step.number}</span>
              <p className="mt-3 font-medium text-foreground">{step.title}</p>
              <p className="mt-1.5 text-sm text-foreground/70">{step.body}</p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="border-t border-border">
      <FadeIn className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 py-16 text-center sm:px-8 sm:py-24">
        <Image src="/brand/logo-mark.png" alt="" width={40} height={40} className="size-10" />
        <h2 className="text-balance font-heading text-3xl text-foreground sm:text-4xl">
          Sumá tu negocio a Proxi hoy.
        </h2>
        <p className="max-w-md text-foreground/70">
          Es gratis para empezar. En unos minutos tu tienda ya está lista para que te encuentren.
        </p>
        <Button
          size="lg"
          className="min-h-11"
          render={<Link href="/registro" />}
          nativeButton={false}
        >
          Sumar mi negocio gratis
        </Button>
      </FadeIn>
    </section>
  )
}

function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 py-8 text-sm text-foreground/60 sm:flex-row sm:justify-between sm:px-8">
        <p>© {new Date().getFullYear()} Proxi Marketplace</p>
        <div className="flex items-center gap-5">
          <Link href="/" className="rounded-md outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
            Explorar comercios
          </Link>
          <Link href="/terminos" className="rounded-md outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
            Términos
          </Link>
          <Link href="/login" className="rounded-md outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </footer>
  )
}
