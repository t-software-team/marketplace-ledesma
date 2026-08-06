---
name: Proxi Marketplace
description: Directorio y feed de comercios locales, curado y verificado, con contacto directo por WhatsApp
colors:
  violeta-proxi: "#7c3aed"
  violeta-proxi-foreground: "#faf5ff"
  fondo-neutro: "#faf8fc"
  superficie: "#ffffff"
  texto-principal: "#3a3550"
  secundario: "#f1eef6"
  texto-mutado: "#767296"
  destacado-lima: "#84cc16"
  verificado-rosa: "#e8a7b0"
  exito: "#b8ddb0"
  advertencia: "#f3dfa0"
  destructivo: "#dc2626"
  borde: "#e6e1ed"
typography:
  heading:
    fontFamily: "Sora, sans-serif"
    fontWeight: 500
  body:
    fontFamily: "Inter, sans-serif"
    fontWeight: 400
  mono:
    fontFamily: "IBM Plex Mono, monospace"
    fontWeight: 500
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.875rem"
spacing:
  card: "1rem"
  card-sm: "0.75rem"
components:
  button-primary:
    backgroundColor: "{colors.violeta-proxi}"
    textColor: "{colors.violeta-proxi-foreground}"
    rounded: "{rounded.lg}"
    padding: "0 0.625rem"
    height: "2rem"
  button-secondary:
    backgroundColor: "{colors.secundario}"
    textColor: "{colors.texto-principal}"
    rounded: "{rounded.lg}"
  badge-default:
    backgroundColor: "{colors.violeta-proxi}"
    textColor: "{colors.violeta-proxi-foreground}"
    rounded: "9999px"
    padding: "0.125rem 0.5rem"
---

# Design System: Proxi Marketplace

## Overview

**Creative North Star: "El Kiosco de Barrio Digital"**

Proxi traduce la calidez y confianza de un comercio de barrio a una interfaz limpia y moderna. No es un mercado frío de resultados genéricos: es un feed curado donde cada comercio verificado se siente elegido, no listado. El violeta vibrante actúa como sello propio de la marca, no como decoración — aparece con moderación, siempre asociado a acción o identidad (botón primario, precio destacado, badge de categoría).

La densidad es alta pero ordenada: mucha información por pantalla (grillas de producto, chips de categoría, badges de estado), organizada con generosidad tipográfica y radios suaves para que no se sienta corporativo ni frío. Todo el sistema está pensado en español, para uso rápido en mobile, con contacto que sale de la app (WhatsApp) — el diseño nunca simula un checkout que no existe.

**Key Characteristics:**
- Violeta vibrante como firma, usado con moderación, nunca como fondo dominante.
- Tipografía Sora (títulos) + Inter (cuerpo) + IBM Plex Mono (precios) — el mono en precios les da peso de "dato", distinto del resto del texto.
- Superficies planas con borde/ring sutil en vez de sombras marcadas.
- Radios suaves y consistentes (0.625rem base) en toda la UI, sin esquinas vivas.
- Grillas densas de 2 columnas en mobile, 3 en desktop, para feed y catálogo.

## Colors

Paleta cálida-neutra (violeta sobre blanco/lila muy claro) con acentos funcionales de estado (éxito, advertencia, destructivo) y dos acentos de marca propios del dominio (destacado, verificado).

### Primary
- **Violeta Proxi** (`#7c3aed` claro / `#a179f2` oscuro): color de marca y acción. Botones primarios, precios de producto, enlaces, categoría activa. Es el único color que debe leerse como "esto es Proxi".

### Neutral
- **Fondo Neutro** (`#faf8fc` claro / `#17131f` oscuro): fondo de página.
- **Superficie** (`#ffffff` claro / `#221c30` oscuro): cards, headers, sheets — todo lo que se apoya sobre el fondo.
- **Texto Principal** (`#3a3550` claro / `#ece8f5` oscuro): texto de cuerpo y títulos.
- **Texto Mutado** (`#767296` claro / `#a79cc4` oscuro): metadatos, labels secundarias, placeholders.
- **Borde** (`#e6e1ed` claro / `#392f4d` oscuro): separadores, contornos de card, inputs.

### Acentos funcionales (dominio)
- **Destacado Lima** (`#84cc16`): comercios/productos con plan destacado — no es un color de marca, es un indicador de estado comercial.
- **Verificado Rosa** (`#e8a7b0`): badge de verificación de comercio (`VerifiedStamp`) — deliberadamente distinto del violeta para no confundirse con acción.
- **Éxito / Advertencia / Destructivo**: estados de sistema estándar (confirmaciones, alertas, acciones irreversibles).

### Named Rules
**La Regla del Violeta Raro.** El violeta primario se usa para una sola cosa por pantalla a la vez: la acción principal o el dato de precio. Nunca como fondo de sección completa.

## Typography

**Display/Heading Font:** Sora (con fallback sans-serif del sistema)
**Body Font:** Inter (con fallback sans-serif del sistema)
**Mono Font:** IBM Plex Mono — reservado para precios y datos tabulares

**Character:** Sora aporta un toque geométrico y cálido a los títulos sin ser corporativo; Inter mantiene el cuerpo legible y neutro a alta densidad; el mono en precios les da peso de "dato verificable", distinguiéndolos claramente del resto del texto.

