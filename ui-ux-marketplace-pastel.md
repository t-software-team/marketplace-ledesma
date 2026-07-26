# UI / UX — Marketplace de Comercios (paleta pastel)

## 1. Dirección de diseño

Se mantiene el concepto de feria/comercio de barrio y el elemento firma (sello de verificado + cinta de destacado), pero llevado a una paleta pastel suave, cálida y minimalista. La idea: que se sienta liviano y amigable, sin perder la seriedad necesaria para que un comercio confíe en dar sus datos de pago.

**Principios**
- Fondos claros, casi blancos con tinte de color, nunca blanco puro plano.
- Un solo color fuerte por vez (nunca dos acentos saturados compitiendo en la misma pantalla).
- Bordes finos (0.5–1px), radios de esquina suaves (10–14px), cero sombras duras.
- El sello de "Verificado" y la cinta de "Destacado" siguen siendo el único lugar donde el diseño se permite un gesto más ilustrativo — todo el resto es plano y quieto.

---

## 2. Paleta de colores

| Token | Hex | Uso |
|---|---|---|
| `--background` | `#FAF8FC` | Fondo general (blanco con tinte lavanda) |
| `--surface` | `#FFFFFF` | Cards, inputs, elementos elevados |
| `--foreground` | `#3A3550` | Texto principal (ciruela oscuro, no negro puro) |
| `--muted-foreground` | `#8B87A0` | Texto secundario, metadatos |
| `--border` | `#E6E1ED` | Líneas finas, separadores |
| `--primary` | `#9FCFC0` | Botones principales, links, estado activo (menta pastel) |
| `--primary-foreground` | `#1F3B34` | Texto sobre `--primary` |
| `--accent-destacado` | `#F5CBA7` | Cinta "Destacado" (subscripción activa) — durazno pastel |
| `--accent-destacado-foreground` | `#6B4423` | Texto sobre el accent |
| `--verified` | `#E8A7B0` | Sello "Verificado" — rosa pastel |
| `--verified-foreground` | `#6B2430` | Texto/trazo del sello |
| `--success` | `#B8DDB0` | Confirmaciones (ej. "solicitud enviada") |
| `--warning` | `#F3DFA0` | Estados pendientes (verificación/subscripción en revisión) |
| `--destructive` | `#EFB0AE` | Rechazos, eliminar (pastel, no rojo saturado) |

**Modo oscuro (opcional, v2):** no es prioritario para este producto — el público objetivo navega de día, en la calle, comparando precios. Si se agrega, oscurecer `--background` a `#211F2B` y subir la luminosidad de los pasteles ~15% para que no se vean apagados.

---

## 3. Tipografía

| Rol | Fuente | Peso | Uso |
|---|---|---|---|
| Encabezados / nombre de shop | **Sora** | 600 | Títulos de pantalla, nombre de tienda en el perfil |
| Cuerpo / UI general | **Inter** | 400 / 500 | Texto de productos, botones, formularios |
| Precios / metadatos | **IBM Plex Mono** | 400 | Precios, distancia, fecha — mantiene el guiño de "etiqueta" sin ser decorativo |

Escala tipográfica sugerida (Tailwind): `text-xs` (12px) metadatos → `text-sm` (14px) cuerpo → `text-base` (16px) inputs/botones → `text-lg` (18px) subtítulos → `text-2xl` (24px) títulos de pantalla. Nada por encima de `text-2xl` — no hay heros gigantes, es una app de uso utilitario.

---

## 4. Espaciado, radios y bordes

- Radio base: `10px` en inputs y botones, `14px` en cards.
- Bordes: `0.5px solid var(--border)` como default; nunca sombra para dar jerarquía, solo el borde y el fondo `--surface` contra `--background`.
- Grid de cards del feed: `gap: 12px`, padding interno de card `16px`.
- Contenedores de pantalla: `padding: 16px` en mobile, `24px` en desktop.

---

## 5. Mapeo a shadcn/ui + Tailwind

```ts
// tailwind.config.ts — extend.colors
colors: {
  background: "#FAF8FC",
  surface: "#FFFFFF",
  foreground: "#3A3550",
  muted: {
    DEFAULT: "#F1EEF6",
    foreground: "#8B87A0",
  },
  border: "#E6E1ED",
  primary: {
    DEFAULT: "#9FCFC0",
    foreground: "#1F3B34",
  },
  destacado: {
    DEFAULT: "#F5CBA7",
    foreground: "#6B4423",
  },
  verified: {
    DEFAULT: "#E8A7B0",
    foreground: "#6B2430",
  },
  success: { DEFAULT: "#B8DDB0", foreground: "#274023" },
  warning: { DEFAULT: "#F3DFA0", foreground: "#4A3B0E" },
  destructive: { DEFAULT: "#EFB0AE", foreground: "#5C1F1D" },
},
borderRadius: {
  DEFAULT: "10px",
  lg: "14px",
},
fontFamily: {
  sans: ["Inter", "sans-serif"],
  display: ["Sora", "sans-serif"],
  mono: ["IBM Plex Mono", "monospace"],
},
```

