@AGENTS.md

# Mercatren.com

Tienda en línea operada por **Mercatren LLC** (Michigan, Estados Unidos).

## LA SOCIEDAD YA ES MERCATREN LLC (12 ago 2026)

**`Mercatren LLC` opera la tienda: compra, vende y factura.** `Windoce, LLC` se
queda solo como el estudio que desarrolla el software — el crédito del pie de
página, que **no debe cambiar nunca**.

**MERCATREN LLC · Michigan · miembro único.** Domicilio registrado y fiscal:
30080 Montmorency Drive, Novi, MI 48377. El nombre legal va **SIN coma** — así
está en LARA y en el IRS, y así tiene que escribirse en todas partes. Windoce,
LLC, la anterior, de Delaware, sí la llevaba: no es un descuido, son dos
nombres distintos.

### Los datos que piden los formularios (comprobados en el registro público)

Verificado el 19 ago 2026 en `mibusinessregistry.lara.state.mi.us`, que es
contra lo que cotejan Payoneer, Google Merchant Center y los bancos:

| Dato                      | Valor                                 |
| ------------------------- | ------------------------------------- |
| Identification #          | **900260648**                         |
| **Fecha de constitución** | **11 ago 2026** (LARA: `08/11/2026`)  |
| EIN                       | **42-4386110** (carta CP575G del IRS) |
| Agente residente          | Pedro M Llerena                       |
| Estado                    | Active · AR Standing Good             |
| **Informe anual vence**   | **15 feb 2027**                       |

**OJO CON DOS COSAS AL LLENAR FORMULARIOS:**

1. **La fecha de constitución NO es la de la firma.** Las Articles of
   Organization se firmaron el **7 de agosto** y LARA las procesó el **11**. La
   que vale es la del registro. Yo mismo me equivoqué recomendando la de la
   firma; el registro público lo corrigió.
2. **El EIN se escribe SIN guion** cuando el formulario lo rechaza:
   `424386110`. Payoneer no admite `42-4386110`.

**El informe anual del 15 de febrero de 2027 no es un trámite menor**: si se
pasa, la LLC pierde el «Good Standing», y con eso se caen la verificación de
Payoneer, la de Merchant Center y potencialmente la cuenta de Mercury.

**La dirección del registro es la MISMA que la de devoluciones**, y eso es
deliberado: desde abril de 2026 Google cruza la dirección de devolución contra
la identidad declarada del comercio.

**EL BANCO DE MERCATREN LLC ES CHASE** (comprobado en pantalla el 19 ago 2026):
`BUS COMPLETE CHK`, cuenta corriente terminada en **1098**, titular `MERCATREN
LLC`. **Stripe activa**, tambien a nombre de Mercatren LLC. Falta la cuenta de
Zelle.

**Dos numeros de ruta, y confundirlos cuesta dias:** Chase da uno para depositos
directos y ACH y **otro distinto para wire**. Lo dice su propia pantalla. Quien
recibe por ACH —Payoneer, un cobro de un comprador— necesita el de ACH; poner el
de wire hace que la transferencia rebote.

**HAY DOS BANCOS Y LOS DOS ESTAN VIVOS** (comprobado el 19 ago 2026 con los
documentos oficiales): **Mercury** —que por dentro es Column N.A.— con una
corriente terminada en **9805**, y **Chase** con la ...1098. Asi que la alarma
de que las variables apuntaran a un banco muerto queda descartada: Mercury
sigue siendo el que recibe y el que mueve los retiros
(`src/lib/retiros/a-mercury.ts`). Lo que si hay que mirar una vez es **a cual
de las dos apuntan** `PAGO_CUENTA`, `PAGO_RUTA_ACH` y `PAGO_RUTA_WIRE`, porque
son las que `pedido/[numero]/page.tsx` le ENSEÑA AL COMPRADOR.

**Los numeros completos NO viven aqui**, que este repositorio es publico: estan
en `~/Mercatren-privado/BANCOS-Y-REGISTRO.md`, fuera del repositorio y con
permisos de solo su dueño. Ahi tambien esta por que un wire internacional a
Mercury **necesita** el banco intermediario `CHASUS33XXX`, y por que Chase da
dos rutas distintas —una para ACH y otra para wire— que rebotan el dinero si se
cambian.

**Y `datos/` NO estaba protegido como decia este archivo:** `.gitignore` solo
ignoraba `*.json` y `*.csv`, asi que un `.sql` o un `.md` dejado ahi se habria
publicado — y el historico Zelle trae nombres y correos de personas reales.
Ahora se ignora la carpeta entera menos su `LEEME.md`.

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

## LO QUE FALTA SE MIRA EN `PENDIENTES.md`

**Cuando el dueño pregunte «¿qué tenemos pendiente?», se contesta desde
`PENDIENTES.md`** — la lista completa, por bloques y en orden de urgencia, con
🔴🟠🟡 y marcando qué es código (💻) y qué solo puede hacer él (👤).

Existe porque los pendientes estaban repartidos en siete archivos y cada
respuesta se dejaba algo fuera. Los planes por tema siguen valiendo: ahí está
el detalle y el porqué. `PENDIENTES.md` es el índice completo, no un resumen
que los reemplace. **Al terminar algo se marca en los dos sitios.**

## Y el detalle de cada tema, en su plan

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

## Los buscadores del panel: uno solo, y dónde van (16 ago 2026)

Lo pidió el dueño al ver Cuentas y Comercios ya largas: _«estamos creciendo y no
quiero comenzar a querer buscar algo y no encontrarlo»_.

**`src/components/panel/buscador-panel.tsx` es UNO para todas las listas.**
Escritos por separado se desincronizan: uno espera 350 ms y otro 800, uno limpia
el filtro de la dirección y otro solo vacía la casilla, y quien usa el panel
tiene que aprenderse cada uno.

- **Filtra EN LA BASE, no sobre lo ya traído.** Con veinte filas da igual; con
  las 1.852 de productos, la pantalla tarda antes de dejar escribir.
- **El texto viaja en la dirección** (`?q=`): el resultado sobrevive a un
  refresco y se puede pasar por chat.
- **Espera 350 ms.** Sin eso, «Bleyder» son siete consultas y siete recargas con
  el texto saltando mientras se teclea.
- **Se ajusta durante el renderizado, no en un efecto.** El lint lo rechaza con
  razón: un `setState` dentro de un efecto dispara un segundo renderizado en
  cascada y se vería como un parpadeo al escribir.
- **Se apaga la equis nativa de Chrome** en los `type="search"`: salían dos, y la
  del navegador solo vacía la casilla sin quitar el filtro de la dirección — la
  lista se quedaba filtrada con la casilla en blanco.
- **El alcance manda sobre la búsqueda, siempre.** Un vendedor que escriba el
  nombre de otro comercio sigue viendo solo el suyo.
- **«No hay nada» y «no hay resultados» son textos distintos**: con el primero
  uno va a crear algo; con el segundo, a corregir lo que escribió.

**Dónde está puesto y por qué** (filas en producción el 16 ago 2026):

| Pantalla    | Filas | Busca por                                  |
| ----------- | ----- | ------------------------------------------ |
| Productos   | 1.852 | ya lo tenía                                |
| Pagos Zelle | 745   | ya lo tenía                                |
| Cuentas     | 10    | nombre, correo y **nombre de su comercio** |
| Comercios   | 28    | nombre, razón social, slug y ciudad        |
| Compradores | 2     | nombre y correo (crece con cada venta)     |
| Retiros     | 73    | comercio y referencia bancaria             |

**Pendientes a propósito, y el criterio:** enlaces de cobro, órdenes de compra,
créditos y pedidos al proveedor están **hoy casi vacíos** (0–2 filas). Una
casilla de buscar sobre dos filas es un mueble. Se les pone cuando pasen de unas
30, y con el componente ya hecho es de diez minutos cada una.

**En Retiros el buscador es solo del equipo**: un comercio ve los suyos, que son
cuatro.

## El botón que desbloqueó las ventas de EE. UU. (16 ago 2026)

**La API de CJ NO puede cobrar una tarjeta guardada.** Comprobado en su
documentación: sus tres formas de pago son `payBalance`, `payBalanceV2` y
`payType=2`, y las tres descuentan del saldo — que solo se recarga por Payoneer
o wire, con tres días de espera. No hay tokenización. Eso es lo que tenía el
proyecto parado.

**Pero `payType=1` devuelve `cjPayUrl`,** y ahí está la salida. Ahora, cuando
entra una venta de Estados Unidos, el sistema **crea solo el pedido en CJ** con
la dirección del comprador, sus renglones y sus cantidades, y deja un **botón de
pagar con tarjeta** — en el correo al equipo y en Panel → Pedidos al proveedor.
Diez segundos, sin buscar el producto, sin transcribir direcciones y **sin
cargar billetera**.

- `src/lib/cj/pedidos.ts` + tabla **`pedidos_proveedor`** (tabla, no columnas).
- **Se pide por SKU**, que es lo que ya guarda el importador: la API acepta
  `vid` o `sku` y exige al menos uno.
- **Idempotente por pedido**: si ya hay una compra viva no se crea otra. Sin
  eso, dos clics comprarían el producto dos veces — dinero de verdad saliendo
  dos veces.
- **Sin dirección no se compra, y se dice cuál falta.** El checkout está hecho
  para el retiro en depósito de Venezuela y deja la calle opcional; mandarle a
  CJ un pedido sin calle es pagar por un paquete que no llega.
- **Nunca tumba una venta**: va en su propio try al final de acreditar. Si CJ
  no contesta, el cobro sigue en pie y la compra queda pendiente en el panel
  **con el motivo exacto que dio CJ**, no con un «no se pudo».
- **Pagar y marcar son dos actos separados**: el pago ocurre en la pasarela de
  CJ y fingir que lo sabemos sería inventar un dato. Se guarda quién marcó y
  cuándo, como en los retiros.
- El filtro `paisOrigen = 'US'` en la cola **no es decorativo**: sin él, cada
  venta venezolana aparecería como «hay que comprársela al proveedor» y alguien
  le pagaría a CJ un producto que la ferretería ya despachó.

**`TRANSPORTE = "USPS+"` es una suposición hasta que las compras de prueba
digan cuál usa de verdad el almacén de EE. UU.** Si el nombre no existe, CJ
rechaza el pedido y su mensaje sale entero en el panel para corregirlo en un
minuto.

## El checkout no tenía dónde escribir la dirección (18 ago 2026)

Lo destapó el dueño comprando un producto de CJ como Soporte: eligió «que me
lo envíen» y **solo le pedía nombre, teléfono y "¿en qué ciudad estás?"**.
Escribió «MI» en la casilla de ciudad — que es exactamente lo que hace
cualquiera cuando el formulario no dice qué quiere.

No era un descuido: el checkout se construyó cuando Mercatren solo vendía en
Venezuela, donde **todo se retira en el depósito**, y su propio comentario
decía que pedir calle y número contradecía cada ficha del sitio. Era correcto.
Dejó de serlo el día que entró el catálogo de Estados Unidos.

**Y lo que no se veía era peor.** Comprobado contra la documentación oficial de
CJ: **`shippingProvince` (el estado) es OBLIGATORIO** y se le mandaba
`entrega.referencia` —una casilla prestada que va vacía—, así que **el pedido
se habría rechazado aunque el comprador pagara**. El código postal no se
mandaba en absoluto.

`src/lib/destino/direccion.ts` (puro, 13 pruebas) decide qué pide cada
destino. Cinco cosas que no se tocan:

1. **Es una TABLA por destino, no un `if`.** Chile y Colombia van a pedir lo
   suyo; con un `if (destino === "US")` repartido por el formulario, el
   servidor y el proveedor, el primer país nuevo obliga a encontrar los tres
   — y siempre se olvida uno.
2. **El estado se elige de una LISTA, jamás se escribe.** CJ compara el código
   de dos letras contra su tabla: «Florida», «florida» y «FL» no son lo mismo
   para ellos, y lo que no reconocen lo rechazan.
3. **El candado está en el SERVIDOR** (`crearPedido`), no en el formulario, y
   decide con lo que ya leyó de la base — de qué tienda es cada producto—, no
   con lo que diga el navegador.
4. **El destino se lo dice el servidor al checkout**, dentro de
   `opcionesDeEntrega`, que ya consultaba esos productos: el carrito guardado
   en el navegador NO lleva el país, porque los que ya existen nacieron antes
   de que hubiera catálogo de EE. UU.
5. **Venezuela no cambió ni un campo.** Comprobado en pantalla con los dos
   carritos: el de allá sigue pidiendo quién retira y su ciudad, sin
   dirección.

## LA PRIMERA COMPRA PAGADA MURIÓ POR UN SKU (18 ago 2026)

MT-000004 se pagó de verdad y CJ la rechazó con **«No variants found for
provided SKUs»**. La causa, comprobada en su documentación: **CJ tiene dos SKU
y le mandábamos el que no era.**

| Cuál             | Ejemplo           | De qué es             |
| ---------------- | ----------------- | --------------------- |
| `productSku`     | `CJJT05843`       | Del producto (el SPU) |
| **`variantSku`** | `CJJT05843-Black` | **De la variante**    |

El buscador guarda el primero —es el que manda `listV2`— y `createOrderV3` pide
el segundo, con esas palabras: «CJ variant SKU». **Y como el enlace de pago lo
devuelve CJ AL CREAR el pedido, sin pedido no había dónde pagar.** No faltaba
una pantalla: faltaba el pedido.

`src/lib/cj/variantes.ts` (puro, 14 pruebas) pregunta las variantes por `pid` y
manda el `vid`. Cuatro cosas de ahí que no se tocan:

1. **Se resuelve al COMPRAR, no al importar.** Así los 78 productos ya
   publicados quedan arreglados sin recargarlos, sin columna nueva, y la
   existencia que se mira es la de hoy.
2. **Se elige la MÁS BARATA**, porque es exactamente la que se le cobró al
   comprador: al importar, un precio en rango se publica por el mínimo. Elegir
   otra sería vender a un precio y comprar a otro más caro.
3. **A igual precio desempata el SKU.** Sin ese segundo criterio, dos
   reintentos elegirían variantes distintas: el panel diría una cosa y CJ
   despacharía otra.
4. **Queda escrito qué se pidió** (`renglones_proveedor`) y sale en ámbar
   cuando la eligió el sistema. Nuestra ficha publica el producto de CJ como
   una sola cosa, así que **el comprador nunca eligió talla ni color**. El pago
   a CJ lo pulsa una persona: esa es la oportunidad de cancelar.

**UNA COMPRA CON ERROR NO TENÍA NINGÚN BOTÓN**, y a la vez desaparecía de
«ventas esperando» porque su fila ya existía. El pedido quedaba en un callejón
sin salida con el comprador ya cobrado. Ahora hay «Volver a intentarlo», y el
reintento **reescribe** la fila fallida en vez de apilar otra.

**`logisticName` ya no está escrito a mano.** Era `"USPS+"` fijo; ahora se
preguntan los transportes reales (`freightCalculate`) y se cae a USPS+ solo si
esa consulta falla. De paso el correo dice **lo que cuesta el envío**, que hoy
entra como CERO al calcular el precio de venta.

**Y el compilador destapó que `pasos.ts` no conocía el estado `preparando`.**
Las pantallas lo colaban con `as EstadoDePedido`, así que un pedido marcado
como «preparando» —que está PAGADO— caía en la rama de «recién creado» y la
pantalla volvía a decir **«ahora falta el pago»**. Era el fallo del 18 de agosto
vivo por otra puerta.

## LAS DEVOLUCIONES: LA DIRECCIÓN NO SE PUBLICA (18 ago 2026)

Decisión del dueño, y el motivo es práctico: **esa dirección puede cambiar
dentro de un año, o antes.** Publicada se copia, se reenvía y se queda
circulando; el día que cambie seguirán llegando cajas a un sitio donde ya no hay
nadie que las reciba.

**El comprador abre su trámite en `/pedido/<número>` —motivo, comentario y
fotos— y la dirección aparece EN ESE MOMENTO.** Antes no existe: ni en la
política, ni en el correo, ni en el HTML de la página.

- `src/lib/devoluciones/reglas.ts` (puro, 19 pruebas) + tablas `devoluciones` y
  `fotos_devolucion`. La dirección sale de **`DEVOLUCION_DIRECCION`**, variable
  de entorno: cambiarla no puede depender de una publicación.
- **La dirección se COPIA dentro del trámite.** Si mañana cambia, quien ya
  despachó tiene que poder demostrar que mandó a donde se le dijo.
- **El plazo son 30 días desde la ENTREGA**, no desde la compra — Google
  rechaza lo segundo. La fecha sale de `hitos_pedido`; **sin fecha el plazo no
  corre**, porque ese hueco es nuestro y no se le cobra al cliente.
- **`enviado` SÍ puede reclamar.** «No me llegó» es justo el reclamo de un
  paquete que salió y no aparece; cerrarle esa puerta lo manda al banco.
- **Las fotos solo cuando el motivo las necesita.** De algo que no llegó no hay
  foto que sacar, y pedirla es una pared donde no hay nada que comprobar.
- **`tests/unit/direccion-devolucion.test.ts` se pone rojo** si alguien lee la
  variable fuera de `devoluciones/acciones.ts` o pega una dirección postal a
  mano en `src/`. Mismo candado que el nombre de la sociedad y el ojito de las
  contraseñas.

**Por qué la dirección es la de Mercatren LLC y no la de CJ:** CJ solo acepta
devoluciones en su almacén de China, y desde abril de 2026 Google cruza la
dirección de devolución contra la identidad declarada del comercio. Un comercio
de Michigan que devuelve a China es el patrón que suspenden. Además el que le
vendió al comprador es Mercatren LLC. **La mercancía vuelve a Novi y Mercatren
asume lo que valga** — decisión del dueño, y es el costo de vender.

## EL SITIO FORZABA HTTPS TAMBIÉN EN DESARROLLO (18 ago 2026)

`upgrade-insecure-requests` y HSTS iban fijos en `next.config.ts`. En una
máquina de desarrollo eso rompe dos cosas:

1. **La página no llega a funcionar.** El navegador pide los estilos y los
   guiones por `https://localhost:3000`, donde no hay TLS, y mueren con error de
   conexión segura. La pantalla se dibuja y nada responde: un formulario de
   entrar donde el botón no hace absolutamente nada.
2. **Y se queda grabado.** HSTS lo recuerda el navegador por dominio, así que
   `localhost` queda clavado en HTTPS **un año, para todos los proyectos de esa
   máquina**. Se limpia a mano en `chrome://net-internals/#hsts`, si uno sabe
   que existe.

Lo destapó la prueba de devoluciones en celular. En producción las dos cabeceras
siguen igual de puestas, que es donde sirven.

