@AGENTS.md

# Mercatren.com

Tienda en línea operada por **Mercatren LLC** (Michigan, Estados Unidos).

## LA SOCIEDAD YA ES MERCATREN LLC (12 ago 2026)

**`Mercatren LLC` opera la tienda: compra, vende y factura.** `Windoce, LLC` se
queda solo como el estudio que desarrolla el software — el crédito del pie de
página, que **no debe cambiar nunca**.

**MERCATREN LLC · Michigan · miembro único.** Domicilio registrado y fiscal:
30080 Montmorency Drive, Novi, MI 48377. EIN asignado el 11 ago 2026 (carta
CP 575 del IRS). El nombre legal va **SIN coma** — así está en LARA y en el
IRS, y así tiene que escribirse en todas partes. Windoce, LLC, la anterior, de
Delaware, sí la llevaba: no es un descuido, son dos nombres distintos.

Banco en **Mercury** (Checking ••9805) y **Stripe activa**, las dos a nombre de
Mercatren LLC. Falta la cuenta de Zelle.

**EL ORDEN QUE SE SIGUIÓ, Y NO ERA NEGOCIABLE:** EIN → banco → Stripe
verificada y activa → **y recién entonces el sitio**. El sitio fue lo último a
propósito: si dice un nombre y el cobro le aparece al comprador con otro en su
estado de cuenta, eso genera reclamos y contracargos.

**LO QUE QUEDA POR CAMBIAR FUERA DEL CÓDIGO** (variables de entorno del panel
de YaDominios Cloud, no código): las claves de Stripe (`STRIPE_SECRET_KEY`,
`STRIPE_CLAVE_PUBLICA`, `STRIPE_WEBHOOK_SECRET`), el correo receptor de Zelle
(`ZELLE_CORREO_RECEPTOR` → `pagos@mercatren.com`), los datos bancarios de
Mercury (`PAGO_CUENTA`, `PAGO_RUTA_ACH`, `PAGO_RUTA_WIRE`) y el emisor de las
facturas (`EMISOR_IDENTIFICACION`, `EMISOR_DIRECCION`).

**El corte contable es un hecho, no una fecha:** el primer dólar que Stripe
liquide en la cuenta de Mercatren LLC. Las facturas anteriores seguirán
diciendo Windoce, LLC para siempre, porque copian los datos del emisor dentro
del documento — y eso es lo correcto.

**El PDF del modelo NO se regeneró.** Lo revisó el abogado y el cambio pasa por
él.

**Cómo se hizo el cambio (preparado el 11 ago 2026).** El nombre estaba
escrito a mano en **240 sitios repartidos por 26 archivos**; ahora sale entero de
**`src/lib/sociedad.ts`**. Comprobado cambiándolo de verdad: de 181 menciones del
documento del modelo, 179 pasaron solas a «Mercatren LLC» y a «Michigan». Las 2
que no son el crédito del desarrollador del pie. **El cambio real, al día
siguiente, fueron dos líneas y un push de tres minutos.**

- Los textos de idioma son JSON y no pueden importar: llevan **`«SOCIEDAD»` y
  `«ESTADO»`**, que se sustituyen al cargar en `src/i18n/request.ts`. Se usan
  comillas angulares y no `{sociedad}` a propósito: next-intl lee las llaves como
  variables ICU y un texto con una variable que nadie pasa **revienta la pantalla
  entera**.
- **`DESARROLLADOR` es otra constante, y es deliberado.** Windoce, LLC seguirá
  siendo quien programa el sitio aunque la tienda pase a otra sociedad. Hoy las
  dos dicen lo mismo y por eso es fácil confundirlas; el día del traspaso dejarán
  de decirlo.
- `tests/unit/sociedad.test.ts` **falla si alguien vuelve a escribir el nombre a
  mano** en `src/` o `messages/`. Sin ese candado, la próxima página lo trae otra
  vez y en dos meses estamos igual.
- **Lo que NO se mueve desde ahí:** el PDF del modelo (lo revisó el abogado), las
  facturas ya emitidas (copian los datos del emisor dentro, así que las viejas
  seguirán diciendo Windoce para siempre — que es lo correcto) y los comentarios
  del código.

**EL ORDEN DEL TRASPASO NO ES NEGOCIABLE, Y EL SITIO VA DE ÚLTIMO:** EIN → banco a
nombre de la sociedad nueva → Stripe **verificado y activo** → el correo de Zelle
a la cuenta nueva → **recién entonces** `sociedad.ts` y un push. Si el sitio dice
un nombre y el cobro le aparece al comprador con otro en su estado de cuenta, eso
es un contracargo.

**El corte es un hecho, no una fecha:** el primer dólar que Stripe liquide en la
cuenta de la sociedad nueva. Ni un hueco ni un solapamiento.

## LA FIGURA JURÍDICA (regla de cabecera, agosto 2026)

> Cambio hecho el 12 ago 2026: donde antes decía Windoce, LLC ahora dice
> Mercatren LLC. El modelo no cambió ni una coma — solo quién lo opera.

**Mercatren LLC compra y revende mercancía por cuenta propia.** No es un agente,
no cobra por cuenta de nadie y no administra dinero de terceros.

1. Un comprador en Estados Unidos compra un producto del catálogo.
2. Paga a Mercatren LLC el precio publicado, desde un banco estadounidense.
3. Mercatren LLC compra ese producto al proveedor **a nombre propio**, con
   factura emitida a Mercatren LLC.
4. El proveedor despacha a la **dirección designada por el comprador**.
5. Mercatren LLC emite factura de venta al comprador.

El dinero que entra es **ingreso propio**; el que sale es **costo de mercancía
vendida**. El ingreso de Mercatren es un **margen comercial dentro del precio
publicado**, no una comisión sobre dinero ajeno.

**Por qué importa:** la redacción anterior ("cobramos y liquidamos ese pago",
"el dinero es del comercio desde el cobro", "comisión del 3%") describe palabra
por palabra la definición de **money transmission** en Estados Unidos, que exige
licencias estatales y registro FinCEN, y es la razón por la que procesadores y
bancos cierran cuentas. El abogado y el contable lo corrigieron el 5 ago 2026.

### EL PRECIO Y LO QUE SE DECLARA (7 ago 2026)

**3 % en los dos métodos** (10 ago 2026). Antes la tarjeta iba al 2 %; se
igualó al 3 % después de comparar con el mercado — Amazon cobra 15 % en la
mayoría de categorías y Mercado Libre entre 11,8 % y 20 %. La meta declarada es
llegar a 8–10 % en menos de un año, subiendo por tramos y avisando antes.

| Método  | Margen de Mercatren | Procesador   | Precio publicado            |
| ------- | ------------------- | ------------ | --------------------------- |
| Tarjeta | 3 %                 | 2.9 % + 0.30 | `V = (base + 0.30) / 0.941` |
| Zelle   | 3 %                 | ninguno      | `V = base / 0.97`           |

**Por Zelle el comprador paga menos**, y ahora la razón es limpia: el margen es
el mismo, la diferencia entera la hace el procesador que ahí no interviene. En
$100, $103.10 contra $106.59. El checkout enseña el ahorro.

**AL CAMBIAR EL MARGEN SE RECALCULAN LOS PRECIOS PUBLICADOS, Y PRIMERO.** El
precio guardado lleva el margen dentro; si sube la constante y los precios se
quedan como estaban, la diferencia sale del bolsillo del comercio en cada
venta. El orden es: `node scripts/recalcular-precios.ts` → `npm run db:cargar`
→ recién ahí desplegar. Así, durante la publicación, el error cuesta de nuestro
lado. El plan completo está en `PLAN-COMISION.md`.

**Las tres constantes tienen que cuadrar entre sí.** `COMISION_TARJETA_PB`,
`COMISION_ZELLE_PB` (lo que el precio le COBRA al comprador) y
`tiendas.comision_puntos_base` (lo que se le DESCUENTA al comercio al
acreditar) valen 300 las tres, y por eso el esquema importa la constante en vez
de escribir 300. Del 5 al 7 de agosto estuvieron desincronizadas —2 % contra
3 %— y ese punto salía del bolsillo del comercio en cada venta, sin aparecer en
ninguna pantalla.

**Lo que se declara: el BRUTO, y el margen sale de la resta.** Stripe reporta
al IRS todo lo que entró (1099-K del bruto), y así tiene que ser: Windoce, LLC
es quien vende, los $103 de una venta de $103 son ingreso propio. La separación
la hace la declaración de la sociedad:

```
Ingreso bruto (103) − Costo de mercancía vendida (100) = Margen (3)
```

Declarar solo el margen es el error caro: Stripe reporta una cosa, la
declaración diría otra, y esa diferencia dispara la auditoría. Por eso cada
cobro lleva su desglose en la metadata (`ingreso_bruto_centavos`,
`costo_mercancia_centavos`, `margen_bruto_centavos`): no cambia un centavo de
lo que se cobra ni de lo que Stripe reporta, es el papel de trabajo del
contador pegado a la operación.

**NO SE USA STRIPE CONNECT NI PAGO DIVIDIDO, a propósito.** Un cobro dividido
(`transfer_data` + `application_fee_amount`) le diría a Stripe que el dinero es
del comercio y que nos quedamos una comisión: el 1099-K del bruto le saldría AL
COMERCIO y a nosotros solo el de la comisión. Esa es exactamente la figura de
intermediario que el abogado desarmó el 5 ago 2026. Aquí se compra y se
revende: el cobro entero es nuestro y el pago al comercio es un costo aparte.
Si alguien "arregla" esto poniendo Connect, deshace la reestructuración entera.

### LA NEGACIÓN VA EN LO LEGAL, NUNCA EN LO COMERCIAL (6 ago 2026)

Lo pidió el dueño y tiene razón. Son dos registros distintos y mezclarlos hace
daño:

- **Términos, privacidad, formularios de cumplimiento, el PDF para bancos** →
  ahí la negación explícita ES precisión, no defensa. Un abogado o un oficial
  de riesgo busca esa frase exacta, y en un contrato lo que no se dice no está.
  Se queda como está.

- **Google, la portada, la ficha de negocio, cualquier texto que lea un
  comprador** → ahí la negación es un error. Nadie llega preguntándose si
  administramos dinero ajeno; responder a una pregunta que nadie hizo planta
  la sospecha uno mismo. Amazon no dice lo que no es: dice lo que es.

Se escribe **qué gana cada uno**: el comprador tiene precio cerrado y un
comercio con nombre detrás; el comercio tiene una vitrina en Estados Unidos
sin montar operación allá. El mecanismo de compra y reventa se cuenta como
ventaja (factura en cada paso), no como descargo.

Palabras del dueño: _"no tenemos que sentir culpabilidad, al contrario,
sentirnos orgullosos de lo que estamos haciendo"_.

### Vocabulario PROHIBIDO en todo el sitio, en los dos idiomas

cobrar por cuenta de · liquidar/liquidación · custodia · retener fondos · saldo
· fondos · billetera/wallet · remesa/remittance · comisión sobre el pago ·
transferencia de dinero · intermediario financiero · agente de cobro · mandato ·
actuamos en nombre de · el pagador · el beneficiario · instrucción de pago.

En su lugar: **vendemos y facturamos · el precio de venta · margen comercial
incluido en el precio · compramos la mercancía al proveedor · el comprador · la
dirección de entrega designada · orden de compra · ingresos por ventas.**

**Hay palabras que no se salvan ni negándolas** (`NI_NEGANDO` en
`tests/unit/vocabulario-publico.test.ts`): "dinero de los comercios", "dinero
ajeno", "dinero de terceros" y sus equivalentes en inglés. En una página
comercial no van ni para decir que no; en los términos y la privacidad sí, y
por eso esos dos archivos están exentos.

Se admiten SOLO como negación explícita, y así están escritas en los términos:
"Windoce, LLC no actúa como agente, fiduciario ni depositario de ninguna de las
partes."

**El nombre legal lleva coma: `Windoce, LLC`.** Es parte del nombre registrado
en Delaware; omitirla ya causó el rechazo de un expediente estatal.

**Pendiente:** los identificadores internos del código y las tablas de la base
todavía se llaman `billetera`, `saldo` y `comision`. Es deuda técnica conocida,
no texto de cara al público; renombrarlas es una migración aparte.

---

## LO QUE FALTA SE MIRA EN `ROADMAP.md`

Cuando el dueño pregunte «¿qué tenemos pendiente?», se contesta desde ahí y por
bloques, en orden. La regla de cabecera de esa lista: **primero lo formal y lo
legal, después lo que crece.** Un negocio que factura mal o cobra a nombre
equivocado no se arregla creciendo — se arregla parando.

Al terminar algo, se marca en el mismo trabajo. Una lista desactualizada miente
igual que un panel que dice «En vivo» con el sitio caído.

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
| Cobros                | Stripe (cobro propio, sin pago dividido — ver más abajo)      |
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
5. **Nuestras cuentas se llaman "Soporte".** Cualquier cuenta de Windoce, LLC
   dentro del sistema lleva la palabra Soporte en el nombre visible. El rol
   correspondiente es `soporte`.
   **Y se crean SIEMPRE con un correo que existe y recibe de verdad**
   (hoy: `mercatren@windoce.com`). Nunca con una dirección inventada: si algún
   día hay que recuperar la contraseña, el correo se va al vacío y la cuenta
   queda perdida — y eso se descubre en el peor momento, en la calle, en medio
   de una demostración.
6. **El botón de borrar nunca va a la vista**: siempre dentro del menú de tres
   puntos, y con confirmación aparte.