### Hierarchy
- **Headline** (font-heading, `text-2xl`, peso 500): título de producto/tienda (`h1`).
- **Title** (font-heading, `text-base`–`text-lg`, peso 500): títulos de card, secciones de feed (`h2`, `CardTitle`).
- **Body** (Inter, `text-sm`, peso 400): texto general, descripciones.
- **Label** (Inter, `text-xs`, peso 400–500): metadatos, badges, breadcrumbs de categoría (a veces uppercase con tracking amplio).
- **Price** (IBM Plex Mono, `text-base`–`text-3xl`, peso 600): siempre en mono, nunca en Inter/Sora.

### Named Rules
**La Regla del Precio en Mono.** Todo precio se muestra en `font-mono`. Es la única excepción a Sora/Inter y funciona como señal visual instantánea de "esto es un monto".

## Layout

Mobile-first con grilla de producto de 2 columnas (`grid-cols-2`) que pasa a 3 en desktop (`md:grid-cols-3`). Filas horizontales con scroll (`overflow-x-auto`, scrollbar oculta) para categorías y comercios relacionados — un patrón de "carrusel de chips" reutilizado en feed, filtros y tiendas relacionadas. Contenedores de página usan padding lateral consistente (`px-4` mobile, `px-6` desktop) y las cards rompen ese margen con `-mx-4`/`-mx-6` cuando ocupan todo el ancho (portada de tienda, grillas de imagen).

## Elevation & Depth

Sin filosofía de profundidad definida todavía: el sistema hoy usa superficies mayormente planas con `ring-1 ring-foreground/10` o `ring-border` en vez de `box-shadow`, salvo excepciones puntuales (logo de tienda con `shadow-md`, badges flotantes sobre imagen con `backdrop-blur`). Queda abierto si esto se formaliza como regla "flat-by-default" o se introduce una escala de sombra — no asumir ninguna de las dos hasta decidirlo.

## Shapes

Radio base de 10px (`--radius: 0.625rem`) con una escala derivada: `sm` (6px), `md` (8px), `lg` (10px, default de cards/botones/inputs), `xl` (14px, contenedores grandes como la portada de tienda). Badges y avatares usan `rounded-full`. Ninguna esquina viva en la UI — todo pasa por la escala de radio.

## Components

### Buttons
- **Shape:** `rounded-lg` (10px), consistente con el resto del sistema.
- **Primary:** fondo Violeta Proxi, texto `--primary-foreground`, `hover:bg-primary/80`.
- **Secondary:** fondo `--secondary` (lila muy claro), texto `--foreground`.
- **Outline / Ghost / Destructive / Link:** variantes de baja énfasis para acciones secundarias; destructive usa `bg-destructive/10` (nunca sólido) para no competir visualmente con acciones primarias.
- **Tamaño e icon-only:** variantes compactas (`xs`/`sm`/`default`/`lg`) más variantes cuadradas `icon-*`. Los botones icon-only sueltos en overlays (favoritos, volver, buscar) deben usar como mínimo `size-11` (44px) para touch target, aunque el token de tamaño `icon` de la librería sea `size-8` — ese default es para toolbars densas, no para overlays táctiles.

### Cards / Containers
- **Corner Style:** `rounded-xl` (14px).
- **Background:** `--card` (blanco / superficie oscura).
- **Shadow Strategy:** sin sombra; `ring-1 ring-foreground/10` como único borde de separación.
- **Internal Padding:** `--card-spacing` de 1rem (0.75rem en variante `sm`).

### Badges
- **Style:** `rounded-4xl` (píldora completa), `h-5`, texto `text-xs`.
- **Variants:** default (violeta, para "Servicio"/categoría activa), secondary, success/warning (fondo al 30% del color + texto de rol), destructive, outline.

### Inputs / Fields
- **Style:** borde `--border`, fondo `--background`, radio `lg`.
- **Focus:** `focus-visible:border-ring` + `ring-3 ring-ring/50` — visible y consistente con botones.

### Navigation
- **Header público:** superficie translúcida (`bg-surface/90 backdrop-blur-sm`) flotante sobre imagen en modo "minimal" (tienda/producto); barra completa con búsqueda en el resto.
- **Chips de categoría:** círculo `size-14` con ícono + label debajo, borde `border-2` que cambia a `border-primary` cuando está seleccionado.

## Do's and Don'ts

### Do:
- **Do** usar `font-mono` para todo precio o monto — es la señal visual de "dato".
- **Do** mantener el violeta como acento raro: una sola aparición dominante por pantalla.
- **Do** usar `ring-1 ring-border` o `ring-foreground/10` en vez de `box-shadow` para separar superficies, salvo overlays sobre imagen donde se necesite legibilidad garantizada.
- **Do** llevar todo botón icon-only en overlay táctil a `size-11` (44px) mínimo, sin importar el tamaño `icon` default del sistema.

### Don't:
- **Don't** usar el violeta primario como fondo de sección completa — se reserva para acción/dato, no para superficie.
- **Don't** introducir una tercera familia tipográfica fuera de Sora/Inter/IBM Plex Mono.
- **Don't** simular UI de checkout o pago de producto — el contacto siempre sale de la plataforma (WhatsApp); solo las suscripciones de comerciantes tienen flujo de pago propio.
