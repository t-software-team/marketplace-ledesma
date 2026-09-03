'use client'

import { Accordion } from '@base-ui/react/accordion'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  {
    question: '¿Cuánto cuesta sumar mi negocio a Proxi?',
    answer:
      'Empezar es gratis: podés crear tu tienda y cargar tus primeros productos sin pagar nada. Si tu negocio crece, podés subir de plan para tener más catálogo, destacados y estadísticas.',
  },
  {
    question: '¿Proxi cobra comisión por venta?',
    answer:
      'No. Vos cerrás la venta directo por WhatsApp con quien te escribe, sin intermediarios ni comisiones por lo que vendés.',
  },
  {
    question: '¿Qué pasa si no vendo productos, sino que ofrezco servicios?',
    answer:
      'No hay problema. Proxi también está pensado para prestadores de servicios: podés mostrar un listado de lo que hacés, sin necesidad de stock ni precio fijo.',
  },
  {
    question: '¿Cómo me contactan los clientes?',
    answer:
      'Directo por WhatsApp. Cuando alguien se interesa en tu catálogo, te escribe a vos y coordinás la venta como ya lo hacés hoy, sin chatbots ni pasos de más.',
  },
  {
    question: '¿Cuánto tarda en estar lista mi tienda?',
    answer:
      'Unos minutos. Te registrás, elegís tu rubro, personalizás tu perfil y cargás tu catálogo cuando quieras editarlo.',
  },
] as const

export function LandingFaqSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
        <h2 className="text-balance text-center font-heading text-2xl text-foreground sm:text-3xl">
          Preguntas frecuentes
        </h2>
        <Accordion.Root className="mt-10 divide-y divide-border">
          {FAQS.map((faq) => (
            <Accordion.Item key={faq.question} value={faq.question} className="py-1">
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 py-4 text-left outline-none">
                  <span className="font-medium text-foreground">{faq.question}</span>
                  <ChevronDown
                    className="size-4 shrink-0 text-foreground/60 transition-transform duration-200 group-data-[panel-open]:rotate-180"
                    aria-hidden
                  />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel className="h-(--accordion-panel-height) overflow-hidden text-sm text-foreground/70 transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0">
                <p className="pb-4">{faq.answer}</p>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  )
}
