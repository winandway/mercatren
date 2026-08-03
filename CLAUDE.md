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
- **Las tablas llegan a producción por `schema.sql`** (en la raíz del repo):
  YaDominios Cloud lo ejecuta contra `env.DB` en cada publicación. Se genera
  con `npm run db:schema-cloud` (DDL idempotente + comercio piloto con
  billetera en CERO) y **se commitea**. Si una migración nueva trae ALTER/DROP,
  el generador se detiene: ese cambio se piensa a mano.
- **`schema.sql` se mantiene CHICO (~13 KB).** Corre entero en cada
  publicación, antes de que el sitio quede en vivo: con el catálogo dentro
  pesaba 556 KB y un despliegue lento se cae y deja el sitio sin publicar.
  Solo van las tablas, que es lo único que el sitio necesita para arrancar.
  **El catálogo y el histórico se cargan aparte, una sola vez.**
- **El histórico Zelle JAMÁS va en schema.sql**: trae nombres y correos de
  personas reales y el repositorio es público. Se carga aparte, directo a la
  base, con autorización expresa.

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
src/components/             layout, marca, panel, cuenta, ui
src/lib/                    db, auth, stripe, dinero, fechas, rutas, utils
src/lib/alcance.ts          qué comercio puede ver quién (puro, con pruebas)
src/lib/autorizacion.ts     sesión, roles y alcance
src/lib/zelle/              contabilidad, lectura de comprobantes, consultas, acciones
src/i18n/                   configuración de idiomas y navegación
src/middleware.ts           idioma y primera barrera del panel (NO renombrar a proxy.ts)
src/sw.ts                   trabajador de la aplicación instalable
messages/es.json            textos en español
messages/en.json            textos en inglés
datos/                      archivos fuente reales (NO se suben al repo)
drizzle/migrations/         SQL versionado (no se aplica solo)
tests/ e2e/                 pruebas
scripts/                    iconos, importación del histórico, alta de cuentas
```

**Ojo con el middleware:** Next 16 recomienda `proxy.ts`, pero proxy compila
SIEMPRE como funcion Node y el adaptador de Cloudflare (OpenNext) solo acepta
el middleware en runtime edge: el build de publicacion se cae con "Node.js
middleware is not currently supported". Por eso el archivo se llama
`src/middleware.ts` (convencion vieja, compila a edge). No renombrarlo a
proxy.ts hasta que OpenNext lo soporte.

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
   van en puntos base (300 = 3%, que es la del piloto). Todo eso está en
   `src/lib/dinero.ts` y tiene pruebas: si se toca, las pruebas deben seguir
   pasando.
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
10. **Ningún enlace puede llevar a un 404.** Si se agrega un enlace en el menú
    o en el pie, la página tiene que existir. `e2e/enlaces.spec.ts` recorre las
    páginas públicas, junta todos sus enlaces internos y falla si alguno
    responde 400 o más. Se corre con `npm run e2e`.

---

## Esto es un servicio para MUCHOS comercios (regla de cabecera)

Mercatren **no es el panel de un cliente**. Es un servicio multi-comercio: hoy
hay un piloto, y los que lleguen se registran solos. Cada comercio entra con su
cuenta y **solo ve sus pagos y su saldo**.

Por eso, cualquier consulta nueva que devuelva dinero o datos de pagadores
**tiene que pasar por el alcance** (`obtenerAlcance()` en
`src/lib/autorizacion.ts`). La decisión de qué comercio se consulta está en
`src/lib/alcance.ts`, es pura y tiene pruebas: si quien pregunta es un comercio,
se usa el suyo aunque en la dirección venga pedido otro.

| Rol         | Qué ve                                                     |
| ----------- | ---------------------------------------------------------- |
| `soporte`   | Toda la operación, todos los comercios, y la configuración |
| `validador` | Toda la operación y la cola de validación                  |
| `vendedor`  | Solo su propio comercio: sus pagos y su billetera          |
| `cliente`   | No entra al panel                                          |

## Panel de administración

Vive en `/[locale]/panel` y **exige sesión con un rol con permiso**. Sin eso,
redirige a `/entrar`. Ahí adentro hay dinero real de comercios y datos de
quienes pagaron: nunca se deja abierto.

Para crear cuentas (con el servidor levantado):

```bash
# equipo de Mercatren
CLAVE='tu-contraseña-larga' npm run cuenta:crear -- "Soporte Windoce" soporte@windoce.com

