# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two-sided, equal priority:

- **Comerciantes**: dueños de comercios locales que crean su perfil/catálogo (tienda, productos, promociones, horarios) para que gente cercana los encuentre y los contacte.
- **Compradores**: consumidores finales que navegan el feed por categoría/cercanía para encontrar dónde comprar algo puntual.

## Product Purpose

Proxi Marketplace es un directorio + feed de comercios locales (en español, mercado argentino) que conecta oferta y demanda de cercanía sin intermediar la venta.

## Positioning

Dos mecanismos combinados que un mapa genérico (Google Maps, Instagram) no ofrece:

- **Curación + verificación local**: comercios verificados/aprobados, categorización real, feed curado — no una lista genérica de resultados.
- **Contacto directo sin intermediarios**: conecta directo por WhatsApp; el valor es la vidriera (descubrimiento + catálogo), no una transacción con checkout ni comisión de venta.

## Operating Context

- Comerciantes gestionan su tienda desde un dashboard (`/mi-tienda`): productos, promociones, configuración, personalización de marca (color de acento, portada, logo), horarios de atención.
- Compradores navegan un feed público (`/`) por categoría/subcategoría/atributos y cercanía, ven la ficha de tienda (`/tienda/[slug]`) y de producto (`/producto/[id]`), pueden marcar favoritos, seguir tiendas y dejar reseñas.
- Panel de administración (`/admin`) gestiona verificación de comercios, categorías, reportes, suscripciones/planes y auditoría.
- Contacto entre comprador y comercio ocurre fuera de la plataforma (WhatsApp, redes), no hay checkout ni pago de producto dentro de Proxi.

## Capabilities and Constraints

- Los **planes de suscripción** (ver `/admin/subscripciones`) limitan funciones reales de producto: cantidad de productos, badges de destacado/verificado, acceso a promociones, etc. El diseño debe reflejar estos límites (ej. upsells, estados bloqueados) en vez de asumir que todo comercio tiene acceso completo.
- Verificación de comercios es un estado explícito (`verification_status`) con badge visual (`VerifiedStamp`) — no decorativo, refleja un proceso real de aprobación.
- Idioma del producto: español (Argentina). No hay checkout/pago de producto embebido; los pagos existentes (galiopay) son para las suscripciones de comerciantes, no para las compras de los usuarios finales.

## Product Principles

- Vidriera, no marketplace transaccional: el producto termina su trabajo cuando conecta comprador y comercio, no cuando se completa una venta.
- Cercanía y curación por sobre volumen: la propuesta de valor es encontrar lo relevante y verificado cerca, no listar todo.
- Los límites de plan son parte del diseño, no un detalle de backend: deben verse y explicarse, no ocultarse.
- Dos lados igual de importantes: ninguna decisión de UX debe optimizar el feed del comprador a costa de la experiencia de gestión del comerciante, ni viceversa.