7. **El pie de página lleva el crédito de Windoce, LLC** con enlace a
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
11. **Ninguna contraseña se escribe a ciegas.** Toda casilla de contraseña usa
    `<CampoClave>` (`src/components/cuenta/campo-clave.tsx`), que trae el ojito
    para verla y arranca oculta. `tests/unit/campo-clave.test.ts` falla si
    aparece un `type="password"` suelto en cualquier otro archivo.
12. **Quien olvida su contraseña se recupera solo.** `/olvide-mi-clave` pide
    el enlace y `/nueva-clave` recibe el del correo. La pantalla **nunca dice
    si el correo existe**: con otra respuesta para uno desconocido sería una
    forma cómoda de averiguar quién tiene cuenta aquí.
13. **Se puede entrar y se puede salir.** Cerrar sesión vive en el menú de
    "Cuenta y listas" del encabezado, en `/cuenta` y en el menú del panel.
    Avisa al servidor y luego hace una **carga completa**: con una navegación
    de cliente el encabezado se quedaría como estaba y el botón de Panel
    seguiría ahí.

---

## El trabajador de la aplicación instalable NO guarda nada con sesión

Serwist trae una regla para no cachear nunca la autenticación, pero está
escrita para `/api/auth/...`. **Como aquí no se usa `/api/` (regla 1), esa
protección no se activa sola.** Por eso `src/sw.ts` declara explícitamente que
`/datos`, `/media`, `/upload` y las pantallas con sesión (panel, entrar,
registro, cuenta) van **siempre a la red**.

Si se quita, vuelve un fallo muy difícil de ver: al entrar, la navegación al
panel devuelve una respuesta redirigida guardada de cuando la persona no había
entrado, el navegador la rechaza y la navegación **muere en silencio, sin
error**. Aguanta recargar y cambiar de navegador, porque el problema ya no está
en el código sino guardado dentro del navegador.

**Y no se ve al probar en local**: el trabajador solo se registra en
producción (`src/components/registro-app-instalable.tsx`). Cualquier cambio que
toque sesión, panel o comprobantes hay que comprobarlo **en el sitio
publicado**, no solo en `npm run dev`.

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
| `vendedor`  | Solo su propio comercio: sus ventas, sus cobros, su dinero |
| `cliente`   | No entra al panel                                          |

**Y no solo ve menos: lee otra cosa.** Las mismas pantallas cambian de texto
según el rol (ver «El mismo panel, leído por el comercio»). Al agregar una
pantalla o una tarjeta con dinero, la pregunta obligatoria es _«¿cómo se lee
esto desde la silla del comercio?»_.

## Panel de administración

Vive en `/[locale]/panel` y **exige sesión con un rol con permiso**. Sin eso,
redirige a `/entrar`. Ahí adentro hay dinero real de comercios y datos de
quienes pagaron: nunca se deja abierto.

Para crear cuentas (con el servidor levantado):

```bash
# equipo de Mercatren
CLAVE='tu-contraseña-larga' npm run cuenta:crear -- "Soporte Windoce" soporte@windoce.com

# un comercio, vinculado a su tienda
CLAVE='…' npm run cuenta:crear -- --rol=vendedor --tienda=tienda-bley-ferreteria "Ferremateriales Bley C.A" correo@delcomercio.com
```

El nombre visible de una cuenta nuestra **debe** contener la palabra "Soporte";
el script no deja guardar otra cosa. El rol no se puede mandar desde el
formulario de registro: se asigna aparte, a propósito.

El menú va en cuatro grupos, ordenados por **trabajo** y no por mecanismo (ver
«El panel se reordenó por TRABAJO», más abajo):

| Grupo          | Qué lleva                                          |
| -------------- | -------------------------------------------------- |
| **Ventas**     | Resumen · Órdenes · **Cobros** · Por validar       |
| **Dinero**     | Billetera · Retiros · Órdenes de compra            |
| **Mi negocio** | Mi tienda · Mis productos · Compradores · Créditos |
| **Equipo**     | Comercios · Cuentas · Configuración · Diccionario  |

El grupo **Equipo** es solo del equipo interno. Dos entradas cambian de nombre
según quién mire —«Por validar»/«En revisión» y «Por pagar a los comercios»/«Mi
dinero»— porque para cada uno son cosas distintas.

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

**Toda foto se encoge EN EL NAVEGADOR antes de subirla**
(`src/lib/imagenes/comprimir.ts`). No es un lujo: los comercios no podían subir
sus fotos. Una foto sale del teléfono con 3–8 MB, y con la conexión de
Venezuela eso es un minuto por foto y un corte a mitad de camino — quien tiene
treinta productos abandona en el tercero. Se redibuja a 1600 px (512 el logo) y
sale en WebP de unos 200 KB. Medido en el navegador: 948 KB → 133 KB.

Tres cosas de ahí que no se tocan:

1. **`accept="image/*"`, nunca una lista cerrada.** La lista dejaba fuera el
   HEIC, que es el formato **por defecto del iPhone**: al comerciante se le veía
   el carrete en gris y no podía subir ni una foto suya.
2. **Si comprimir falla, se sube el original.** Un navegador viejo, un formato
   que no se puede dibujar. Subir lento es mucho mejor que no poder subir.
3. **El comprobante de pago NO se comprime.** Ahí un validador tiene que leer el
   monto y la referencia del banco; comprimir texto es justo donde se pierde
   legibilidad, y eso es dinero.

**NUNCA pedir una tabla entera en una consulta** (`producto: productos` o
`.select()` sin columnas). Drizzle lista TODAS las columnas del esquema,
incluidas las que se acaban de agregar — y como `schema.sql` solo trae
`CREATE TABLE IF NOT EXISTS`, una base que ya existe no las recibe. El código
pide una columna que en producción no está y la pantalla revienta con 500.
**Pasó el 5 ago 2026** con `deposito_id`: en local todo perfecto, en
producción ninguna ficha de producto abría. Se arregla nombrando las
columnas, y así agregar una al esquema no puede tumbar nada.

**Columnas nuevas en `tiendas`:** `razon_social`, `identificacion_fiscal`,
`correo_contacto`, `telefono`, `direccion`, `ciudad`, `sitio_web`, `horario`.
Se aplicaron a producción con `ALTER TABLE` vía `npm run db:cargar`, y a la
base local igual. **Ojo al agregar columnas:** `schema.sql` solo trae
`CREATE TABLE IF NOT EXISTS`, así que una base que ya existe NO las recibe
sola; hay que aplicar el ALTER a mano, una vez, con el token.

## Las tiendas nacen ACTIVAS (15 ago 2026)

Decisión del dueño, y la razón es de operación, no de tecnología: **los
comercios que se registran son gente a la que él manda a registrarse.** La
aprobación era un trámite que siempre iba a conceder, así que en la práctica no
era un filtro — era una cola que nadie miraba, con el comercio del otro lado
viendo su tienda en 404 y creyendo que el sitio había perdido su trabajo.

**El control no desaparece, cambia de momento:** se revisa después y se suspende
a quien no cumpla. Es la diferencia entre frenar a todos por si acaso y frenar a
quien de verdad hace algo raro.

`pendiente` y `borrador` siguen existiendo y las pantallas los saben leer —es lo
que queda al suspender a alguien— y el botón de aprobar sigue estando, ahora en
**Comercios**, que es donde el dueño lo buscó. Estaba escondido en la ficha de
la cuenta, y no encontrarlo es lo mismo que no tenerlo.

## La tienda recién creada le daba 404 a su propio dueño (14 ago 2026)

Un comercio creó su tienda, le subió el logo y la portada, tocó «ver mi tienda»
y se encontró un **404 de su propia tienda**. La sospecha razonable fue que la
imagen pesaba demasiado; no era eso — **el banner y el logo se comprimen en el
navegador desde hace tiempo**, igual que las fotos de producto.

La causa: **una tienda nueva nace en `pendiente`** —la revisa el equipo antes de
publicarla— y `obtenerTiendaPorSlug` filtraba por `estado = 'activa'` dentro de
la consulta. Así que la ficha no existía para nadie, ni para su dueño.

Desde su silla, un 404 no se lee como «está en revisión»: se lee como que el
sitio perdió su trabajo. Y lo primero que uno piensa es que la culpa fue de la
foto que acaba de subir.

**Ahora la consulta trae el estado y NO filtra por él**; quién puede ver la
ficha lo decide `src/lib/tiendas/visibilidad.ts` (puro, 10 pruebas), que sabe
quién está mirando:

- **Su dueño y el equipo** la ven, con una franja amarilla arriba del todo que
  dice por qué todavía no es pública y qué falta.
- **Un visitante sigue recibiendo 404.** Enseñar tiendas sin revisar al público
  es justo lo que la revisión viene a evitar, y un 404 ni siquiera confirma que
  ese nombre exista.
- **Otro comercio tampoco.** Se compara el id de la tienda con el de quien
  mira; sin eso, cualquiera espiaría la tienda sin publicar de un competidor
  escribiendo su dirección.
- **Google no la indexa** mientras no sea pública, aunque su dueño la esté
  viendo: si la guarda durante la revisión, queda en sus resultados una tienda
  que quizá no se aprobó nunca.

## El comercio piloto

`Ferremateriales Bley C.A` (id `tienda-bley-ferreteria`) viene del MVP
anterior. Lo crea el propio importador con los datos del archivo, junto con su
billetera.

**Su slug es `bley-ferreteria` y NO se cambia**, aunque el nombre visible ya no
lo diga: es la dirección pública de su tienda, está en el mapa del sitio que ya
recibió Google y en los enlaces que circulan. El nombre visible se corrigió el
5 ago 2026 (decía "Bley Ferretería"); el slug se quedó como estaba a propósito.

**El nombre de un comercio lo manda el COMERCIO, no un script.** El importador
del histórico lo escribía en cada corrida (`ON CONFLICT DO UPDATE SET nombre`),
así que reimportar le devolvía el nombre viejo semanas después, sin que nadie
entendiera por qué. Ya no: el script solo lo pone al dar de alta la tienda.

**El saldo de su billetera NO se escribe a mano: se calcula.**

```
entradas aprobadas − comisión = neto del comercio
neto − retiros ya hechos      = lo que tiene a su favor
```

Con el histórico eso da **$24,283.75**, exactamente lo que el comercio ve en su
sistema anterior. Ese dinero no está en una cuenta aparte: está en la cuenta
del banco, a favor de él, esperando a que lo pida.

**Antes esto estaba mal.** Aquí decía que la billetera arrancaba en cero porque
el histórico "ya se le había liquidado". No es cierto: de los $327,143.25 que
se le acreditaron, retiró $302,859.50 en 70 retiros y el resto sigue siendo
suyo. Lo corrigió el dueño del negocio el 3 ago 2026 con las capturas del
sistema anterior.

**Ojo con la regla de los retiros.** En los totales del NEGOCIO (ingresos,
comisión) los retiros no se suman nunca — eso sigue igual. Pero el saldo de una
billetera es justo lo contrario: es lo que queda DESPUÉS de restarlos. Son dos
preguntas distintas sobre los mismos datos. La cuenta vive en
`src/lib/zelle/billetera.ts`.

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

**Sacar el dinero ya funciona.** En `/panel/retiros` el comercio pide cuánto
y cómo —a otro comercio de Mercatren, ACH o wire—, el monto **se aparta al
pedirlo** (si no, con $2,000 pediría $1,000 tres veces) y al equipo le entra
en una cola. El botón del equipo dice **"Ya lo pagué"**, no "Pagar": la
transferencia la hace una persona en el banco y aquí solo queda la
constancia. Los retiros nuevos viven en la tabla `retiros`; los 70 del
histórico siguen congelados en `pagos_zelle` y el saldo suma los dos.

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
   de prueba en vivo (Ferremateriales Bley C.A): 743 movimientos, **666 entradas
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
  cuesta distinto: el margen de Mercatren es 3% en los dos, pero la tarjeta
  además lleva el 2.9% + $0.30 del procesador y Zelle no.
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

**Todo el detalle vive en `SEO.md`**, en la raíz: etiquetas, datos
estructurados, mapa del sitio, robots, Merchant Center, mediciones y lo
pendiente. Se actualiza en el mismo trabajo que toque cualquiera de esas
cosas. Cuando el dueño pida "escanea" o "¿ya está posicionando?", los pasos
exactos están en la primera sección de ese archivo.

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

## El catálogo de Estados Unidos (15 ago 2026)

Se elige en **Panel → Catálogo de Estados Unidos**, buscando en CJ Dropshipping.
La decisión se toma viendo **lo que de verdad queda** —después de que CJ, el
envío y Stripe cobren lo suyo—, que es algo que el panel de CJ no puede enseñar
porque no conoce nuestras tarifas. El margen aquí es **30 %**
(`COMISION_US_PB`), no el 3 % de Venezuela: allá el comercio pone la mercancía
y responde por ella; aquí Mercatren compra, despacha y asume la devolución y el
contracargo.

**Cuelga de una tienda interna nuestra** (`tienda-mercatren-us`), porque en
Estados Unidos **Mercatren LLC es quien vende y factura**. Se crea sola la
primera vez, con su billetera, y es lo que Merchant Center necesita: un solo
vendedor responsable con una política de envío y una de devoluciones.

**El producto se publica al agregarlo, y cae en su departamento.** Antes nacía
en borrador —la intención era buena, una ficha de dos líneas en inglés es media
suspensión en Merchant Center— pero en borrador **no se ve en la tienda**, así
que el catálogo se armaba a ciegas. El riesgo de Google se atiende donde de
verdad está: en el archivo que se le manda, no en la tienda.