**Y el ayudante `e2e/apoyo/entrar.ts` perdía el correo.** En el perfil de
teléfono se escribía antes de que React montara el formulario y al montar lo
reiniciaba: la instantánea del error enseñaba la casilla del correo vacía y la
de la contraseña llena. Ahora se comprueba que lo escrito quedó, y si no, se
vuelve a escribir.

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
- **EL EQUIPO SÍ PUEDE COMPRAR DURANTE LA PAUSA** (16 ago 2026), y no es un
  privilegio: es la única forma de probar el circuito completo —venta, pedido
  al proveedor, pago con tarjeta, entrega— sin abrirle la tienda al público
  antes de saber que se puede despachar. La alternativa era quitar la pausa
  unas horas y cruzar los dedos. La opción se pasa **explícita y por defecto en
  `false`**: si alguien olvida pasarla, el candado se queda puesto; al revés,
  el olvido abriría la venta, que es el fallo caro. En la ficha sale una franja
  ámbar diciendo que para el público sigue en mantenimiento — comprar sin
  saberlo haría creer que la tienda ya está abierta.

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

## LA AUDITORÍA DEL 21 DE AGOSTO: CINCO COSAS QUE ESTABAN MAL (21 ago 2026)

El dueño pidió repasar lo construido buscando lo que no se hubiera terminado
bien. Salieron cinco, y **tres eran de dinero**. Se anotan aquí porque las tres
nacieron del mismo descuido: dar por hecho lo que no se comprobó en pantalla.

**1. CUALQUIER COMERCIO PODÍA DESCARGAR LA CONTABILIDAD DE MERCATREN LLC.**
`/datos/exportar?que=asiento` solo exigía `tienePermisoDePanel()`, y ese permiso
lo tiene el rol `vendedor`. El archivo trae el ingreso bruto de todos los
comercios juntos, el costo de la mercancía y el margen de la casa: las ventas de
sus competidores, en un CSV, escribiendo una palabra en la barra de direcciones.
Ahora `tablaDelAsientoMensual` exige `esEquipoInterno()` **antes de tocar la
base**. Comprobado con dos sesiones reales: un vendedor con su comercio recibe
403 en el asiento y **200 en sus propias ventas**.

**Aquí no vale el alcance por comercio** que usan las otras exportaciones: este
archivo no tiene una versión «la suya» que se le pueda entregar a un vendedor.

**2. EL ASIENTO AGRUPABA TODO EN «1970-01».** `strftime('%Y-%m', creadoEn /
1000, 'unixepoch')` — y las columnas son `mode: "timestamp"`, o sea **segundos**.
El `/1000` sobraba. Un asiento MENSUAL que amontona el histórico entero en una
sola fila no le sirve al contador para nada. Es el mismo fallo de unidades que
puso los movimientos de la billetera en el año 58548, ahora al revés.

**3. LA COMISIÓN DEL PROCESADOR ERA UN CERO FIJO**, con un comentario al lado
que prometía que «sale por diferencia». No salía: salía cero, y **el margen del
mes se declaraba con las comisiones de Stripe dentro**. En un asiento contable
eso es declarar de más. Ahora la calcula `comisionDelProcesador()`
(`src/lib/dinero.ts`, pura, 4 pruebas): 2.9 % + $0.30 **por cobro con tarjeta**,
y cero para Zelle, donde no interviene ningún procesador.

**No pretende cuadrar al centavo con el extracto de Stripe** —de eso ya se
encarga Xero, conectado con Stripe y con el banco—: sirve para que el margen no
salga inflado y para saber qué buscar cuando los dos números no coincidan.

**4. LA CASILLA DE LAS FACTURAS DE CJ ESTABA MARCADA SIN QUE EXISTIERA EL
TRABAJO.** Se creó la tabla `facturas_proveedor` y **nadie escribía en ella**.
En una venta de Estados Unidos vende Mercatren LLC, así que no hay orden de
compra a ningún comercio —nadie se factura a sí mismo— y el único papel que
respalda ese costo es la factura del proveedor. Ya se archiva desde Panel →
Pedidos al proveedor, en cada compra pagada.

- **`facturas-proveedor/` es privado en `/media`, y ni un comercio con sesión lo
  abre.** Lleva el precio al que compramos: con esa carpeta abierta, cualquiera
  calcula el margen restando. Comprobado: soporte 200, comercio 404, sin sesión 404.
- **No se pisa una factura ya archivada.** Reemplazarla en silencio dejaría un
  archivo huérfano en el bucket y el asiento respaldado por otro documento sin
  que nadie se entere.
- **El número es opcional**: no todos los proveedores lo dan, y exigirlo dejaría
  la factura sin archivar por un campo que no existe.

**5. EL CANDADO FISCAL FRENABA EL DINERO Y EL EQUIPO NO PODÍA VERLO.** El
W-8BEN-E se comprueba dentro de `pedirRetiro`, así que el retiro **ni siquiera
llega a la cola**: un comercio llama diciendo «no me deja pedir mi dinero» y de
este lado no había dónde mirarlo. Ahora sale en la tarjeta de cada comercio
(Panel → Comercios), en rojo si frena y en ámbar si solo avisa.

**Se marca la EXCEPCIÓN, no lo normal:** quien lo tiene al día no dibuja nada.
Un sello verde en cada tarjeta convierte la lista en ruido y hace que el rojo
deje de significar algo.

**Y esa fecha viaja en MILISEGUNDOS con el nombre diciéndolo**
(`fiscalVenceEnMs`). Sale de una subconsulta cruda, que se salta la conversión
de Drizzle: un `new Date()` del número pelado daba **1970**, y la pantalla habría
dicho que no puede cobrar alguien que sí firmó. Es el punto 2 otra vez, en otro
archivo, el mismo día.

## COBRAR SIN API, Y REENVIARLE EL ENLACE A QUIEN DE VERDAD PAGA (21 ago 2026)

**El cobro por enlace existía SOLO por API**, así que lo tenía un comercio: el
único con un programador que la integró. Los demás abrían «Enlaces de cobro», la
veían vacía para siempre, y **no había un solo botón para crear uno**.

Y el caso que lo pedía es el más común de todos: **quien paga no es el cliente**.
Alguien compra en el mostrador de Valencia y el que pone la tarjeta es su hijo en
Miami. El comercio necesita un enlace que se pueda REENVIAR.

`src/lib/cobros/pedir.ts` — misma mecánica que la API (`revisarPeticion`,
`venceEn`, `generarEnlace`, misma tabla, mismo correo); lo único que cambia es de
dónde sale la tienda: aquí del **alcance de la sesión**, allá del token.

**Va en archivo aparte de `cobros/acciones.ts` a propósito:** ese es el lado de
PAGAR un cobro —el intento de Stripe, la acreditación, el comprobante— y este el
de PEDIRLO. Juntarlos haría un archivo donde el dinero entra y sale en la misma
pantalla de código. _(Lo aprendí sobrescribiéndolo por error: el typecheck lo
atrapó, pero antes de crear un archivo hay que mirar si ya existe.)_

Cuatro cosas que no se tocan:

1. **EL MONTO NO USA `tipo="soloNumeros"`.** Ese filtro **se come el punto
   decimal**: quien escribe 45.90 guarda 4590, o sea **$4,590.00 cobrados por una
   factura de cuarenta y cinco dólares**. Va a mano con `inputMode="decimal"`,
   igual que en los retiros. No lo atrapó ningún tipo — lo destapó llenar el
   formulario en pantalla.
2. **El enlace se VE y se COPIA, aunque el correo salga.** La mayoría de estos
   enlaces se mandan por WhatsApp: con quien se habla es por chat. Un sistema que
   solo mande el correo obliga a entrar al buzón del cliente para copiarlo.
   `listarEnlacesDeCobro` **no traía el campo `enlace`**, así que el comercio
   veía su cobro y no tenía nada que copiar.
3. **Reenviar NO genera un enlace nuevo.** La referencia y el enlace se
   conservan: en el extracto del banco tiene que seguir apareciendo el mismo
   número, y el correo que ya circulaba sigue funcionando. Anular y recrear
   obligaría a cambiar la referencia — justo lo que ensucia la conciliación.
4. **Uno pagado o cancelado no se reenvía**, y el alcance va **dentro** de la
   búsqueda: si el cobro es de otro comercio no aparece, así que nadie reenvía
   un enlace ajeno escribiendo su id a mano.

Y al crearlo bien **se olvida el borrador y se vacía el formulario**: sin lo
primero, al volver a la pantalla el borrador repinta el cobro anterior y se crea
dos veces —o con un monto que ya no es—. Pasó en la primera prueba.

## EL FLETE Y EL MANEJO, QUE NO TENÍAN DÓNDE IR (21 ago 2026)

Lo pidió el dueño con el caso exacto: una ferretería vende diez sacos de cemento
por $540, el camión son $40, y subirlos a un tercer piso con dos ayudantes, $20.
El cliente paga $600.

Hasta hoy el comercio tenía dos salidas y las dos malas: **sumarlo al precio de
la mercancía** —y entonces la factura dice que el cemento costó $600, que es
falso— **o no cobrarlo**.

`src/lib/cobros/cargos.ts` (puro, 10 pruebas) + tabla **`cargos_cobro`**.

**SE LLAMAN «FLETE Y TRANSPORTE» Y «MANEJO Y SERVICIOS ADICIONALES», y el nombre
no es cosmético.** _Manejo_ es el término de la industria (_handling_): cubre
embalaje especial, carga y descarga, acarreo y subir a un piso. Separarlo del
flete importa de verdad — el flete lo cobra quien transporta y el manejo lo cobra
quien pone la gente. Un solo renglón de «otros gastos» es lo que hace que un
cliente llame a preguntar, y a veces a su banco.

- **Tabla y no dos columnas**, como manda la regla: `schema.sql` solo trae
  `CREATE TABLE IF NOT EXISTS` y una columna nueva no llega sola a producción. Y
  cada cargo lleva **su propia explicación escrita por el comercio**, que es lo
  que hace que el cliente entienda por qué paga de más.
- **El desglose se VE en la página de pago**: «mercancía $540 · flete $40 ·
  manejo $20». Un cargo que aparece sin decir qué es, es la primera línea de un
  contracargo — y aquí quien paga muchas veces **ni estuvo en el mostrador**
  cuando se acordó el precio.
- **El total se calcula, nunca se guarda aparte.** Guardar el total además de sus
  partes es tener dos verdades.
- **Un cargo en CERO no se guarda:** saldría «Flete: $0.00», que no significa
  nada y hace dudar de si falta algo por cobrar.
- **El concepto NO es obligatorio.** Obligar a explicar cada cargo haría que un
  comercio con prisa lo sumara al precio de la mercancía — justo lo que esto
  viene a evitar.
- **Tope de $5.000 por cargo.** No es desconfianza: un dedo de más convierte $40
  en $4.000 y quien paga lo ve como un robo. Corta el error de tecleo, no el
  negocio.
- **El total se ve mientras se escribe**, antes de mandar el enlace: si no cuadra
  con lo acordado, se corrige ahí y no anulando el cobro.

Comprobado en pantalla **a 375 px**, que es desde donde se cobra de verdad: el
formulario, el desglose en la página de pago y el reenvío entran sin desbordarse.

## ENTRANDO COMO UN COMERCIO SE VEÍA EL PANEL DEL SUPERADMIN (21 ago 2026)

Lo destapó el dueño usando «Ver su panel» y es un fallo de los serios. Sus
palabras: _«estoy viendo la cuenta del superadmin entrando como cliente… hasta
usted se puede equivocar»_.

Con el modo puesto, el panel del comercio salía **con el menú completo de
Soporte encima** —Comercios, Cuentas, Configuración, Catálogo de EE. UU.,
Pedidos al proveedor— y **no era solo el menú: se entraba de verdad**. Ahí
adentro están los enlaces que cobran de NUESTRA tarjeta, el costo real de la
mercancía y el dinero de todos los demás comercios.

La causa: el menú y las pantallas miraban `esEquipoInterno()`, que solo leía el
**rol** de la sesión. Y en este modo el rol sigue siendo `soporte` — lo que
cambia es el alcance de los datos, no quién eres.

**EL ARREGLO ES LA PROPIA FUNCIÓN, y por eso vale.** `esEquipoInterno()` ahora
devuelve **false** mientras hay un comercio observado. Con eso cambian las
**veinticuatro** llamadas a la vez: las pantallas dejan de enseñar lo del
equipo **y** `exigirEquipoInterno()` deja de dejar pasar. Con el disfraz puesto
no se archiva una factura del proveedor, no se baja el asiento contable y no se
compra saltándose la pausa de EE. UU.

- **`esSoporteDeVerdad()` NO mira el modo**, y es deliberado: la usan los
  retiros por Mercury y el recálculo de precios, que son cosas que se hacen
  como uno mismo y nunca disfrazado.
- **Salir del modo no comprueba nada.** Ya estaba así y es lo correcto:
  quitarse el disfraz no puede fallar nunca, o alguien se queda encerrado.

**Y OCULTAR NO ES CERRAR:** `src/lib/panel/solo-equipo.ts` (puro, 9 pruebas)
lista los tramos del panel que son solo del equipo, y el **middleware** los
cierra mientras el modo está puesto. Va ahí y no en cada pantalla porque una
línea cubre las secciones de hoy **y las que se agreguen mañana**; repartido
por pantallas, la próxima nace sin candado y nadie se entera.

- **Se compara por TRAMO COMPLETO, nunca por prefijo de texto.** `tiendas` y
  `mi-tienda` empiezan distinto pero `tiendas` y `tiendas-usa` no: con un
  `startsWith` a secas, cerrar una habría cerrado la otra — y peor, cerrar
  «tiendas» habría dejado al comercio sin poder editar su propia ficha.
- **El middleware lee la cookie por su nombre** porque corre en el borde y no
  puede importar `ver-como.ts`, que es `server-only`. Hay una prueba que se
  pone roja si los dos nombres dejan de coincidir: sin ella, renombrarla en un
  sitio abriría el candado en silencio.
- **Redirige al panel del comercio**, no al login ni a un 404: es donde la
  persona creía estar, y cualquier otra cosa haría pensar que se rompió algo.

**Comprobado con las dos sesiones:** con el modo puesto, seis secciones del
equipo dan 307 y siete del comercio dan 200; al salir, las seis vuelven a 200.

**Y de paso se vio un fallo viejo que solo se ve desde esa silla:** el tablero
del comercio enseñaba **«Disponible para retirar» DOS VECES**, con el mismo
número. Son dos ramas distintas que caían en la misma tarjeta. Dos veces el
mismo dato en una pantalla de dinero hace dudar de si son dos cosas distintas
—¿tengo $24.676 o $49.352?— y esa duda se paga cara. **Eso es exactamente para
lo que existe el modo.**

## EL W-8BEN-E ACEPTABA «ESTADOS UNIDOS» COMO PAÍS (21 ago 2026)

Lo destapó el dueño creando un comercio de prueba y llenando el formulario. En
el documento generado se leía, textualmente:

> `2 · COUNTRY OF INCORPORATION` → **ESTADOS UNIDOS**

**Ese formulario es, literalmente, el papel con el que una empresa declara NO
ser estadounidense.** Un W-8BEN-E que dice «Estados Unidos» se contradice en su
segunda línea, y no vale para nada.

**Y no fue por escribirlo a mano.** La casilla tenía `maxLength={2}` y el
placeholder «VE»; lo que metió el texto entero fue **el autocompletado del
navegador**, que además puso «ESTADOSUNIDOS» en el campo del número fiscal. En
un documento que se firma bajo pena de perjurio, un dato que puso el navegador
y nadie miró es exactamente lo que no puede pasar.

**La causa de fondo: el servidor solo comprobaba que el campo no estuviera
vacío.** `loQueFalta()` no valida contenidos.

`src/lib/fiscal/paises.ts` (puro, 12 pruebas): los 225 países del mundo con su
código ISO, **sin Estados Unidos**.

Cinco cosas que no se tocan:

1. **NI ESTADOS UNIDOS NI SUS TERRITORIOS.** Quitar solo «Estados Unidos» deja
   pasar **Puerto Rico**, Guam, Islas Vírgenes, Samoa Americana y las Marianas
   — y una entidad de Puerto Rico **es «U.S. person» para el IRS**: le toca el
   W-9. Es el mismo error con otro nombre, y es el que nadie ve.
2. **El candado está en el SERVIDOR**, no en el desplegable. Comprobado colando
   `US` y `PR` con la consola abierta: los dos rechazados.
3. **Se distinguen los dos errores.** A una empresa de Estados Unidos no se le
   dice «país inválido»: se le dice **que le toca el W-9**. Rechazar sin
   explicar deja a alguien sin poder cobrar y sin saber qué hacer.
4. **`autoComplete="off"` en el país y en el número fiscal.** `<Campo>` acepta
   ahora esa propiedad suelta y **no se cambió la regla del tipo**:
   `identificacionFiscal` se usa también en «Mi tienda», donde autocompletar sí
   ayuda.
5. **NO es una lista de sanciones.** Aquí están los países que existen, no los
   que se pueden pagar. Quién puede recibir dinero lo deciden Mercury y OFAC;
   mezclarlo haría creer que un país de la lista está aprobado para pagarle.

**Y el documento se arregló de paso:** decía `VE` en vez de **Venezuela** —el
campo del IRS pide el país en texto, y quien lo lee no se sabe la tabla ISO— y
el tipo de entidad salía en español dentro de un formulario en inglés. Ahora va
**Corporation**, que es lo que espera quien tiene que leerlo.

## ZELLE NO SALÍA EN NINGÚN ENLACE DE COBRO (22 ago 2026)

Un cobro de **$620** llegó con solo tarjeta. Zelle estaba construido entero
—los tres pasos, el número de conciliación en rojo, la captura, la cola de
validación— y **no lo tenía ni un comercio**.

La causa: `zelle_cobros_tienda` funcionaba como interruptor de ENCENDER. Sin
fila no había Zelle, y encenderlo era un acto del equipo tienda por tienda. En
la práctica eso significó que nadie lo tuviera nunca — y Zelle es **la** forma
de pago de esta clientela.

**AHORA EL EQUIPO LO APAGA, NO LO ENCIENDE.** Sin fila, disponible. Lo que de
verdad filtra lo que no compensa es el **mínimo de $200**, no el interruptor:
por debajo, validar la captura cuesta más de lo que deja el margen. El
interruptor se queda para poder quitárselo a un comercio concreto que dé
problemas.

Comprobado en pantalla: **$199 no ofrece Zelle ni dibuja el selector; $620
sí**. El número lo fijó el dueño de viva voz: _«si pasa de doscientos dólares,
Zelle debe ir en el link; si no pasa, se restringe por todos lados»_.

**OJO con el mínimo por tienda en CERO:** `0` es un valor válido y significa
«sin mínimo», no «usar el general». Un 0 guardado por descuido le abre Zelle a
ese comercio desde un centavo.

