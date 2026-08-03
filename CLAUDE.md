@AGENTS.md

# Mercatren.com

Servicio de comercio electrónico transfronterizo de **Windoce LLC** (Estados
Unidos). Funciona como agente de compras y agente de ventas a la vez: el cliente
compra productos de Estados Unidos y los recibe en su país, y cualquier vendedor
puede abrir su tienda dentro del sitio y llegar a nuevos mercados.

Es un **mercado multi-tienda**: muchos vendedores, cada uno con su tienda, y una
comisión para Mercatren en cada venta.

---

## Perímetro del proyecto (REGLA CRÍTICA)

Esta sesión trabaja **únicamente** en `/Users/windocellc/Mercatren.com`.

- Todo lo que no sea de Mercatren se detiene y se avisa: pertenece a otra sesión.
- **Publicación:** solo en **YaDominios Cloud**. Ninguna otra plataforma.
- **Recursos permitidos** (lista cerrada; lo que no esté aquí, no se toca):
  - Sitio de YaDominios Cloud: `mercatren` → `mercatren.sitios.dev` → `mercatren.com`
  - Base de datos del sitio: binding `DB` (SQLite que da la plataforma)
  - Archivos del sitio: binding `BUCKET` (R2 que da la plataforma)
- **Prohibido crear recursos remotos** (bases, buckets, dominios, subdominios)
  aunque "hagan falta". Se propone y se espera el sí.
- Las migraciones se **escriben** libremente en `drizzle/migrations/`, pero
  **aplicarlas contra la base real requiere autorización expresa cada vez**.

---

## Cómo está armado

| Pieza                 | Qué se usa                                                    |
| --------------------- | ------------------------------------------------------------- |
| Framework             | Next.js 16 (App Router) + React 19 + TypeScript estricto      |
| Estilos               | Tailwind CSS v4 (colores de marca en `src/app/globals.css`)   |
| Aplicación instalable | Serwist (`src/sw.ts`, `src/app/manifest.ts`)                  |
| Base de datos         | SQLite de YaDominios Cloud (`env.DB`) con Drizzle ORM         |
| Cuentas               | Better Auth con adaptador de Drizzle                          |
| Cobros                | Stripe Connect (pago dividido vendedor / comisión)            |
| Bilingüe              | next-intl (`/es` y `/en`)                                     |
| Datos en el navegador | TanStack Query + Zustand                                      |
| Pruebas               | Vitest + Testing Library (unidad), Playwright (punta a punta) |
| Publicación           | GitHub Action → rama `yapanel-build` → YaDominios Cloud       |

### Estructura

```
src/app/[locale]/(tienda)/  lo que ve el público (con encabezado y pie)
src/app/[locale]/panel/     administración (menú lateral, exige sesión)
src/app/datos/              rutas de servidor (login, avisos de Stripe…)
src/components/             layout, marca, panel, ui
src/lib/zelle/              contabilidad, lectura de comprobantes, consultas
src/i18n/              configuración de idiomas y navegación
src/lib/               db, auth, stripe, dinero, rutas, utils
src/proxy.ts           redirección por idioma (en Next 16 se llama proxy, no middleware)
src/sw.ts              trabajador de la aplicación instalable
messages/es.json       textos en español
messages/en.json       textos en inglés
drizzle/migrations/    SQL versionado (no se aplica solo)
tests/ e2e/            pruebas
scripts/               generación de iconos
```

**Ojo con el service worker:** el plugin `@serwist/next` trabaja con webpack y
este proyecto compila con Turbopack, así que `public/sw.js` lo genera
`npm run sw` (el generador propio de Serwist) **antes** de `next build`. Por eso
el script `build` son dos pasos. No volver a meter `withSerwistInit` en
`next.config.ts`: no genera nada y confunde.

---

## Reglas propias de este proyecto

1. **Nada de rutas `/api/`.** En YaDominios Cloud ese prefijo lo capturan los
   archivos estáticos antes de llegar al código. Se usa `/datos`, `/media` y
   `/upload` (ver `src/lib/rutas.ts`). El login vive en `/datos/auth`.
2. **El dinero siempre en centavos enteros.** Nunca decimales. Las comisiones
   van en puntos base (1000 = 10%). Todo eso está en `src/lib/dinero.ts` y tiene
   pruebas: si se toca, las pruebas deben seguir pasando.
3. **Todo texto del público es bilingüe.** Se agrega en `messages/es.json` _y_ en
   `messages/en.json`. Hay una prueba que falla si falta una traducción. En el
   panel, cada campo que ve el público lleva dos casillas (español e inglés).
4. **El inglés tiene que ser de nativo**, neutro y profesional de EE.UU. Nunca
   traducción literal del español.
5. **Nuestras cuentas se llaman "Soporte".** Cualquier cuenta de Windoce LLC
   dentro del sistema lleva la palabra Soporte en el nombre visible. El rol
   correspondiente es `soporte`.
6. **El botón de borrar nunca va a la vista**: siempre dentro del menú de tres
   puntos, y con confirmación aparte.
7. **El pie de página lleva el crédito de Windoce LLC** con enlace a
   windoce.com en pestaña nueva. No se quita.
