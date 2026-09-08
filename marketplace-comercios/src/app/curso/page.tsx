import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Check, GitBranch, MessageCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/shop/landing/landing-fade-in'
import { BackToTop } from '@/components/shop/landing/landing-back-to-top'
import { toWhatsAppNumber } from '@/lib/whatsapp'

const CONTACT_PHONE = toWhatsAppNumber('+54 9 3886528023')
const CONTACT_MESSAGE = encodeURIComponent(
  'Hola! Quiero más info sobre el curso de Programación Básica Profesional + IA.'
)
const CONTACT_URL = `https://wa.me/${CONTACT_PHONE}?text=${CONTACT_MESSAGE}`

export const metadata: Metadata = {
  title: 'Curso de Programación Básica Profesional + IA · TSoft',
  description:
    'Curso de 5 meses para empezar en programación desde cero: JavaScript, React, Git/GitHub, IA con criterio, Supabase y un proyecto full stack publicado en internet.',
}

export default function CursoPage() {
  return (
    <div className="bg-background text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <FichaGeneral />
        <Promesa />
        <MapaMeses />
        <Reglas />
        <PerfilEgreso />
        <NivelDos />
        <FinalCta />
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  )
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link
          href="/curso"
          className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Image src="/brand/logo-mark.png" alt="" width={28} height={28} className="size-7" priority />
          <span className="font-heading text-lg text-foreground">TSoft</span>
        </Link>
        <Button size="sm" render={<a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" />}>
          <span className="sm:hidden">Consultar</span>
          <span className="hidden sm:inline">Consultar por WhatsApp</span>
        </Button>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="mx-auto max-w-4xl px-5 py-16 text-center sm:px-8 sm:py-24">
      <FadeIn>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="size-3.5" aria-hidden />
          Nivel básico · sin experiencia previa
        </span>
        <h1 className="mt-5 text-balance font-heading text-4xl leading-[1.08] text-foreground sm:text-5xl lg:text-6xl">
          Programación Básica Profesional + IA
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-foreground/70">
          5 meses para pasar de cero a construir y publicar tu propia app full stack, usando la IA
          como herramienta de trabajo con criterio — no como oráculo.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            className="min-h-11"
            render={<a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" />}
          >
            Quiero anotarme
          </Button>
          <a
            href="#mapa"
            className="inline-flex min-h-11 items-center justify-center rounded-md text-sm font-medium text-foreground/70 outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Ver el programa completo →
          </a>
        </div>
      </FadeIn>
    </section>
  )
}

const FICHA = [
  { label: 'Duración', value: '5 meses · 20 semanas' },
  { label: 'Frecuencia', value: 'Martes y viernes, 60 min' },
  { label: 'Total de clases', value: '40 clases · 40 horas' },
  { label: 'Trabajo fuera de clase', value: '4 horas semanales' },
  { label: 'Edad', value: '14 años en adelante' },
  { label: 'Stack', value: 'JavaScript · React · Supabase' },
] as const

function FichaGeneral() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <FadeIn className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FICHA.map((item) => (
            <div key={item.label} className="rounded-2xl border border-border bg-surface p-5">
              <p className="text-sm text-foreground/60">{item.label}</p>
              <p className="mt-1 font-heading text-lg text-foreground">{item.value}</p>
            </div>
          ))}
        </FadeIn>
      </div>
    </section>
  )
}

function Promesa() {
  return (
    <section className="border-t border-border bg-primary/[0.04]">
      <FadeIn className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8 sm:py-24">
        <h2 className="text-balance font-heading text-2xl text-foreground sm:text-3xl">
          Este curso no es sobre crear inteligencia artificial. Es sobre programar con ella.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-foreground/70">
          Los primeros dos meses son a mano, a propósito: un asistente te da código en segundos,
          pero si no sabés leerlo, no sabés si está bien. La IA se enciende recién en el mes 3,
          cuando ya tenés el criterio para usarla.
        </p>
        <p className="mx-auto mt-4 max-w-xl font-medium text-foreground">
          Este programa prioriza cobertura por sobre profundidad: el egresado construye y publica
          una app full stack completa, con el mapa entero y la primera vuelta recorrida.
        </p>
      </FadeIn>
    </section>
  )
}

const MESES = [
  {
    numero: '1',
    eje: 'Lógica y conceptos de programación',
    resultado: 'Resuelve problemas con funciones, bucles y datos',
    ia: 'IA apagada',
  },
  {
    numero: '2',
    eje: 'Fundamentos de JavaScript + React básico',
    resultado: 'Construye interfaces con componentes y estado',
    ia: 'IA apagada',
  },
  {
    numero: '3',
    eje: 'GitHub + IA aplicada: SDD y Gentle-AI',
    resultado: 'Trabaja con ramas, PRs y agentes con criterio',
    ia: 'IA se enciende',
  },
  {
    numero: '4',
    eje: 'Supabase, SQL básico, React e IA',
    resultado: 'Su app guarda, lee y modifica datos reales',
    ia: 'Herramienta cotidiana',
  },
  {
    numero: '5',
    eje: 'Consultoría, integrador full stack y despliegue',
    resultado: 'Entregó una app full stack publicada',
    ia: 'Forma de trabajar instalada',
  },
] as const