**Y EL TEXTO DEL NÚMERO DE CONCILIACIÓN SE REESCRIBIÓ.** Se pensó en advertir
«sin este número te devolvemos el dinero» y **se descartó**: eso le abre la
puerta a quien deje la nota en blanco a propósito para reclamar la mercancía Y
el reembolso. Lo que sí es cierto —y le sirve a quien paga— es que ese número
documenta las dos puntas del movimiento: _«a ti te justifica la salida de tu
cuenta y a nosotros la entrada en la nuestra»_. Quien entiende que le protege
su propia cuenta lo escribe; a quien se le amenaza, discute.

## POR QUÉ DESDE WHATSAPP NO SALEN LOS BANCOS (22 ago 2026)

Lo preguntó el dueño y la respuesta no es un fallo nuestro ni de Stripe.

Un enlace abierto desde WhatsApp **no se abre en Chrome ni en Safari**: se abre
en un navegador que va dentro de la propia app (_webview_). Pagar con la cuenta
del banco obliga a abrir una ventana del banco para identificarse, y eso un
webview no lo puede hacer — así que **Stripe directamente no ofrece ese
método**. Desde el lado del comercio la página se ve completa y nadie entiende
nada.

**No se puede arreglar**: ninguna página puede sacarse a sí misma de un
webview, lo decide la app. Lo que sí se puede es **decirlo**, y eso hace
`src/lib/navegador/dentro-de-app.ts` (puro, 7 pruebas) + el aviso ámbar con el
enlace copiable.

- **Se busca la marca de la APP, nunca se deduce por descarte.** Casi todos los
  navegadores de móvil llevan «Safari» o «Chrome» en su identificación,
  **incluidos los webviews**. Con un «no es Chrome, luego es webview» el aviso
  le saldría a media clientela — y un aviso que sale cuando no hace falta se
  aprende a ignorar.
- **`micromessenger` es WeChat y contiene `messenger`.** Sin descartarlo
  primero, a un usuario de WeChat se le decía que estaba dentro de Messenger.
  Lo encontró su propia prueba.
- **Va ANTES de los métodos de pago**: quien ya eligió tarjeta porque era lo
  único que veía no vuelve a subir a leer un aviso.
- **Y dice que la tarjeta SÍ funciona ahí dentro**, o el aviso se lee como «no
  puedes pagar» y la persona cierra la página.

## EL PDF QUE SE LE MANDA A LOS BANCOS DECÍA «WINDOCE» 54 VECES (22 ago 2026)

El dueño pidió barrer toda mención de Windoce del sitio público. El barrido
dio un resultado limpio —los textos, los términos, la privacidad, el
`llms.txt`, el sitemap y los datos estructurados están todos en Mercatren
LLC— salvo dos cosas:

1. **El crédito del pie de página.** Es la única mención visible, y **se queda**:
   decisión del dueño consultada expresamente. Ya lleva `nofollow` y
   `data-nosnippet`, así que Google no lo cita ni lo trata como una relación de
   negocio.
2. **El PDF del modelo de negocio**, y ese sí era grave.

**`public/docs/mercatren-modelo-de-negocio.pdf` decía «Windoce, LLC» 54 veces
y «Mercatren» solo 14.** Su primera línea: _«Mercatren es una tienda en línea
operada por Windoce, LLC»_. Se generó antes del cambio de sociedad y **no se
regeneró a propósito** —lo revisó el abogado y el cambio pasa por él—, pero
seguía descargable desde **tres sitios** del sitio público.

**Es el documento que se le manda a un banco o a un procesador cuando piden
«muéstrame cómo funciona».** Uno que nombra a otra empresa como operadora
contradice al propio sitio, a los términos y a la cuenta bancaria — que es
exactamente lo contrario de lo que hace falta para abrir una cuenta.

**Google no lo indexaba** (`robots.ts` lo cierra desde siempre) **pero una
persona sí lo descargaba**, y es justo la persona que importa.

**Se retiró la descarga, no el archivo.** Se queda en el repositorio para poder
compararlo cuando se regenere.

- **No deja a nadie sin nada:** la página `/docs/modelo-de-negocio` **ES** el
  documento, en HTML, actualizado y con los datos de Mercatren LLC. Lo único
  que falta es la versión imprimible.
- **A quien necesite los apartados que no se publican** —el encuadre
  regulatorio, los controles, el plan de crecimiento— se le dice que lo pida
  por correo. Quitar el botón sin decir cómo conseguirlo habría dejado sin
  salida justo al banco que preguntaba.
- **Vuelve cuando el abogado apruebe el PDF regenerado**, y está anotado en
  `PENDIENTES.md` en rojo.

## LA PÁGINA DE PAGO POR ZELLE, GUIADA — Y EL TUTORIAL DEL W-8BEN-E (22 ago 2026)

Tres cosas que pidió el dueño sobre el cobro por enlace, y una cuarta que
sirvió para destapar un hueco.

**1. El paso 1 va en VERDE, con el nombre del titular, y palpita.** Al mandar un
Zelle el banco enseña **a nombre de quién** está la cuenta antes de confirmar;
quien no sabe qué nombre esperar cancela — y hace bien. `ZELLE_NOMBRE_RECEPTOR`
existía y se usaba en la página del pedido, pero **al cobro por enlace no se le
pasaba**. Ahora el paso 1 dice «La cuenta está a nombre de Mercatren LLC».

- **El latido va uno detrás de otro, no todos a la vez** (`.latido-guia`,
  `-2`, `-3` en `globals.css`): paso 1 tres veces, paso 2 arranca a los 3,4 s,
  paso 3 a los 6,8 s. Si palpitara todo junto no guiaría nada. **Y se para
  solo** — una animación que no termina se aprende a ignorar.
- **Se apaga con `prefers-reduced-motion`.** No es acabado: hay gente a la que
  el movimiento repetido le marea de verdad.

**1b. Los tres pasos van en un HILO: círculo numerado y línea que los une.**
Lo pidió el dueño viendo la pantalla: los pasos «no estaban presentes». Un
«1 ·» pegado al título se lee como parte del texto; un círculo con el número
(verde, rojo, oscuro — el tono de cada paso) y una línea que baja hasta el
siguiente se lee como lo que es: un camino de tres paradas. Es un `<ol>`: el
número lo lee el lector de pantalla, la línea es `aria-hidden`. Y de paso el
correo del paso 1 **ya no se parte por la mitad** en celular —«pagos@mercatren.c
/ om»—: la fila es `flex-wrap` con ancho mínimo, así el botón «Copiar» baja de
línea cuando no cabe y el correo queda entero. Un correo partido se copia mal a
mano.

**2. «Esta factura ya está pagada», con método y fecha.** El caso exacto: el
comercio le hace varios cobros al mismo cliente, alguien vuelve a abrir un
enlace y no sabe si ese ya se pagó. Ahora sale en verde, arriba, con monto,
**cómo se pagó**, fecha y referencia. `cobros/como-se-pago.ts` (puro, 4
pruebas) lo deduce del prefijo del `pago_id` (`pi_`/`ch_` = tarjeta) o de la
fila en `cobros_zelle` — **y cuando no se sabe, dice «Confirmado», no inventa
«Tarjeta»**: esa pantalla la mira alguien que está conciliando su banco.

**3. El botón de devolver, a la mano.** Palabras del dueño: _«ese botón téngalo
a la mano porque el cliente lo tiene que tener a la mano. Muchas veces toca»_.
**No existía** para los cobros por enlace: un comercio que cobró de más escribía
a soporte, y mientras tanto quien pagó llamaba a su banco.

- `cobros/devolver.ts` + tabla **`devoluciones_cobro`** (tabla y no columnas,
  como manda la regla) + estado **`devuelto`** en `ESTADOS_COBRO`.
- **Solo lo pagado con tarjeta.** Un Zelle no tiene marcha atrás: el dinero
  está en una cuenta de banco y volver a mandarlo es una transferencia nueva
  hecha por una persona. El mensaje lo dice con esas palabras.
- **El motivo es obligatorio**, el alcance va dentro de la búsqueda, no se
  devuelve más de lo cobrado, y **solo una devolución TOTAL cierra el cobro**:
  con una parcial sigue pagado — el comercio entregó mercancía y cobró por
  ella, solo devolvió una parte.
- **Va dentro de un desplegable, no a la vista.** Un botón rojo suelto al lado
  de cada cobro pagado es fácil de tocar sin querer en un celular.
- **Uno devuelto no se puede cancelar encima** (`sePuedeAnular` lo sabe): el
  dinero entró y volvió a salir, y cancelarlo borraría el rastro de las dos
  cosas.

**4. El tutorial del W-8BEN-E, con capturas del propio panel.** El dueño lo va a
mandar a la mayoría de los comercios, así que va en `/docs/formulario-fiscal-w8ben-e`
en los dos idiomas. Lo que dice está sacado de lo ya verificado en
`PLAN-CONTABILIDAD.md` (title passage §861/§862, sin 1099 a extranjeros, sin
retención) — **no se inventó nada**.

- **El motor de artículos no admitía imágenes.** Se agregó el bloque `imagen`
  (`src`, `alt` obligatorio, `pie`) en `tipos.ts` y `cuerpo-articulo.tsx`. «Un
  tutorial de solo texto no está terminado» — regla de la casa.
- **`tests/unit/articulos-imagenes.test.ts`** se pone roja si un artículo
  referencia una captura que no está en `public/`, o con `alt` vacío. La
  próxima captura que alguien olvide subir salta ahí, no en la pantalla de un
  comercio siguiendo el paso 3.
- Las capturas se tomaron con Playwright a 390 px y DPR 2, y se encogieron a
  900 px de alto máximo. **La primera salió de 1.800 px** porque la tarjeta
  trae el formulario desplegado cuando falta firmar: se recortó a los primeros
  620 px. El formulario entero va en la captura 2.
- De paso: la ayuda bajo el país decía «Dos letras: VE, CO, MX, CL…» con el
  campo ya convertido en desplegable. Corregida.

## LA DEMOSTRACIÓN DEL PANEL: UNA TIENDA QUE VENDIÓ $6.000 (22 ago 2026)

Lo pidió el dueño para una presentación y un video: enseñarle a un comercio
**cómo se ve su panel cuando vende** — las ventas, cuánto le quedó, cómo pide
su dinero. Vive en `public/demo/panel-ventas.html` y se presenta desde
`/docs/demo-del-panel` (artículo en los dos idiomas, con su captura y un botón).

- **Es un HTML estático aparte, no una pantalla del producto.** Una tienda
  inventada con ventas inventadas no puede vivir dentro del panel real. Lleva
  `noindex` para que unas ventas de mentira no salgan en Google como si fueran
  reales; el artículo de `/docs` sí se indexa y es la entrada.
- **Los productos son SOLO de nuestras tiendas de Estados Unidos** (Sole &
  Thread, Ridgeback, Oakhaus, Copper Spoon, Yo soy Elon, Belle & Co…), con su
  título en español y su precio publicado, sacados del propio feed de Google.
  Decisión del dueño: ni uno de la ferretería ni de otros comercios — «el
  cliente va a pensar que le estamos vendiendo los productos».
- **Y no solo los productos: TODO lo que se lee sale de esa tienda.** Los
  conceptos de los cobros por enlace decían «10 sacos de cemento + flete» y
  «Repuesto llave de paso» — escritos de memoria, del caso de la ferretería de
  otro trabajo. En un demo que sus clientes ven como «así se ve tu panel», una
  ferretería que no existe se lee como tomadura de pelo. Ahora son maletas,
  bicicletas y lámparas de la misma lista, con envío a domicilio por DHL.
  **Antes de entregar un demo se barre el archivo con `grep`** buscando el
  vocabulario del caso que NO es.
- **El demo APLICA la regla de Zelle desde $200, igual que el sistema.** Lo
  encontró el dueño grabando el video por tercera vez: en Cobros → Zelle salían
  ventas de $39 y $101 «pagadas por Zelle». No se corrigió solo en los datos:
  `ZELLE_MINIMO = 200` en el propio demo y una venta marcada «zelle» por menos
  pasa a tarjeta al calcular, así que no puede volver a contradecirse aunque
  alguien toque la lista. `tests/unit/demo-panel.test.ts` lee el HTML y se pone
  rojo si vuelve a pasar, si el vocabulario de ferretería reaparece o si se cae
  el `noindex`.
- **Lleva diez compras chiquitas con tarjeta, desde $1,09, revueltas entre las
  grandes.** Lo pidió el dueño para el video: enseñar que con tarjeta se compra
  desde un dólar, sin el mínimo que piden en Venezuela. Una unidad cada una,
  productos baratos de nuestras tiendas (pegatinas, aceite esencial, labial,
  camiseta…), con los días repartidos para que en Órdenes se mezclen solas con
  las grandes. 44 ventas y $6.391,38 en el mes.
- **Los totales se CALCULAN a partir de la lista de ventas** (vendido, comisión,
  procesador, te quedó, disponible). Así cuadran al centavo y el retiro de
  prueba mueve «disponible» a «pedido» de verdad.
- Es bilingüe (ES/EN con interruptor), calcado al panel real (mismos grupos de
  menú, mismas tarjetas) y entra en celular. El motor de artículos ganó el
  bloque `boton` para enlazarlo.
- **La dirección para compartir es `https://mercatren.com/demo/panel-ventas`**
  (sin `.html`). En producción el servidor de estáticos de Cloudflare quita la
  extensión: `/demo/panel-ventas.html` responde **307** hacia la limpia, y la
  limpia 200. En local (`next dev`) es al revés: solo existe la del `.html`.
  Por eso el artículo enlaza la del `.html` —funciona en los dos sitios— y
  **no se agrega una ruta de Next para «limpiarla»**: si la plataforma dejara
  de servir el estático primero, una ruta que redirige al `.html` haría un
  bucle con el 307 de Cloudflare.

## LA PORTADA POR RONDAS, LA FLECHA QUE VUELVE A LA TIENDA, LOS SIMILARES Y «LO QUE ESTABAS MIRANDO» (23 ago 2026)

Lo pidió el dueño con cuatro puntos y una condición: _«vamos a hacerlo bien
hecho esta vez»_.

**1. La flecha de la ficha sacaba de la tienda.** Era un `← Volver al catálogo`
fijo (`href="/catalogo"`): quien recorría una tienda, abría un producto y tocaba
la flecha caía en el catálogo entero y tenía que buscar su tienda otra vez.
Ahora `VolverDeLaFicha` + `src/lib/catalogo/volver.ts` (puro, con pruebas):
vuelve atrás si venía del propio sitio, y si llegó de fuera (WhatsApp, Google)
va a **la tienda del producto**. Nunca al catálogo —hay prueba—.

- **`document.referrer` NO sirve dentro del sitio.** Next navega sin recargar y
  el referrer se queda con el de la primera carga (vacío si se entró por enlace
  directo). Medido: tienda → producto por clic, y `referrer: ""`. Por eso existe
  el **rastro de navegación** (`src/lib/navegacion/rastro.ts`, en
  `sessionStorage`: página actual y anterior, anotado por `<RastroDeNavegacion/>`
  en el layout de la tienda). La flecha mira primero el rastro y solo después el
  referrer. `rutaAnteriorA()` sirve ANTES y DESPUÉS de que el efecto anote la
  página actual, porque el primer dibujo ocurre antes del efecto — prueba.
- **El texto cambia y el `href` no:** «Volver» si hay atrás, «Volver a {tienda}»
  si no; el enlace es siempre la tienda, así sirve sin JavaScript y Google lo
  lee como lo que es.
- **Se lee con `useSyncExternalStore`, no con un `setState` en un efecto.** El
  lint lo rechaza, y con razón: es un segundo renderizado en cascada.

**2. La portada era de una sola tienda.** Medido en producción: los primeros 22
productos eran de la ferretería. No era el orden — «lo nuevo» (≤ 7 días) eran
622 de Bley contra 78 de Estados Unidos, y ni el barajado con semilla ni el
intercalado pueden arreglar una proporción así. Ahora la consulta ordena por
**RONDAS de tienda** con funciones de ventana de SQLite: ronda 0 = los 2 más
nuevos de cada tienda, ronda 1 = los 2 siguientes…
(`ROW_NUMBER() OVER (PARTITION BY tienda)`), y dentro de la ronda **primero las
tiendas con novedades** (`MAX(creado_en) OVER (PARTITION BY tienda) > corte`),
barajadas con la semilla para que la portada siga «moviéndose» entre visitas.

- `PRODUCTOS_POR_RONDA` vive en `intercalar.ts`, junto a `MAXIMO_SEGUIDOS`, y
  `tests/unit/portada-rondas.test.ts` exige que sigan iguales: la ronda y el
  intercalado cuentan la misma historia.
- **El divisor de la ronda va como `sql.raw` literal.** Un parámetro numérico
  puede llegar como REAL y la división dejaría de ser entera: todas las rondas
  serían distintas y el orden, ruido.
- La base local tiene una sola tienda: la proporción se mide en producción.

**3. Similares al pie de la ficha.** `productosSimilares()`: misma categoría
primero, luego misma tienda, **nunca el propio producto**, con el mercado y la
zona de siempre. Cierra con «Ver más de {tienda}».

**4. «Porque estuviste mirando».** Si la persona abre dos fichas de la misma
categoría, la portada enseña «Más de {categoría}»; si se pasa a otra cosa
(zapatos), la banda la sigue. `src/lib/catalogo/afinidad.ts` (puro, pruebas):
manda la categoría de las dos últimas fichas si coinciden; si no, la más
reciente que se repita en las últimas ocho; **una visita sola no es una
intención**. El historial vive en el navegador (`zustand persist`,
`mercatren-vistos`) y no se manda al servidor. `para-ti.tsx` pide por
`/datos/catalogo?categoria=` —la misma puerta de la parrilla, con mercado y
zona— y quita lo ya visto; con menos de tres no dibuja nada. La afinidad se
**deriva** con `useMemo` y lo cargado va atado a la categoría que lo pidió:
nada que «limpiar» en un efecto.

**OJO AL PROBAR ESTO EN EL NAVEGADOR DEL PANEL INTEGRADO.** React 19.2 revela
los límites de Suspense en un `requestAnimationFrame`; si la pestaña está
`hidden` (el panel no está al frente), la ficha en carga fría **no termina de
hidratar** —quedan `template[id^="B:"]` en el DOM, el botón del carrito sin
fibra de React— y los efectos (anotar la visita) no corren. Costó una hora
creer que era el store. No es un fallo del sitio: se comprueba con Playwright,
que abre la pestaña visible — `e2e/ficha-y-portada.spec.ts`, en celular y en
escritorio, sin textos escritos a mano.

## LAS TIENDAS CHICAS DE PRIMERO, CJ «VARIADITO», LA FOTO QUE ROTA Y DÓNDE SE RECLAMA (23 ago 2026)

