@AGENTS.md

# Mercatren.com

Tienda en línea operada por **Windoce, LLC** (Delaware, Estados Unidos).

## LA SOCIEDAD CAMBIÓ DE NOMBRE — PERO EL SITIO TODAVÍA NO (6 ago 2026)

**Ya está registrada `Mercatren LLC`** (sin coma), y es la que va a operar la
tienda: comprar, vender y facturar. `Windoce LLC` se queda solo como el
estudio que desarrolla el software — el crédito del pie de página.

El expediente se presentó el 7 ago 2026 (formulario CSCL/CD-700, Articles of
Organization de una LLC doméstica) y está **en revisión**, no aprobado todavía.
Ojo con esto: **es un estado distinto del de Windoce, LLC, que es de
Delaware.** Antes de tocar una línea del sitio hay que tener el certificado en
la mano y confirmar cuál es el estado de registro, porque de ahí cuelgan el
domicilio fiscal, el agente registrado y lo que dicen los términos.

**NO SE CAMBIA EL SITIO TODAVÍA.** Decisión del dueño: primero tienen que estar
a nombre de Mercatren LLC el banco, Stripe y Merchant Center. El motivo es
concreto: si el sitio dice Mercatren LLC pero el cobro le aparece al comprador
como Windoce en su estado de cuenta, eso genera reclamos y contracargos.

Mientras tanto, **todo el texto publicado sigue diciendo `Windoce, LLC` y está
bien así**. Son 239 menciones repartidas entre los términos, la privacidad, la
documentación pública, los correos y el PDF del modelo — y ese PDF lo revisó el
abogado, así que el cambio pasa por él antes de tocarse.

Cuando llegue el momento: `SITIO.sociedad` en `src/lib/sitio.ts` es el punto de
partida, pero no alcanza — hay texto escrito a mano en `src/contenido/`.

## LA FIGURA JURÍDICA (regla de cabecera, agosto 2026)

> El nombre que aparece abajo es el que está publicado hoy. Cuando se haga el
> cambio, se sustituye por `Mercatren LLC` en todo este bloque.

**Windoce, LLC compra y revende mercancía por cuenta propia.** No es un agente,
no cobra por cuenta de nadie y no administra dinero de terceros.

1. Un comprador en Estados Unidos compra un producto del catálogo.
2. Paga a Windoce, LLC el precio publicado, desde un banco estadounidense.
3. Windoce, LLC compra ese producto al proveedor **a nombre propio**, con
   factura emitida a Windoce, LLC.
4. El proveedor despacha a la **dirección designada por el comprador**.
5. Windoce, LLC emite factura de venta al comprador.

El dinero que entra es **ingreso propio**; el que sale es **costo de mercancía
vendida**. El ingreso de Mercatren es un **margen comercial dentro del precio
publicado**, no una comisión sobre dinero ajeno.

**Por qué importa:** la redacción anterior ("cobramos y liquidamos ese pago",
"el dinero es del comercio desde el cobro", "comisión del 3%") describe palabra
por palabra la definición de **money transmission** en Estados Unidos, que exige
licencias estatales y registro FinCEN, y es la razón por la que procesadores y
bancos cierran cuentas. El abogado y el contable lo corrigieron el 5 ago 2026.

### EL PRECIO Y LO QUE SE DECLARA (7 ago 2026)

**2 % con tarjeta · 3 % por Zelle.** Lo decidió el dueño el 7 ago 2026,
corrigiendo lo que se había hecho el día anterior (que dejó Zelle en 2 %).

| Método  | Margen de Mercatren | Procesador   | Precio publicado            |
| ------- | ------------------- | ------------ | --------------------------- |
| Tarjeta | 2 %                 | 2.9 % + 0.30 | `V = (base + 0.30) / 0.951` |
| Zelle   | 3 %                 | ninguno      | `V = base / 0.97`           |

**Y por Zelle el cliente igual paga menos**, porque el fee del procesador pesa
más que el punto de diferencia: en $100, $103.10 contra $105.47. El checkout
enseña el ahorro cuando elige Zelle.

**Las dos constantes tienen que cuadrar entre sí.** `COMISION_ZELLE_PB` (lo que
el precio le COBRA al comprador) y `tiendas.comision_puntos_base` (lo que se le
DESCUENTA al comercio al acreditar) son el mismo número, y por eso el esquema
importa la constante en vez de escribir 300. Del 5 al 7 de agosto estuvieron
desincronizadas —2 % contra 3 %— y ese punto salía del bolsillo del comercio en
cada venta, sin aparecer en ninguna pantalla.

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
CLAVE='…' npm run cuenta:crear -- --rol=vendedor --tienda=tienda-bley-ferreteria "Ferremateriales Bley C.A" correo@delcomercio.com
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

- **`mercatren@windoce.com` RECIBE.** Es el buzón real y funcional: el
  contacto de la web, el que figura en términos y condiciones, y el Reply-To
  de todo lo que enviamos. Vive en `src/lib/correo/direcciones.ts`.
- **`avisos@mercatren.com` SOLO ENVÍA.** Es la voz del sistema: bienvenida,
  contraseña, compra, pagos. No recibe nada. Cualquier buzón `@mercatren.com`
  sirve de remitente: el dominio entero está autorizado y firmado.
- **PROHIBIDO** poner de contacto un correo `@mercatren.com` sin buzón real
  (ej. soporte@mercatren.com): no recibe y el mensaje del cliente se pierde.

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