function MapaMeses() {
  return (
    <section id="mapa" className="border-t border-border scroll-mt-16">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance font-heading text-2xl text-foreground sm:text-3xl">
            El mapa de los 5 meses
          </h2>
          <p className="mx-auto mt-3 max-w-md text-foreground/70">
            Cada mes cierra con un resultado concreto, no solo temario visto.
          </p>
        </FadeIn>

        <div className="mt-10 space-y-4">
          {MESES.map((mes, index) => (
            <FadeIn key={mes.numero} delay={index * 0.05}>
              <div className="flex items-start gap-5 rounded-2xl border border-border bg-surface p-6">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-lg text-primary">
                  {mes.numero}
                </span>
                <div className="min-w-0">
                  <p className="font-heading text-lg text-foreground">{mes.eje}</p>
                  <p className="mt-1 text-sm text-foreground/70">{mes.resultado}</p>
                  <span className="mt-3 inline-block rounded-full bg-muted px-3 py-1 text-xs text-foreground/80">
                    {mes.ia}
                  </span>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

const REGLAS = [
  {
    icon: BookOpen,
    title: 'La clase no es donde se aprende',
    body: 'Se presenta el concepto y se corrige lo anterior. Programar se aprende programando solo, en las 4 horas semanales de tarea obligatoria.',
  },
  {
    icon: Check,
    title: 'Ninguna instalación se hace en clase',
    body: 'Node, Vite, GitHub, Gentle-AI: todo va con guía escrita, video corto y sesión de soporte fuera de horario.',
  },
  {
    icon: GitBranch,
    title: 'La IA se enciende recién en el mes 3',
    body: 'Los dos primeros meses son a mano, a propósito, para construir el criterio antes de delegarle código a un asistente.',
  },
] as const

function Reglas() {
  return (
    <section className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance font-heading text-2xl text-foreground sm:text-3xl">
            Las tres reglas del programa
          </h2>
        </FadeIn>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {REGLAS.map((regla, index) => (
            <FadeIn key={regla.title} delay={index * 0.1}>
              <div className="h-full rounded-2xl border border-border bg-surface p-6">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <regla.icon className="size-5" aria-hidden />
                </div>
                <p className="mt-4 font-medium text-foreground">{regla.title}</p>
                <p className="mt-1.5 text-sm text-foreground/70">{regla.body}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

const PERFIL = [
  'Resuelvo un problema partiéndolo en pasos y lo escribo en JavaScript',
  'Construyo interfaces con React: componentes, props, estado y datos externos',
  'Diseño un modelo de datos simple y consulto una base con SQL',
  'Conecto una aplicación a una base de datos real con usuarios y sesiones',
  'Trabajo con Git y GitHub: ramas, pull requests y revisión de código de otros',
  'Escribo una especificación antes de programar, y sé por qué eso importa',
  'Uso asistentes de IA y puedo detectar cuándo se equivocan',
  'Relevo lo que un cliente necesita y armo una propuesta con alcance',
  'Publiqué una aplicación full stack en internet con una URL que puedo mostrar',
] as const

function PerfilEgreso() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-24">
        <FadeIn className="text-center">
          <h2 className="text-balance font-heading text-2xl text-foreground sm:text-3xl">
            Al terminar, el alumno dice:
          </h2>
        </FadeIn>
        <FadeIn delay={0.1} className="mt-10 space-y-3">
          {PERFIL.map((item) => (
            <div key={item} className="flex items-start gap-2.5 rounded-xl border border-border bg-surface p-4 text-sm text-foreground/80">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              {item}
            </div>
          ))}
        </FadeIn>
      </div>
    </section>
  )
}

const NIVEL_2 = [
  'TypeScript',
  'React avanzado',
  'Testing automatizado',
  'Backend propio (Node y NestJS)',
  'SQL en profundidad',
  'CI/CD y GitHub Actions',
  'React Native',
] as const

function NivelDos() {
  return (
    <section className="border-t border-border">
      <FadeIn className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8 sm:py-24">
        <h2 className="text-balance font-heading text-2xl text-foreground sm:text-3xl">
          Lo que queda para el nivel 2
        </h2>
        <p className="mx-auto mt-3 max-w-md text-foreground/70">
          Este curso te da el mapa completo y una vuelta entera recorrida. La profundización en
          cada tecnología es el paso siguiente.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {NIVEL_2.map((tema) => (
            <span key={tema} className="rounded-full bg-muted px-3 py-1 text-xs text-foreground/80">
              {tema}
            </span>
          ))}
        </div>
      </FadeIn>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="border-t border-border">
      <FadeIn className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 py-16 text-center sm:px-8 sm:py-24">
        <Image src="/brand/logo-mark.png" alt="" width={40} height={40} className="size-10" />
        <h2 className="text-balance font-heading text-3xl text-foreground sm:text-4xl">
          ¿Arrancamos?
        </h2>
        <p className="max-w-md text-foreground/70">
          Escribinos por WhatsApp y te contamos fechas, cupos y forma de pago.
        </p>
        <Button
          size="lg"
          className="min-h-11"
          render={<a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" />}
        >
          Quiero anotarme
        </Button>
      </FadeIn>
    </section>
  )
}

function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 py-8 text-sm text-foreground/60 sm:flex-row sm:justify-between sm:px-8">
        <p>© {new Date().getFullYear()} TSoft</p>
        <a
          href={CONTACT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-md outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <MessageCircle className="size-3.5" aria-hidden />
          Consultar por WhatsApp
        </a>
      </div>
    </footer>
  )
}