8. **Nada de datos de prueba ni datos reales de nadie** en placeholders, valores
   por defecto o semillas. Los placeholders describen el campo, no dan ejemplos
   de personas.
9. **Antes de publicar un cambio que se vea, se prueba en el navegador** y se
   muestra la captura.

---

## Panel de administración

Vive en `/[locale]/panel` y **exige sesión con rol `soporte` o `validador`**.
Sin eso, redirige a `/entrar`. Ahí adentro hay dinero real de comercios y datos
de quienes pagaron: nunca se deja abierto.

Para crear la cuenta de acceso (con el servidor levantado):

```bash
CLAVE='tu-contraseña-larga' npm run soporte:crear -- "Soporte Windoce" soporte@windoce.com
```

El nombre visible **debe** contener la palabra "Soporte"; el script no deja
guardar otra cosa. El rol no se puede mandar desde el formulario de registro: se
asigna aparte, a propósito.

Secciones: Resumen · **Pagos Zelle** · Por validar · Órdenes · Tiendas ·
Clientes · Configuración. Las cuatro últimas están con la estructura lista y sin
datos todavía.

## Pagos por Zelle

Es la pasarela de cobros por comercio. El flujo del negocio:

1. El pagador (normalmente un familiar en Estados Unidos) transfiere por Zelle y
   **sube la captura**.
2. Un **validador** comprueba que el pago esté de verdad en el banco.
3. Al aprobarlo, el monto **se acredita a la billetera** del comercio.
4. El comercio entrega el producto en su país.

La billetera se apoya en el **WaaS de tokiia.com**: el saldo que guardamos es un
espejo, la fuente de verdad es el proveedor. Las pantallas de aprobar/rechazar y
la conexión con el proveedor **todavía no están hechas**; la cola de validación
ya se ve en `/panel/validacion`.

### Reglas de estos datos (NO negociables)

1. **Solo suman las entradas.** `tipo = 'retiro'` se guarda y se lista, pero
   jamás entra en un total. La regla vive en `src/lib/zelle/contabilidad.ts` y
   tiene pruebas; en la base es el filtro `tipo = 'entrada'`.
2. **Una sola tabla para todo:** `pagos_zelle`. El histórico importado va con
   `origen = 'import'` y los pagos nuevos con `origen = 'live'`.
3. **El histórico está congelado.** Son operaciones ya procesadas de la cuenta
   de prueba en vivo (Bley Ferretería): 743 movimientos, **666 entradas
   aprobadas por $337,261.22**, más 5 rechazadas y 2 pendientes.
4. **Las capturas no se migraron.** Cada registro guarda la dirección pública de
   su imagen en el almacenamiento original y se muestra desde ahí.
5. **El archivo fuente no entra al repositorio** (ver `datos/LEEME.md`): trae
   nombres, correos y comprobantes de personas reales, y el repo es público.

### Cuidado con lo que dice el comprobante

El lector automático guarda en `sender_name` lo que sale en la captura, y **casi
nunca es el nombre de quien paga**: suele ser el producto bancario de la cuenta
de origen ("Adv SafeBalance Banking - 1030"). Por eso `src/lib/zelle/clasificar.ts`
separa lo que sí se puede saber — banco, últimos cuatro dígitos y si detrás hay
una persona, una empresa o solo una cuenta — y deja "sin identificar" cuando no
alcanza. **No inventar el pagador a partir de ese campo.**

Lo mismo con `recipient_name`: llega con decenas de variantes ("WINDOC",
"Windows Llc", "Wind Once Llc"). La cuenta receptora se identifica por el
**correo**, que sí es exacto.

### Reimportar el histórico

```bash
npm run zelle:importar   # arma el SQL desde datos/ y comprueba los números
npm run db:local         # migraciones + datos en la base de tu computadora
```

El importador **se detiene** si los totales no cuadran con los números de
control del propio archivo. Llevar esto a producción requiere autorización
expresa y se hace aparte.

---

## Comandos

```
npm run dev             # servidor local
npm run build           # genera el service worker y compila
npm run sw              # solo regenera public/sw.js
npm run test:run        # pruebas de unidad
npm run e2e             # pruebas de punta a punta
npm run typecheck       # revisar tipos
npm run lint            # revisar código
npm run db:generar      # generar SQL de migración (NO la aplica)
npm run db:local        # aplicar migraciones + histórico a la base local
npm run zelle:importar  # rearmar el SQL del histórico de pagos
npm run soporte:crear   # crear la cuenta que entra al panel
npm run iconos          # regenerar iconos y tarjeta social desde el logo
npm run cf:tipos        # regenerar tipos de los bindings
npm run cf:build        # compilar para YaDominios Cloud
```

**Secretos:** nunca en el repositorio. Local en `.dev.vars`, producción en el
panel de YaDominios Cloud. La lista está en `.env.example`.

**Logo:** los archivos oficiales están en `public/logo_mercatren/`. Las
variantes `-oscuro` son las que van **sobre fondo azul**. Colores de marca:
azul `#10263A` y naranja `#FF6B1A`.