# un comercio, vinculado a su tienda
CLAVE='…' npm run cuenta:crear -- --rol=vendedor --tienda=tienda-bley-ferreteria "Bley Ferretería" correo@delcomercio.com
```

El nombre visible de una cuenta nuestra **debe** contener la palabra "Soporte";
el script no deja guardar otra cosa. El rol no se puede mandar desde el
formulario de registro: se asigna aparte, a propósito.

Secciones: Resumen · **Pagos Zelle** · Por validar · Billetera · Órdenes ·
Comercios · Clientes · Configuración. Las tres últimas son solo del equipo, y
Órdenes y Clientes todavía no tienen datos.

## El comercio se administra solo

En `/panel/mi-tienda` cada comercio maneja lo suyo: **logo, portada,
descripción bilingüe y datos de empresa** (razón social, identificación
fiscal, correo, teléfono, dirección, ciudad, sitio web y horario). Todo eso
sale en su tienda pública; **lo que deja vacío no se muestra**, para que la
ficha nunca tenga huecos.

- La tienda que se edita sale del **alcance de la sesión**, nunca de la
  dirección: un vendedor solo puede tocar la suya. El equipo puede abrir la de
  un comercio con `?comercio=slug`.
- El comercio **no** puede cambiar su comisión, su estado ni su slug: lo
  primero lo acuerda Mercatren y lo último rompería los enlaces que circulan.
- Las imágenes se suben con `src/lib/subidas.ts` (tipo y tamaño se comprueban
  en el servidor, no en el navegador) y la anterior se borra **después** de
  guardar la nueva.

**Columnas nuevas en `tiendas`:** `razon_social`, `identificacion_fiscal`,
`correo_contacto`, `telefono`, `direccion`, `ciudad`, `sitio_web`, `horario`.
Se aplicaron a producción con `ALTER TABLE` vía `npm run db:cargar`, y a la
base local igual. **Ojo al agregar columnas:** `schema.sql` solo trae
`CREATE TABLE IF NOT EXISTS`, así que una base que ya existe NO las recibe
sola; hay que aplicar el ALTER a mano, una vez, con el token.

## El comercio piloto

`Bley Ferretería` (id `tienda-bley-ferreteria`) viene del MVP anterior. Lo crea
el propio importador con los datos del archivo, junto con su billetera.

**La billetera arranca en CERO a propósito:** todo el histórico ya se le liquidó
en el sistema anterior, así que darle ese saldo aquí sería pagarle dos veces.
Solo suma lo que se apruebe de ahora en adelante.

Sus productos todavía no se han migrado.

## Pagos por Zelle

Es la pasarela de cobros por comercio. El flujo del negocio:

1. El pagador (normalmente un familiar en Estados Unidos) transfiere por Zelle y
   **sube la captura**.
2. Un **validador** comprueba que el pago esté de verdad en el banco.
3. Al aprobarlo, el monto **se acredita a la billetera** del comercio.
4. El comercio entrega el producto en su país.

Aprobar y rechazar ya funcionan en `/panel/validacion`: al aprobar, el **neto**
(monto menos comisión) se le acredita al comercio y queda el movimiento en su
billetera. Rechazar obliga a escribir el motivo. Todo el trabajo de aprobar va
en un solo envío a la base y el saldo se suma con `saldo = saldo + X`, para que
dos validadores a la vez no se pisen.

Lo que **falta**: conectar la billetera con el **WaaS de tokiia.com**. El saldo
que guardamos es un espejo; cuando se conecte, la fuente de verdad pasa a ser el
proveedor y hay que sincronizar (`billeteras.proveedorBilleteraId` y
`sincronizadoEn` ya están para eso).

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

## Lo que se le cuenta al público

Páginas abiertas, sin necesidad de cuenta:

- **`/docs`** — el índice de la documentación pública. Es el enlace que se
  comparte cuando alguien (un banco, un socio) pide "muéstrame cómo funciona":
  un clic y está, sin login.
- **`/docs/modelo-de-negocio`** — el documento del modelo en HTML, bilingüe:
  "Comercio electrónico transfronterizo con liquidación doméstica". Publica la
  parte comercial del PDF (qué es, quién es quién, el ciclo con sus figuras,
  la evidencia, por qué Zelle, la economía y el resumen final). Los apartados
  de encuadre regulatorio, controles y plan de crecimiento **NO se publican**:
  van solo en el PDF completo (`public/docs/mercatren-modelo-de-negocio.pdf`),
  que se descarga desde esa misma página y está excluido de Google en
  `robots.ts`. El contenido vive en `src/contenido/docs/modelo.es.ts` y
  `modelo.en.ts`; si cambia el modelo, se actualizan LOS DOS y se sube la
  versión (V2 → V3) con su fecha.
- **`/como-funciona`** — para clientes, pagadores y comercios. Qué es el
  servicio, el paso a paso, **qué NO es** (no es remesa, no hay cambio de
  divisas, no se mueve dinero entre particulares) y por qué cada forma de pago
  cuesta distinto: Zelle 3%, tarjeta 5%, saldo sin costo.
- **`/transparencia`** — pensada para **bancos, procesadores de pago y socios**.
  Por dónde pasa el dinero paso a paso, qué no incluye la operación, cómo se
  verifica cada pago y qué queda registrado.

Dos cosas al tocar estas páginas:

1. **Describen cómo funciona la operación; no afirman su calificación
   regulatoria.** Nada de escribir que somos o no somos tal figura legal: eso lo
   decide el abogado del proyecto, no la página.
2. **Los textos legales de verdad (términos, privacidad) están pendientes de
   revisión legal** antes de publicarse.

Lo privado es privado y lo público es público: los montos, los comprobantes y
los datos de quienes pagaron **nunca** salen a estas páginas.

### SEO (posicionarse como los creadores del modelo)

- La dirección canónica del sitio y la sociedad viven en **`src/lib/sitio.ts`**
  (`SITIO.url`, `SITIO.nombre` = marca Mercatren, `SITIO.sociedad` = Windoce
  LLC). No duplicar esa constante en otro lado.
- **`src/app/sitemap.ts`** arma `mercatren.com/sitemap.xml` con las páginas
  fijas + tiendas activas + productos publicados, cada una con sus dos idiomas
  (hreflang). Esa dirección es la que se envía a **Google Search Console**.
- **`src/app/robots.ts`** cierra panel, carrito, checkout, pedido, entrar,
  `/datos/`, `/media/` y el PDF completo del modelo.
- Datos estructurados: `Organization` en el layout; `Article` + `FAQPage` en
  `/docs/modelo-de-negocio`. Página nueva pública = agregarla al sitemap y
  darle `alternates` con `rutaCanonica()` de `src/lib/sitio.ts`.
- El término que se quiere posicionar: **"comercio electrónico transfronterizo
  con liquidación doméstica"** (en inglés: _cross-border ecommerce with
  domestic settlement_).

## Catálogo y sincronización

Los comercios que ya tienen su tienda montada por fuera (el piloto es uno) no
cargan todo otra vez a mano: **traen su catálogo desde su propio sistema**.

- **El archivo de exportación ES el contrato de la API.** El mismo JSON sirve
  para importarlo a mano hoy y para que Mercatren lo lea solo mañana desde una
  dirección que ellos publiquen (`fuentes_catalogo.url`).
- **Cada producto guarda de dónde viene**: `fuente_id` + `externo_id`. La pareja
  (tienda, externo_id) es única, así que reimportar **actualiza** en vez de
  duplicar. Sin eso, la segunda sincronización llenaría el catálogo de copias.
- **Las fotos no se copian.** Si vienen de la tienda de origen se guarda su
  dirección (`imagenes_producto.url`) y se muestran desde ahí; si las sube el
  comercio a nuestro bucket, va `clave` y se sirven por `/media`. Una foto usa
  uno de los dos campos, nunca los dos.
- **Lo que el comercio quita de su tienda pasa a borrador, no se borra**: puede
  tener pedidos viejos colgando.
- **Traducciones:** si el origen no trae inglés, `titulo_en` queda vacío y en
  pantalla se muestra el español. **No se inventan traducciones.**

Tres cosas que el importador resuelve solo, porque los sistemas de origen no
siempre traen lo que uno espera:

1. **Slug que en realidad es un identificador.** Hay tiendas cuya URL es el UUID
   del producto. Usarlo dejaría direcciones como `/producto/9f3c1a7e-…`, así que
   cuando el slug parece un identificador, la dirección se arma del título. El
   id de origen se sigue guardando en `externo_id`, así que no se duplica nada.
2. **Borradores sin precio.** Un producto que el comercio aún no terminó de
   cargar entra en cero y **no se publica**. Uno publicado sin precio **detiene
   la importación**: se vendería regalado.
3. **Existencias con decimales.** `productos.existencias` es un número con
   decimales a propósito: una ferretería vende cable por metro y cemento por
   kilo. Truncar 13.5 kg a 13 le quitaría media unidad de inventario al
   comercio. **Esto vale para mercancía, no para dinero**: el dinero sigue
   siendo entero en centavos, sin excepción.

**Las fotos importadas se traen desde el panel.** El catálogo importado
apunta a las fotos del servidor del comercio de origen, y si esa tienda se
apaga, Mercatren se queda sin imágenes. En **Configuración → Fotos del
catálogo** hay un botón que las copia a nuestro bucket por tandas, con barra
de avance; se puede parar y retomar. Es idempotente: solo mira las que aún
tienen `url` y no tienen `clave`. Una foto que falle no detiene a las demás.

**La sincronización ya no necesita el archivo local.** En **Mi tienda →
Sincronizar mi catálogo** el comercio pone la dirección donde publica su
archivo de exportación y Mercatren lo lee: actualiza lo que existe (por
`fuente_id` + `externo_id`), pasa a borrador lo que él quitó, deja en
borrador lo publicado sin precio, y **no toca las fotos que ya se trajeron a
nuestro bucket**. El importador de línea de comandos sigue sirviendo para la
primera carga:

```bash
npm run productos:importar                          # desde datos/
npm run productos:importar -- --archivo=otra/ruta.json
```

El importador **se detiene** si los totales no cuadran con los del propio
archivo.

## El carrito y la compra

El carrito vive en el navegador (`src/lib/carrito/store.ts`, se guarda solo) y
sirve **solo para saber qué quiere comprar el cliente**. Al confirmar,
`crearPedido()` vuelve a leer de la base el precio, la disponibilidad y la
comisión de cada producto. Si alguien manipula lo que tiene guardado para
ponerse un precio de un dólar, aquí no le sirve de nada.

- **Hay que tener cuenta para comprar**: el pago debe poder acreditarse a
  alguien y el cliente tiene que poder seguir su pedido.
- **Las existencias NO se descuentan al crear el pedido**, sino cuando el pago
  queda confirmado. Así un carrito abandonado no deja mercancía bloqueada. A
  cambio, el validador tiene que mirar que quede stock antes de aprobar.
- **Envío e impuestos van en cero por ahora**: se acuerdan con el comercio.
  Cuando se definan, entran en `crearPedido()` y en el total.
- **La cuenta de Zelle que recibe los pagos sale de `ZELLE_CORREO_RECEPTOR`.**
  Si no está configurada, la pantalla del pedido lo dice; **no inventa un
  correo**.
- El número de pedido es correlativo y legible: `MT-000001`.

## Correos del sistema (Resend)

Dos direcciones, y no se inventan otras (**regla del proyecto**):

- **`mercatren@windoce.com` RECIBE.** Es el buzón real y funcional: el
  contacto de la web, el que figura en términos y condiciones, y el Reply-To
  de todo lo que enviamos. Vive en `src/lib/correo/direcciones.ts`.
- **`noreply@mercatren.com` SOLO ENVÍA** (vía Resend). Es la voz del
  sistema: bienvenida, contraseña, compra, pagos. No recibe nada.
- **PROHIBIDO** poner de contacto un correo `@mercatren.com` sin SMTP
  (ej. soporte@mercatren.com): no recibe y el mensaje del cliente se pierde.

Cómo está armado: `src/lib/correo/` — `direcciones.ts` (las dos
direcciones), `plantilla.ts` (HTML de tablas con estilos en línea, que es lo
único que se ve bien en Gmail/Outlook), `correos.ts` (los envíos, uno por
momento del negocio), `enviar.ts` (el cliente de Resend). Los textos viven en
`messages/*.json` bajo `correos` y salen **en el idioma guardado en la
cuenta del destinatario**, no en el de quien dispara la acción.

Los 7 correos y dónde se disparan: bienvenida (alta de cuenta, hook de Better
Auth) · restablecer contraseña (`sendResetPassword`) · gracias por su compra
(`crearPedido`) · comprobante en revisión (`subirComprobante`) · compra
aprobada y venta acreditada al comercio (`aprobarPago`) · pago no aprobado
con el motivo (`rechazarPago`).

**El correo nunca es requisito:** si Resend falla o `RESEND_API_KEY` no está
configurada, se registra el aviso perdido y la operación sigue. Un pago
aprobado jamás se deshace porque el aviso no salió. Para que los envíos
funcionen hace falta la clave en el panel y el dominio mercatren.com
verificado en Resend.

## Los datos bancarios NO van en el código (REGLA CRÍTICA)

La cuenta que recibe los pagos, sus rutas ACH y wire y el correo de Zelle salen
**siempre** de variables de entorno: `PAGO_CUENTA`, `PAGO_RUTA_ACH`,
`PAGO_RUTA_WIRE`, `ZELLE_CORREO_RECEPTOR` y compañía.

**Por qué:** el repositorio es público. Un número de cuenta junto a su ruta ACH
es justo lo que hace falta para intentar un cobro no autorizado en Estados
Unidos. En local van en `.dev.vars`; en producción, en el panel de YaDominios
Cloud. Si faltan, la pantalla del pedido lo dice; **nunca inventa datos**.

Tampoco es una página pública: los datos se le muestran **solo al cliente que
tiene ese pedido por pagar**.

**Solo se aceptan pagos desde bancos de Estados Unidos.** Por eso no se ofrece
SWIFT ni transferencia internacional, y la ficha lo avisa.

## El comprobante de pago

El cliente sube la captura en la página de su pedido y entra a la **misma cola
de validación** que ya usa el equipo. No hay acreditación automática: una
persona lo comprueba contra el banco.

- El archivo se guarda en el bucket como
  `comprobantes/<id del pedido>/<código aleatorio>.<ext>`.
- **La ruta `/media` los protege:** los comprobantes solo los ve el dueño del
  pedido y el equipo de Mercatren. Otro cliente recibe **404**, no un "no
  puedes" — así ni siquiera se confirma que el archivo existe. Las fotos de
  productos sí son públicas.
- Si el pedido mezcla varios comercios, el pago queda **sin comercio asignado**
  y lo resuelve el equipo: repartir un pago entre comercios es una decisión de
  negocio, no algo que deba adivinar el sistema.
- Solo se acepta una captura pendiente por pedido.

**Ojo con la ruta `/media`:** devuelve el contenido completo del archivo, no el
flujo del bucket, y arma las cabeceras a mano. Copiar los metadatos de R2 o
pasar su flujo tal cual falla en el servidor de desarrollo.

## Comandos

**Ojo al correr `npm run e2e`:** apaga antes cualquier `npm run dev` que
tengas abierto. Dos servidores de desarrollo sobre la misma carpeta `.next`
se corrompen la caché entre ellos y el sitio empieza a dar 500 con un error de
JSON que no tiene nada que ver con el código. Las pruebas corren con **dos
procesos como máximo** (`playwright.config.ts`) porque el servidor de
desarrollo compila cada ruta la primera vez que se pide.

```
npm run dev             # servidor local
npm run build           # genera el service worker y compila
npm run sw              # solo regenera public/sw.js
npm run test:run        # pruebas de unidad
npm run e2e             # pruebas de punta a punta
npm run typecheck       # revisar tipos
npm run lint            # revisar código
npm run db:generar      # generar SQL de migración (NO la aplica)
npm run db:schema-cloud # regenerar schema.sql (tablas + catálogo para producción)
npm run db:local        # aplicar migraciones + histórico a la base local
npm run zelle:importar  # rearmar el SQL del histórico de pagos
npm run cuenta:crear    # crear una cuenta que entra al panel
npm run db:cargar       # mandar un SQL a la base de PRODUCCIÓN (pide TOKEN_MERCATREN)
npm run productos:importar # rearmar el SQL del catálogo de un comercio
npm run iconos          # regenerar iconos y tarjeta social desde el logo
npm run cf:tipos        # regenerar tipos de los bindings
npm run cf:build        # compilar para YaDominios Cloud
```

**La clave de sesiones se resuelve sola.** `BETTER_AUTH_SECRET` manda si
está cargada en el panel; si no, el sitio genera una la primera vez y la
guarda en su propia base (tabla `configuracion`, llave `auth_secret`). Se
hizo así porque un sitio recién publicado se quedaba sin poder autenticar a
nadie hasta que una persona entrara al panel a cargarla, y eso pasó de verdad
en producción. Cargar la variable después sigue siendo lo correcto y tiene
prioridad.

**Secretos:** nunca en el repositorio. Local en `.dev.vars`, producción en el
panel de YaDominios Cloud. La lista está en `.env.example`.

**Logo:** los archivos oficiales están en `public/logo_mercatren/`. Las
variantes `-oscuro` son las que van **sobre fondo azul**. Colores de marca:
azul `#10263A` y naranja `#FF6B1A`.