Componentes de shadcn a usar tal cual, sin reescribir:
- `Button` (`variant="default"` = primary menta; `variant="outline"` para acciones secundarias; nunca más de un botón `default` por pantalla)
- `Input`, `Select`, `Textarea` para formularios de carga de producto
- `Card` para producto/shop, solo `CardContent` (sin header/footer por defecto, se agregan si el contenido lo pide)
- `Badge` para categoría y estados (`pending`/`active`/`rejected` de subscripción usan `warning`/`success`/`destructive`)
- `Dialog` para confirmar acciones sensibles (aprobar subscripción, eliminar producto)
- `Tabs` en el dashboard del superadmin (Shops / Categorías / Subscripciones)

Componentes propios (no vienen en shadcn):
- `<VerifiedStamp />`: círculo con doble borde `--verified`, texto rotado -8°, ícono de check chico en el centro.
- `<FeaturedRibbon />`: cinta esquinera `--accent-destacado`, esquina superior izquierda de la card.
- `<WhatsAppButton />`: botón ancho, ícono + "Contactar por WhatsApp", `bg-primary`, siempre visible sin scroll en el perfil de shop.

---

## 6. Pantallas clave (wireframes en texto)

### 6.1 Feed público (mobile-first)
```
┌────────────────────────────┐
│ [🔍 Buscar productos]  [📍]│
│ [Todos][Comida][Ropa][+]   │  ← chips scroll horizontal
├────────────────────────────┤
│ ┌────────┐ ┌────────┐      │
│ │ 🎗️img  │ │  img 🔴│      │  🎗️ = cinta destacado
│ │ nombre │ │ nombre │      │  🔴 = sello verificado
│ │ $precio│ │ $precio│      │
│ └────────┘ └────────┘      │
│ ┌────────┐ ┌────────┐      │
│ │  img   │ │  img   │      │
│ └────────┘ └────────┘      │
└────────────────────────────┘
```
Orden: destacados primero, luego por cercanía (si el usuario dio permiso de ubicación), luego por fecha.

### 6.2 Perfil de shop
```
┌────────────────────────────┐
│ [cover]                    │
│  (logo) Nombre del shop 🔴 │
│  categoría · 1.2 km        │
│  [ Contactar por WhatsApp ]│
│  [ Ver en mapa ] [ QR ↗ ] │
├────────────────────────────┤
│ Productos                  │
│ ┌────────┐┌────────┐       │
│ │  img   ││  img   │       │
│ └────────┘└────────┘       │
└────────────────────────────┘
```

### 6.3 Onboarding (post-login, primera vez)
```
┌────────────────────────────┐
│   ¿Qué querés hacer?       │
│  ┌───────────┐┌───────────┐│
│  │  Quiero    ││  Quiero   ││
│  │  comprar   ││  vender   ││
│  │  (Cliente) ││  (Shop)   ││
│  └───────────┘└───────────┘│
└────────────────────────────┘
```
Dos `Card` grandes clickeables, sin texto de más — la decisión se toma en un tap, no con un formulario.

### 6.4 Dashboard shop admin
```
┌─────┬──────────────────────┐
│ Mi  │ Estado: Free          │
│shop │ [Mejorar visibilidad] │
│Prod.│ ──────────────────── │
│Config│ Productos (12)        │
│     │ [+ Nuevo producto]    │
│     │ tabla: nombre|precio|●│
└─────┴──────────────────────┘
```

### 6.5 Panel superadmin
```
[Shops] [Categorías] [Subscripciones]  ← Tabs
Solicitudes pendientes de verificación:
┌──────────────────────────────┐
│ Panadería Norte  [ver doc] ✔✘│
│ Estudio Lana     [ver doc] ✔✘│
└──────────────────────────────┘
```

---

## 7. Estados vacíos y feedback

Siguiendo tono de interfaz (no de persona), directo y accionable:

- Feed sin resultados: "No encontramos comercios en esta categoría. Probá con otra o ampliá la distancia."
- Shop sin productos cargados: "Todavía no cargaste productos. Agregá el primero para aparecer en el feed."
- Subscripción pendiente: "Tu solicitud está en revisión. Te avisamos apenas se apruebe."
- Verificación rechazada: mostrar el motivo que carga el superadmin, no un mensaje genérico.

---

## 8. Accesibilidad

- Contraste: verificar que `--muted-foreground` (#8B87A0) sobre `--background` cumpla AA para texto ≥14px; si no, oscurecerlo a `#767296`.
- Foco visible en todos los inputs y botones (ring de 2px con `--primary` al 40% opacidad).
- El sello y la cinta son decorativos — su información (verificado/destacado) debe repetirse en texto para lectores de pantalla (`aria-label="Comercio verificado"`).
- Todos los botones de acción (WhatsApp, QR, favoritos) con `aria-label` explícito además del ícono.