Lo destapó el dueño la misma noche que se publicaron las rondas: _«sale primero
el bloque de Bley completo, y ahí viene todo lo de CJ, y el resto de productos
como que no existen… esas tiendas son chiquitas, sácalas de primero a todos;
¿que tiene un solo producto? no importa, sácalo de primero»_. Los clientes ya
se lo habían reclamado: parecía que se le daba prioridad a quien más productos
tiene.

**Por qué las rondas del 22 ago no bastaron.** Dos causas, las dos medidas:

1. **Lo primero que se ve en la portada son las BANDAS por departamento**, no
   la parrilla del final — y las bandas barajaban con `RANDOM()` a secas: en la
   de Ferretería la lámina de zinc de MAXIUM competía contra seiscientos
   productos de la ferretería y salía una vez de cada seiscientas. Las rondas
   solo se habían puesto en la parrilla de abajo, donde casi nadie llega.
2. **Las veintitrés tiendas `us-<rubro>` contaban como veintitrés tiendas.** Una
   ronda eran 46 productos de CJ antes del segundo producto de la tienda de
   Tucaní. Y «las tiendas con novedades primero» ponía siempre delante a la
   ferretería, que sincroniza a diario.

**La regla nueva, `ordenPorRondas(semilla)` en `consultas.ts`, usada por la
parrilla Y por las bandas:**

- El puesto se cuenta por **FAMILIA** (`familiaDe` en `intercalar.ts`): cada
  comercio venezolano es su propia familia; **todo lo de Estados Unidos es UNA
  sola, «us»** — detrás vende Mercatren LLC y surte un solo proveedor.
- La ronda = puesto / cupo: **2 por comercio venezolano, `CJ_POR_RONDA` = 6
  para toda la familia de CJ** («unos cinco, seis productos»). Ronda 0 = los
  dos más nuevos de CADA comercio de Venezuela + seis de CJ.
- **Dentro de la ronda, Venezuela primero**; las tiendas barajadas con la
  semilla de la visita (una vez abre MAXIUM, otra MEGAYES); CJ barajado con la
  semilla dentro de su familia.
- **Se quitó la ventaja entre tiendas por «tener novedades»**: tapaba a las
  chicas. Lo nuevo de cada comercio sigue yendo primero DENTRO de su tienda.
- **El intercalado posterior va por familia**, no por tienda: seis rubros de
  CJ seguidos son seis tiendas distintas para el intercalado por tienda, y el
  dueño los ve como un bloque.
- **La portada abre con «De todas las tiendas»** (`inicio.deTodasLasTiendas`):
  la primera tanda de la parrilla (24), ANTES de las bandas; la parrilla
  infinita del final sigue desde la página 2 (`desdePagina`), sin repetir.
  `obtenerPortada` pide 48 y la página los parte.

**La foto de la tarjeta rota** (`fotoDeTurno(semilla)`): MAXIUM tiene dos fotos
y la linda no la veía nadie. El turno se calcula con `ROW_NUMBER` dentro de las
fotos del producto —**no con `orden`, que el importador deja en 0 para todas**—
y las tres subconsultas (dirección, clave, alt) llevan el mismo orden, así que
hablan de la misma foto. La portada usa la semilla de la visita; el catálogo
por categoría y los similares, `semillaDelDia()` (estable entre páginas del
mismo listado). La ficha del producto no pasa por aquí: enseña todas sus fotos.
Comprobado en SQLite 3.51 y en la API local: seis semillas, la foto alterna y
el alt la sigue.

**Dónde se reclama, en toda ficha venezolana.** Los zapatos de Variedades
COLOMBIA NEXT no decían dónde se retiraban: el producto no tiene depósito y la
tienda sí tiene su dirección cargada. Ahora **sin depósito, el producto hereda
la ciudad y la dirección de su tienda** (`zonaPorNombre` en `zonas.ts`; la
misma regla que ya usaba el filtro `enZona`, así ficha y filtro cuentan lo
mismo), con la frase de lo que pasa después: «Después de pagar, reclamas el
producto en esta dirección con tu número de pedido» y «Comercio verificado en
Mercatren». Si la tienda tampoco cargó ciudad, **no se inventa**: se dice que
falta y que le escriba antes de pagar. Lo de Estados Unidos no pasa por aquí
(se despacha). `obtenerProductoPorSlug` trae `tiendaCiudad` y
`tiendaDireccion` (columnas nombradas, existen en producción desde el 5 ago).

Candados: `tests/unit/portada-rondas.test.ts` (reescrita),
`tests/unit/familia-vendedor.test.ts`, y las e2e de ficha y portada.

## AGENTES DE IA, METADATOS, BANNERS Y EL BLOG (23 ago 2026)

El dueño pasó el sitio por **isitagentready.com** y dio **33/100** («Bot-Aware»):
Discoverability 3/4, Content 0/1, Bot Access Control 2/2, API/Auth/MCP/Skills
0/8. Lo que faltaba no era contenido: era que una máquina pudiera descubrir qué
hay y cómo usarlo. Cuatro puntos en un solo arranconazo.

### 1. Lo que se le publica a los agentes (`src/lib/agentes/`)

**Una sola lista de direcciones** (`recursosDe(base)`) arma todos los
documentos, para que el catálogo de la API, la tarjeta MCP y el manifiesto ARD
no se contradigan (tres documentos a mano se desincronizan a la segunda
semana). `tests/unit/agentes.test.ts` lo exige.

| Qué                           | Dónde                                                        | Qué es                                                                                                                                                                                                                                        |
| ----------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Markdown para agentes         | cualquier página con `Accept: text/markdown`                 | El middleware reescribe a `/datos/markdown`, que arma el Markdown DESDE LOS DATOS (portada, ficha, tienda, catálogo, artículos) y para el resto convierte el HTML (`htmlAMarkdown`, sin DOM). Responde `text/markdown` + `x-markdown-tokens`. |
| Catálogo de la API (RFC 9727) | `/.well-known/api-catalog`                                   | `application/linkset+json` → OpenAPI, docs, salud, MCP.                                                                                                                                                                                       |
| OpenAPI 3.1                   | `/datos/openapi.json`                                        | Catálogo público, buscador, salud, MCP y la API de socios (sacada de las propias rutas, no de memoria).                                                                                                                                       |
| Salud                         | `/datos/salud`                                               | `{ok, base}`; 503 si la base no contesta. Es el canario.                                                                                                                                                                                      |
| Servidor MCP                  | `POST /datos/mcp`                                            | Streamable HTTP sin SSE, JSON-RPC 2.0. Cuatro herramientas de SOLO LECTURA: `buscar_productos`, `ver_producto`, `listar_tiendas`, `ver_tienda`. La lógica del protocolo es pura (`mcp.ts`) y los servicios reales están en `servicios.ts`.    |
| Tarjeta MCP (SEP-1649)        | `/.well-known/mcp/server-card.json`                          | Anuncia las mismas herramientas que sirve el servidor (prueba).                                                                                                                                                                               |
| Skills (agentskills.io)       | `/.well-known/agent-skills/index.json` + `<nombre>/SKILL.md` | «comprar-en-mercatren» y «cobrar-por-mercatren». El SHA-256 del índice se calcula del texto que se sirve: no pueden desincronizarse.                                                                                                          |
| Manifiesto ARD                | `/.well-known/ai-catalog.json`                               | `urn:air:mercatren.com:<espacio>:<nombre>`, tipo IANA, 2–5 consultas representativas por entrada.                                                                                                                                             |
| Recurso protegido (RFC 9728)  | `/.well-known/oauth-protected-resource`                      | `authorization_servers: []`, honesto: **no hay servidor OAuth** y no se publica uno.                                                                                                                                                          |
| auth.md                       | `/auth.md`                                                   | Cómo se consigue el token de tienda (lo entrega el equipo; una plataforma socia lo obtiene con su llave en `/datos/socios/vincular`).                                                                                                         |
| WebMCP                        | `<WebMcp/>` en el layout de la tienda                        | Si el navegador trae `navigator.modelContext`, anuncia buscar, abrir producto e ir a tienda. Nada de carrito ni sesión.                                                                                                                       |

Tres trampas medidas ese día:

- **Tras una reescritura del middleware, `request.url` en la ruta es el
  ORIGINAL, sin el parámetro.** Toda página devolvía la portada en Markdown.
  La ruta viaja también en la cabecera `x-ruta-markdown`.
- **El streaming de React manda el contenido FUERA de `<main>`** (en
  `<div hidden id="S:…">`). Quedarse con `<main>` daba páginas vacías; se
  convierten las dos versiones y gana la más completa.
- **`/.well-known/*` y `/auth.md` no pasan por el middleware** (el matcher
  excluye todo lo que lleva punto), así que next-intl no les pone idioma.
  Son rutas de `src/app/.well-known/...`; no hay archivos en `public/` ahí.

**DNS-AID (lo único que no sale del código).** Pendiente de Richard en el DNS
de mercatren.com: registros tipo **HTTPS (SVCB)** en `_index._agents` y
`_mcp._agents` con prioridad `1`, destino `mercatren.com.` y parámetros
`alpn=h2`, y **DNSSEC** encendido. Ver `PENDIENTES.md` bloque 4.

**Lo que NO se hizo a propósito:** un servidor OAuth/OIDC. No existe; publicar
`/.well-known/oauth-authorization-server` sería mentir. Cuando un tercero lo
necesite, se construye.

### 2. Los metadatos de cada ficha (`src/lib/seo/meta.ts`, puro, 11 pruebas)

El dueño: «los productos están en español, pero los metadatos no se
trabajaron». Ahora el título es **producto + comercio** (≤ 60) —«Electrodo
3/32 gris · Ferremateriales Bley C.A»—, la descripción dice **precio, dónde se
retira o que se despacha, y cómo se paga** (≤ 155, en los dos idiomas) y van
palabras clave y tarjeta de Twitter. `titularNormal()` pasa los títulos
GRITADOS del catálogo importado a normal conservando siglas y números; uno
escrito a mano no se toca. La tienda dice quién es, dónde está y cuántos
productos tiene; el catálogo cambia el título según lo buscado o filtrado.
**Nada inventado**: cada frase sale de un dato; lo que no hay, no se escribe.

### 3. Los banners publicitarios de las parrillas (`src/lib/banners/`)

Tabla **`banners`** (nueva, no columnas), CRUD en **Panel → Equipo → Banners**
(solo rol soporte, con `esSoporteDeVerdad()`: el disfraz de «ver su panel» no
puede poner publicidad), y salida en las cuatro parrillas públicas (portada
«De todas las tiendas», parrilla infinita, tienda y catálogo) con
`intercalarBanners` (puro, 14 pruebas): después de `cada_cuantos` productos va
un banner, se turnan, y **nunca abren ni cierran una parrilla**. Uno clavado a
una tienda sale SOLO en esa tienda; `todas/portada/tienda/catalogo` deciden el
lugar; `desde/hasta` programan; `mercado` los separa por país. La lista de
activos se recuerda un minuto por mercado y **se olvida al guardar**
(`olvidar()`), o quien acaba de pulsar Guardar no ve su banner. El enlace se
autollena al elegir la tienda. La migración `0028` se recortó a la tabla nueva:
drizzle-kit quiso volver a crear tablas que ya viajaron por `schema.sql`.

### 4. El blog: de 2 a 10 notas, con capturas reales

Ocho notas nuevas en `src/contenido/articulos/` (ES y EN, mismo slug), con
capturas tomadas del sitio publicado y del panel local
(`public/blog/<slug>/…`, encogidas a 1000 px). **Antes de capturar el panel
local se cambió el correo Zelle de `.dev.vars` a `pagos@mercatren.com` y el
nombre de la cuenta local a «Soporte Mercatren»**: una captura pública no puede
enseñar un correo de prueba ni la palabra Windoce. `PLAN-BLOG-IA.md` deja
escrito el plan de las notas diarias de producto por IA (solo el plan, no se
ejecuta hasta que el dueño decida).

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

## Zelle en los enlaces de cobro, con conciliación estricta (16 ago 2026)

Decisión del dueño: el enlace de cobro ofrece **tarjeta y Zelle**, y la
conciliación bancaria de Mercatren LLC es **obligatoria y estricta** — cada
transferencia del extracto tiene que cuadrar con su cobro.

- **El número de conciliación es el protagonista**: `Mercatren F-00123`
  (la referencia de la factura del comercio por `conceptoDelPago`), en rojo, en
  grande y con botón de copiar, ANTES de la captura. Queda escrito también en
  las `notas` del pago, delante del validador.
- **La captura entra a la MISMA cola de validación** (`pagos_zelle` con
  `pedido_id` en null); el puente con el cobro es la tabla **`cobros_zelle`**
  — tabla y no columna, como manda la regla del proyecto. La huella anti
  captura-repetida y las alertas aplican solas.
- **Al aprobar, el cobro se cierra** (`estado='abierto'` dentro del WHERE: si
  ya se pagó con tarjeta mientras la captura esperaba, no se pisa) y salen el
  recibo al pagador, el aviso al equipo, y el sistema del comercio ve `pagado`.
  Al rechazar, el pagador recibe el MOTIVO y el cobro sigue abierto.
- **Sin doble conteo**: un cobro pagado por Zelle suma por el camino de Zelle;
  el join de la cuarta fuente de la billetera filtra por
  `nota LIKE 'Cobro por enlace%'`, que solo escribe la acreditación con
  tarjeta. Comprobado con SQL contra la base.
- **Control por tienda, solo rol `soporte`** (Configuración → Zelle en los
  enlaces de cobro): interruptor + mínimo propio; mínimo general en
  `configuracion.zelle_cobros_minimo_centavos`; respaldo final
  `ZELLE_MINIMO_CENTAVOS`. Sin fila NO hay Zelle: encenderlo es un acto del
  equipo (`zelle_cobros_tienda`). La decisión es pura
  (`src/lib/cobros/zelle.ts`, 10 pruebas) y se re-comprueba EN EL SERVIDOR al
  recibir la captura.
- **`GET /datos/socios/cobro` ahora dice `metodo`** (`tarjeta`/`zelle`) **y
  `en_revision`**: el sistema del comercio puede decir «pago en revisión» en
  vez de un «sin pagar» que no cuenta la historia.
- De paso: la página decía «Mercatren cobra este pago **por cuenta de** …» —
  vocabulario prohibido que se escapó por conjugación (el test buscaba el
  infinitivo). Corregido el texto Y el test (`"por cuenta de"`, `"on behalf
of"`).

## La auditoría del sistema de cobro por enlace (16 ago 2026)

El dueño pidió auditar a fondo el cobro de la ferretería antes de que lo usen.
La conexión estaba viva (token vinculado, cero cobros creados) — y menos mal que
cero, porque el camino principal estaba roto. Lo que se encontró y se arregló:

1. **Pagar con tarjeta reventaba.** `intentoParaCobro` escribía en `pagos` con
   el id del cobro en `pedido_id`, que tiene llave foránea contra `pedidos`.
   Probado contra la base: `FOREIGN KEY constraint failed`, en la cara del
   pagador al meter la tarjeta. Ya no se escribe ahí — el rastro vive en
   `cobros_solicitados.pago_id`.
2. **El dinero no entraba a la billetera del comercio.** La posición no sumaba
   los cobros por enlace: cobraban y su «disponible» no subía. Ahora son la
   cuarta fuente de `billetera.ts`, y el neto sale del MOVIMIENTO escrito al
   acreditar (join `movimientos_billetera.referencia = pago_id`), no de
   recalcular con la comisión de hoy: el margen va a subir por tramos y un
   cobro viejo debe seguir diciendo lo que se acreditó.
3. **Acreditar no era idempotente.** El comentario prometía `estado='abierto'`
   en el WHERE y no estaba: un reintento del webhook duplicaba el dinero.
4. **Sin respaldo si el webhook no llegaba.** El cobro quedaba «abierto» para
   siempre y el sistema del comercio jamás veía pagada su factura. La página
   ahora concilia al volver de Stripe (`?payment_intent=`), confiando solo en
   lo que Stripe responda y solo si su metadata apunta a ESE cobro.
5. **El correo prometía Zelle y la página solo ofrece tarjeta.** El texto ya
   dice la verdad. Agregar Zelle al enlace es decisión del dueño, pendiente.
6. **Faltaban dos correos:** el recibo al pagador (`reciboDeCobro` — semanas
   después, ese correo es lo que le recuerda qué pagó; el primer paso de un
   contracargo es no reconocer un cargo) y el aviso al equipo por cada cobro
   entrado. La billetera se crea si falta, en vez de saltarse el movimiento.

## Cobrar por Mercatren desde el sistema del comercio (10 ago 2026)

Primera etapa de `mercatren-api-integraciones.pdf`. La cajera de la ferretería
hace su factura como todos los días, toca un botón, y **el correo con el enlace
de pago sale solo**. Quien paga —muchas veces el hijo o el socio en Estados
Unidos, a quien le reenviaron el correo— abre y paga con tarjeta o por Zelle.

- `src/lib/cobros/reglas.ts` — puro, 25 pruebas. El enlace vive **7 días por
  defecto y hasta 15 si el comercio los pide** (`dias` en el POST), y **el
  vencimiento se calcula, no se guarda**: un estado `vencido` guardado depende
  de que algo lo escriba a tiempo, y si eso falla alguien paga una venta que el
  comercio ya dio por perdida.
- **ERAN 48 HORAS Y ESTABA MAL** (corregido el 19 ago 2026). Lo puse suponiendo
  que «alcanza de sobra para que alguien lo vea, lo pague o lo reenvíe». Esa
  suposición no describe el negocio: en un abono de una ferretería del interior
  de Venezuela **la cadena es de tres personas** —el cliente llama a la
  ferretería, la ferretería llama al vendedor, y recién ahí quien paga tiene que
  conseguir la tarjeta o hablar con el familiar en Estados Unidos— y **tardan
  hasta una semana**. Y mi consuelo de «vencer no pierde la venta, se pide otro»
  tampoco era cierto: cada vencimiento obliga a escribirle otra vez al cliente,
  y **cada vez que hay que volver a escribirle se pierden cobros**.
- **Un cobro vencido se REACTIVA conservando su referencia Y su enlace**
  (`POST /datos/socios/cobro/reactivar`). Crear otro obligaba al comercio a
  cambiar la referencia (`VIG-02497-A1` → `A2`), y eso ensucia la conciliación:
  en el extracto parecen dos cobros distintos cuando es el mismo abono.
  Conservar el enlace además hace que **el correo que ya se mandó vuelva a
  funcionar**, así muchas veces no hay que volver a escribirle a nadie.
  **Solo revive lo que está `abierto`**, y el estado se vuelve a comprobar
  dentro del `WHERE`: entre leerlo y escribirlo puede entrar el pago, y revivir
  un cobro pagado es abrirle la puerta a que se pague dos veces.
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