**El departamento se calcula de la categoría que ya trae CJ**
(`src/lib/cj/departamento.ts`, puro, 10 pruebas) y **se ve en la tarjeta antes
de pulsar el botón**: así el que caiga mal se corrige en ese momento y no en una
revisión de trescientos productos ya publicados. Se prueba del nivel más
específico al más general —«Wallets» antes que «Women's Clothing»—, y el título
es el último recurso: los de CJ vienen cargados de palabras sueltas para su
buscador.

Cuatro cosas de ahí que no se tocan:

1. **«card» NO es «car».** La comparación va por palabras enteras, no por
   trozos de texto: con un `includes` a secas, el «Pop Up **Card** Holder» —de
   los primeros resultados al buscar «wallet»— se iba a «Repuestos de carro».
2. **El orden de la lista ES la regla.** Mascotas antes que Juguetes («Dog
   Toys»), Jardín antes que Hogar («Garden Decoration»), Camping antes que ropa
   («Sleeping Bags»), Cocina antes que Ferretería («Kitchen Tools»). Las dos
   primeras las encontró su propia prueba.
3. **Lo que no se reconoce se deja SIN colgar.** Un producto sin departamento
   se ve y se busca igual; uno colgado del equivocado no lo encuentra nunca
   quien sí lo quería.
4. **El slug se comprueba contra la lista antes de guardarlo.**
   `productos.categoria_id` tiene llave foránea: uno mal escrito haría fallar el
   guardado entero.

### Los dos países, mezclados, con banderita (15 ago 2026)

El catálogo de Estados Unidos estaba publicado y **no salía en la portada**. La
causa: el filtro de «¿dónde lo retiro?» (`enZona`, en `catalogo/consultas.ts`)
pide depósito o ciudad venezolana, y la tienda de EE. UU. no tiene ninguna de
las dos — así que las 78 fichas quedaban invisibles con una ciudad elegida.

**Esa pregunta solo existe en Venezuela.** Un producto de Estados Unidos no se
retira en ningún lado: se despacha a la dirección del comprador. Por eso el
filtro ahora lleva `OR paisOrigen = 'US'`, y el aviso de la portada lo dice
completo: «lo que se retira en {ciudad} o cerca, **más lo que se entrega en
Estados Unidos**».

**Se marca la EXCEPCIÓN, no lo normal.** La banderita de EE. UU. va solo en los
productos de allá (`src/components/catalogo/bandera-destino.tsx`, 6 pruebas);
lo de Venezuela es la mayoría del catálogo y va sin nada — la tarjeta ya dice
debajo en qué ciudad se retira. Marcarlo todo convertiría la portada en un mar
de banderas que deja de significar algo.

Cuatro cosas de ahí que no se tocan:

1. **Es un dibujo, no un emoji.** El emoji de bandera **no se dibuja en
   Windows**: sale como dos letras en un recuadro, y media clientela de Estados
   Unidos vería un cuadro roto en cada tarjeta del catálogo nuevo.
2. **Va abajo a la izquierda de la foto.** Arriba a la izquierda vive el sello
   de descuento y arriba a la derecha el de «Nuevo»: un producto rebajado y de
   EE. UU. habría quedado con dos sellos encima del otro.
3. **NO toca nada de Google.** Es una imagen al lado de la tarjeta, con su
   texto alternativo. No entra en el título, ni en la descripción, ni en el
   archivo del feed. Meterla dentro del título sí sería un problema — Merchant
   Center rechaza los títulos con adornos.
4. **`tiendaPais` viaja en `ProductoLista`**, no se consulta por tarjeta: en una
   portada con seis bandas son cientos de tarjetas y sería una consulta por
   producto.

**Lo que falta y es de negocio, no de código:** un carrito no puede mezclar
destinos —lo de EE. UU. se entrega allá y lo de Venezuela se retira allá—, y
hoy nada lo impide. `cabenJuntos()` en `src/lib/destino/reglas.ts` existe justo
para eso y **todavía no está puesto en el carrito ni en el checkout**. El
selector de destino en el encabezado (el croquis del 15 ago) es la otra mitad
de esa historia.

### Varias tiendas de EE. UU., una por rubro (15 ago 2026)

Con 10.000 productos colgando de una sola tienda el sitio se ve como un depósito
y se lee como un monopolio. Ahora hay una tienda por rubro
(`src/lib/cj/rubros.ts`, puro, 7 pruebas): `tienda-us-<departamento>`, con su
nombre y su ficha.

**Por dentro no cambia nada:** la compra a CJ y la factura las hace Mercatren
LLC, directo. El nombre de la tienda es presentación.

**LA REGLA QUE HACE QUE ESTO SEA LEGÍTIMO, y no se toca:** en la ficha de cada
tienda **se lee quién vende y factura** («Vendido y facturado por Mercatren
LLC»). Con esa línea son marcas de la casa, como las marcas propias de cualquier
cadena. Sin ella son vendedores inventados, y eso es tergiversación: causa de
suspensión en Merchant Center y de contracargos que el comprador gana.

- **La tienda nace al entrar su primer producto**, con el nombre del
  departamento como propuesta; se cambia después desde el panel. Pedir que se
  den de alta veintitrés tiendas antes de cargar nada es un trámite que nadie
  hace.
- **El producto manda sobre la pantalla.** Si estando en repuestos se agrega una
  cartera, la cartera se va sola a la de carteras. El equipo no tiene que
  acordarse de cambiar de tienda antes de cada producto.
- **Un rubro sin tienda propia se queda en la general**, nunca se descarta.
- **`Repartir por rubro`** (Panel → Catálogo de EE. UU.) mueve lo que ya estaba
  cargado. **Mueve, no copia:** conserva dirección, fotos y precio — un producto
  que ya está en Google no puede cambiar de dirección. Se puede pulsar las veces
  que haga falta.

### El mapa del almacén y el envío gratis en la ficha (15 ago 2026)

La ficha no decía **ni que el envío es gratis ni a dónde llega**, que es lo que
uno se pregunta antes de comprar. Ahora va arriba, pegado al precio, con el
plazo y con «el precio que ves es el final» — y es cierto: el costo del envío
está dentro del precio publicado.

**El mapa (`src/components/catalogo/mapa-almacen.tsx`) es un dibujo nuestro**,
no Google Maps: eso cobra por carga, mete un guion de un tercero en la ficha y
obligaría a tocar la política de cookies. **Alaska y Hawái NO se dibujan** — el
envío estándar de CJ no siempre llega allá, y dibujarlas sería prometerlo sin
comprobarlo.

**El consejo del casillero** va en gris y abajo, sin competirle al botón de
comprar: **sin nombrar ninguna empresa** y **sin prometer nada del tramo
internacional** —ni plazo, ni costo, ni aduana—, porque ahí no mandamos
nosotros.

### La mezcla y la barra de categorías (15 ago 2026)

**Los productos salían en bloque** —hileras enteras con banderita seguidas de
hileras sin ella— y la causa no era el orden: el barajado le da **ventaja a lo
recién llegado**, y los 78 entraron el mismo día. Se intercalan **después** de
consultar (`src/lib/catalogo/intercalar.ts`, 9 pruebas), nunca en el SQL: el
orden que llega trae la semilla —que impide que la portada «baile» entre
recargas— y esa ventaja, y eso no se rehace.

**La garantía NO es «nunca más de dos seguidos»**, y lo tumbó su propia prueba:
cuando una tienda se agota, el resto **tiene** que salir de corrido — dejar
huecos en la parrilla sería peor. Lo que se garantiza es que no haya rachas
**mientras quede de otra tienda**.

**Y la tira de departamentos se queda al entrar al catálogo.** Antes solo estaba
en la portada: se tocaba un departamento, se entraba, y desaparecía — un
callejón sin salida en el segundo clic, justo para quien navega por gusto.

### Dos trampas de la API de CJ que ya costaron una noche

1. **`listV2` devuelve los productos en `data.content[].productList[]`**, no en
   `data.list` como el endpoint viejo (`/product/list`, el de la sonda de
   Configuración). Leerlos donde no están daba **cero resultados para cualquier
   búsqueda, sin ningún error** — la llamada iba bien y la respuesta venía
   vacía. `tests/unit/cj-lista.test.ts` parsea la forma real.
2. **El precio llega como rango** (`"12.50 -- 15.30"`) en los productos con
   variantes. `Number()` de eso da NaN, el NaN se volvía cero y el producto se
   descartaba por «sin precio». Se toma el más barato del rango.

Y una de la base: **`productos.fuente_id` tiene llave foránea contra
`fuentes_catalogo`**. La fila `cj` se crea sola la primera vez; sin ella la base
rechaza el producto y el botón de agregar devuelve un 500 que no dice nada.

**Los errores de esta pantalla se enseñan enteros**, con el motivo de la base
incluido. Es solo del equipo interno: no hay un comprador del otro lado a quien
filtrarle nada, y un «error del servidor» a secas obliga a adivinar entre una
llave, una columna que falta y un permiso.

**Lo que falta antes de mandárselo a Google:** la descripción propia de cada
ficha y el título en español (hoy se guarda el inglés de CJ en los dos campos,
y **no se inventa una traducción automática**). Y `/datos/google` todavía manda
el catálogo entero, incluidos los productos venezolanos, que no se pueden
entregar en Estados Unidos.

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

## Correos del sistema (Cloudflare Email Service)

Dos direcciones, y no se inventan otras (**regla del proyecto**):

- **`hola@mercatren.com` es el contacto PÚBLICO** (12 ago 2026): la web, los
  documentos y el Reply-To de todo lo que enviamos. Antes era
  `mercatren@windoce.com`, de cuando la tienda la operaba Windoce, y esa era
  **la mención de Windoce más visible que quedaba en el sitio** — salía en el
  pie, en términos, en privacidad y hasta en el `llms.txt`. Por eso Google, al
  preguntarle con qué empresa funciona Mercatren, seguía contestando «Windoce,
  LLC»: leía la página y la dirección de contacto se lo decía.
- **`soporte@mercatren.com` recibe los avisos INTERNOS** del equipo
  (`CORREO_EQUIPO`): venta nueva, contracargo, retiro pedido. Era
  `mercatren@windoce.com` y se movió el **14 ago 2026**, después que el
  público y no a la vez: de estos avisos depende que alguien mire la cola de
  retiros y que a un comercio le llegue su dinero, así que primero había que
  estar seguros de que el buzón nuevo se lee. **Tiene que ser distinta del
  contacto público** —hay una prueba que lo exige— o los avisos de dinero se
  pierden entre los mensajes de los clientes.
- **`avisos@mercatren.com` SOLO ENVÍA.** Es la voz del sistema: bienvenida,
  contraseña, compra, pagos. No recibe nada. Cualquier buzón `@mercatren.com`
  sirve de remitente: el dominio entero está autorizado y firmado.
- **PROHIBIDO** poner de contacto una dirección sin buzón real: no recibe y el
  mensaje del cliente se pierde sin que nadie se entere.
- **Y PROHIBIDO escribir la dirección a mano.** Sale de
  `src/lib/correo/direcciones.ts`; `tests/unit/correo-contacto.test.ts` se pone
  roja si alguien la teclea en otro archivo. Cambiarla costó tocar diez
  archivos; la próxima vez es una línea.

Cómo está armado: `src/lib/correo/` — `direcciones.ts` (las dos direcciones),
`plantilla.ts` (HTML de tablas con estilos en línea, que es lo único que se ve
bien en Gmail/Outlook), `correos.ts` (los envíos, uno por momento del negocio),
`enviar.ts` (la llamada al servicio), `rebotes.ts` (a quien rebota no se le
vuelve a escribir), `sonda.ts` (diagnóstico). Los textos viven en
`messages/*.json` bajo `correos` y salen **en el idioma guardado en la cuenta
del destinatario**, no en el de quien dispara la acción.

**Ojo con los nombres de los campos.** El servicio usa `email` (no `address`) y
`replyTo` en una sola palabra (no `reply_to`), y `to`/`from` van como texto
plano. Con otros nombres responde `invalid_request_schema` y no manda nada, sin
decir qué campo falla. Se comprueba con **Panel → Configuración → Probar el
envío**, que además dice el motivo exacto cuando algo no sale.

Los 7 correos y dónde se disparan: bienvenida (alta de cuenta, hook de Better
Auth) · restablecer contraseña (`sendResetPassword`) · gracias por su compra
(`crearPedido`) · comprobante en revisión (`subirComprobante`) · compra
aprobada y venta acreditada al comercio (`aprobarPago`) · pago no aprobado
con el motivo (`rechazarPago`).

**El correo nunca es requisito:** si el envío falla o `CLOUDFLARE_EMAIL_TOKEN`
no está configurada, se registra el aviso perdido y la operación sigue. Un pago
aprobado jamás se deshace porque el aviso no salió.

## Por qué Google decía «Windoce, LLC» (14 ago 2026)

El dueño lo notó buscándose a sí mismo: al preguntarle a Google con qué empresa
funciona Mercatren, contestaba **Windoce, LLC**. No se lo inventaba — leía la
página.

Eran dos señales, y las dos se cerraron:

1. **El correo de contacto era `mercatren@windoce.com`** y salía en el pie, en
   términos, en privacidad y en el `llms.txt`. Corregido el 12 ago 2026:
   `hola@mercatren.com`.
2. **El crédito del desarrollador**, que enlaza a windoce.com desde el pie de
   TODAS las páginas. Ese **no se quita** —es regla de la casa—, pero el enlace
   lleva ahora `nofollow`, que es justo para lo que existe: decirle al buscador
   que un crédito de plantilla no es una relación de negocio. **No cambia nada
   de lo que ve una persona.**

