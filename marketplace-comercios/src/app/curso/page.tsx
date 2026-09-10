import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  BookOpen,
  Calendar,
  CalendarClock,
  Check,
  Clock,
  Code2,
  Database,
  GitBranch,
  Laptop,
  Layers,
  MessageCircle,
  Rocket,
  Sparkles,
  UsersRound,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/shop/landing/landing-fade-in'
import { BackToTop } from '@/components/shop/landing/landing-back-to-top'
import { CursoSiteHeader } from '@/components/curso/curso-site-header'
import { toWhatsAppNumber } from '@/lib/whatsapp'

const CONTACT_PHONE = toWhatsAppNumber('+54 9 3886528023')
const CONTACT_MESSAGE = encodeURIComponent(
  'Hola! Quiero más info sobre el curso de Programación Básica Profesional + IA.'
)
const CONTACT_URL = `https://wa.me/${CONTACT_PHONE}?text=${CONTACT_MESSAGE}`

export const metadata: Metadata = {
  title: 'Curso de Programación Básica Profesional + IA',
  description:
    'Curso de 5 meses para empezar en programación desde cero: JavaScript, React, Git/GitHub, IA con criterio, Supabase y un proyecto full stack publicado en internet.',
}

export default function CursoPage() {
  return (
    <div className="overflow-x-hidden bg-background text-foreground">
      <CursoSiteHeader contactUrl={CONTACT_URL} />
      <main>
        <Hero />
        <FichaGeneral />
        <Promesa />
        <MapaMeses />
        <Reglas />
        <PerfilEgreso />
        <NivelDos />
        <Profesor />
        <Precio />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  )
}