## Un país = un dominio = un catálogo (17 ago 2026)

Entró `mercatren.cl` y con él la estructura multi-país. **El plan completo lo
dictó el dueño (armado con la sesión de YaDominios Cloud) y vive en
`PLAN-PAISES.md` — ese manda.** Doctrina: multi-inquilino, no multidominio. El
código NUNCA se separa; se separa el DATO. Y tres muros que protegen cosas
distintas: código, datos y **caché**.

**Fases 1 a 4 hechas y en producción.** Lo que hay que saber al tocar esto:

- **El dominio decide el mercado** (`src/lib/mercado/mercados.ts`, lista
  cerrada; `actual.ts` lee el Host). mercatren.com = `US`, mercatren.cl = `CL`,
  mercatren.com.co = `CO`. Una sola función de deducción: nadie mira el Host
  por su cuenta. **`mercatren.co` NO se declara**: redirige al `.com.co` desde
  la plataforma, y declararlo haría que las dos direcciones se disputaran la
  misma página ante Google.
- **El país es obligatorio EN EL TIPO.** Cada consulta del catálogo recibe
  `mercado: Mercado` de primer argumento, y el filtro solo se puede fabricar
  dentro de `src/lib/mercado/repositorio.ts` (lleva un símbolo único que no se
  exporta). Pedir el catálogo sin país **no compila**.
- **`tests/unit/muro-mercado.test.ts`** cubre lo que el compilador no ve: que
  alguien reciba el país y NO lo use. Destapó dos fugas reales el primer día.
- **`tests/unit/muro-cache.test.ts`** exige el mercado en toda llave de
  `recordado()` y que ninguna ruta con contenido por país se hornee.
- **Al agregar una consulta pública nueva:** sale de la capa o la prueba se
  pone roja. Al agregar una caché: la llave lleva `${mercado.codigo}`.
- **El panel se mira por país** (Soporte, selector arriba a la derecha). El
  país vive en la SESIÓN, nunca en la dirección — con un `?mercado=` el
  selector sería un adorno. Franja azul permanente fuera del principal.
- **Chile vende en PESOS CHILENOS y Colombia en PESOS COLOMBIANOS**, y ninguno
  de los dos tiene centavos: el divisor sale de `mercado/moneda.ts`, por moneda
  y no por país, así el siguiente país lo hereda solo. El dólar sale idéntico.
- **El documento de la empresa cambia por país** (`mercado/identificacion.ts`):
  RUT en Chile y NIT en Colombia, los dos **con su dígito verificador
  comprobado de verdad** — y son algoritmos DISTINTOS. El NIT se validó contra
  cinco NIT públicos reales antes de escribirlo. Un país sin regla propia se
  queda con la genérica: no se inventa la regla de un país que no conocemos.
- **Las URL absolutas se calculan por petición**: `rutaCanonica()` devuelve
  relativas y Next las resuelve contra `metadataBase`, que es del dominio. El
  sitemap, el JSON-LD, la tarjeta social y el manifest, también.
- **No se redirige por geolocalización, nunca**: rompe SEO y los enlaces
  compartidos. El dominio es la elección del usuario.

**Lo que falta para operar Chile de verdad** está en `PLAN-PAISES.md`:
Turnstile con mercatren.cl entre sus dominios, procesador de pagos chileno,
geografía del país, proveedores (Dropi) y el copy propio de esa plaza.

## LA PUBLICACIÓN SE CAYÓ POR EL PESO DEL WORKER (17 ago 2026)

YaDominios Cloud rechaza la publicación: «Tu `_worker.js` pesa 12.3 MB y es
demasiado grande». **El sitio lleva desde el 16 ago 12:55 sirviendo la versión
vieja**, y por eso tampoco corrió `schema.sql` — las tablas nuevas hubo que
aplicarlas a mano.

**Medido, no supuesto:**

|                                 |                                     |
| ------------------------------- | ----------------------------------- |
| `_worker.js` sin comprimir      | **12,31 MB**                        |
| `_worker.js` comprimido (gzip)  | **3,22 MB**                         |
| Tope real de Cloudflare Workers | **10 MB COMPRIMIDO** (plan de pago) |

**Estamos a menos de un tercio del tope real.** El worker ya sale minificado, y
**nada nuestro está dentro**: se comprobó buscando los textos del modelo de
negocio, los de idioma, los países bancarios y los datos del comercio piloto —
ninguno aparece. Los dibujos de los iconos suman 0,03 MB. Los 12,31 MB son el
motor de Next.js y el adaptador, que es la línea base de OpenNext.

**Conclusión: no hay nada que recortar de este lado.** El fallo es que la
plataforma mide el archivo **sin comprimir** contra un tope que Cloudflare
aplica **comprimido**. Se arregla en YaDominios Cloud, que es otro proyecto y
va en su propia sesión.

## Los retiros salen por la API de Mercury (16 ago 2026)

Lo pidió el dueño, y tenía razón: con tres mil retiros nadie llena tres mil
formularios. Mercatren entra en Chile y Colombia; el sistema tiene que escalar
solo.

**`POST /account/{id}/request-send-money`, NO `transactions`.** La diferencia
es toda la historia — comprobado en la documentación de Mercury:

|                    | `transactions`                         | **`request-send-money`**            |
| ------------------ | -------------------------------------- | ----------------------------------- |
| Wire internacional | ❌ solo `ach`, `check`, `domesticWire` | ✅ **acepta `internationalWire`**   |
| Aprobación humana  | Sale de una                            | ✅ **espera aprobación en Mercury** |
| Lista blanca de IP | ✅ obligatoria                         | ✅ **EXENTO**                       |

**El tercer punto es el que lo hace posible.** El sitio corre en el borde y no
tiene IP fija que declarar: con `transactions` la automatización sería
inviable. `request-send-money` está exento **precisamente porque el dinero no
sale sin que una persona lo apruebe** — la forma de trabajar que queríamos es
la que el banco premia. Y once de los doce países salen por wire, así que con
el otro endpoint solo se habría podido automatizar Estados Unidos.

**El flujo:** el comercio pide → el sistema crea el destinatario y la solicitud
→ al dueño le aparece en Mercury esperando su botón → aprueba y sale.

- `src/lib/retiros/a-mercury.ts` — la traducción, **pura y con 14 pruebas**. Es
  donde un error cuesta dinero: un SWIFT en el campo equivocado o el país como
  «Colombia» donde el banco espera «CO» deja el wire dando vueltas semanas.
- **Cada país llama a su cuenta de otra forma**: IBAN en España y Rumanía,
  CLABE en México, CBU en Argentina, CCI en Perú. Buscar solo `iban` habría
  mandado a México **sin número de cuenta** — Mercury acepta el destinatario y
  el wire no llega. Lo encontró su propia prueba.
- **La llave de idempotencia es el id del retiro.** Repetirla devuelve 409 en
  vez de crear un segundo pago: la diferencia entre un reintento y pagarle dos
  veces al comercio. Mercury además bloquea duplicados dentro de 24 horas.
- **`purpose` es obligatorio en los wires.** Va fijo (`Vendor payment`): en
  Mercatren siempre es lo mismo, se le paga al comercio su mercancía.
- **El SWIFT se manda en mayúsculas y sin espacios.** La gente lo copia del
  banco como «colo co bb» y así no sale.
- **Solo el rol `soporte`, con `esSoporteDeVerdad()`.** Quien mira el panel de
  un comercio con el disfraz de «ver su panel» no puede mandarle plata a nadie.
- **El motivo del banco se enseña entero.** Con un SWIFT mal escrito o un país
  no permitido, un «no se pudo» obliga a adivinar.

**Falta cargar `MERCURY_CUENTA_ID`** en el panel del sitio: de qué cuenta sale
el dinero. `MERCURY_TOKEN` ya estaba.

## El comercio ya no elige el carril bancario (16 ago 2026)

Lo destapó un retiro real a **Colombia**. El formulario preguntaba «¿cómo lo
quieres recibir?» con tres opciones: a otro comercio, **ACH** o **wire**. Eso le
pide al comercio una decisión técnica que no puede tomar bien —y que el sistema
ya sabe por su país—.

Un comercio colombiano leía «ACH: a tu cuenta de Estados Unidos» y «wire», no se
reconocía en ninguna de las dos, y se quedaba sin pedir su dinero. Peor: podía
elegir «ACH» y después Colombia, dejando la pantalla diciendo dos cosas
contradictorias del mismo retiro.

**Ahora elige lo único que decide él —a otro comercio o a su banco— y el PAÍS
escoge el carril.** `ach` y `wire` se siguen guardando igual en la base: es lo
que necesita quien va a Mercury a hacer la transferencia, pero eso es trabajo
nuestro, no una pregunta para el comercio. Viaja en un campo oculto calculado
del país.

**Y el error dice QUÉ campo está mal.** `revisarCuenta` ya devolvía la lista de
los que fallan y esa información se estaba tirando: el comercio veía «revisa los
campos» con ocho casillas delante y solo podía repasarlas adivinando. Ahora se
nombran, con las mismas etiquetas que dibuja el formulario — si el aviso dice
«CLABE» y la casilla dice otra cosa, no sirve de nada.

Las pruebas del formulario se reescribieron para proteger la garantía nueva, que
es más fuerte: que al comercio **no** se le ofrezca elegir carril, que el oculto
siga al país (`US → ach`, `CO → wire`), y que Zelle no aparezca ni escondido —
Mercury no lo hace.

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

## LA FUGA DEL PROCESADOR EN LOS COBROS POR ENLACE (26 ago 2026)

**Lo vio el dueño antes que nadie**, mirando la calculadora: _«si solamente se
agregó el 3% para nosotros y al cliente le da la gana de pagar con tarjeta,
salimos peleando nosotros»_. Tenía razón, y era peor de lo que parecía.

`acreditarCobro` le descontaba al comercio **solo el 3% de Mercatren**, sin
mirar por dónde entró el dinero. Con tarjeta, Stripe se lleva además 2,9% +
$0.30 — y ese costo salía del margen. Medido con las facturas reales:

| Cobro con tarjeta | Stripe  | Al comercio | Margen REAL de Mercatren |
| ----------------- | ------- | ----------- | ------------------------ |
| $2.860,71         | $83,26  | $2.774,89   | **$2,56**                |
| $7.475,00         | $217,08 | $7.250,75   | **$7,17**                |
| $10,00            | $0,59   | $9,70       | **−$0,29** ← pérdida     |

En la factura de siete mil dólares el margen se quedaba en siete, y **por
debajo de unos once dólares cada cobro daba pérdida**. Llevaba así desde que
existe el cobro por enlace.

**`src/lib/cobros/reparto.ts`** (puro, 12 pruebas) reparte por método: el
procesador primero, el margen después, el resto del comercio. Las dos ramas
—tarjeta y Zelle— pasan por la misma función, y `tests/unit/reparto-cobro.test.ts`
exige que las tres partes **sumen siempre el monto exacto** y que no vuelva a
aparecer un `calcularComisionCentavos` suelto en la acreditación.

Cuatro cosas que no se tocan:

1. **Reusa las fórmulas del catálogo** (`precioConAjusteCentavos` y
   `precioZelleCentavos`), que estaban resueltas desde el 7 de agosto. Dos
   fórmulas para lo mismo se separan al primer arreglo.
2. **Nunca se le acredita un negativo al comercio.** Con un cobro de un dólar
   el fijo de $0.30 se come más que el margen; un neto negativo escrito en una
   billetera es una deuda que nadie contrajo.
3. **La calculadora pregunta por dónde va a pagar**, y enseña el procesador en
   su propio renglón. Comprobado en pantalla con la factura real: los mismos
   $2.860,71 dejan **$2.774,89 por transferencia y $2.691,63 con tarjeta**.
   Calcular sin decir el método es dar un número que no se va a cumplir.
4. **El comercio elige qué métodos acepta el enlace** (tabla `metodos_del_cobro`,
   tabla y no columna). Si calculó su factura para cobrar por transferencia,
   dejar la tarjeta abierta le regala el 2,9% + $0.30. **Sin filas se aceptan
   todos**, que es como se comportan los cobros de antes: un cambio de esquema
   no puede dejar a nadie sin poder cobrar. Y si solo queda un método, el
   enlace lo enseña directo sin obligar a elegir.

## TRANSFERENCIA ACH DIRECTA EN EL COBRO POR ENLACE (26 ago 2026)

Lo pidió el dueño con la cuenta hecha: una factura de siete mil dólares con
tarjeta deja **más de $200 en comisiones del procesador**; por ACH directo a
la cuenta de Mercatren LLC, **cero**. Ahora la página de un cobro por enlace
ofrece tres métodos: tarjeta, Zelle y transferencia.

**LO QUE HAY QUE ENTENDER DE ESTE MÉTODO:** una transferencia a nuestro banco
**no pasa por Stripe**, así que el sistema NO se entera solo de que llegó. Es
el mismo camino que Zelle —comprobante, validación humana contra el banco,
acreditación— y por eso reusa `subirComprobanteDeCobro`, la misma cola y el
mismo número de conciliación. No se duplicó nada.

`src/lib/cobros/transferencia.ts` (puro, 8 pruebas). Cuatro reglas:

1. **Los CUATRO datos o ninguno** (beneficiario, banco, cuenta, ruta ACH).
   Enseñar una cuenta sin su número de ruta —o al revés— es mandar a alguien
   al banco con media instrucción: ese dinero se va a otra parte o se queda
   sin salir.
2. **Se lee `PAGO_RUTA_ACH`, jamás `PAGO_RUTA_WIRE`.** Chase da un número de
   ruta para ACH y otro distinto para wire; con el de wire, la transferencia
   rebota. Hay una prueba que se pone roja si alguien lee la de wire aquí.
3. **El mismo mínimo que Zelle**, porque cuesta lo mismo: las dos las valida
   una persona. Por debajo, ese trabajo se come el margen entero y la tarjeta
   es el método correcto aunque cobre comisión.
4. **Ni un número de cuenta en el código** — todo sale de las variables del
   entorno, y una prueba busca cualquier secuencia de nueve dígitos o más en
   los tres archivos del método. El repositorio es público.

**Cada dato con su propio botón de copiar**, y es deliberado: así se llena el
formulario del banco, una casilla cada vez. Un bloque con los cuatro juntos
obliga a seleccionar a mano trozo por trozo, y ahí es donde se cuela un dígito
de menos en un número de cuenta con siete mil dólares dentro.

**Y NO SE PUEDE PAGAR EN PARTES, a propósito.** Un cobro tiene un monto y al
aprobarlo se cierra; no hay pagos parciales por ningún método. Es lo que
pidió el dueño y es lo correcto: media factura pagada es una factura que
nadie sabe si está cobrada.

**⚠️ ANTES DE ENCENDER ESTO EN PRODUCCIÓN, COMPROBAR A QUÉ CUENTA APUNTAN LAS
VARIABLES.** Comprobado en local el 26 ago 2026: `PAGO_BENEFICIARIO`,
`PAGO_BANCO`, `PAGO_CUENTA` y `PAGO_RUTA_ACH` todavía traen los datos de
**Windoce, LLC en Bank of America** — la sociedad anterior. Ya estaba anotado
como pendiente en la cabecera de este archivo desde el 19 de agosto, y ahora
importa el doble: esas mismas variables las enseña la página del pedido, y con
ACH encendido el dinero de una factura entera se iría a la cuenta equivocada.
Se cambian en el panel de YaDominios Cloud, no en el código.

## CUADRAR UNA FACTURA CON CANTIDADES ENTERAS (26 ago 2026)

Un comercio tenía que cobrar **$7,475.00 exactos** y vende tubo estructural a
$199.05: 7475 / 199.05 = **37,55 unidades**. Se puso a probar cantidades a
mano desde el celular —catorce tubos, veinte tubos— y preguntó, con esas
palabras, «¿va agregando un tubo uno por uno?».

**LO PRIMERO, QUE NO ES CÓDIGO:** para una factura de monto acordado **no hay
que cuadrar nada** — el cobro por enlace ya cobra el monto exacto que se
escriba, y el margen se descuenta de ahí (`acreditarCobro`: `neto = monto −
comisión`). Se pone $7,475, el cliente paga $7,475 y al comercio se le
acreditan $7,250.75. La calculadora hace falta solo cuando el comercio quiere
que la factura enseñe el **desglose por producto**.

**`src/lib/facturar/cuadrar.ts`** (puro, 9 pruebas) + Panel → Ventas →
Cuadrar factura.

Cuatro cosas que no se tocan:

1. **Se busca el importe alcanzable MÁS CERCANO, no solo el exacto.** Casi
   nunca existe el exacto: con $199.05 y $191.61 no hay ninguna combinación
   que dé $7,475 (el máximo común divisor de los precios no divide al
   objetivo). La primera versión, al no encontrarlo, caía a un llenado voraz
   que devolvía **$7,556.46 — $81 de más**; recorriendo la misma tabla en
   busca del más cercano sale `26 × $199.05 + 12 × $191.61 = $7,474.62`, **38
   centavos**. La tabla ya estaba calculada: era mirarla entera en vez de una
   sola casilla.
2. **Todo en centavos enteros y con programación dinámica.** Es el problema
   del cambio de moneda; con coma flotante, «cuadra exacto» dejaría de ser
   verdad por un centavo.
3. **LAS DOS CIFRAS SIEMPRE A LA VISTA**, y de ahí venía toda la confusión: el
   comercio decía «$7,475 con el 3% dentro» y a la vez «$2,775 menos el 3%»,
   que son cosas distintas. La pantalla enseña siempre _paga el cliente_ y _te
   queda a ti_, y deja elegir cuál de las dos es el objetivo
   (`cuantoCobrarParaRecibir` redondea hacia ARRIBA: hacia abajo llegaría un
   centavo de menos, y en una pantalla de dinero eso es una llamada).
4. **Se elige qué productos entran.** Una factura es de tubos O de láminas de
   zinc, nunca del catálogo mezclado — que es justo cómo estaba partida la
   factura real ($7,475 de tubos y $2,775 de zinc).

**El equipo puede cuadrar POR el comercio** con `?comercio=slug`, como el
resto del panel: era lo que el dueño quería hacer desde su computadora
mientras el comercio trabaja desde el celular.

`productosParaCuadrar()` es una consulta aparte y no `listarMisProductos`:
esa pagina de 24 en 24, y un producto que se quedó en la página 2 es un
producto con el que no se puede cuadrar.

## «SHORTS» NO SE TRADUCE, Y LA HILERA SE COLAPSABA (25 ago 2026)

Tres cosas que destapó el dueño mirando su propia portada en el escritorio.