Comprobado en el sitio publicado: las únicas menciones de Windoce que quedan en
cualquier página son las de ese crédito. Los textos (`messages/*.json`) están
en cero, y el pie dice «Operado por Mercatren LLC, Michigan» mientras los datos
estructurados declaran `legalName: Mercatren LLC`.

3. **El crédito lleva además `data-nosnippet`** (14 ago 2026). Eso lo saca de
   los fragmentos que Google enseña en sus resultados y en sus respuestas de
   IA. No lo oculta: quien entra al sitio lo sigue viendo igual. Lo que deja de
   ser es texto citable fuera del sitio, que es exactamente como terminó en un
   resumen de Google como si Windoce operara la tienda.

**LO QUE QUEDA NO SE ARREGLA TOCANDO EL SITIO: GOOGLE ESTÁ CITANDO SU COPIA
VIEJA.** Comprobado leyendo las páginas publicadas el 14 de agosto: la de
privacidad dice, literalmente, «Mercatren LLC, sociedad registrada en Estados
Unidos, operando bajo la marca Mercatren». Es la misma frase que Google cita —
con el nombre correcto. La suya es de antes del 12 de agosto.

Lo único que acelera eso es **pedir la reindexación en Search Console**
(Inspección de URL → Solicitar indexación), página por página: portada,
términos, privacidad, nosotros, cómo funciona y transparencia, en los dos
idiomas. Reescribir textos que ya están bien no cambia nada y hace perder el
día.

## Lo escrito NO se pierde: borrador en todos los formularios (12 ago 2026)

Un comercio real —MEGAYES, que vende motos— pasó días sin poder cargar su
catálogo. Lo peor no era el fallo: era que **cada intento le vaciaba el
formulario** y tenía que escribirlo todo otra vez. Palabras del dueño: _«la
persistencia. Que se encuentra llenando unos datos tan largos y da un error y
los tiene que volver a poner de nuevo otra vez, eso es una mierda»_.

Ya se había blindado el formulario con un `try` para que una excepción del
servidor no lo desmontara, y **seguía pasando**. La causa es que la pérdida no
siempre viene del servidor: en un teléfono, abrir el carrete deja el navegador
en segundo plano y si el sistema anda justo de memoria **mata la pestaña**; al
volver, la página se recarga sola y las casillas salen vacías. Contra eso no
sirve ningún `try` — la página ya no existe. Lo único que sirve es que lo
escrito **viva fuera de la página**.

`src/lib/formularios/borrador.ts` (16 pruebas) +
`src/components/ui/formulario-persistente.tsx` (9 pruebas). Se adopta cambiando
`<form>` por `<FormularioPersistente llave="...">` y llamando a
`olvidarBorrador(llave)` en la rama de éxito. **Ya está puesto en los nueve
formularios largos**: producto, mi tienda, alta de comercio, checkout, pedir
retiro, medidas, envíos, preguntas y registro de cuenta.

Cuatro reglas que no se tocan:

1. **Las contraseñas y los datos de tarjeta NUNCA se guardan**, y se descartan
   por el TIPO de la casilla y su `autocomplete`, no por su nombre: los nombres
   cambian de un formulario a otro y basta uno mal escrito para dejar una
   contraseña en claro en el disco de una computadora prestada.
2. **Los archivos tampoco.** El almacén del navegador ronda los 5 MB para todo
   el sitio; una sola foto lo llenaría y haría fallar el guardado del texto, que
   es justo lo que esto viene a salvar.
3. **Cada formulario lleva su llave, y las de un producto llevan su id.** Con
   una sola llave, el borrador de una moto se colaría en el formulario de la
   siguiente.
4. **Se borra al guardar bien, nunca al enviar.** Borrarlo al enviar sería
   borrarlo justo cuando el servidor lo rechazó, que es cuando más falta hace.

Se **avisa** de que se recuperó y se deja «Empezar de nuevo»: restituir en
silencio hace creer que el sistema se inventó unos datos.

**Y dos arreglos que salieron del mismo caso:**

- **Las fotos se comprimen de UNA EN UNA, nunca con `Promise.all`.** Ocho fotos
  decodificándose a la vez son más de 100 MB en memoria — en una computadora no
  se nota, en un teléfono el sistema mata la pestaña. Eso era, literalmente, el
  «se me borran los datos».
- **El error dice el motivo**, no «no pudimos guardar». Con el mensaje genérico,
  un comercio a 900 km solo puede decir «no me deja» y de este lado hay que
  adivinar entre la red, el peso de las fotos, un permiso y la base. Se
  perdieron días así.

## LAS VENTAS DE ESTADOS UNIDOS, EN PAUSA (15 ago 2026)

Decisión del dueño, y es la correcta: **antes de vender lo que no se puede
entregar, se pone el cartel de mantenimiento.** El catálogo de EE. UU. está
publicado y navegable, pero la billetera del proveedor está en cero y la pieza
que le manda la orden **no está construida** — comprobado: no existe ni una
llamada a `createOrder` en todo el código. Un comprador que pagara hoy se
quedaría con el cobro hecho y sin mercancía. Eso no es un error de
programación, es un contracargo.

`src/lib/ventas/pausa.ts` (puro, 7 pruebas). **Se quita con una línea:
`EN_PAUSA = false`** y un push.

- **Se pausa la COMPRA, no la ficha.** El producto se sigue viendo, se busca y
  Google lo sigue leyendo: apagar las fichas tiraría el posicionamiento que ya
  está corriendo, y volver a levantarlas cuesta semanas de indexación.
- **Venezuela no se toca.** Ahí hay comercios reales despachando de verdad, y
  su venta no puede pagar por una prueba que es nuestra.
- **El candado va en `crearPedido`, en el servidor**, antes de tocar
  existencias. El cartel de la ficha es cortesía: el botón dibujado se lo salta
  cualquiera que abra la consola.
- **La pausa se comprueba ANTES que «agotado»**: decir «sin existencias» de algo
  que en realidad está en pausa es mentir, y encima hace creer que mañana vuelve.
- **En la parrilla NO se dibuja cartel**, solo desaparece el botón de agregar
  rápido: cien avisos amarillos en una parrilla se leen como que el sitio entero
  está roto. El motivo se cuenta en la ficha, donde la persona ya decidió que
  ese producto le interesa.
- Es constante y no variable de entorno a propósito: el día que se levante hay
  que **probar que de verdad se puede despachar**, y eso pasa por una
  publicación mirada, no por alguien tocando un panel de madrugada.

**Lo que hay que resolver antes de quitarla** (decidido el 15 ago 2026): probar
el proveedor con compras propias y medir qué papel viene DENTRO de la caja (si
trae la factura del mayorista con el precio de compra, el comprador ve nuestro
margen), desde qué almacén salió (EE. UU. o China cambia el plazo de 5 a 20
días, y la ficha ya promete uno), qué dirección de devolución trae, y si el
producto es el de la foto. Y comparar contra otros dos o tres proveedores antes
de casarse con este.

## Los catálogos ya no envejecen solos (15 ago 2026)

La ferretería agregó lijas a su depósito y aquí no aparecían; vendían en su
mostrador y nuestro stock no bajaba. **Los tres caminos estaban construidos y
funcionaban** —el comercio nos empuja (`POST /datos/socios/productos`), su
sistema lee lo que cambió aquí (`GET /datos/socios/cambios`), o nosotros leemos
el archivo que publica (`fuentes_catalogo.url`)— y nuestras propias ventas sí
descontaban stock. **Lo que faltaba era el reloj:** ni `wrangler.jsonc`, ni
`yadominios.json`, ni ningún flujo de GitHub tenía un `cron`. Eran botones, y
nadie los pulsaba.

`.github/workflows/sincronizar.yml` cada 15 minutos → `POST /datos/sincronizar`
→ recorre cada fuente con dirección y la relee.

- **El reloj va FUERA de la aplicación**: Next sobre este adaptador no expone un
  `scheduled()`, así que no hay dónde colgar un cron por dentro. GitHub Actions
  ya está montado y no obligó a crear ni un recurso nuevo en ninguna nube.
- **Sin `SINCRONIZAR_LLAVE` la puerta responde 503 y no hace nada.** Una
  dirección que reescribe el catálogo de los comercios no puede quedar abierta
  porque una variable no esté puesta. La llave se compara en tiempo constante y
  a quien no corresponde se le devuelve **404**: ni se le confirma que existe.
- **`sincronizarCatalogo(id, { sinSesion: true })`** salta la comprobación de
  alcance. Va como parámetro explícito y NO como «si no hay sesión, adelante»:
  eso último convertiría cualquier fallo al leer la sesión en un permiso.
- **El fallo de una fuente no detiene a las demás**, y el motivo queda escrito.
  Una sincronización que falla en silencio es peor que no tenerla: se sigue
  confiando en un stock que ya no es cierto.
- **No se cancela la corrida en marcha** (al revés que la publicación): cortarla
  a mitad dejaría medio catálogo con fecha nueva y medio con la vieja, y el
  barrido de «lo que ya no viene» lo pasaría a borrador.

**Y AHORA SE VE SI UN CATÁLOGO DEJÓ DE LLEGAR** (`salud-sincronizacion.ts`,
puro, 12 pruebas). Una fecha vieja se lee igual de bien que una nueva.

- **La tolerancia no es el intervalo**: corre cada 15 minutos y la alarma salta
  a los 60. GitHub retrasa las tareas programadas cuando anda cargado, y una
  pantalla que se pone roja por un retraso normal enseña a ignorar el rojo.
- **«Nunca» y «sin dirección» no son «atrasada».** Atrasada dice que algo se
  rompió; lo que el comercio necesita leer es qué le falta hacer a él.
- **Panel → Configuración → Catálogos de los comercios** junta los dos caminos
  (quien empuja y a quien leemos) con lo atrasado arriba. Los que empujan se
  miden contra **un día**, no contra una hora: una ferretería que no tocó nada
  desde ayer no está rota, simplemente no vendió de madrugada.

**LA DIRECCIÓN NO VA SOLA: VA CON SU LLAVE.** Casi ningún comercio publica su
catálogo abierto al mundo. El de la ferretería piloto
(`https://ferrematerialesbley.com/exportar/catalogo`) exige
`Authorization: Bearer <token>` y sin él responde 401 — y el formulario de «Mi
tienda» solo pedía la dirección. Se habría guardado, la pantalla habría dicho
que todo bien, y la lectura habría muerto en un 401 para siempre. Ahora la
casilla está al lado, y `guardarFuente` distingue **campo ausente** (no se toca
lo guardado) de **campo vacío a propósito** (se borra): sin esa diferencia,
guardar solo la dirección le borraba la llave a alguien sin avisar.

- **La llave guardada NUNCA se vuelve a dibujar**, solo si la hay. Traerla al
  navegador la deja escrita en el HTML de la página.
- **Va como texto normal, no como casilla de contraseña.** No es la clave de
  nadie: es una credencial de máquina que se pega una vez, y esconderla
  mientras se pega solo consigue que se pegue mal.

**PONER LA DIRECCIÓN ES ENCENDERLA (15 ago 2026).** Las fuentes de las
importaciones a mano nacen `pausada`, y el robotito salta las pausadas a
propósito. Así que un comercio podía pegar su dirección, ver el mensaje verde de
guardado, y quedarse esperando para siempre una lectura que nunca iba a ocurrir
— sin un solo error en ninguna pantalla. Nadie va a buscar un interruptor que no
sabe que existe: poner la dirección ES decir «léeme». Quitarla la apaga.
`con_error` se respeta —ahí la apagó un fallo de verdad— y **se cura sola** en
la primera lectura que salga bien; si no, un mal minuto del servidor del
comercio dejaría su catálogo apagado para siempre.

**Lo que falta no es código:** el token del catálogo de la ferretería (vive en
`configuracion_sistema.token_catalogo`, en SU Supabase — no en ningún
repositorio, que es lo correcto) y `SINCRONIZAR_LLAVE` en los dos sitios
—variable del sitio en YaDominios Cloud y secreto del repositorio en GitHub, las
dos ya cargadas y comprobadas el 15 ago 2026 con un `200`—.

## Seguridad y dinero: lo que se cerró el 12 ago 2026 (bloque 3)

**El concepto del Zelle, tan grande como el monto.** Zelle no manda un cobro:
manda una transferencia suelta con una nota, y de este lado llega dinero de un
banco cualquiera a nombre de alguien que muchas veces no compró. Sin el número
de factura en la nota, quien valida solo puede adivinar. Se le pedía en una
línea gris al final de la pantalla, con un «si tu banco lo permite» que se lee
como opcional. Ahora va en rojo, debajo del monto y **antes** de los datos del
banco —el orden en que se lee es el orden en que se llena el formulario—, con
`Mercatren MT-000002` en grande y su botón de copiar. Lleva la marca delante
porque en el extracto, semanas después, «MT-000002» a secas no le dice nada al
comprador y llama al banco: el primer paso de un contracargo.
`src/lib/pedidos/concepto.ts`, 6 pruebas. Sin número no dibuja nada.

**Límite de intentos** (`src/lib/seguridad/intentos.ts`, 14 pruebas + tabla
`intentos_acceso`). Hasta ese día no había NINGUNO: la única defensa era
Turnstile, que frena robots y no a alguien decidido. Ocho fallos por cuenta y
cuarenta por dirección, en quince minutos. Se cuenta por las dos cosas porque
tapan agujeros distintos: por dirección frena a quien prueba contra muchas
cuentas, por cuenta frena mil máquinas contra UNA. **Solo se cuentan los
fallos**, y al entrar bien se limpia el contador de esa cuenta —pero no el de
la dirección, o el atacante entraría a una cuenta que sí conoce para limpiar el
marcador—. Recuperar la contraseña también entra, porque manda un correo.