function Hero() {
  return (
    <section className="relative mx-auto max-w-4xl px-5 py-16 text-center sm:px-8 sm:py-24">
      <div
        className="absolute top-[-15%] left-1/2 -z-10 size-[32rem] -translate-x-1/2 rounded-full bg-primary/[0.14] blur-3xl"
        aria-hidden
      />
      <FadeIn>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <Sparkles className="size-3.5" aria-hidden />
          Nivel básico · sin experiencia previa
        </span>
        <h1 className="mt-6 text-balance font-heading text-4xl leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Programación Básica Profesional{' '}
          <span className="bg-gradient-to-r from-primary via-primary to-[#ed587a] bg-clip-text text-transparent">
            + IA
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-foreground/70">
          5 meses para pasar de cero a construir y publicar tu propia app full stack, usando la IA
          como herramienta de trabajo con criterio{' '}
          <span className="text-foreground/50">— no como oráculo.</span>
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            size="lg"
            className="min-h-12 rounded-full px-7 text-base shadow-[0_8px_24px_-6px_rgba(124,58,237,0.5)] transition-transform hover:-translate-y-0.5"
            render={<a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" />}
          >
            Quiero anotarme
          </Button>
          <a
            href="#mapa"
            className="group inline-flex min-h-12 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium text-foreground/70 outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Ver el programa completo
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </a>
        </div>
      </FadeIn>
    </section>
  )
}

const FICHA = [
  { label: 'Modalidad', value: 'Online, en vivo', icon: Laptop },
  { label: 'Duración', value: '5 meses · 20 semanas', icon: Calendar },
  { label: 'Frecuencia', value: 'Martes y viernes, 60 min', icon: CalendarClock },
  { label: 'Total de clases', value: '40 clases · 40 horas', icon: BookOpen },
  { label: 'Trabajo fuera de clase', value: '4 horas semanales', icon: Clock },
  { label: 'Edad', value: '16 años en adelante', icon: UsersRound },
] as const

const STACK = [
  'JavaScript',
  'React',
  'Git/GitHub',
  'SQL',
  'Supabase',
  'Gentle-AI',
  'SDD',
  'Kilo Code',
  'OpenCode',
  'Integración de IA',
] as const

function FichaGeneral() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance font-heading text-2xl tracking-tight text-foreground sm:text-3xl">
            El programa en números
          </h2>
          <p className="mx-auto mt-3 max-w-md text-foreground/70">
            Todo lo que necesitás saber antes de anotarte, de un vistazo.
          </p>
        </FadeIn>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FICHA.map((item, index) => (
            <FadeIn key={item.label} delay={index * 0.06}>
              <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-primary/30">
                <div
                  className="pointer-events-none absolute -top-10 -right-10 size-28 rounded-full bg-primary/[0.08] blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  aria-hidden
                />
                <div className="relative flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105">
                  <item.icon className="size-5" aria-hidden />
                </div>
                <p className="relative mt-4 text-sm text-foreground/60">{item.label}</p>
                <p className="relative mt-1 font-heading text-lg text-foreground">{item.value}</p>
              </div>
            </FadeIn>
          ))}

          <FadeIn delay={FICHA.length * 0.06}>
            <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-primary/30">
              <div
                className="pointer-events-none absolute -top-10 -right-10 size-28 rounded-full bg-primary/[0.08] blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                aria-hidden
              />
              <div className="relative flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105">
                <Code2 className="size-5" aria-hidden />
              </div>
              <p className="relative mt-4 text-sm text-foreground/60">Stack</p>
              <div className="relative mt-2 flex flex-wrap gap-1.5">
                {STACK.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground/80"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

function Promesa() {
  return (
    <section className="border-t border-border bg-primary/[0.04]">
      <div className="mx-auto grid max-w-5xl items-center gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1fr_1.3fr] lg:gap-14">
        <FadeIn className="relative mx-auto w-full max-w-[280px] lg:mx-0">
          <div
            className="absolute -inset-10 -z-10 rounded-full bg-primary/[0.16] blur-3xl"
            aria-hidden
          />
          <Image
            src="/curso/ghost-avatar.svg"
            alt=""
            aria-hidden
            loading="lazy"
            width={1080}
            height={1080}
            unoptimized
            className="w-full"
          />
        </FadeIn>

        <FadeIn delay={0.1} className="text-center lg:text-left">
          <h2 className="text-balance font-heading text-2xl tracking-tight text-foreground sm:text-3xl">
            Este curso no es sobre crear inteligencia artificial. Es sobre programar con ella.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-foreground/70 lg:mx-0">
            Los primeros dos meses son a mano, a propósito: un asistente te da código en segundos,
            pero si no sabés leerlo, no sabés si está bien. La IA se enciende recién en el mes 3,
            cuando ya tenés el criterio para usarla.
          </p>
          <p className="mx-auto mt-4 max-w-xl font-medium text-foreground lg:mx-0">
            Este programa prioriza cobertura por sobre profundidad: el egresado construye y
            publica una app full stack completa, con el mapa entero y la primera vuelta recorrida.
          </p>
        </FadeIn>
      </div>
    </section>
  )
}

const MESES = [
  {
    numero: '1',
    icon: BookOpen,
    eje: 'Lógica y conceptos de programación',
    resultado: 'Resuelve problemas con funciones, bucles y datos',
    ia: 'IA apagada',
  },
  {
    numero: '2',
    icon: Layers,
    eje: 'Fundamentos de JavaScript + React básico',
    resultado: 'Construye interfaces con componentes y estado',
    ia: 'IA mínima',
  },
  {
    numero: '3',
    icon: GitBranch,
    eje: 'GitHub + IA aplicada: SDD y Gentle-AI',
    resultado: 'Trabaja con ramas, PRs y agentes con criterio',
    ia: 'IA se enciende',
  },
  {
    numero: '4',
    icon: Database,
    eje: 'Supabase, SQL básico, React e IA',
    resultado: 'Su app guarda, lee y modifica datos reales',
    ia: 'Herramienta cotidiana',
  },
  {
    numero: '5',
    icon: Rocket,
    eje: 'Consultoría, integrador full stack y despliegue',
    resultado: 'Entregó una app full stack publicada',
    ia: 'Forma de trabajar instalada',
  },
] as const

function MapaMeses() {
  return (
    <section id="mapa" className="border-t border-border scroll-mt-16">
      <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance font-heading text-2xl tracking-tight text-foreground sm:text-3xl">
            El mapa de los 5 meses
          </h2>
          <p className="mx-auto mt-3 max-w-md text-foreground/70">
            Cada mes cierra con un resultado concreto, no solo temario visto.
          </p>
        </FadeIn>

        <div className="relative mt-14">
          <div
            className="absolute top-0 bottom-0 left-6 w-px bg-gradient-to-b from-primary via-border to-transparent md:left-1/2 md:-translate-x-1/2"
            aria-hidden
          />
          <div className="space-y-10 md:space-y-4">
            {MESES.map((mes, index) => {
              const isEven = index % 2 === 0
              return (
                <div
                  key={mes.numero}
                  className={`relative flex items-start gap-5 pl-16 md:gap-0 md:pl-0 ${
                    isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  <FadeIn
                    delay={index * 0.08}
                    className="absolute left-0 z-10 md:relative md:left-auto md:flex md:w-1/2 md:shrink-0 md:items-center md:justify-center"
                  >
                    <span className="relative flex size-12 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground shadow-[0_2px_10px_rgba(0,0,0,0.14)]">
                      <mes.icon className="size-5" aria-hidden />
                      <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                        {mes.numero}
                      </span>
                    </span>
                  </FadeIn>

                  <FadeIn
                    delay={index * 0.08 + 0.05}
                    className="min-w-0 md:w-1/2"
                    x={isEven ? 16 : -16}
                  >
                    <div
                      className={`rounded-2xl border border-border bg-surface p-6 ${
                        isEven ? 'md:mr-8' : 'md:ml-8'
                      }`}
                    >
                      <p className="text-xs font-medium text-primary">Mes {mes.numero}</p>
                      <p className="mt-1 font-heading text-lg text-foreground">{mes.eje}</p>
                      <p className="mt-1 text-sm text-foreground/70">{mes.resultado}</p>
                      <span className="mt-3 inline-block rounded-full bg-muted px-3 py-1 text-xs text-foreground/80">
                        {mes.ia}
                      </span>
                    </div>
                  </FadeIn>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

const REGLAS = [
  {
    icon: BookOpen,
    title: 'La clase no es donde se aprende unicamente',
    body: 'Se presenta el concepto y se corrige lo anterior. Programar se aprende programando con las tareas semanales.',
  },
  {
    icon: Check,
    title: 'La instalación de todo el proyecto se guía en clase',
    body: 'Node, Vite, GitHub, Gentle-AI: te acompañamos paso a paso en vivo, y la clase queda grabada para que la repases cuando la necesites.',
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
          <h2 className="text-balance font-heading text-2xl tracking-tight text-foreground sm:text-3xl">
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

const PERFIL_DESTACADO = [
  {
    title: 'Vas a usar asistentes de IA y vas a saber detectar cuándo se equivocan',
    body: 'Muchos le piden código a un asistente. Pocos saben leer ese código y reconocer cuándo está mal. Ese criterio lo vas a construir en cinco meses de trabajo, y es lo que te va a distinguir de un usuario de IA.',
  },
  {
    title: 'Vas a publicar una aplicación full stack en internet con una URL que vas a poder mostrar',
    body: 'No un ejercicio de práctica: vas a construir una aplicación real, con base de datos y usuarios, funcionando en producción. Un proyecto verificable pesa más que cualquier certificado.',
  },
] as const

const PERFIL = [
  'Vas a tomar un problema descrito en lenguaje natural y lo vas a convertir en una secuencia de pasos ejecutable en JavaScript',
  'Vas a construir interfaces con React: componentes, props, estado y consumo de datos externos',
  'Vas a diseñar un modelo de datos simple y lo vas a consultar con SQL',
  'Vas a conectar una aplicación a una base de datos real, con usuarios que se registran e inician sesión',
  'Vas a trabajar con Git y GitHub en un flujo colaborativo: ramas, pull requests y revisión de código ajeno',
  'Vas a redactar una especificación antes de programar, porque una especificación clara es la base de una implementación correcta',
  'Vas a relevar la necesidad real de un cliente y la vas a traducir en una propuesta con alcance definido',
] as const

function PerfilEgreso() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-24">
        <FadeIn className="text-center">
          <h2 className="text-balance font-heading text-2xl tracking-tight text-foreground sm:text-3xl">
            Perfil de egreso
          </h2>
          <p className="mx-auto mt-3 max-w-md text-foreground/70">
            Esto es lo que vas a dominar, clase a clase, a lo largo de las 20 semanas del programa.
          </p>
        </FadeIn>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {PERFIL_DESTACADO.map((item, index) => (
            <FadeIn key={item.title} delay={index * 0.1}>
              <div className="h-full rounded-2xl border border-primary/30 bg-primary/[0.05] p-6">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Check className="size-5" aria-hidden />
                </div>
                <p className="mt-4 font-heading text-lg leading-snug text-foreground">
                  {item.title}
                </p>
                <p className="mt-2 text-sm text-foreground/70">{item.body}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {PERFIL.map((item, index) => (
            <FadeIn key={item} delay={index * 0.05}>
              <div className="flex items-start gap-2.5 rounded-xl border border-border bg-surface p-4 text-sm text-foreground/80">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                {item}
              </div>
            </FadeIn>
          ))}
        </div>
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
        <h2 className="text-balance font-heading text-2xl tracking-tight text-foreground sm:text-3xl">
          Lo que queda para el nivel 2
        </h2>
        <p className="mx-auto mt-3 max-w-md text-foreground/70">
          Este curso te da el mapa completo y una vuelta entera recorrida. La profundización en
          cada tecnología es el paso siguiente.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {NIVEL_2.map((tema, index) => (
            <FadeIn key={tema} delay={index * 0.04} y={8}>
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-foreground/80">
                {tema}
              </span>
            </FadeIn>
          ))}
        </div>
      </FadeIn>
    </section>
  )
}

const LINKEDIN_URL = 'https://www.linkedin.com/in/christianit96'

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.446-2.136 2.94v5.666H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.114 20.452H3.558V9h3.556v11.452z" />
    </svg>
  )
}

function Profesor() {
  return (
    <section id="profesor" className="scroll-mt-24 border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-5xl items-center gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[auto_1fr] lg:gap-14">
        <FadeIn className="mx-auto lg:mx-0">
          <div className="relative size-40 overflow-hidden rounded-full border-4 border-surface shadow-[0_2px_16px_rgba(0,0,0,0.12)] sm:size-48">
            <Image
              src="/curso/profesor.jpg"
              alt="Christian Toscano, profesor del curso"
              width={400}
              height={400}
              className="size-full object-cover"
            />
          </div>
        </FadeIn>

        <FadeIn delay={0.1} className="text-center lg:text-left">
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            Quién da el curso
          </span>
          <h2 className="mt-3 text-balance font-heading text-2xl tracking-tight text-foreground sm:text-3xl">
            Christian Toscano
          </h2>
          <p className="mt-1 text-foreground/70">
            Software Engineer, Full Stack &amp; Mobile Developer · 7 años de experiencia
            profesional
          </p>
          <p className="mx-auto mt-4 max-w-xl text-foreground/70 lg:mx-0">
            Trabajé en empresas de Argentina y Estados Unidos, y soy el creador y desarrollador de{' '}
            <Link
              href="/landing"
              className="font-medium text-foreground underline decoration-foreground/30 underline-offset-2 transition-colors hover:decoration-foreground"
            >
              Proxi Marketplace
            </Link>
            , la plataforma que estás viendo ahora mismo: full stack, en producción, con usuarios
            reales todos los días. No enseño con ejercicios de práctica — enseño con el mismo
            criterio que uso para construir software que la gente usa.
          </p>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex min-h-9 items-center gap-2 rounded-md text-sm font-medium text-foreground/70 outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <LinkedinIcon className="size-4" aria-hidden />
            linkedin.com/in/christianit96
          </a>
        </FadeIn>
      </div>
    </section>
  )
}

const PRECIO_FUNDAMENTOS = [
  'Clases en vivo, en grupos reducidos, no un video pregrabado que ves solo',
  'Seguimiento personalizado clase a clase: se corrige tu código, no el de un ejercicio genérico',
  'Docente con 7 años de experiencia profesional full stack, no un instructor sin experiencia en la industria',
  'Termina en un proyecto real, publicado en producción, que podés mostrar en una entrevista',
] as const

function Precio() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8 sm:py-24">
        <FadeIn>
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Wallet className="size-6" aria-hidden />
          </div>
          <h2 className="mt-5 text-balance font-heading text-2xl tracking-tight text-foreground sm:text-3xl">
            Inversión
          </h2>
          <p className="mt-4 font-heading text-4xl tracking-tight text-foreground sm:text-5xl">
            $80.000{' '}
            <span className="text-lg font-normal text-foreground/60 sm:text-xl">por mes</span>
          </p>
          <p className="mx-auto mt-3 max-w-lg text-foreground/70">
            5 cuotas mensuales durante los 5 meses del programa. Sin costos ocultos.
          </p>
        </FadeIn>

        <div className="mt-10 space-y-3 text-left">
          {PRECIO_FUNDAMENTOS.map((item, index) => (
            <FadeIn key={item} delay={index * 0.06}>
              <div className="flex items-start gap-2.5 rounded-xl border border-border bg-surface p-4 text-sm text-foreground/80">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                {item}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

const FAQ = [
  {
    q: '¿Necesito experiencia previa en programación?',
    a: 'No. El curso arranca desde cero, asumiendo que nunca escribiste una línea de código.',
  },
  {
    q: '¿Cuánto tiempo tengo que dedicarle por semana?',
    a: 'Dos clases en vivo de 60 minutos (martes y viernes) más 4 horas semanales de trabajo fuera de clase.',
  },
  {
    q: '¿Qué pasa si me atraso o me pierdo una clase?',
    a: 'Las clases se graban y hay seguimiento personalizado para que no te quedes afuera del ritmo del grupo.',
  },
  {
    q: '¿Puedo pagar en cuotas?',
    a: 'Sí, la inversión se divide en 5 cuotas mensuales, una por cada mes del programa.',
  },
  {
    q: '¿Qué edad mínima se necesita?',
    a: 'El curso está pensado para mayores de 16 años.',
  },
] as const

function Faq() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
        <FadeIn className="text-center">
          <h2 className="text-balance font-heading text-2xl tracking-tight text-foreground sm:text-3xl">
            Preguntas frecuentes
          </h2>
        </FadeIn>

        <div className="mt-10 space-y-4">
          {FAQ.map((item, index) => (
            <FadeIn key={item.q} delay={index * 0.06}>
              <div className="rounded-2xl border border-border bg-surface p-5">
                <p className="font-heading text-base text-foreground">{item.q}</p>
                <p className="mt-1.5 text-sm text-foreground/70">{item.a}</p>
              </div>
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
        <h2 className="text-balance font-heading text-3xl tracking-tight text-foreground sm:text-4xl">
          ¿Arrancamos?
        </h2>
        <p className="max-w-md text-foreground/70">
          Escribinos por WhatsApp y te contamos fechas, cupos y forma de pago.
        </p>
        <Button
          size="lg"
          className="min-h-12 rounded-full px-7 text-base shadow-[0_8px_24px_-6px_rgba(124,58,237,0.5)] transition-transform hover:-translate-y-0.5"
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
        <p>© {new Date().getFullYear()} Proxi Academia</p>
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