**1. El traductor del navegador convertía «Shorts» en «BERMUDAS».** La prenda
de ropa, en la etiqueta de la hilera, en el menú y en el título de la sección,
para todo el que llegara con la traducción automática puesta. Sus palabras:
_«esa palabra no tiene traducción, significa video corto en inglés y YouTube
lo llamó así»_. Se arregla con **`translate="no"` Y la clase `notranslate`**:
hacen falta las dos —el atributo estándar y la clase que mira Google— o alguno
lo traduce igual. `tests/unit/shorts-no-se-traduce.test.ts` exige las dos en
los tres sitios donde se dibuja, y que la palabra sea idéntica en `es` y `en`.

**2. LA SEGUNDA HILERA ESTABA DENTRO DEL `<ul>` DE PRODUCTOS.** Como hija de
un grid ocupaba **una sola celda**: el título salía en vertical, una palabra
por línea, y el resto de la fila en blanco. El dueño lo marcó con una equis
roja sobre la captura. Va fuera de la lista, que es su sitio — una hilera no
es un producto. La prueba empareja los bloques `<ul>…</ul>` y falla si alguna
vuelve a caer dentro; **hay que emparejarlos**, porque un patrón «ul …
HileraVideos … /ul» da falso positivo: el `</ul>` que encuentra puede ser el
de la siguiente sección, con la hilera legítimamente en medio.

**3. Varias hileras, cada una con su título y su baraja** (`videos/hileras.ts`,
puro, con pruebas). Lo pidió con el ejemplo de las redes: _«tenemos que
repetir los mismos videos, pero los barajeamos diferente»_. Seis títulos —
Descubre · Las tiendas por dentro · Lo más visto · Recién subidos · Los que
más gustan · Productos que se están vendiendo— y cada una ordena la MISMA
lista con una semilla distinta (la de la visita, desplazada por hilera).

Tres reglas de ahí que no se tocan:

1. **No se promete lo que no se mide.** «Lo más visto» y «Los que más gustan»
   ordenan de verdad por vistas y por corazones, que son datos que tenemos.
   Los demás títulos hablan de lo que hay, no de una métrica inventada: poner
   «Tendencias» sobre una lista al azar es mentirle a quien mira, y se nota a
   la segunda visita.
2. **Una hilera cuyo dato está en cero NO se dibuja.** «Lo más visto» sin una
   sola vista no dice nada. Con menos de tres videos tampoco: tres recuadros
   sueltos se leen como un error, no como una sección.
3. **El orden de una hilera no cambia entre dibujos.** Si cambiara, la hilera
   «bailaría» al navegar por el sitio.

Comprobado en escritorio (1440 px) y en celular (390 px): las hileras ocupan
el ancho completo en los dos, con sus títulos distintos y los videos
repartidos entre comercios.

## LOS VIDEOS SE MEZCLAN ENTRE TODOS LOS COMERCIOS (25 ago 2026)

Lo pidió el dueño en cuanto entraron videos de verdad: _«que no salgan 5
videos seguidos de una sola persona, sino que se mezclen entre todos»_.

**EL FALLO GORDO ESTABA EN EL VISOR.** `siguientesEnElVisor` ordenaba
`CASE WHEN tienda = la del actual THEN 0 ELSE 1`: abrías un video de la
ferretería y **los siguientes eran todos de la ferretería**. Medido con tres
comercios de cinco videos cada uno, el orden viejo daba `F F F F 2 3 2 3…` y
el nuevo `2 3 F 2 3 F…`. Con dos comercios no se nota; con veinte, quien entra
a mirar ve siempre a la misma persona y se va.

**`repartirEntreTiendas()`** (`videos/reglas.ts`, puro, con pruebas) reparte
por turnos: hasta `VIDEOS_POR_RONDA` (2) de cada comercio por vuelta. Va en
las hileras/parrilla **y** en el «siguiente y siguiente» del visor, y el SQL
además pide por rondas para que el `LIMIT` traiga variedad y no los primeros
sesenta de un solo comercio.

**NO se reusó `intercalarPorTienda` del catálogo, y se vio probándolo.**
Aquella respeta el orden que traía la lista y solo salta cuando la racha se
pasa — con una lista agrupada (cinco de cada comercio seguidos) devuelve
`A A B A A B A B B C B C C C C`: **cuatro seguidos, y el tercer comercio no
aparece hasta la novena posición**. Sirve para el catálogo, donde el SQL ya
reparte; aquí no.

Cinco reglas que no se tocan:

1. **El que sube su PRIMER video sale en la primera vuelta**, al lado del que
   lleva cincuenta. Es la mitad del asunto: sin eso, el comercio nuevo queda
   sepultado y no aparece nunca.
2. **Dentro de cada comercio se conserva el orden** (lo más nuevo primero).
3. **Están todos**: repartir no puede perder el video de nadie.
4. **Cuando un comercio se queda sin videos, el resto sigue de corrido.** La
   garantía no es «nunca más de dos», es «nunca más de dos mientras quede de
   otro» — dejar huecos sería enseñar menos videos de los que hay.
5. **La semilla MEZCLA BITS, no suma ni multiplica.** Los dos intentos simples
   fallaron y los dos se vieron probándolos: sumar la semilla al empezar dejaba
   el orden alfabético, y multiplicarla al final **conserva el orden** cuando
   los hashes quedan casi consecutivos — con semillas del día normales, nunca
   cambiaba. Con FNV-1a + el mezclador de splitmix32 sí baraja, y sigue siendo
   determinista (que es lo que permite recordar la lista un minuto).

Comprobado en el navegador con tres comercios de cinco videos: parrilla
`3 2 F 3 2 2 F F 3 3 2 2 F F 3` y visor `3 2 2 F F 3 3 2 2 F F 3 3` — racha
máxima 2 en los dos, sin perder ninguno.

## LAS SECCIONES DE VIDEO DE MERCATREN Y EL ENLACE CON PIN (24 ago 2026)

Lo pidió el dueño: una sección propia, **«Tu Próximo Producto Ganador»**, con
videos que graba él en los almacenes que trabajan con nosotros recomendando
productos que se están vendiendo. Tiene quince listos y va a haber muchas
secciones más.

**LO QUE LAS DEFINE ES QUE SON NEUTRAS.** Un video de sección **no lleva a la
tienda de nadie**: lleva al catálogo de Mercatren. No es cortesía — es lo que
hace que la recomendación valga. En cuanto un video de «producto ganador»
empuja a un comercio concreto deja de ser una recomendación y pasa a ser
publicidad pagada de ese comercio, y quien la mira lo nota. La regla vive en
`destinoDelVideo()` (`secciones/reglas.ts`, puro, con pruebas) y no en un `if`
suelto dentro del visor.

**Cómo está armado.** Dos tablas nuevas —`secciones_video` y el puente
`videos_de_seccion`— y **ni una línea duplicada del visor**: el video sigue
siendo un video normal en `videos_tienda`, así que hereda el visor, los
corazones, los comentarios, la compresión en el navegador, las vistas y la
ventana de precarga. La tienda contenedora (`tienda-mercatren-secciones`) se
crea sola la primera vez, como la del catálogo de EE. UU.: `tienda_id` es
obligatorio y tiene llave foránea, así que un video de Mercatren necesita una
tienda igual que uno de un comercio — pero **no se enseña como tienda**.

**EL ENLACE ES LA HERRAMIENTA.** `/subir/<llave>` se abre en el celular y
**es** la aplicación de subida: sin cuenta, sin login, sin panel. Se manda por
WhatsApp al teléfono con el que se va a grabar. Dos capas: la llave (24 bytes
al azar) y un **PIN de cuatro dígitos**.

Ocho cosas que no se tocan:

1. **El PIN se comprueba en el SERVIDOR**, con el mismo límite de intentos del
   login. Cuatro dígitos son diez mil combinaciones: sin límite, una máquina
   las prueba todas — y detrás hay una puerta que sube archivos.
2. **Se guarda con PBKDF2 y su sal**, nunca en claro, y la comparación no
   corta al primer dígito distinto: el tiempo que tardara en decir «no»
   revelaría cuántos acertó.
3. **A una llave que no existe se le da 404**, igual que a cualquier dirección
   inventada. Un «esa sección no existe» convertiría el enlace en un detector
   de llaves válidas.
4. **PINES obvios rechazados** (`1234`, `0000`, `4321`…). Con `1234` puesto,
   la segunda capa no existe.
5. **El pase se recuerda 30 días en ESE teléfono**, en cookie `httpOnly`, y
   **muere solo si se cambia el PIN**. Subir quince videos tecleando el PIN
   cada vez es un castigo, no una herramienta.
6. **La página del enlace NUNCA se indexa.** Si Google guardara una de estas
   direcciones, la llave dejaría de ser un secreto para siempre.
7. **`comoEquipo` va explícita y por defecto en `false`** en la subida: si
   alguien la olvida, la puerta se queda cerrada; al revés, el olvido la
   abriría — que es el fallo caro.
8. **Crear secciones y ver sus llaves es solo de `esSoporteDeVerdad()`**: con
   el disfraz de «ver su panel» no se crean canales de Mercatren.

**Y UN FALLO DE REACT 19 QUE DESTAPÓ ESTA PANTALLA, y que vale para todo el
proyecto:** un `<form action={fn}>` **se resetea después de cada acción,
también cuando falla**. Escribir el nombre, las dos descripciones y el PIN,
equivocarse en el PIN y perderlo todo es exactamente la queja que dio origen a
`FormularioPersistente`. El formulario va con `onSubmit` + `preventDefault` +
`new FormData(...)` a mano, y solo se limpia al guardar bien. Comprobado en
pantalla: con el PIN malo, lo escrito se queda.

Comprobado de punta a punta: soporte crea la sección (rechazando `1234`), el
enlace se copia, se abre en un iPhone simulado, un PIN malo se rechaza, el
bueno entra, el video se comprime y se sube, el subidor queda listo para el
siguiente con «Llevas 1 subidos», y la página pública `/seccion/<slug>`
responde 200 sin sesión con el video dentro.

## NADIE ESPERA A QUE LO APRUEBEN: EL ALTA ES INMEDIATA (24 ago 2026)

Al dueño le llegó un correo del sistema pidiéndole entrar a «verificar» a
Brillox Steel — un comercio cuya tienda **ya estaba activa y publicada** desde
el momento del registro. Sus palabras: _«no puede ser que una persona esté
esperando que uno entre y verifique… En Amazon no están esperando para
verificarlo, se registran y ya. Solo cuando un usuario comete una infracción es
que uno actúa»_.

**La tienda nacía activa desde el 15 de agosto** (ver la sección de arriba).
Lo que se quedó atrás nueve días fueron los TEXTOS y el CORREO, y nadie lo
notó porque nada se ponía rojo:

| Dónde                     | Decía                                                                              | Dice                                                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Correo al equipo          | «Comercio nuevo **por aprobar**» · «espera aprobación» · botón «Revisar y aprobar» | «Comercio nuevo» · «su tienda ya está activa y publicada — no hay nada que aprobar» · botón «Ver su tienda» |
| Al comercio, tras el alta | «el equipo de Mercatren **lo va a revisar**»                                       | «¡Listo! Tu tienda ya está publicada y cualquiera puede verla»                                              |
| Ficha sin publicar        | «la estamos revisando… te avisamos»                                                | «ahora mismo no está publicada… escríbenos y la activamos»                                                  |
| Panel → Comercios         | «Pendiente de aprobar» · «Aprobar y dejarlo vender»                                | «Sin publicar» · «Publicar esta tienda»                                                                     |

**Un correo que manda a hacer una tarea que no existe es peor que no mandarlo:
enseña a ignorar los correos del sistema**, y entre ellos van los de dinero.

**LA CONFIRMACIÓN DEL ALTA SE LEE, YA NO SE PASA DE LARGO.** El formulario
redirigía solo al panel: el comercio enviaba y aterrizaba en otra pantalla sin
llegar a leer nada. Ahora se queda con el mensaje y **los dos caminos que de
verdad siguen**: «Cargar mis productos» y «Ver mi tienda» (con su enlace real,
que ahora `solicitarComercio` devuelve en `slug`).

**Y AL CREAR LA CUENTA SE DICE QUÉ PUEDE HACER CON ELLA.** Lo pidió el dueño:
_«que sea claro si él está creando una cuenta para comprar, que le diga: con
esta cuenta puedes comprar y también puedes vender»_. El subtítulo lo decía
—en gris, de 14 px, debajo del título—, o sea que no lo decía. Ahora son dos
tarjetas con ícono: **Para comprar** y **Para vender, con la misma cuenta**, y
la segunda cierra con lo que hoy importa: _se publica al momento, no hay que
esperar a que nadie te apruebe_. Son dos y no una lista porque la pregunta que
trae la persona es «¿esta cuenta es la mía?», y verlas al lado la responde sin
leer una palabra de más. El correo de bienvenida dice lo mismo.

**El candado: `tests/unit/alta-sin-aprobacion.test.ts`** se pone rojo si el
alta vuelve a insertar `pendiente`, si el correo vuelve a hablar de aprobar, si
un texto del público le promete a un comercio una revisión, o si la pantalla de
registro deja de explicar las dos cosas. Sin él, esto se vuelve a desincronizar
en el próximo cambio — que es exactamente lo que pasó.

**Lo que NO desaparece:** el botón para publicar una tienda sigue en Panel →
Comercios, porque `pendiente` y `borrador` siguen existiendo — es lo que queda
al **suspender** a alguien. El control no se quitó: cambió de momento.

## EL VIDEO SE COMPRIME EN EL NAVEGADOR, COMO LAS FOTOS (24 ago 2026)

El dueño seguía viendo los videos «arranca, se corta, arranca» en varios
navegadores, y pidió investigar cómo lo hace YouTube y qué ofrece Cloudflare.
Medido en producción antes de tocar nada: el primer video real era un **`.mov`
de iPhone de 61,8 MB por 34 segundos = 14,5 Mbps**, cuando YouTube le sirve a
un espectador de 720p unos 3 Mbps — el video pedía cinco veces el caudal de
una conexión normal. Y el índice (`moov`) venía AL FINAL del archivo: dos
viajes antes del primer cuadro. **El borde no era el problema** (entregaba a
4–7 MB/s): el problema era el archivo.

**`src/lib/videos/comprimir-video.ts`** (con `mediabunny`, cargada con import
dinámico): H.264, lado mayor a 1280, 30 cuadros, ~2,8 Mbps + AAC 128k, y el
índice ADELANTE (`fastStart: "in-memory"`). Comprobado con un clon del caso
real (13 MB · 60 fps · 14 Mbps · moov al final) subido por el panel con un
navegador de verdad: quedó en **2,74 MB, 2,84 Mbps, moov en el byte 32**.

Las reglas, las mismas de las fotos, con pruebas (6 con el conversor simulado

- las de `haceFaltaComprimir`):

1. **Si comprimir falla, se sube el original.** Un navegador sin WebCodecs no
   puede dejar a un comercio sin publicar.
2. **Lo ya eficiente no se toca**: un `.mp4` bajo el umbral (3,5 Mbps) se sube
   tal cual. Un `.mov` liviano sí pasa — solo para reempaquetarlo con el
   índice adelante (las pistas se copian, no se recodifican).
3. **Nunca se agranda** y **nunca se empeora**: si el resultado sale más
   pesado que el original, gana el original.
4. **La barra tiene dos fases** («Preparando el video…» y «Subiendo…»): sin
   la primera, la espera de la compresión parece un cuelgue.

**Y «Aligerar este video»** (Panel → Videos) arregla los que ya estaban
subidos sin volver a grabar: baja el video, lo encoge con el MISMO compresor
en el navegador, y lo devuelve por la misma puerta (`/upload/video` con
`videoId`). Tres cosas de ahí que no se tocan:

- **La clave del archivo es NUEVA, jamás se pisa la vieja**: el video viejo
  vive un año en la caché del borde con `immutable` — pisarlo dejaría a media
  clientela viendo el pesado por meses. El objeto viejo se borra después.
- **Solo puede ACHICAR**: un archivo igual o más pesado no reemplaza nada.
- **El botón solo sale en los videos pesados** (sobre el umbral): en uno
  liviano sería un mueble.

**Ojo con el dev server tras un `npm install`:** el runtime queda con las
conexiones envenenadas («Attempted to use poisoned stub») y TODO da 500,
incluido el login. Se cura reiniciando `npm run dev`. Y **la base local con el
servidor encendido esconde las filas nuevas** (WAL): para leerla con
`sqlite3`, apagar el servidor primero.

**El siguiente escalón, si el sitio crece, es Cloudflare Stream** (streaming
adaptativo real, como YouTube: varias calidades y el reproductor elige según
la conexión). Cuesta $5 por 1.000 minutos almacenados y $1 por 1.000 minutos
entregados. Es decisión de gasto del dueño y NO hace falta hoy: con el
compresor quedamos en el rango de bitrate que YouTube sirve.

## EL VISOR INMERSIVO EN EL TELÉFONO, LA VENTANA DE PRECARGA Y LAS VISTAS (24 ago 2026)

Lo pidió el dueño con la captura delante: en el celular el encabezado completo
—logo, buscador, ciudad, menú— se comía media pantalla y **el botón «Entra en
mi tienda» quedaba escondido debajo**. Y autorizó expresamente leer el
reproductor de su proyecto Beellon (`reel-viewer.tsx`, solo lectura) como
referencia de lo que ya le funcionó.

**1. En el teléfono, el video ES la pantalla.** La página del video volvió al
grupo de rutas `(visor)`, pero esta vez CON el encabezado — envuelto en
`hidden sm:block`: escritorio intacto (menús a los lados, como se decidió),
teléfono inmersivo como TikTok. Flotando sobre el video van la flecha de
volver (atrás si hay historia; `/videos` si se llegó por enlace) y la **lupa**
que lleva al catálogo — el buscador completo sobraba ahí. La URL no cambia.
La prueba vieja que exigía «nada de grupo (visor)» se reescribió contando la
historia en dos actos: sin encabezado se tragaba el escritorio; completo
tapaba el botón en el teléfono. La forma final es el grupo con el encabezado
oculto solo en teléfono.

**2. La ventana de precarga es lo que quita el tirón Y lo que aguanta diez
mil videos.** El `src` solo se monta cerca del que se mira (uno atrás, dos
adelante) — al montarse, el navegador lo busca solo; al alejarse, suelta el
buffer. El actual y el siguiente van con `preload="auto"` (el siguiente ya
está descargado cuando llega el dedo — la técnica del reproductor de
Beellon); el resto ni un byte: queda la portada. Antes era `metadata` para
todos, y por eso «había una milésima» entre video y video.