**`zod` en las acciones que tocan dinero** (`src/lib/validacion/acciones.ts`,
13 pruebas). Una regla por tipo de dato escrita UNA vez, no `zod` suelto en
cada archivo. Puesto en aprobar/rechazar un Zelle, subir el comprobante, abrir
y avanzar un pedido, y el enlace de un cobro. **Falta en el resto de los
archivos de acciones** — sigue siendo deuda escrita.

**Prueba de entrega** (tabla `pruebas_entrega`). Un cobro con tarjeta se
revierte hasta 120 días después y el banco pide una sola cosa: demuéstrame que
la mercancía llegó. `hitos_pedido` dice que alguien pulsó un botón; la guía, la
foto o la firma dicen que llegó. **El comprador no puede aportarla** —sería
pedirle la prueba en su contra— y **solo el equipo puede quitarla**.

**Devoluciones desde el panel** (`src/lib/stripe/devolver.ts`). El estado
`reembolsado` existía sin forma de llegar a él. Va dentro de los tres puntos.
**NO le descuenta el neto al comercio**: quién asume la devolución es una
decisión de negocio, la misma que ya se tomó con los contracargos. Una
devolución parcial no marca el pedido como reembolsado. Zelle no se devuelve
desde aquí y se dice.

**Aviso al equipo en cada venta con tarjeta.** Antes solo se enteraban el
comprador y el comercio.

**La letra del panel, un escalón más grande** (`.letra-panel` en
`globals.css`). Se hace redefiniendo `--text-xs` / `--text-sm` / `--text-base`
dentro del panel, no cambiando 500 clases: sube todo de golpe, mantiene las
proporciones y **no toca ni un píxel de la tienda**. Un escalón y no dos:
pasarse rompe las tablas anchas, que es la otra forma de no poder leer un panel.

---

## Los formularios: una sola regla por tipo de dato

Todo lo que se escribe en una casilla del sitio pasa por
**`src/lib/validacion/campos.ts`**. Cada tipo de dato se define UNA vez y de esa
definición salen **las dos barreras**:

1. **El navegador** — el teclado correcto en el celular, el tope de largo, y el
   filtro que va quitando lo que no corresponde mientras se escribe (un nombre
   no admite números, un teléfono no admite letras).
2. **El servidor** — el esquema de `zod` que se comprueba antes de tocar la base.

**Las dos las arma la misma función (`sellar`), a propósito.** Escritas por
separado se desincronizan: al escribir este archivo, `alfanumerico` cortaba en
40 caracteres en pantalla y el servidor aceptaba 9000. Lo encontró su prueba.

**Lo del navegador es COMODIDAD, no seguridad.** Cualquiera lo salta abriendo la
consola. La barrera de verdad es la del servidor.

Las casillas se ponen con `<Campo tipo="telefono" …>`
(`src/components/ui/campo.tsx`), que saca solo los atributos, el filtro y el
aviso. **El aviso sale al SALIR de la casilla**, no en cada tecla: poner
"correo inválido" cuando alguien escribió la primera letra es regañarlo por no
haber terminado.

Tipos disponibles: `telefono` · `nombrePersona` · `razonSocial` · `ciudad` ·
`correo` · `identificacionFiscal` · `soloNumeros` · `alfanumerico` ·
`sitioWeb` · `direccion` · `textoCorto` · `textoLargo`.

**Aceptan lo que la gente escribe de verdad.** Rechazar un dato bueno es el
error más caro: `+58 412-1234567`, `+1 (305) 555-0142`, `O'Brien`,
`García-López`, `Ferremateriales Bley C.A`, `3M de Venezuela S.A.`. Una regla
de un solo país dejaría fuera a media clientela.

Los avisos viajan como **clave de traducción**, no como frase — el mismo
esquema corre en el navegador, donde no se sabe el idioma. En el servidor se
convierten con `avisoDeCampo()` (`src/lib/mensajes.ts`).

## La fortaleza de la contraseña

`src/lib/validacion/fortaleza.ts` mide de 0 a 4 y **la misma función corre en el
navegador y en el servidor**, así que lo que se ve en pantalla es exactamente lo
que se va a aplicar al guardar.

**El largo pesa más que los símbolos**, que es lo contrario de lo que pide casi
todo formulario y lo que hoy recomiendan NIST y el NCSC: `mi perro come tres
veces al dia` es más fuerte que `P@ss1!x`.

**No pasan** las más usadas del mundo, una tirada de teclado, la misma letra
repetida, ni **una que lleve dentro su propio correo o nombre** — la primera que
prueba quien conoce a la persona. Ojo con esa: se compara **por trozos**, no
contra el dato entero; la primera versión buscaba el correo completo y
`carlos2024!` con correo `carlos@…` pasaba limpio.

La barra sale sola donde se **crea** una contraseña, porque va atada a
`autoComplete="new-password"`: registro, cambiar clave y recuperar clave la
tienen, y cualquier pantalla nueva la hereda. En iniciar sesión no aparece, y
está bien — ahí la clave ya existe y calificarla solo delataría en pantalla qué
tan floja es.

## El correo del registro tiene que poder recibir (14 ago 2026)

Cualquiera podía registrarse con un correo inventado. Nunca recibía la
bienvenida, ni el aviso de su compra, ni el enlace de recuperar la clave — y del
lado de la base quedaba una cuenta que no sirve para nada. Casi siempre no es
alguien colándose: **es un cliente que se equivocó al escribir y no se enteró**.

Tres capas, todas en el SERVIDOR (`src/lib/validacion/correo-real.ts` para lo
que se decide sin red, `dns-correo.ts` para la consulta, `correo-servidor.ts`
para juntarlas). El formulario del navegador se salta abriendo la consola: ahí
esto sería un adorno.

1. **Dominios de ejemplo** (`example.com`, `ejemplo.com`, `localhost`…) y
   cualquier dominio sin punto. Rechazo inmediato, sin gastar la consulta.
2. **Correos temporales** (mailinator, yopmail y compañía). Funcionan hoy y se
   autodestruyen mañana: abrir una cuenta ahí es abrirla sin poder avisar nada.
3. **DNS sobre HTTPS**, que es la que de verdad importa: las listas siempre se
   quedan cortas porque los dominios inventados son infinitos. Se pregunta por
   el registro MX y, si no tiene, por el A — hay dominios pequeños que reciben
   en su propia dirección sin declarar MX aparte.

**SI EL DNS FALLA O TARDA MÁS DE 2 SEGUNDOS, SE DEJA PASAR.** Es la regla que
manda sobre las demás. Rechazar a un cliente real porque una consulta se puso
lenta es muchísimo peor que dejar entrar un correo falso, que de todos modos se
queda sin confirmar. Una puerta de registro que se cierra sola cuando un
servicio ajeno tose es la forma más cara de perder clientes: no da error
visible, no avisa a nadie, y desde fuera parece que el sitio no quiere tu
correo.

**Los dominios que IMITAN a los grandes —`gmial.com`, `hotmial.com`— pasan, y
está bien que pasen.** Existen y tienen servidor de correo. Cazarlos por
parecido significaría rechazar dominios legítimos parecidos a otro.

**Solo en el alta, jamás al entrar.** A quien ya tiene cuenta no se le vuelve a
mirar el correo: si esto corriera en el login, un cliente de hace meses podría
quedarse fuera de su propia cuenta porque hoy su dominio no contesta.

Cada rechazo queda anotado en `rechazos_correo` (motivo, correo, dominio, IP).
Un filtro que nadie mide se convierte en una pared silenciosa: sin ese registro,
el día que empiece a rechazar un dominio legítimo nos enteraríamos por un
cliente enfadado — o por ninguno, porque el que no puede registrarse se va.

Para comprobarlo: `npx tsx scripts/probar-correos.ts`, que usa las mismas
funciones que el registro.

## El login: escudo anti-fuerza bruta

`/entrar` y `/registro` llevan Cloudflare Turnstile. Sin él, cualquiera puede
probar miles de contraseñas por minuto contra cuentas que ven el dinero de los
comercios.

- **La comprobación de verdad va en el servidor** (`src/lib/escudo.ts`, llamada
  desde `src/app/datos/auth/[...all]/route.ts`), **antes de mirar la
  contraseña**. El recuadro del navegador se lo puede saltar cualquiera.
- El pase viaja en la cabecera `x-escudo`, no en el cuerpo, para que Better
  Auth reciba la petición tal como la espera.
- **Se apaga solo si no está configurado** (`TURNSTILE_CLAVE_SITIO` y
  `TURNSTILE_SECRETO`): sin claves, la entrada funciona como siempre. Y si
  Cloudflare no responde, deja pasar — detrás siguen la contraseña y el rol.
- **El guion se carga a mano, NO con `<Script>` de Next.** La primera versión
  usaba `<Script onReady>`, que en una navegación de cliente no vuelve a
  dispararse: entrando directo a `/entrar` funcionaba, y llegando desde otra
  página del sitio el recuadro no se dibujaba nunca. Con el escudo exigido del
  lado del servidor, eso es **la entrada cerrada para todos los clientes**.
  Estuvo así meses sin verse, porque nunca había corrido con claves cargadas.
  `tests/unit/escudo.test.tsx` cubre justo ese caso.
- **Con claves válidas no se ve ningún recuadro.** Turnstile resuelve de forma
  invisible y solo emite el pase; el reto solo aparece cuando algo huele raro.
  Que no se vea nada **es** el comportamiento correcto, no un fallo.
- Para probarlo en local están las claves de prueba públicas de Cloudflare
  (siempre dan el pase por bueno), en `.dev.vars`, que no se sube.

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

## Ventas a crédito del comercio a su cliente (6 ago 2026)

Aprobado por el abogado. El documento que se aprobó está en
`docs/mercatren-ventas-a-credito.pdf` (se regenera con
`npm run docs:pdf-credito`).

**LA FIGURA MANDA SOBRE TODO EL DISEÑO: el crédito lo da EL COMERCIO y el
riesgo es suyo.** Él decide a quién, cuánto y a cuántos días, y entrega la
mercancía bajo su propio acuerdo. Windoce, LLC no presta ni sale de garante —
no puede: prestar en EE.UU. exige licencias de prestamista. Lo que hace
Mercatren es, en cada abono, **comprarle la mercancía correspondiente**. Cada
abono es una compra-venta cerrada.

Por eso el aviso legal va **dentro del formulario y a la vista**, no escondido
en unos términos.

- `src/lib/credito/cupo.ts` — las cuentas, puras y con 26 pruebas. Una de ellas
  verifica los números EXACTOS del ejemplo del PDF: si se pone roja, el sistema
  dejó de hacer lo que se le prometió por escrito a un comercio.
- **Lo debido se CALCULA de los abonos aprobados, nunca se guarda.** Guardar un
  total además de los movimientos es tener dos verdades.
- **Cada abono libera cupo**: con $2.000 de tope y $1.700 abonados puede volver
  a comprar $1.700. Es lo que hace que el comercio venda más.
- Un comprobante sin validar **no cuenta** como abono: si contara, cualquiera
  liberaría su cupo subiendo una foto.
- Quitar un crédito va en el menú de tres puntos y solo si no deben nada; si
  deben, se suspende — el registro se queda porque el dinero se queda.
- **Tablas nuevas, no columnas** (`creditos_cliente`, `pedidos_credito`): así
  llegan solas a producción con `schema.sql`.

**Lo que falta del módulo** (siguiente fase): pagar con el cupo desde el
checkout, la pantalla del cliente con su avance, y los avisos de vencimiento.
Hoy el comercio ya puede dar, cambiar, suspender y quitar cupos, y ver lo que
le deben.

## Borrón y cuenta nueva del histórico (10 ago 2026)

Bley traía **$24,283.75 figurando a su favor** y 3 comprobantes esperando
validación. Nada de eso era deuda viva: todo venía de su tienda anterior y **ya
se había liquidado allá** antes de mudarse a Mercatren. El importador trajo el
histórico para tener el rastro, no para volver a pagarlo.

**No se borró un solo registro.** El saldo se CALCULA (entradas − retiros), así
que se cerró como se cierra de verdad: los 3 pendientes pasaron a aprobados
—fueron pagos reales que sí se recibieron—, su pedido a entregado, y se registró
**un retiro de cierre de $24,990.86** (`cierre-bley-2026-08-10`) con la nota de
que se liquidó en el sistema previo.

Resultado: Bley en **$0.00**, cola de validación vacía, y el histórico entero —
669 entradas, 5 rechazos, 71 retiros. El día que alguien pregunte por un pago de
julio, ahí está.

**Borrar las entradas habría sido fabricar un pasado que no ocurrió.**

La única venta viva de Mercatren es la MT-000002 de Inversiones Multiservicios:
$31.87 con tarjeta, **$30.91 disponibles**. Y los 32 centavos que quedaban
pendientes de decidir se resolvieron solos al pasar al 3 %: su comisión guardada
(96) es exactamente la que toca ahora.

## Cobrar por Mercatren desde el sistema del comercio (10 ago 2026)

Primera etapa de `mercatren-api-integraciones.pdf`. La cajera de la ferretería
hace su factura como todos los días, toca un botón, y **el correo con el enlace
de pago sale solo**. Quien paga —muchas veces el hijo o el socio en Estados
Unidos, a quien le reenviaron el correo— abre y paga con tarjeta o por Zelle.