**3. Las vistas se cuentan al MIRAR, no al cargar.** La columna `vistas`
existía y se sumaba al cargar la página — contaba recargas y robots, y no se
enseñaba en ningún lado. Ahora la cuenta el visor a los **2 segundos** de
tener el video delante, una vez por video y por sesión del navegador, vía
`registrarVistaDeVideo` (única puerta; comprueba `estado = 'publicado'` para
que un id inventado desde la consola no infle nada). `sumarVista` se retiró:
dejar los dos caminos era contar doble — lo destapó la propia prueba (+3 en
una visita). Comprobado después: dos cargas y una mirada real = exactamente
una vista. Se enseña con el ojo en la columna social y en la insignia de la
tarjeta, formateada con `formatearVistas` (Intl compact: «1,2 mil», no
«1234») en el idioma de quien mira.

## EL CORAZÓN QUE NO ANOTABA, EL ESPACIADOR Y EL ALGORITMO DE «LO TUYO PRIMERO» (24 ago 2026)

Tres cosas que destapó el dueño usando los videos desde su iPhone, y las tres
tenían causa distinta:

**1. El corazón «no anotaba» y la pantalla se rodaba.** El navegador enfoca el
botón al tocarlo y, dentro de un contenedor con scroll-snap, ese enfoque
arrastra la pantalla al siguiente video — el toque se iba en el movimiento.
`onPointerDown` con `preventDefault` en los tres botones de la columna (lo que
hacen las apps de video). Y el aviso de «entra para dar me gusta» estaba
DETRÁS del video (14rem, pegado a la columna): ahora sale centrado, encima de
todo, con el botón de entrar que vuelve al mismo video.

**2. El espaciador no escribía y «enviar no funciona».** Dos causas:

- El visor intercepta el espacio para pausar (como YouTube) — pero YouTube lo
  apaga cuando el foco está en una casilla y aquí no: el `preventDefault` se
  comía los espacios del comentario. El manejador ahora ignora INPUT,
  TEXTAREA, contentEditable y todo lo que esté dentro de un `role="dialog"`.
- **Safari de iOS hace ZOOM solo al enfocar una casilla con letra menor de
  16 px**, y la pantalla queda recortada por la derecha: el botón de enviar y
  la equis quedaban FUERA. La captura del dueño lo enseña tal cual. El arreglo
  es global y SIN capa en `globals.css` (lo sin capa le gana a las utilidades
  de Tailwind): en pantallas de teléfono, `input/select/textarea` con
  `font-size: max(16px, 1em)`. Vale para todos los formularios del sitio, no
  solo este — un fallo se arregla para todos.

**3. El algoritmo: las señales de quien ya entró** (`src/lib/recomendar/`).
`senales.ts` (server) junta lo que la persona HIZO: **comprar pesa el doble
que un corazón**, y de ahí salen sus tiendas y categorías afines (se recalcula
de los hechos, cache de 1 minuto por usuario, jamás un perfil guardado).
`ordenar.ts` (puro, con pruebas) las aplica. Hoy está puesto en los videos:
las hileras de la portada, `/videos` y el «siguiente y siguiente» del visor.

Cinco reglas de ahí que no se tocan:

1. **REORDENA, NUNCA FILTRA.** Un comercio nuevo sin corazones ni ventas tiene
   que poder salir igual. Personalizar hasta tapar a los chicos sería deshacer
   las rondas del 23 de agosto con otro nombre.
2. **Nunca más de 2 afines seguidos** (`MAXIMO_AFINES_SEGUIDOS`), intercalados
   con el resto — que conserva su orden.
3. **El video con MI corazón va de primero** entre los afines: es la señal más
   directa que existe.
4. **La personalización va DESPUÉS de la caché del borde, en memoria.** Meter
   al usuario en la llave de la caché la volvería inútil (una entrada por
   persona). Sin sesión no se toca nada; si algo falla, la lista de siempre.
5. **Comprobado con dos sesiones**: anónimo ve el orden con semilla; el
   cliente que dio corazón ve ese video de primero.

Lo que falta del algoritmo (roadmap): aplicar las mismas señales a las bandas
de PRODUCTOS de la portada (misma regla: después de la caché, reordenar sin
filtrar) y sumar la señal de «lo vio entero» cuando haya medición de vistas.

## «AVÍSAME CUANDO ENTRE UN PAGO»: EL WEBHOOK AL SISTEMA DEL COMERCIO (24 ago 2026)

Estaba prometido al comercio piloto desde la sesión de los cobros por enlace:
su sistema hace la factura, crea el cobro y **quiere enterarse solo** cuando el
cliente paga, sin estar preguntando cada minuto por `/datos/socios/cobro`.

- Tabla nueva `webhooks_tienda` (una fila por tienda: dirección, secreto,
  activo, último intento, último ok, último error).
- Se dispara **al acreditar**, en los dos caminos: tarjeta
  (`cobros/acciones.ts`) y Zelle aprobado (`zelle/acciones.ts`). Va **al final
  y en su propio try**: el cobro ya está acreditado y un servidor ajeno que no
  conteste no puede deshacerlo.
- **Va firmado** (HMAC-SHA256 del cuerpo, cabecera `x-mercatren-firma`) con un
  secreto que se enseña UNA vez al crearlo. Sin firma, cualquiera que averigüe
  la dirección del comercio podría decirle que le pagaron y su sistema marcaría
  la factura cobrada. La firma vive en `src/lib/cobros/firma.ts`, **sin
  `server-only`**, para poder probarla (lo mismo que hace el otro lado).
- **La dirección tiene que ser `https`**: por ahí viaja el importe de una venta.
- **El resultado se anota siempre**, salga bien o mal, y el comercio ve en su
  panel la fecha del último aviso entregado y el motivo del último fallo. Un
  aviso que falla en silencio es peor que no tenerlo: el comercio cree que su
  sistema está al día y no lo está.
- **Hay un botón de probar** que manda un aviso de mentira (referencia
  `PRUEBA-MERCATREN`) y dice qué contestó. Sin eso, el comercio se entera de
  que su dirección está mal el día que pierde un pago.
- Sin dirección configurada no se hace nada, y eso **no** es un error.

Se configura en **Panel → Mi tienda → «Avísame cuando entre un pago»**, al lado
de la sincronización del catálogo: las dos son la conexión con su sistema.

## UN CARRITO NO PUEDE MEZCLAR DESTINOS (24 ago 2026)

Estaba escrito como pendiente desde el 15 de agosto y era una venta que se
cobra y no se puede entregar: lo de Estados Unidos se despacha a una dirección
de allá y lo de Venezuela se retira en el comercio. **No hay una sola entrega
que sirva para los dos**, y el checkout ni siquiera pide los mismos datos.

Lo que pasaba: bastaba con que UN producto fuera de Estados Unidos para que el
pedido entero se marcara «US», y a la mercancía venezolana se le pedía estado y
código postal de allá.

- **El candado está en el servidor** (`crearPedido`), decidido con lo leído de
  la BASE —de qué tienda es cada producto—, no con lo que diga el navegador.
- **El aviso está en el carrito**, para que la persona se entere ANTES de
  llenar el checkout: al agregar algo del otro destino sale un cuadro con la
  salida a mano —«vaciar el carrito y llevarme este»—, porque decir «no se
  puede» y dejarlo ahí es mandarlo a vaciar el carrito a mano.
- **Un carrito guardado ANTES de esto no tiene el país** de cada línea. Lo que
  no se sabe, no decide: no se bloquea a nadie por un carrito viejo (el
  servidor lo vuelve a mirar). Si el guardado YA venía mezclado, la pantalla lo
  dice y ofrece quitar unos u otros.
- **En la parrilla el botón rápido no discute**: si no cabe, lleva a la ficha,
  donde el aviso cabe y se puede explicar. Cien cuadros amarillos en una
  parrilla se leen como que el sitio está roto.

`src/lib/destino/carrito.ts` es puro y tiene 8 pruebas; `crearPedido` tiene la
suya.

## QUE EL SITIO VUELE: LA CACHÉ DE LA PORTADA Y DE LOS VIDEOS (24 ago 2026)

Medido en producción antes de tocar nada: **la portada tardaba ~2 s en cada
visita** y la ficha de una tienda saltaba entre 0,25 s y **2,8 s**. El dueño lo
vio como es: _«se queda como tres segundos así esa pantalla»_, con el rectángulo
gris delante.

- **Las bandas de la portada se recuerdan un minuto** (en el BORDE, ver abajo): son SEIS
  consultas con funciones de ventana y el resultado es idéntico para todo el
  que entre desde la misma ciudad en ese rato.
- **La primera tanda de la parrilla también**, con una diferencia que importa:
  se guarda con el orden del DÍA y se **rota en memoria** con la semilla de la
  visita, así la portada sigue moviéndose entre visitas sin volver a consultar.
  **La rotación mueve por dónde empieza, en bloques del tamaño de una ronda —
  jamás reordena por familia.** La primera versión ordenaba por familia y
  agrupaba todos los productos de cada tienda: deshacía las rondas enteras. Lo
  destapó la propia medición y hay una prueba que se pone roja si vuelve.
- **Los videos de las hileras, igual.** Las páginas siguientes de la parrilla
  infinita NO se recuerdan: las pide poca gente y llevan su propia semilla.
- **Toda llave lleva el mercado y la ciudad**, como exige `muro-cache`: sin eso
  un dominio serviría el catálogo de otro.
- **La ficha de tienda hace sus cinco consultas a la vez** (envío, videos,
  color, verificación, banners). Ninguna depende de otra; iban en fila y la
  ficha tardaba la suma.
- **`/media` guarda lo público en la caché del borde.** Un video sale del bucket
  en trozos y cada trozo pasaba por el worker: por eso «algunos videos se
  quedan pegados al darles play». Lo privado (comprobantes, facturas del
  proveedor) **nunca** entra en una caché compartida.

**Y LA CACHÉ TIENE QUE SER LA DEL BORDE, NO LA DE MEMORIA.** La primera
versión guardaba en la memoria del worker y en producción **siguió dando picos
de dos segundos**: cada visita puede caer en un worker distinto o recién
arrancado. `recordadoEnElBorde` (en `src/lib/cachecito.ts`) usa `caches.default`
—que sí se comparte— con la memoria como primer nivel. Si la caché del borde no
existe (en `next dev` no está), se sigue como siempre.

Medido en local después: la portada pasó de 0,94 s a 0,09 s con la caché
caliente, y la ficha de tienda de 0,67 s a 0,11 s.

## LOS SHORTS DE MERCATREN: CADA COMERCIO ENSEÑA SU TIENDA EN VIDEO (23 ago 2026)

Lo pidió el dueño con la referencia delante (la hilera de Shorts de YouTube):
_«cada video es la tienda mostrando por dentro cómo es… si alguien entra en un
video, le da siguiente y siguiente, como TikTok… y un botón donde dice entra en
mi tienda»_. Y una condición: **que subirlo sea fácil de verdad**.

**Cómo está armado.** Tabla nueva `videos_tienda` (no columnas), el archivo en
nuestro bucket servido por `/media`, y cuatro sitios donde sale: hileras en la
portada entre los bloques de productos, la ficha de cada tienda, `/videos` con
todos, y **la página propia de cada video** (`/video/<slug>`) con su
`VideoObject`, su entrada en el mapa del sitio y su tarjeta social. Las reglas
puras están en `src/lib/videos/reglas.ts` (10 pruebas).

**El tope son 3 MINUTOS y se rechaza EN EL NAVEGADOR**, antes de subir un byte:
el navegador ya conoce la duración en cuanto lee los metadatos. Hacer esperar
cinco minutos una subida para después decir «muy largo» es la forma más cara de
perder a un comercio. El servidor lo vuelve a comprobar (un formulario se salta
con la consola).

Cinco cosas que costaron y no se tocan:

1. **La CSP bloqueaba la vista previa.** Faltaba `media-src ... blob:`: el
   navegador lee el archivo del disco como blob para medir la duración y sacar
   la portada, y sin eso el formulario decía «no pudimos leer la duración» con
   un video perfecto delante. Medido el 23 ago 2026.
2. **El archivo se le pasa a R2 TAL CUAL (es un `Blob`).** `archivo.stream()` a
   secas falla con «Provided readable stream must have a known length», y
   `FixedLengthStream` **no existe** en el runtime de `next dev`. Con el Blob,
   R2 sabe el tamaño y no hay que cargar los megabytes en memoria.
3. **`/media` sirve los videos por RANGOS** (206 + `Content-Range`, y
   `Accept-Ranges` siempre). Sin eso el navegador se baja el archivo entero
   antes del primer fotograma y la barra de tiempo no deja saltar — que es
   exactamente lo que hace que una hilera se sienta rota.
4. **La portada la saca el navegador del propio video** (fotograma del segundo
   1, a WebP). Sin portada, una hilera de ocho videos son ocho recuadros negros.
5. **El visor vive en el grupo de rutas `(visor)`**, sin encabezado ni pie: con
   la barra del sitio encima deja de ser pantalla completa y el botón «Entra en
   mi tienda» se sale de la pantalla del teléfono. La URL no cambia.

**El tope de peso son 100 MB** porque es lo que aguanta el cuerpo de una
petición en la plataforma; un video vertical de un minuto pesa 20–60 MB. La
barra de avance es real (`XMLHttpRequest` contra `/upload/video`): una acción de
servidor no informa del progreso, y sin barra la gente cree que se colgó.

**SE COMPORTAN COMO CUALQUIER RED DE VIDEOS (24 ago 2026).** Palabras del
dueño: _«no inventes la rueda, hágalo igual como funcionan las redes sociales»_.
Tres niveles, y **los tres los elige la persona**:

1. **En la hilera**, el mouse encima mueve el video dentro de la tarjeta (en
   silencio, en bucle) y al quitarlo vuelve la portada. Así se catan seis
   videos en diez segundos sin salir de la página. `preload="none"` hasta que
   el mouse entra: ocho videos precargando se comen la conexión de un teléfono.
2. **El clic abre la página del video CON LOS MENÚS DEL SITIO A LOS LADOS** —el
   reproductor centrado, la columna de corazón / comentarios / compartir a la
   derecha, y arriba del video pausa y sonido a la izquierda y expandir a la
   derecha—. Por eso la página volvió al layout `(tienda)`: el grupo `(visor)`
   sin encabezado se tragaba la pantalla y obligaba a volver atrás.
3. **La pantalla completa solo con el botón de expandir**, y es la del
   navegador (`requestFullscreen`), no un CSS que la imite: así el teléfono
   esconde su barra y el botón de volver funciona. El estado se lee de
   `fullscreenchange`, que también cubre salir con Escape.

**Corazones, comentarios y compartir** (tablas `me_gusta_video` y
`comentarios_video`, nuevas): el corazón es uno por persona (la llave primaria
es la pareja video+persona) y **el número sube en la pantalla antes de que
conteste el servidor**, corrigiéndose si dice que no — esperar el viaje de red
se siente roto. Quien no entró ve los botones igual y al tocarlos se le invita
a entrar: esconderlos sería esconder que existen. Compartir usa el menú del
sistema (`navigator.share`) en el teléfono y copia el enlace en escritorio.
**Un comentario se OCULTA, nunca se borra** (`estado = 'oculto'`): si mañana
hay una discusión sobre lo que alguien escribió, el rastro tiene que existir.
Lo pueden ocultar quien lo escribió, el comercio dueño del video y el equipo.

**Y SE TIENEN QUE PODER ESCUCHAR (24 ago 2026).** El dueño subió sus primeros
videos y no sonaban: la vista previa llevaba `muted` —justo cuando uno quiere
comprobar qué eligió y qué está diciendo— y la lista «Mis videos publicados»
era una miniatura sin reproductor, así que entre tres videos parecidos no había
forma de saber cuál era cuál. Ahora la vista previa suena (no hay autoplay: la
persona pulsa play, y ahí el navegador no obliga a silenciar) y la miniatura de
la lista abre el video en grande con los controles del navegador, que se cierra
con la equis, con Escape o tocando fuera. **En el visor público sí arranca en
silencio y con su botón**, porque ahí sí hay autoplay y el navegador lo exige.
`tests/unit/videos.test.ts` se pone rojo si vuelve el `muted`.

**Las hileras nunca abren ni cierran la portada** y no se dibujan con menos de
tres videos: tres recuadros sueltos parecen un error, no una sección.

## DOCS: SE LLAMA «DOCS», SE VE COMO LA DE YADOMINIOS Y CADA GUÍA ES SU PÁGINA (23 ago 2026)

Regla global del dueño (está en el CLAUDE global): la sección se llama **«Docs»** —
nunca «Documentación» ni «Documentos»— en el menú, el pie, el título y la
vuelta; se ve como `yadominios.com/docs` (barra lateral con secciones e íconos,
buscador grande con ⌘K que filtra en vivo, tarjetas con título y resumen por
sección) pero con los colores de la casa; y cada guía es **su propia página con
su enlace fijo**, para pasárselo a alguien como soporte y para que Google la
indexe sola.

- `src/lib/docs/indice.ts` (puro, con pruebas): las cinco secciones con su
  ícono (Empieza aquí · Para compradores · Para comercios · Para desarrolladores
  y agentes de IA · Legal), los enlaces fijos del sitio (cómo funciona,
  entrega, términos…), los recursos para máquinas (OpenAPI, MCP, skills,
  auth.md, llms.txt) y `seccionDeGuia(temas)`, que mete sola cada guía escrita
  en su sección. `buscarEnDocs` busca sin acentos y sin signos («w8ben»
  encuentra «W-8BEN-E»).
- **La barra NUNCA se pierde.** `src/app/[locale]/(tienda)/(docs)/` es un
  GRUPO DE RUTAS: ahí adentro viven el índice, cada guía, el modelo **y
  también** cómo funciona, transparencia, entrega, devoluciones, ayuda,
  vender, comisiones, términos, privacidad y quiénes somos — con su URL de
  siempre. `(docs)/layout.tsx` les pone a todas la barra (`BarraDocs`, con el
  ítem activo resaltado por `EnlaceDocs`) y, arriba del contenido, «← Docs»
  (`MigasDocs`) para el celular, donde la barra va plegada en «Índice de
  Docs». Una página de Docs que se saque del grupo pierde la barra:
  `tests/unit/docs-indice.test.ts` exige que cada enlace del índice exista
  DENTRO del grupo. (`vender/empezar` se queda fuera a propósito: es el alta
  de la tienda, no una guía.)
- `BuscadorDocs` (cliente) filtra en el navegador: son decenas de entradas y la
  lista entera viaja con la página. Sin la equis nativa de Chrome.
- Las guías nuevas van en `src/contenido/articulos` (tipo `documentacion`) con
  sus `temas`; **los textos de los enlaces fijos en `docs.enlaces.<clave>` en
  los DOS idiomas**; `tests/unit/docs-indice.test.ts` se pone rojo si un enlace
  del índice no tiene página, si falta un texto, o si alguien vuelve a escribir
  «Documentación» en `messages/`.

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

## EL CATÁLOGO DE EE. UU. SE PUEDE BUSCAR EN ESPAÑOL (19 ago 2026)