- `src/lib/cobros/reglas.ts` — puro, 20 pruebas. El enlace vive 48 horas y **el
  vencimiento se calcula, no se guarda**: un estado `vencido` guardado depende
  de que algo lo escriba a tiempo, y si eso falla alguien paga una venta que el
  comercio ya dio por perdida.
- **El enlace NO es el identificador del cobro.** Ese aparece en el sistema del
  comercio y en sus pantallas; el enlace es un secreto aparte de 24 bytes que
  solo viaja en ese correo.
- **La cuenta del cliente se abre sola.** Pedirle registrarse antes de pagar es
  justo el paso donde se pierde la venta que esto existe para salvar.
- **Tabla nueva** (`cobros_solicitados`), no un pedido: aquí no hay renglones de
  catálogo ni existencias que descontar — la venta ya ocurrió en el mostrador.
- `GET /datos/socios/cobro?referencia=…` es lo que deja al comercio marcar su
  factura pagada sola.

**En el repo de Bley** (`/Users/windocellc/ferremateriales-bley`):
`functions/cobrar/mercatren.ts` guarda el token —**nunca en el navegador**, que
`VITE_` termina dentro del sitio publicado—, `src/lib/cobrarPorMercatren.ts` lo
llama, y `src/components/CobrarPorMercatren.tsx` es el botón.

**No se tocó `metodo_pago`, a propósito.** Ese enum alimenta el cierre de caja:
meter ahí un cobro que va en camino descuadraría el cierre del día con dinero
que nadie recibió. Cómo se contabiliza esa venta cuando el pago llega es una
decisión del comercio, no del código.

## Sacar el dinero desde cualquier país (10 ago 2026)

Un comercio de Colombia entró a pedir su dinero, eligió «wire», y **no encontró
dónde poner su Bancolombia**: el formulario solo tenía titular, banco, cuenta y
**número de ruta**, que existe únicamente en Estados Unidos. La pantalla hasta
le decía que solo se transfiere a bancos de allá. Se quedó bloqueado una tarde
entera mientras del otro lado nadie sabía qué contestarle.

**El país va primero y decide todo lo demás.** `src/lib/retiros/paises.ts`
declara los doce países con los campos de cada uno, y el formulario dibuja solo
esos: CLABE en México, IBAN en España y Rumanía, tipo de cuenta y documento en
Colombia, CBU en Argentina, agencia y CPF en Brasil (con el Pix opcional).

- **Un formulario con todos los campos NO habría servido**, porque quien lo
  llena no sabe cuáles le tocan. Un mexicano no tiene número de ruta y un
  estadounidense no tiene CLABE; enseñar los dos y dejar que adivine es como se
  manda una transferencia a una cuenta mal escrita.
- **Se valida en serio** (21 pruebas): una CLABE son 18 dígitos, un CBU 22, un
  routing 9. Un wire mal dirigido no rebota al día siguiente — se queda dando
  vueltas entre bancos y puede tardar semanas.
- **Los espacios y guiones NO son un error.** Un IBAN se copia en grupos de
  cuatro. Rechazar un dato bueno es el error más caro: el comercio ya vendió y
  no puede cobrar. Se limpian al guardar, porque lo guardado es lo que alguien
  copia y pega en Mercury.
- **Al cambiar de país se borra lo escrito**: arrastrar una CLABE al formulario
  de Colombia solo confunde a quien después va al banco.

**ZELLE DEJÓ DE SER UNA FORMA DE RETIRO, y no fue un recorte.** El dinero sale
de la cuenta de Mercury, y **Mercury no hace Zelle**: solo ACH dentro de
Estados Unidos y wire para afuera. Mientras estuvo en la lista, un comercio
podía pedirlo y quien iba al banco no lo podía ejecutar.

**El desglose de los dos fees** (`src/lib/retiros/desglose.ts`, 12 pruebas) sale
arriba del formulario: lo que pagaron los compradores, lo que se llevó Stripe,
lo que se llevó Mercatren y lo que le queda. **Son dos costos de dos dueños
distintos** — juntarlos en un renglón que diga «comisiones» hace que el comercio
nos atribuya los dos. Los tres renglones suman el bruto exacto, siempre: un
centavo que no cuadra en una pantalla de dinero rompe la confianza en todo.

## Ver el panel como lo ve un comercio (10 ago 2026)

Un comercio manda una captura y pregunta «¿aquí es donde cargo lo de Colombia?»,
y quien atiende **no sabe qué está mirando**: el panel del equipo enseña otras
secciones y otros botones. Se le termina respondiendo a suposición a alguien que
está esperando su dinero.

En **Comercios**, Soporte pulsa «Ver su panel» y navega el panel entero con el
alcance de ese comercio. Tres candados:

1. **Solo el rol `soporte`**, comprobado en el servidor y no solo en el botón.
2. **Solo mirar.** `pedirRetiro` se niega mientras el modo está puesto: el
   alcance prestado no puede mover dinero de nadie.
3. **Una franja amarilla permanente arriba**, que no se puede cerrar. Lo
   peligroso no es entrar, es **olvidar que estás dentro**: quien mira una
   billetera con $24.283 creyendo que es la suya decide sobre datos que no son.

Va en una cookie y no en `?comercio=` porque tiene que sobrevivir a la
navegación — la gracia es recorrer el panel entero, y un parámetro se pierde en
el primer enlace que no lo arrastre.

## Los cuatro huecos que quedaban en los cobros (10 ago 2026 · Fases 2–5)

El plan entero está en `PLAN-PAGOS.md`. Lo que hay que saber al tocar esto:

**1. Un cobro con tarjeta ya no se puede perder.** Todo dependía de que llegara
el aviso de Stripe; si no llegaba, el comprador pagaba y el pedido se quedaba
en «esperando el pago» **sin que nadie se enterara**. Ahora, cuando el comprador
abre su pedido, se le pregunta a Stripe (`src/lib/stripe/conciliar.ts`) y se
acredita ahí mismo. El equipo tiene además el botón «Comprobar el cobro».

- **No hace falta un cron**: el momento en que esto importa es justo cuando la
  persona está mirando la pantalla.
- La acreditación se sacó a `src/lib/stripe/acreditar.ts` para que el webhook y
  el respaldo hagan **exactamente lo mismo**. Duplicarla habría sido lo peor:
  son cien líneas que descuentan stock y acreditan billeteras, y dos copias se
  separan al primer arreglo que alguien haga en una sola.
- **Solo `succeeded` cuenta como cobrado** (`estado-intento.ts`, 10 pruebas).
  `processing` y `requires_capture` se parecen y no lo son.

**2. Los contracargos ya no pasan en silencio.** Una tarjeta se revierte hasta
120 días después; hasta hoy el dinero salía de la cuenta y solo se veía en el
extracto. Ahora el webhook escucha `charge.dispute.*`, lo guarda en `disputas`,
avisa al equipo por correo y sale **en rojo arriba de la ficha del pedido**.

**No revierte nada, y es deliberado.** Quién asume ese dinero es decisión de
negocio —puede tocarle a Mercatren, puede negociarse, la disputa se puede
ganar—. Un sistema que revierte solo le quitaría a un comercio dinero que a lo
mejor recupera en dos semanas. Por eso el aviso dice las dos cosas: «el dinero
ya salió» **y** «la venta NO se deshizo sola».

**3. Las dos facturas de una venta, juntas.** El modelo se sostiene sobre el par
—la nuestra al comprador y la del comercio a nosotros— y estaban en pantallas
distintas sin enlace. Ahora la ficha del pedido las enseña juntas
(`src/lib/facturas/par.ts`), y la orden de compra tiene su propia ficha con lo
que se le compró. Del pedido a la orden y de la orden al pedido.

**4. La entrega deja constancia de QUIÉN.** `hitos_pedido` guarda cada paso con
su autor y su fecha. Con un contracargo de por medio, «Entregado» a secas no
defiende a nadie; «marcado como entregado por Fulano el 12 de agosto» sí. Lo
que hace el sistema solo sale **sin autor**: ponerle un nombre sería atribuirle
a una persona algo que no hizo.

`disputas` y `hitos_pedido` son **tablas nuevas, no columnas**: así llegan solas
a producción con `schema.sql`.

## Zelle blindado contra la captura falsa (10 ago 2026 · Fase 1 del plan de pagos)

**Zelle no manda un cobro: manda una FOTO.** Y una foto se guarda, se reenvía y
se vuelve a subir en otro pedido. Casi ninguna tienda en línea acepta Zelle por
esto; aquí se acepta porque es lo que usan los venezolanos, así que el control
tiene que ser nuestro.

Hasta hoy el validador aprobaba a ojo: la pantalla no le decía ni una cosa. Y ya
se había colado — en el histórico está el código `kfrcrk9wp` usado dos veces por
$100, uno aprobado y otro rechazado. Lo atajó una persona con buena memoria.

- `src/lib/zelle/alertas.ts` — puro, 18 pruebas. Decide qué es sospechoso.
  `src/lib/zelle/sospechas.ts` trae los hechos de la base.
- **El candado va en el SERVIDOR** (`aprobarPago`), no solo en la pantalla: un
  aviso dibujado se lo salta cualquiera y del otro lado hay dinero del comercio.
- **Solo bloquea lo ya APROBADO.** Un código visto en un pago rechazado no
  bloquea: rechazar y volver a intentar con la transferencia corregida es lo
  normal, y cerrarle la puerta a quien pagó de verdad cuesta más caro que el
  fraude que evitaría. Por eso NO hay índice único en `codigo_confirmacion` —
  además rompería con ese par legítimo del histórico.
- **La huella de la imagen** (`huellas_comprobante`, SHA-256) reconoce el mismo
  archivo aunque le cambien el nombre. No detecta una captura reeditada y no
  pretende: atrapa el caso común y perezoso.
- **Tabla nueva, no columna**: `schema.sql` solo trae `CREATE TABLE IF NOT
EXISTS`, así que una columna no llegaría sola a producción.
- El monto que no cuadra, la falta de código y los rechazos previos del
  comprador **avisan pero no bloquean**: pueden tener explicación, y si todo se
  pintara de rojo el rojo dejaría de significar algo.
- Las señales son **solo para el equipo**. Al comercio no le toca juzgar el
  comprobante de su propio cobro.
- **Al comprador se le dice cuánto tarda**, en el checkout y al subir la
  captura: un pago por Zelle lo confirma una persona, normalmente el mismo día
  hábil. Quien no lo sabe se queda esperando que su pedido arranque solo.

De paso se quitó una trampa documentada del proyecto: `aprobarPago` pedía la
tabla entera con `.select()`. Una columna nueva en el esquema habría dejado de
funcionar **la aprobación de pagos** en producción.

## El panel se reordenó por TRABAJO, no por mecanismo (11 ago 2026)

El dueño lo dijo entero: _«está muy mal organizado»_. Tenía razón, y la causa
era concreta.

**1. La venta del día estaba enterrada.** Órdenes dibujaba PRIMERO los 669
tiques del histórico importado —con carga infinita— y los pedidos de verdad
quedaban debajo. La venta estaba en la página, pero donde nadie llega. Ahora
mandan los pedidos, con filtro por fecha (`src/lib/pedidos/rangos.ts`, puro,
14 pruebas) y el archivo plegado al final.

De ahí, dos reglas que no se tocan: **«hoy» arranca en la medianoche**, no hace
24 horas —quien pregunta por lo de hoy quiere el día natural— y **lo que no
tiene fecha NO se esconde**: el histórico tiene huecos y el dinero existió
igual.

**2. La tarjeta no tenía pantalla.** Había una sección entera para Zelle y
ninguna para el método con el que entró la primera venta real. Ahora
`/panel/cobros` es una sola sección con tres pestañas —tarjeta, Zelle y los
enlaces de cobro— y **los contracargos salen arriba, en rojo**: un contracargo
es dinero que ya salió de la cuenta, no puede estar escondido dentro de la
ficha de un pedido que hay que sospechar primero para abrirlo. La dirección
vieja `/panel/pagos-zelle` redirige.

**3. El menú nombraba mecanismos.** «Operación» juntaba un método de cobro con
el dinero y con el papeleo, y **Órdenes vivía dentro de «Catálogo»**. Quedan
cuatro grupos que contestan «¿qué vengo a hacer?»: **Ventas · Dinero · Mi
negocio · Equipo**.

**4. La billetera le hablaba a una sola persona.** Decía «por pagar al
proveedor» también cuando la abría el proveedor. Para el equipo es lo que hay
que pagar; para el comercio es SU dinero esperando. Ahora cada uno lee lo suyo,
igual que ya pasaba con la cola de validación.

**Los pasos de la venta, en horizontal** (`pasos-de-la-venta.tsx`): comprada →
pagada → enviada → entregada → **en la billetera**, con quién movió cada uno.

**Dice «en la billetera» y no «retirado», a propósito.** Un retiro no es un
hecho de un pedido: el comercio pide un monto contra su saldo, que junta muchas
ventas. Marcar una venta concreta como «retirada» obligaría a repartir cada
retiro entre las ventas que lo componen — una atribución que el sistema no
guarda y que nadie firmó. Lo que sí es cierto de ese pedido es que su dinero
quedó acreditado; el retiro se mira donde ocurre, y va el enlace.

**Descargar en Excel** (`src/lib/exportar/`, 23 pruebas) en Órdenes y en
Cobros. Tres trampas del CSV, resueltas de una vez: el **BOM** (sin él, Excel
en Windows rompe los acentos y el contador sospecha de los datos, no del
archivo), el **dinero en dólares con dos decimales** (una columna en centavos
se suma mal a la primera) y la **inyección de fórmulas** — lo que empieza por
`=` o `@` se marca como texto, porque nombres y conceptos los escriben personas
de fuera y la hoja los ejecutaría al abrirla.

**Un negativo sí pasa como número**, y esa distinción la encontró su propia
prueba: marcarlo como texto dejaba los retiros y los reembolsos sin sumar, con
el total mal y sin un solo aviso.

**El alcance no baja por ser un archivo.** Un vendedor que pida el comercio de
otro se lleva el suyo igual, y si se llega al tope de filas se avisa: uno
recortado en silencio hace sumar una parte creyendo que es el total.

De paso, el menú marcaba dos secciones a la vez: `/panel/ordenes-compra`
empieza igual que `/panel/ordenes` y la coincidencia era por prefijo de texto.

## El mismo panel, leído por el comercio (11 ago 2026)

**No hay dos paneles: hay uno que sabe quién está mirando.** Cada pantalla
resuelve `esEquipoInterno()` y elige el texto; duplicar pantallas habría
garantizado que una de las dos se quedara atrás al primer arreglo.

Lo que el comercio leía y no hablaba de él: «Neto a comercios · Costo de la
mercancía» por lo que le quedó, «Comercios activos: 1», el filtro por **nuestra**
cuenta receptora, «Retiro del comercio» cuando el que mira es el comercio, y un
resumen cuyo número grande era el histórico ya liquidado. Ahora: **te pagaron ·
comisión de Mercatren · te quedó · disponible para retirar**, y en el menú
«Órdenes de compra» pasa a «Mis facturas a Mercatren».

**La comisión SÍ se le enseña, entera y con su nombre.** Es lo que se le
descontó; esconderla es lo que hace desconfiar. Lo que cambia es el punto de
vista: para él no es «nuestro margen», es su comisión.

**LA CONTRADICCIÓN DE DINERO QUE HABÍA.** La billetera le restaba $302.859,50
en retiros y `/panel/retiros` le decía «todavía no has pedido ningún retiro».
Los 70 del sistema anterior viven en `pagos_zelle` con `tipo = 'retiro'` y esa
pantalla solo leía la tabla `retiros`. Dos pantallas diciendo cosas distintas
del mismo dinero es como un comercio deja de creerle al sistema.

Ahora se juntan, marcados (`historico: true`) y **sin acciones**: son hechos ya
pagados, no una cola. El histórico se suma solo cuando se mira un comercio
concreto y **no** se filtra por estado — en la cola de «solicitado» que trabaja
el equipo llenarían de ruido una lista de pendientes.

**Los 70 llegaron SIN fecha, y así se dice** («sin fecha en el archivo»). Se
probó rellenarla con la de importación y es peor: los 70 salían el mismo día,
contándole al comercio que sacó todo su dinero en una sola tarde. **Un dato que
falta se dice; no se rellena con el que había a mano.**

**Y un candado que faltaba:** `listarDisputas()` y el conteo de contracargos
salieron sin alcance en su primera versión, así que un comercio habría visto
los contracargos de otro —con su monto— en su propia pantalla. Toda consulta
nueva que devuelva dinero pasa por el alcance, incluidas las de apoyo.

## Cómo se pagó cada venta, y una sola cifra para el comercio (10 ago 2026)

La primera venta real con tarjeta destapó tres cosas. Las tres eran de dinero.

**1. El método de pago no se veía en ninguna pantalla.** Estaba guardado desde
el primer pedido, pero para saber si una venta entró por tarjeta o por Zelle
había que abrir «Pagos Zelle» y, si no estaba ahí, deducir que fue con tarjeta.
Ahora sale en Órdenes, en la ficha del pedido y en Órdenes de compra, con su
referencia (`pi_…` de Stripe o el código del banco) y el número de pedido de la
orden de compra convertido en enlace a su ficha.

La traducción vive en `src/lib/pagos/rastro.ts`, pura y con 25 pruebas, porque
los dos métodos guardan su rastro en tablas distintas y con estados que se
llaman distinto (`confirmado` contra `aprobado`). Traducir eso en cada pantalla
termina en dos pantallas que dicen cosas diferentes del mismo pedido.

Dos reglas de ahí que no se tocan:

- **Sin cobro confirmado no se enseña la referencia de la tarjeta.** El `pi_…`
  existe desde que se abre el intento, mucho antes de que el dinero entre;
  enseñarlo en un pedido sin pagar es despachar mercancía que nadie pagó. En
  Zelle es al revés: la referencia sirve aunque esté en revisión, porque es lo
  que el validador busca en el banco.
- **El estado del pedido manda cuando no aparece el cobro.** El histórico llegó
  sin enlazar a su pedido, y la lista enseñaba «Entregado» y «sin pagar» en la
  misma línea. Pero **no tapa un cobro rechazado**: ahí la contradicción es de
  verdad y es justo lo que hay que revisar.

**2. La venta con tarjeta no le sumaba al comercio.** La billetera calculaba el
saldo leyendo solo `pagos_zelle` y `retiros`. El comercio veía **$0.00 y cero
movimientos** teniendo su dinero esperando. Ahora `obtenerPosicion` y
`listarMovimientosReales` suman también lo cobrado con tarjeta.

Se calcula desde `pagos` + `items_pedido`, **no desde `movimientos_billetera`**:
la aprobación de un Zelle también escribe ahí, así que sumar esa tabla contaría
los pagos de Zelle dos veces. Y va con `exists`, no con un `innerJoin`: un
pedido con dos filas de cobro duplicaría cada renglón y el comercio vería el
doble de lo que vendió.

**3. El mismo pedido tenía DOS cifras de lo que se le paga al comercio.** Al
crear el pedido se guardaba siempre la tarifa de la tienda (3 %, la de Zelle)
sin mirar cómo se iba a pagar, y el webhook de Stripe acreditaba con el 2 %. En
la MT-000002 la orden de compra salió por $30.91 y a la billetera entraron
$31.23. **El número correcto es el del método** —en tarjeta el 2 %, porque el
precio que pagó el comprador se calculó con ese 2 % dentro— y lo decide
`puntosBaseDelMetodo()` en `src/lib/dinero.ts`.

Ahora hay UNA sola cifra, `items_pedido.comision_centavos`, y todos la leen: la
orden de compra, la billetera, el acreditado y el correo que le avisa al
comercio. **Que cuadren dejó de depender de que cuatro sitios hagan la misma
cuenta.**

**Deuda pendiente:** la MT-000002 quedó con el 3 % guardado. Su orden de compra
dice $30.91 cuando debería decir $31.23. Corregirla es tocar un documento
contable ya emitido, y esa decisión es del dueño.

De paso se arregló un fallo viejo de la billetera: `fechaTransaccion` está
declarada como timestamp, así que Drizzle la devuelve como `Date`, y el código
la multiplicaba por mil. Los movimientos salían fechados **en el año 58548**, y
además se iban al principio de la lista y empujaban fuera de la pantalla a los
movimientos de verdad.

## Las dos facturas de cada venta (7 ago 2026 · Fase 1 de `PLAN.md`)

El modelo se sostiene sobre esto y hasta hoy el sistema no emitía nada. Ahora,
**cuando un pago queda confirmado** —por Stripe o al aprobar un comprobante de
Zelle— se emiten solos:

- **La factura de venta** (`facturas` + `lineas_factura`), de Windoce, LLC al
  comprador. La emitimos nosotros.
- **Una orden de compra por comercio** (`ordenes_compra`). **La factura de
  compra la emite el COMERCIO, no nosotros** — no se fabrica un documento a
  nombre de otro. Lo que hacemos es darle la orden con todo lo que necesita
  para facturarnos, y guardar su factura contra ella.

**El monto de la orden es lo que se le PAGA al comercio** (subtotal − margen),
no el precio publicado. Si figurara el publicado, diría que le compramos por
más de lo que le pagamos.

**El correlativo NO sale de `COUNT(*)`.** Los pedidos sí lo usan y está bien
ahí; una factura no puede saltar ni repetir. El número se toma con
`UPDATE series_documento SET ultimo = ultimo + 1 ... RETURNING`, que en SQLite
es una sola operación atómica — dos confirmaciones a la vez reciben números
distintos. Comprobado contra la base local, no solo en pruebas.

**Los datos de las partes se copian, no se apuntan.** Si mañana la sociedad
cambia de nombre, la factura vieja tiene que seguir diciendo lo que decía.

**Emitir nunca tumba un pago:** va en su propio `try`, después de acreditar. Un
documento se vuelve a emitir; un cobro no se vuelve a cobrar.

Quién emite sale de `EMISOR_IDENTIFICACION` y `EMISOR_DIRECCION` (variables de
entorno, no código: el día que la sociedad pase a Mercatren LLC se cambian sin
tocar nada). Si faltan, sale el nombre solo — **nunca inventa una dirección**.

## Las preguntas de cada producto (10 ago 2026 · Fase 2 de `PLAN-CONFIANZA.md`)

El comercio escribe en su panel las preguntas que ya le hacen por WhatsApp
(«¿sirve para 220?», «¿cuántos metros trae?») y salen respondidas en la ficha.

**Esto NO es una reseña, y la diferencia no es de matiz.** Una pregunta escrita
por el vendedor es **información del producto**; nadie finge ser un cliente
contento y en pantalla se lee quién responde. Una estrella inventada es una
persona falsa diciendo que quedó satisfecha — eso es lo que se descartó en
`PLAN-CONFIANZA.md`, con la ley delante.

- `src/lib/preguntas/reglas.ts` — puro, 16 pruebas. **Una pregunta sin respuesta
  NO sale al público**: enseñar «¿sirve para 220?» sin nada debajo le planta la
  duda al siguiente comprador y no se la resuelve. Es peor que no tener nada.
- **A igual orden desempata el id.** Sin eso, dos preguntas con el mismo número
  se intercambian entre una carga y otra y la ficha «baila» sin motivo.
- La ficha usa un `<details>` del navegador, como «Más de este comercio»: abre
  sin una línea de JavaScript, **Google lee el contenido aunque esté cerrado** y
  funciona con lector de pantalla. La primera va abierta, o nadie toca ninguna.
- Sin traducción al inglés se muestra el español, como en todo el catálogo. **No
  se inventan traducciones.**
- Los avisos de las acciones salen por `mensajes()`, no escritos en el código:
  el panel se ve en los dos idiomas.

**No se espera nada del dato `FAQPage`.** Google retiró ese resultado
enriquecido en junio de 2026. Esto se hizo por las 28 páginas «rastreada:
actualmente sin indexar» de Search Console —fichas de dos líneas que Google no
considera suficientes—, porque es justo lo que cita un asistente de IA, y porque
responde la objeción antes de que mate la venta.

## El blog y la documentación

`/blog` (novedades) y `/docs/<slug>` (documentación) salen del **mismo motor**:
`src/contenido/articulos/`. Un artículo se escribe en `es.ts` **y** en `en.ts`
con el mismo `slug`, y entra solo al mapa del sitio con su dato estructurado
`Article`.

Cada artículo es una página propia a propósito: **cada cosa que se publica suma
para Google**; escribirlo todo dentro de una página larga no suma nada.

**Al publicar algo nuevo:** una nota en el blog contando qué cambió, y si hace
falta explicar cómo funciona, su página de documentación enlazada desde la nota.

## El blindaje (6 ago 2026)

El proyecto tiene un arnés automático que atrapa los errores antes de que
lleguen a un cliente. Se instaló **encima** de lo que ya funcionaba: no se tocó
ni una línea de lógica del producto, y lo viejo que no pasa se anotó como deuda
en vez de "arreglarse" a lo bruto.

**Un solo comando lo corre todo:**

```bash
npm run verify
```

= tipos + revisión de código + pruebas con cobertura + auditoría de
dependencias + búsqueda de secretos + compilación. Corre solo en cada `git
push` (hook de husky) y en GitHub (`.github/workflows/verify.yml`).

Las piezas, y por qué cada una:

| Pieza                                       | Qué protege                                                                        |
| ------------------------------------------- | ---------------------------------------------------------------------------------- |
| `e2e/humo.spec.ts`                          | 18 direcciones tienen que responder 200, y el catálogo de Google no puede ir vacío |
| `tests/msw/servidor.ts`                     | Ninguna prueba le pega a Stripe, al correo ni al servidor de un comercio           |
| Umbral en `vitest.config.ts`                | La cobertura no puede bajar de donde estaba el 6 ago 2026                          |
| `scripts/auditoria.ts`                      | Los fallos de dependencias conocidos están escritos; uno nuevo rompe el build      |
| `.gitleaks.toml` + hooks                    | Ninguna clave entra al repositorio, que es público                                 |
| `src/env.ts` + `tests/unit/entorno.test.ts` | Ninguna variable de entorno se usa sin declararla y documentarla                   |
| Cabeceras en `next.config.ts`               | CSP, HSTS, nosniff, frame-options, referrer y permissions                          |
| `eslint-plugin-security`                    | Avisa de patrones peligrosos nuevos (en modo aviso, no error)                      |

**Tres cosas que NO se pueden hacer**, y que son justo las tentaciones cuando
algo se pone rojo:

1. **Bajar el umbral de cobertura.** Si se pone rojo, lo que falta es la prueba
   del código nuevo.
2. **Agregar algo a `CONOCIDOS` de `scripts/auditoria.ts` sin mirarlo.** Se
   agrega cuando se puede escribir por qué no alcanza al sitio publicado.
3. **Saltarse un hook con `--no-verify`.** Si está rojo, se arregla el cambio;
   no se apaga el semáforo.