El dueño buscó «repuestos» en su propio sitio y no salió nada. **El buscador
nunca estuvo roto** —busca en título español, inglés, descripción, marca, SKU y
nombre del comercio—: lo que estaba en inglés era **el dato**. CJ solo publica
`productName` (chino) y `productNameEn`, así que el importador guarda el inglés
en los DOS campos y la palabra «repuestos» no existía ni una vez en la base.

**`src/lib/catalogo/sinonimos.ts` (25 pruebas) hace que se pueda buscar hoy, sin
traducir un producto.** Cada palabra vale por todas sus equivalentes:

1. **Español → inglés.** «bicicleta» encuentra «bike». Eso es lo que desbloquea
   el catálogo de Estados Unidos ahora mismo.
2. **Español → español.** «caucho» (Venezuela) encuentra «llanta»;
   «refacciones» (México) encuentra «repuestos»; «corneta» encuentra «bocina».
   Esto sigue haciendo falta el día que todo esté traducido.

Cinco cosas de ahí que no se tocan:

1. **Son GRUPOS, no pares.** Un grupo es un concepto y todas sus palabras se
   valen entre sí en las dos direcciones. Con pares habría que escribir cada
   relación dos veces y a la tercera palabra el mantenimiento se cae.
2. **Tope de 12 formas por palabra, y lo tecleado va primero.** Ocho palabras
   por doce formas son 96 condiciones; sin tope, este proyecto ya se topó una
   vez con «too many SQL variables». Y si lo escrito no fuera lo primero, el
   tope podría dejar fuera de su propia búsqueda la palabra que la persona puso.
3. **`expandir` nunca devuelve vacío.** Un vacío haría que `or()` diera
   `undefined`, esa palabra dejaría de filtrar, y la búsqueda traería el
   catálogo entero.
4. **`normalizarTexto` vive en `normalizar.ts`, aparte.** `sinonimos` la
   necesita para armar su índice AL CARGAR el módulo y `buscar` necesita a
   `sinonimos`: importándose entre sí, el índice llamaría a una función a medio
   inicializar y el buscador moriría con «is not a function».
5. **El nombre del departamento entra en el texto que se busca, Y VA COMO
   SUBCONSULTA.** La primera versión lo escribió como `categorias.nombreEs` a
   secas, aprovechando el join que ya hacía el listado del catálogo — **y rompió
   el buscador entero**: `sugerencias()`, el desplegable que sale mientras se
   escribe, solo une `productos` con `tiendas`, así que su consulta quedó
   inválida y devolvía CERO para todo. Lo destapó probarlo en el navegador
   contra la base real: «tablero» daba 3 y pasó a dar 0. Un fragmento de SQL
   compartido no puede depender de lo que haya unido quien lo llama.

**Dos palabras se ajustaron probando contra el catálogo REAL, no en pruebas:**
«torch» salió del grupo de linterna —en inglés británico es correcto, pero en
una ferretería choca con «an*torch*a» de corte y traía justo eso—, y «llave» a
secas entró en el de wrench, porque las fichas dicen «LLAVE ALLEN» y no «llave
inglesa», así que «wrench» no encontraba NADA. Encontrar de más es aceptable;
encontrar de menos es lo que hace que la gente se vaya.

**Y hay un candado que mira el archivo** (`buscador-espanol.test.ts`): el
diccionario puede seguir perfecto mientras alguien desenchufa la llamada, y
entonces todo pasa en verde con el catálogo otra vez invisible.

### El traductor, que es el arreglo de fondo

**Panel → Configuración → Catálogo en español.** Reescribe el título como lo
escribiría una tienda, no palabra por palabra: los títulos de CJ son montones
de palabras sueltas puestas para su buscador.

- **Es un modelo de TEXTO** (`gemini-2.5-flash` por defecto), no de imagen. El
  bloqueo de la casa sigue puesto y no se escala a nada más caro si falla.
  Traducir diez mil productos cuesta menos de un dólar.
- **Sin `TRADUCCION_LLAVE` no se dibuja el botón y se dice por qué.** Un botón
  que siempre falla hace creer que el sistema está roto.
- **Lo ya traducido NO se vuelve a tocar**, y la señal es que los dos idiomas
  dejaron de decir lo mismo. No se adivina el idioma: medio catálogo de CJ son
  códigos y marcas, un detector se equivoca ahí, y equivocarse significa
  reescribir un título que una persona corrigió a mano.
- **Nada de lo que devuelve el modelo se cree sin comprobar**: un id que nadie
  pidió se descarta, y una traducción vacía, igual al original o convertida en
  parrafada no se guarda — guardarla marcaría el producto como traducido y no
  se volvería a intentar jamás.
- Se puede parar y retomar: lo que decide qué falta es el propio dato.

## LAS BICICLETAS ESTABAN EN REPUESTOS DE CARRO (19 ago 2026)

Toda bicicleta de rueda gruesa de CJ se llama «Fat Tire Bike», y
`repuestos-carro` capturaba la palabra **`tire`** — que se prueba antes que
deportes. Y la misma trampa con **`truck`**: el «Hand Truck» es una carretilla
de almacén.

- **`bicicletas` es departamento propio** y va ANTES que repuestos en la lista,
  porque el orden ES la regla. Entran las de adulto, las eléctricas, **las de
  niño** —que no van a «Bebés y niños» por el mismo motivo— y sus accesorios.
- **Motos se quedó con el icono de moto de verdad.** Tenía el de bicicleta.
- **`EXCEPCIONES`: frases que significan otra cosa que su palabra suelta**, y se
  prueban primero. No se arregla quitando `truck` de la lista —un `truck` suelto
  sí es un vehículo— ni metiendo condiciones dentro del bucle. **Esa lista crece
  con lo que se encuentra, no con lo que se imagina.**
- **«card» dentro de «car» NO entró ahí a propósito**: esa trampa ya la resuelve
  la comparación por palabras enteras, y meterla como excepción le habría
  quitado el acierto que ya tenía. Lo destapó su propia prueba.
- Las pruebas usan **los títulos REALES del catálogo publicado**, no ejemplos.

## EL PRECIO DE EE. UU. NO LLEVABA EL ENVÍO DENTRO (19 ago 2026)

`cj/importar.ts` publicaba con `desglosarUs(costo, 0)`. Ese cero es el envío.
Medido con la primera compra real (MT-000004) el envío fueron **$1.57**: un
producto que debía dejar $3.09 dejaba **$0.82**. No se perdía dinero — se
ganaba un tercio de lo declarado, y en silencio.

- **El flete se cotiza contra CJ al publicar** (`cj/flete.ts`), que es el único
  momento en que el precio deja de ser una estimación de pantalla.
- **EL RESPALDO NUNCA ES CERO** (`destino/envio-us.ts`, 10 pruebas). Volver a
  cero «porque es lo que había antes» es reproducir el fallo, y de los dos
  errores posibles es el caro: cobrar de más vende un poco menos; cobrar de
  menos regala el margen en cada venta, para siempre y en silencio. **Un cero
  cotizado tampoco se toma por bueno**: ningún transportista lleva nada gratis.
- **`envios_producto` es tabla nueva, no columna**, como manda la regla: una
  columna no llega sola a producción. Guarda además **si fue cotizado o
  estimado y cuándo**: un precio armado con un estimado se puede volver a
  mirar, uno armado con un cero no se distingue de uno correcto.
- **Panel → Configuración → Precios de Estados Unidos** recalcula los que ya
  estaban publicados. Idempotente: solo mira los que no tienen fila de envío.
- **El estimado de $3.50 sale de UNA medición.** Se sube en cuanto haya tres o
  cuatro compras medidas.

## A GOOGLE SE LE MANDABAN 622 PRODUCTOS QUE NO SE PUEDEN ENTREGAR (19 ago 2026)

Contado contra la base: `/datos/google` filtraba por `tiendas.mercado`, que dice
en qué plaza se vende, y no por `pais_origen`, que dice de dónde sale la
mercancía. La ferretería venezolana vende EN mercatren.com —mercado US— pero su
mercancía se retira en Venezuela. Resultado: **622 productos venezolanos
presentados a Merchant Center como comprables y entregables en Estados Unidos.
Ni uno lo era.**

No es un detalle de catálogo: es el patrón por el que suspenden cuentas, y una
suspensión se lleva por delante también lo que sí estaba bien.

**La prueba de humo se ajustó, y el cambio importa:** exigía «más de un
producto» en el feed. Con el filtro puesto, una máquina con catálogo venezolano
y sin catálogo de EE. UU. produce un archivo vacío **y eso es lo correcto** —
exigir productos ahí sería una prueba que se pone roja por hacer lo que debe.
Ahora comprueba que el feed sea XML válido con su canal, y que si trae
productos, traigan precio y enlace.

## CANCELAR UN COBRO YA CREADO (20 ago 2026)

Lo pidió el comercio piloto con un caso real: el cobro `VIG-02497-A1` salió
hacia `hernandezbleider@gmai.com` — sin la «l» de gmail. Ese correo no existe,
así que **el enlace nació muerto y seguía vivo y cobrable hasta vencer**, y
nadie podía apagarlo. Los otros dos casos pasan igual de seguido: el cliente
pagó en efectivo o por Zelle mientras el enlace andaba dando vueltas —si
después alguien lo abre y lo paga, pagó dos veces— o se equivocaron de monto,
de cliente o de factura.

```
POST /datos/socios/cobro/anular
Authorization: Bearer <token del comercio>
{ "referencia": "VIG-02497-A1", "motivo": "el correo estaba mal escrito" }
```

**EL ESTADO SE LLAMA `cancelado`, NO `anulado`.** El comercio pidió `anulado`;
aquí se usa el que ya existía en `ESTADOS_COBRO` y que la página de pago ya
sabía dibujar. Dos palabras para el mismo estado es como empiezan los fallos
que nadie encuentra: un día alguien compara contra la que no es y el cobro
sigue cobrable creyendo que está apagado.

- **Un cobro PAGADO no se cancela** (409). Taparía dinero que ya entró: el
  comercio dejaría de verlo, la conciliación no cuadraría y el cliente se
  quedaría sin comprobante de algo que sí pagó. Si hay que devolvérselo, eso es
  una devolución y tiene su propio camino.
- **Uno ya cancelado devuelve 200, no error.** Un doble clic no puede parecer
  un fallo, o quien lo pulsó se queda dudando de si de verdad se apagó.
- **Uno VENCIDO también se cancela**, y por un motivo concreto: un vencido se
  puede reactivar, así que cancelarlo es justo lo que impide que reviva.
- **Un cancelado NO revive por `/reactivar`.** No hizo falta agregar nada
  —esa ruta ya exige `abierto`— pero quedó escrito ahí para que nadie lo relaje
  pensando que «vencido y cancelado son parecidos».
- **El estado se re-comprueba DENTRO del `UPDATE`.** Entre leer y escribir
  puede entrar el pago del cliente; sin eso, un cobro recién pagado quedaría
  marcado como cancelado y el dinero estaría en la cuenta sin que nadie lo
  asocie a nada.

**EL MOTIVO NO SALE NUNCA A LA PÁGINA DE PAGO**, y por eso vive en tabla
aparte (`anulaciones_cobro`, tabla y no columna como manda la regla). Lo
escribe una persona y puede nombrar al comercio; teniéndolo en otra tabla, la
consulta que dibuja esa página ni siquiera lo trae, así que no se puede filtrar
por descuido.

**Y EL MENSAJE DE CANCELADO CAMBIA SEGÚN EL MODO.** Con el cobro normal se
nombra al comercio («Ferremateriales Bley C.A canceló este cobro»); en modo
`solo_mercatren` no se nombra a nadie («Este cobro fue cancelado»). No es
cosmético: ese enlace le llega al cliente de una ferretería que revende, y si
ahí aparece quién le surte, le compra directo. Es la razón entera de que ese
modo exista, y filtrarlo justo al cancelar rompería todo lo demás.
`cobros-anular.test.ts` mira el archivo y se pone rojo si alguien cambia
`presentacion.comercio` por el nombre crudo.

**Comprobado contra un servidor real, no solo en pruebas:** sin token 401,
token inválido 401, referencia ajena o inexistente 404, pagado 409, abierto
200, el mismo otra vez 200, vencido 200, reactivar un cancelado 409, y el GET
devolviendo `cancelado`. Las dos pantallas se miraron en el navegador.

## CJ ACEPTA UNA LLAMADA POR SEGUNDO. UNA. (20 ago 2026)

`Too Many Requests, QPS limit is 1 time/1second`. Eso contestó CJ a 989 de
1.033 productos cuando se le pidieron las descripciones de a cinco seguidas.

**Y el fallo de fondo no fue el ritmo: fue tragarse el motivo.** La primera
versión devolvía `null` para todo —CJ caído, CJ limitando, producto sin
descripción, petición mal armada— así que la pantalla decía «989 sin datos en
CJ» y eso se leía como «CJ no tiene esas descripciones». Cuatro causas con el
mismo síntoma y tres de ellas con arreglo. **El motivo entero se guarda ahora
por producto y el panel lo enseña agrupado**, que es lo que convirtió una
pregunta en una respuesta de una sola pasada.

- **1,2 segundos entre llamadas, no 1,0.** El límite lo cuenta CJ en su reloj,
  y dos llamadas separadas por exactamente un segundo pueden caerle dentro del
  mismo. El margen cuesta 200 ms por producto y evita repetir la pasada entera.
- **El ritmo se paga salga bien o mal:** lo que CJ cuenta son las llamadas
  hechas, no las que funcionaron.
- **Un reintento a los 2 segundos** si aun así responde que somos muchos: basta
  que otra parte del sitio le hable a CJ en el mismo segundo —una compra, un
  flete— para chocar sin que nadie tenga la culpa.
- Vale para **todo** lo que le pida algo a CJ, no solo las descripciones.

## LA MARCA DE UN FALLO NO VA EN EL CAMPO QUE VE EL COMPRADOR (20 ago 2026)

Para que los productos sin descripción no volvieran a entrar en la cola, se
marcaron con **un espacio** dentro de `descripcion_es`. La ficha hace
`{descripcion || t("sinDescripcion")}` y **un espacio es TRUTHY en
JavaScript**: pasaba el `||`, se dibujaba, y la ficha quedaba con el título
«Descripción» y un hueco en blanco debajo. Ni siquiera salía el aviso de que no
hay ninguna — que es lo que sí salía ANTES del cambio.

- La ficha usa `descripcion?.trim() || …`, con su prueba, y hay otra que se
  pone roja si alguien quita ese `.trim()`.
- La marca de «ya lo intenté» vive en `intentos_descripcion`, **tabla nueva y
  no columna**, junto al motivo exacto que dio CJ.
- Y la consulta de pendientes usa `trim()` en el SQL, así que los que quedaron
  marcados con un espacio vuelven a la cola solos, sin tocar la base a mano.

## EL FORMULARIO FISCAL DEL COMERCIO EXTRANJERO (21 ago 2026)

Un comercio de Venezuela o Colombia **no necesita una LLC en Estados Unidos**
para venderle a Mercatren. Lo que necesita es un **W-8BEN-E**: el papel con el
que declara que no es estadounidense. Comprobado con las fuentes citadas en
`PLAN-CONTABILIDAD.md`: a un proveedor extranjero no se le emite 1099, y no hay
retención porque el ingreso por venta de mercancía se ubica **donde pasa la
propiedad** —regla del _title passage_, secciones 861(a)(6) y 862(a)(6)— y esa
mercancía se entrega en su país.

**Se llena en pantalla, en español, y sale el documento firmado.** Es lo que
hacen Google y Facebook con quien cobra desde fuera. La alternativa —bajar un
PDF en inglés, imprimirlo, firmarlo, escanearlo y mandarlo— la abandona la
mayoría, y con ella se les queda el dinero parado sin que nadie sepa por qué.

Seis cosas que no se tocan:

1. **ESCRIBIR EL NOMBRE NO ES FIRMAR.** El IRS lo dice con esas palabras. Hace
   falta guardar **fecha, hora, desde dónde** y **el texto exacto de la
   declaración que se le enseñó**. Guardar solo «aceptó los términos» no
   demuestra nada el día que alguien lo pida.
2. **El vencimiento NO es «hoy + 3 años».** Es el 31 de diciembre del tercer
   año siguiente al de la firma. Uno de marzo y uno de diciembre del mismo año
   vencen el mismo día; calcularlo como tres años exactos le quitaría nueve
   meses al primero y se le pediría el papel de nuevo sin motivo.
3. **A una tienda de Estados Unidos no se le pide.** El formulario es
   justamente el que declara NO ser estadounidense.
4. **Uno por vencer SÍ cobra.** Solo se frena el que falta o el que ya venció.
   Frenarle el dinero a alguien porque su papel vence en cincuenta días sería
   castigarlo por adelantado — para eso está el aviso a los sesenta días.
5. **El candado está en `pedirRetiro`, en el servidor, y ANTES de tocar el
   saldo.** El aviso de «Mi tienda» es cortesía; un botón dibujado se lo salta
   cualquiera. Y si se comprobara después de apartar el dinero, un comercio sin
   formulario dejaría su saldo bloqueado por un retiro que nunca sale.
6. **Lo firma el comercio, nunca el equipo.** Es una declaración bajo pena de
   perjurio: firmarla por otro sería falsificarla.

**El documento es un formulario SUSTITUTO, y está permitido.** El IRS los
acepta si llevan la misma información y la misma declaración jurada — por eso
el texto va en inglés y palabra por palabra, con la traducción al lado. Se
imprime desde el navegador en vez de generarse en el servidor: meter una
biblioteca de PDF dentro de un worker del borde es peso y mantenimiento para
algo que el navegador ya hace.

**Y no se manda a ninguna parte.** No va al IRS. Se guarda por si alguien
pregunta, y la propia pantalla lo dice antes del primer campo: mucha gente cree
que está declarando impuestos en Estados Unidos y abandona ahí mismo.

## EL ASIENTO PARA XERO SE EXPORTA, NO SE INTEGRA (21 ago 2026)

Xero está conectado con Chase y con Stripe, así que ya sabe cuánto dinero se
movió. Lo que no sabe es **qué se vendió y cuánto costó**, que es de donde sale
el margen.

**No se conecta Mercatren con la API de Xero, a propósito.** Hoy hay tres
órdenes de compra en total. Una integración son semanas, una credencial más que
mantener y una pieza que se rompe cuando Xero cambia algo — para automatizar
tres asientos al mes que se escriben en diez minutos.

**Panel → Configuración → Asiento contable del mes** exporta los tres
renglones: ingresos por el bruto, costo de mercancía, y comisiones del
procesador. **Son tres y no dos** porque son dos costos de dueños distintos:
juntarlos haría que el comercio nos atribuyera los dos y que nadie viera cuál
de ellos crece.

Se conecta de verdad cuando el asiento pase de una hora, o con más de unas
cincuenta órdenes al mes.

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