**La CSP está escrita para ESTE proyecto, no copiada de un ejemplo.** Lleva
`unsafe-inline` y `unsafe-eval` en `script-src` porque Next mete guiones en
línea para arrancar la página —quitarlos deja el sitio en blanco— y `img-src`
acepta cualquier `https` porque las fotos de los productos importados se sirven
desde el servidor de cada comercio, y cada comercio nuevo trae un dominio que
hoy no se conoce. Se comprobó en el navegador con la CSP puesta y quitada: el
sitio se ve igual y no hay ni un aviso en la consola.

### Lo que quedó pendiente a propósito (deuda escrita)

Ninguna de estas se hizo porque **hacerlas exige tocar el código del producto**,
y eso estaba prohibido en este trabajo. Están aquí para cuando se decida
abrirlas, cada una en su propio trabajo y con sus pruebas:

- **`zod` en solo 3 de los 12 archivos con acciones de servidor.** Validan
  productos, tiendas y retiros. **No validan:** `correo/acciones.ts`,
  `retiros/monto.ts`, `pedidos/comprobante.ts`, `pedidos/acciones.ts`,
  `legal-acciones.ts`, `zelle/acciones.ts`, `catalogo/traer-fotos.ts`,
  `catalogo/sincronizar.ts`, `stripe/acciones.ts`. Todas exigen sesión y rol,
  así que no están abiertas a cualquiera, pero un dato mal formado llega hasta
  la base. **Es la deuda más grande que dejó el blindaje**, y se cierra archivo
  por archivo, cada uno con su prueba.
- **Límite de intentos (rate limit)** en entrar, registro y recuperar clave.
  Hoy la protección es Turnstile, que frena robots pero no a alguien decidido.
- **`noUncheckedIndexedAccess` en TypeScript.** Se probó: rompe en 16 sitios (8
  del producto, 8 de pruebas). Encenderlo obliga a reescribir esos 16.
- **Nonce por petición en la CSP**, para poder quitar `unsafe-inline`.
- **La cobertura mide los archivos que las pruebas tocan, no el proyecto
  entero.** Un archivo nuevo sin pruebas no baja el número, porque ni se mide.
- **`e2e/comprobante.spec.ts` falla en local** (`ERR_ABORTED` al navegar justo
  después del login). **Es preexistente**: se comprobó corriéndola en `main`
  sin nada del blindaje y falla igual. En GitHub se salta sola, porque ahí la
  base no tiene el pedido de prueba.
- **2 avisos de seguridad en el lint**, los dos falsos positivos comprobados:
  la expresión regular de `precio-tienda.tsx` se aplica a lo que genera
  `Intl.NumberFormat` (nadie de fuera lo controla) y la de `middleware.ts` se
  arma con nuestra propia lista de idiomas.

## Publicar: el push basta, pero hay que MIRAR el run (corregido 7 ago 2026)

**Los push a main sí disparan la publicación.** El 6 de agosto se anotó aquí lo
contrario, y era una lectura equivocada: se estaba mirando `gh run list` sin
filtrar y los runs por push no aparecían donde se los buscaba. Comprobado el 7
de agosto con cuatro commits seguidos, los cuatro publicados solos.

**NO dispares el flujo a mano después de un push.** El disparo manual y el del
push caen en el mismo grupo de concurrencia, y el segundo **cancela al
primero**: el 7 de agosto el manual salió `cancelled` a los 3 segundos. Si te
quedas mirando ese run, parece que la publicación falló cuando en realidad la
buena estaba corriendo al lado.

**Lo que sí hay que hacer siempre: comprobar que terminó en verde antes de
decir que algo está publicado.**

```bash
gh run list --limit 3 --workflow=build.yml
```

**Y después, mirar el sitio de verdad — con la caché saltada.** El run en verde
solo dice que se compiló y se subió; el borde sigue sirviendo la página vieja
un rato. El 7 de agosto tardó **unos 4 minutos** en propagar, y durante esos
minutos el sitio devolvía 200 con el texto anterior. Comprobarlo sin
cache-buster es exactamente cómo se reporta "ya está arriba" cuando no lo está:

```bash
curl -s -H 'Cache-Control: no-cache' "https://mercatren.com/es/nosotros?v=$RANDOM" | grep "lo que cambiaste"
```

## Comandos

**Las pruebas de punta a punta NO llevan textos escritos a mano.** Los sacan
de `messages/es.json` y buscan por rol. Se aprendió caro: cuando el título
pasó de "Entrar" a "Iniciar sesión" y cuando se agregó el ojito de la
contraseña —que hizo que buscar por la etiqueta "Contraseña" encontrara dos
cosas—, las pruebas se quedaron atrás y **tumbaron cuatro publicaciones
seguidas sin que nadie lo notara**: el sitio pasó días sin recibir nada
mientras cada commit parecía subido. Si una prueba busca un texto literal de
la interfaz, está mal.

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
npm run verify          # TODO junto: tipos, lint, pruebas, auditoría, secretos, build
npm run auditoria       # dependencias: falla solo si aparece un fallo nuevo
npm run secretos        # busca claves en toda la historia del repositorio
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

## El perfil del comercio y los envíos (7 ago 2026)

**La ficha pública se rehízo** (`/tienda/[slug]`): el nombre va **grande dentro
de la portada azul**, el logo montado en el borde, y al lado el botón de
escribir por WhatsApp — armado del teléfono que el comercio ya cargó; si no lo
tiene, no se dibuja. Debajo, la franja de confianza (verificada · productos ·
desde cuándo), la descripción en texto normal, y las tarjetas de envío, horario
y dónde se retira.

**Los datos de la empresa bajaron al final**, después de los productos. El RIF y
el domicilio los busca quien ya decidió comprar; quien llega de Google quiere
ver qué venden.

**No se enseña cuántas ventas lleva un comercio.** Decisión del dueño: con "0
ventas" espanta más de lo que ayuda. Va cuando el número acompañe.

**Los datos fiscales van DENTRO del banner, a la derecha** (identificación
fiscal, correo, dirección, sitio web), separados por una línea fina y no por
una caja — una caja dentro del banner se ve como un parche pegado. Suben ahí
porque quien llega sin conocer la tienda necesita ver que hay una empresa de
verdad detrás ANTES de bajar. La razón social no sube (ya es el nombre grande)
ni el teléfono (ya es el botón de WhatsApp), y **la tarjeta del final se
eliminó**: repetirlo cargaba la página sin agregar nada.

**El sello de verificado va MONTADO en la esquina de ARRIBA A LA IZQUIERDA del
logo**, con el envoltorio `relative` y el sello `absolute`. Las dos posiciones
que se probaron antes fallaron: en el flujo, al lado, se lo comía el botón de
contacto; abajo a la derecha quedaba pegado al botón de WhatsApp — y los dos
son verdes, así que se leían como una sola cosa. Arriba a la derecha tampoco
sirve: con un logo ancho, esa esquina se corre hacia el botón otra vez. A la
izquierda queda lejos mida lo que mida el logo.

**El botón de contacto lleva el logo REAL de WhatsApp**
(`src/components/ui/icono-whatsapp.tsx`; lucide no trae logos de marcas), pero
**el botón va en el azul de la casa, no en verde**. Se probó con el verde
entero de WhatsApp y quedaba enorme: una mancha verde que se comía la ficha y
sacaba la página del estilo del sitio. El contacto es una acción más, no la
protagonista. Lo que sí conserva su verde es el logo: a ese tamaño el color es
lo que hace que se reconozca sin leer.

**El enlace lleva el mensaje escrito de antemano** («Hola, estoy interesado en
tus productos publicados en Mercatren.com», bilingüe). Al comercio le entra un
WhatsApp de un número que no conoce: si llega vacío no sabe quién es ni de qué
le hablan, y muchas veces ni contesta. Y el comprador no tiene que pensar qué
escribir, que es justo donde se abandona una conversación antes de empezarla.

### Cada tienda tiene su color

`apariencia_tienda` (tabla nueva) guarda el color elegido; la paleta y la
lógica están en `src/lib/marca/colores.ts`.

**EL COLOR SALE DEL LOGO** (`src/lib/marca/color-de-imagen.ts`). Se calcula en
el NAVEGADOR, sobre un lienzo, la primera vez que el comercio abre su panel —
no hace falta procesar imágenes en el servidor. Si nunca eligió color, se le
guarda ese. Si ya eligió, no se le toca nada.

**Se vota por tono, no se promedia.** El logo de Bley tiene un arco azul y
letras rojas: promediando los píxeles saldría MORADO, un color que no está en
el logo y que no se parece a nada de la paleta. Cada píxel vota por su franja
de 30° y gana la que más peso junta; se promedia solo dentro de esa. Se
descartan el blanco del fondo, el negro del contorno y los grises — el píxel
más repetido de casi cualquier logo es el blanco, y no dice nada de la marca.

**Si no hay logo**, el color se deriva del NOMBRE. Es el respaldo, no lo
principal: derivar del nombre es arbitrario y ya falló — a una ferretería de
logo azul y rojo le tocó marrón, y su dueño quería azul. De ahí salió todo
esto (8 ago 2026).

Y si quiere, el comercio elige otro en su panel, o pide «usar el color de mi
logo» cuando cambie de logo.

**LA PALETA ES CERRADA Y TODOS SON OSCUROS, y no es capricho.** Todo el banner
va en texto blanco: el nombre, la identificación fiscal, el correo. Con un
selector libre de colores, tarde o temprano un comercio elige amarillo porque es
el de su marca, su ficha queda ilegible, y no va a saber por qué no le compran.
Hay una prueba que mide la luminancia de cada color y **falla si alguien agrega
uno claro**.

Los enlaces del banner van en blanco subrayado, no en naranja: el naranja se
ensucia sobre el vino y el tierra.

### En el celular, la ficha es OTRA (8 ago 2026)

En un teléfono, el banner con los datos fiscales más las tarjetas de envío y
horario **se comían la pantalla entera**: el comprador entraba y no veía ni un
producto sin hacer scroll. En una tienda de seiscientos artículos, mucha gente
no llega nunca. La ficha se veía seria y no vendía nada.

Por debajo de `lg`, la ficha enseña **nombre, ciudad, logo, contacto, la franja
de confianza, dos líneas de presentación y los PRODUCTOS**. Todo lo demás —los
datos fiscales, el envío, el horario y dónde se retira— entra plegado en
«Más de este comercio», a un toque.

Es un `<details>` del navegador, a propósito: abre y cierra sin una línea de
JavaScript, Google lee su contenido aunque esté cerrado, y funciona con lector
de pantalla. Un panel con estado de React costaría más y daría menos.

La presentación va con `line-clamp-2` en móvil: un comercio que escriba tres
párrafos empujaría los productos fuera de la pantalla otra vez.

### Los envíos: cuatro estados, no un sí/no

Tabla `envios_tienda` (nueva, no columnas: así llega sola en la publicación).
La lógica pura está en `src/lib/envios/politica.ts`, con pruebas.

| Modo          | Qué significa                            |
| ------------- | ---------------------------------------- |
| `sin_definir` | Todavía no lo dijo. **NO es «no envía»** |
| `solo_retiro` | Se busca en su local                     |
| `porcentaje`  | Despacha y cobra un % sobre el precio    |
| `incluido`    | Despacha y no cobra aparte               |

**Por qué cuatro y no un booleano:** si a un comercio que sí despacha le
enseñáramos «solo retiro» por no haber llenado el formulario, le estaríamos
mintiendo a su comprador y quitándole ventas. `sin_definir` sale en su ficha
como **«Envío a toda Venezuela · aún no especificado por el vendedor»**, que
además es el empujón para que entre a completarlo.

**El porcentaje va en puntos base** (400 = 4 %), como toda comisión del
proyecto, y **está topado al 50 %**: un dedo de más convierte un 4 % en un 40 %
y el comprador lo ve como un cobro absurdo. Se acota en el servidor, no solo en
el formulario.

**El costo lo calcula el SERVIDOR con la política de la base**, nunca con lo que
mande el navegador — misma regla que el precio. Y se calcula **por comercio**:
un carrito con tres tiendas puede llevar tres fletes distintos, cada uno sobre
el subtotal de lo suyo.

**El retiro SIEMPRE está disponible**, aunque el comercio despache: quitarlo
sería cobrarle un flete que no pidió.

### Dónde se ve el envío (todo, no solo la ficha del comercio)

Cuando un comercio dice cómo despacha, eso tiene que cambiar en **las cinco
pantallas por las que pasa un comprador**. Si cambia en una sola, el sitio se
contradice a sí mismo:

| Dónde               | Qué dice                                              |
| ------------------- | ----------------------------------------------------- |
| Ficha del comercio  | La política, con su cobertura y su plazo              |
| Ficha del producto  | La misma línea, debajo de dónde se retira             |
| Checkout            | La elección retiro/envío, el costo y qué va a pasar   |
| Página del pedido   | El renglón de envío y cómo lo va a recibir            |
| Correo de la compra | El renglón de envío y el paso siguiente según el caso |

**Lo que había antes era una promesa fija y falsa.** La ficha del producto
decía a todo el mundo «por ahora todo se retira en el depósito, no hacemos
entregas a domicilio», y el checkout «todo se retira en el depósito». Desde que
los comercios pueden despachar, eso le estaba quitando la venta en su propia
ficha a quien sí envía.

**Y el correo mandaba el SUBTOTAL, no el total.** Sin envío daba igual; con
envío le enseñaba al comprador menos de lo que iba a pagar. Corregido el 8 ago
2026 en el mismo trabajo.
