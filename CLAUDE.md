@AGENTS.md

# Mercatren.com

Tienda en línea operada por **Mercatren LLC** (Michigan, Estados Unidos).
Servicio **multi-comercio y multi-país**: un país = un dominio = un catálogo.

> **CÓMO SE USA ESTE ARCHIVO (reorganizado el 6 sep 2026).** Aquí están las
> REGLAS vigentes: lo que no se puede romper. El diario del proyecto —cada
> fallo real, su causa y su candado— vive en **`HISTORIAL.md`**, con el índice
> al final de este archivo. **Antes de tocar una pieza, lee su sección allí.**
>
> Se separaron porque este archivo pesaba 332 KB y viajaba entero dentro de
> CADA mensaje de la sesión: ~85.000 tokens por turno gastados en releer
> historia. Nada se borró.

---

## LO PRIMERO QUE SE MIRA, SEGÚN LA PREGUNTA

| Si preguntan…                   | Se contesta desde                      |
| ------------------------------- | -------------------------------------- |
| «¿qué falta?» · «¿qué hago yo?» | `CRONOGRAMA.md` (orden y prioridad)    |
| «¿qué tenemos pendiente?»       | `PENDIENTES.md` (índice completo)      |
| ¿un pago funciona?              | `VERIFICAR-PAGOS.md` — **obligatorio** |
| abrir un país nuevo             | `ABRIR-UN-PAIS.md` — lista entera      |
| posicionamiento, «escanea»      | `SEO.md`                               |
| por qué algo se hizo así        | `HISTORIAL.md` (índice abajo)          |

Al terminar algo se marca en `CRONOGRAMA.md` **y** en `PENDIENTES.md`.

---

## Perímetro del proyecto (REGLA CRÍTICA)

Esta sesión trabaja **únicamente** en `/Users/windocellc/Mercatren.com`.

- Todo lo que no sea de Mercatren se detiene y se avisa: es de otra sesión.
- **Publicación: solo YaDominios Cloud.** Ninguna otra plataforma.
- **Recursos permitidos** (lista cerrada; lo que no esté aquí no se toca):
  sitio `mercatren` → `mercatren.sitios.dev` → `mercatren.com`; base `DB`
  (SQLite de la plataforma); archivos `BUCKET` (R2).
- **Prohibido crear recursos remotos** (bases, buckets, dominios, subdominios)
  aunque «hagan falta». Se propone y se espera el sí.
- Las migraciones se **escriben** libres en `drizzle/migrations/`; **aplicarlas
  contra la base real exige autorización expresa cada vez**.
- **Las tablas llegan a producción por `schema.sql`**, que YaDominios Cloud
  ejecuta en cada publicación. Se genera con `npm run db:schema-cloud` y se
  commitea. **Solo tablas, nunca datos** (~53 KB hoy): corre entero antes de
  que el sitio quede en vivo, y con el catálogo dentro (556 KB) la
  publicación se caía.
- **El histórico Zelle JAMÁS va en `schema.sql`**: trae nombres y correos de
  personas reales y el repositorio es público.

---

## LA FIGURA JURÍDICA (regla de cabecera)

**Mercatren LLC compra y revende mercancía por cuenta propia.** No es un
agente, no cobra por cuenta de nadie y no administra dinero de terceros.

1. Un comprador paga a Mercatren LLC el precio publicado.
2. Mercatren LLC compra al proveedor **a nombre propio**, con factura a su
   nombre.
3. El proveedor despacha a la dirección designada por el comprador.
4. Mercatren LLC emite factura de venta.

Lo que entra es **ingreso propio**; lo que sale, **costo de mercancía
vendida**. El ingreso es un **margen comercial dentro del precio publicado**.

**Por qué importa:** la redacción anterior («cobramos y liquidamos ese pago»,
«comisión del 3 %») describe palabra por palabra la definición de _money
transmission_ en EE. UU. — licencias estatales, registro FinCEN — y es la
razón por la que procesadores y bancos cierran cuentas. Lo corrigieron el
abogado y el contable el 5 ago 2026.

**NO SE USA STRIPE CONNECT NI PAGO DIVIDIDO.** Un cobro dividido le diría a
Stripe que el dinero es del comercio: el 1099-K del bruto le saldría a ÉL.
Quien «arregle» esto con Connect deshace la reestructuración entera.

**Lo que se declara es el BRUTO**, y el margen sale de la resta
(`bruto − costo de mercancía = margen`). Declarar solo el margen dispara la
auditoría, porque Stripe reporta otra cosa.

### Vocabulario PROHIBIDO en todo el sitio, en los dos idiomas

cobrar por cuenta de · liquidar/liquidación · custodia · retener fondos ·
saldo · fondos · billetera/wallet · remesa/remittance · comisión sobre el pago ·
transferencia de dinero · intermediario financiero · agente de cobro · mandato ·
actuamos en nombre de · el pagador · el beneficiario · instrucción de pago.

En su lugar: **vendemos y facturamos · el precio de venta · margen comercial
incluido en el precio · compramos la mercancía al proveedor · el comprador ·
la dirección de entrega designada · orden de compra · ingresos por ventas.**

**Hay palabras que no se salvan ni negándolas** (`NI_NEGANDO` en
`tests/unit/vocabulario-publico.test.ts`): «dinero de los comercios», «dinero
ajeno», «dinero de terceros». En páginas comerciales no van ni para decir que
no; en términos y privacidad sí, y por eso esos dos archivos están exentos.

**LA NEGACIÓN VA EN LO LEGAL, NUNCA EN LO COMERCIAL.** En términos, privacidad
y formularios de cumplimiento la negación explícita ES precisión. En Google,
la portada o cualquier texto que lea un comprador es un error: nadie llega
preguntándose si administramos dinero ajeno, y responder a una pregunta que
nadie hizo planta la sospecha uno mismo. Se escribe **qué gana cada uno**.

---

## LA SOCIEDAD: MERCATREN LLC (los datos que piden los formularios)

Verificado en `mibusinessregistry.lara.state.mi.us`, que es contra lo que
cotejan Payoneer, Merchant Center y los bancos. **El nombre legal va SIN
coma** (Windoce, LLC, la anterior, sí la lleva: son dos nombres distintos).

| Dato                      | Valor                                                      |
| ------------------------- | ---------------------------------------------------------- |
| Identification #          | **900260648**                                              |
| **Fecha de constitución** | **11 ago 2026** (no la de la firma)                        |
| EIN                       | **42-4386110** (sin guion: `424386110` cuando lo rechacen) |
| Agente residente          | Pedro M Llerena                                            |
| Domicilio fiscal          | 30080 Montmorency Drive, Novi, MI 48377                    |
| **Informe anual vence**   | **15 feb 2027**                                            |

**El informe anual no es un trámite menor:** si se pasa, la LLC pierde el
«Good Standing» y con eso se caen Payoneer, Merchant Center y potencialmente
Mercury. La dirección del registro es **la misma que la de devoluciones**, a
propósito: Google las cruza desde abril de 2026.

**Dos bancos vivos:** Mercury ...9805 (Column N.A. por dentro) y Chase ...1098.
**Chase da DOS números de ruta** —uno para ACH y otro para wire— y confundirlos
rebota el dinero. Los números completos viven en
`~/Mercatren-privado/BANCOS-Y-REGISTRO.md`, **fuera del repositorio**.

**El nombre sale entero de `src/lib/sociedad.ts`.** `tests/unit/sociedad.test.ts`
falla si alguien vuelve a escribirlo a mano en `src/` o `messages/`. Los textos
de idioma llevan `«SOCIEDAD»` y `«ESTADO»`, con comillas angulares y no llaves:
next-intl lee `{sociedad}` como variable ICU y revienta la pantalla entera.
**`DESARROLLADOR` es otra constante** (Windoce, LLC sigue programando el sitio).

---

## EL PRECIO Y LAS COMISIONES

| Método  | Margen | Procesador   | Precio publicado            |
| ------- | ------ | ------------ | --------------------------- |
| Tarjeta | 3 %    | 2.9 % + 0.30 | `V = (base + 0.30) / 0.941` |
| Zelle   | 6 %    | ninguno      | `V = base / 0.94`           |

En EE. UU. (catálogo propio de CJ) el margen es **30 %** (`COMISION_US_PB`):
allá Mercatren compra, despacha y asume devolución y contracargo.

**AL CAMBIAR EL MARGEN SE RECALCULAN LOS PRECIOS PUBLICADOS, Y PRIMERO.** El
precio guardado lleva el margen dentro: si sube la constante y los precios se
quedan, la diferencia sale del bolsillo del comercio en cada venta. Orden:
`node scripts/recalcular-precios.ts` → `npm run db:cargar` → recién ahí
desplegar. Plan en `PLAN-COMISION.md`.

**Zelle va al 6 % desde el 8 sep 2026** (`COMISION_ZELLE_PB = 600`; tarjeta
sigue en 300). El comercio recibe su precio exacto en los dos caminos: en
pedidos la comisión del renglón es «cobrado − base» y se guarda al crear; en
cobros por enlace **la tarifa pactada se guarda con el cobro**
(`tarifas_del_cobro`) y sin fila vale la de antes — subir el margen no toca
lo ya emitido. **Zelle ya no es siempre más barato que la tarjeta**: el cruce
está en ~$282 de base, y el ahorro solo se enseña cuando existe.

---

## Cómo está armado

| Pieza                 | Qué se usa                                                    |
| --------------------- | ------------------------------------------------------------- |
| Framework             | Next.js 16 (App Router) + React 19 + TypeScript estricto      |
| Estilos               | Tailwind CSS v4 (marca en `src/app/globals.css`)              |
| Aplicación instalable | Serwist (`src/sw.ts`, `src/app/manifest.ts`)                  |
| Base de datos         | SQLite de YaDominios Cloud (`env.DB`) con Drizzle ORM         |
| Cuentas               | Better Auth con adaptador de Drizzle                          |
| Cobros                | Stripe (cobro propio, sin pago dividido)                      |
| Bilingüe              | next-intl (`/es` y `/en`)                                     |
| Pruebas               | Vitest + Testing Library (unidad), Playwright (punta a punta) |
| Publicación           | GitHub Action → rama `yapanel-build` → YaDominios Cloud       |

```
src/app/[locale]/(tienda)/  lo que ve el público (encabezado y pie)
src/app/[locale]/panel/     administración (exige sesión)
src/app/datos/              rutas de servidor (login, avisos de Stripe…)
src/lib/alcance.ts          qué comercio puede ver quién (puro, con pruebas)
src/lib/autorizacion.ts     sesión, roles y alcance
src/lib/mercado/            países: lista cerrada, repositorio, muro de datos
src/middleware.ts           idioma, mudanzas y primera barrera del panel
messages/es.json · en.json  textos
datos/                      archivos fuente reales (NO se suben al repo)
drizzle/migrations/         SQL versionado (no se aplica solo)
```

---

## Reglas propias de este proyecto

1. **Nada de rutas `/api/`.** En YaDominios Cloud ese prefijo lo capturan los
   estáticos. Se usa `/datos`, `/media` y `/upload` (`src/lib/rutas.ts`).
2. **El dinero siempre en centavos enteros.** Comisiones en puntos base
   (300 = 3 %). Todo en `src/lib/dinero.ts`, con pruebas.
3. **Todo texto del público es bilingüe** (`es.json` _y_ `en.json`; hay prueba).
   En el panel, cada campo que ve el público lleva dos casillas.
4. **El inglés tiene que ser de nativo**, neutro y profesional de EE. UU.
5. **Nuestras cuentas se llaman «Soporte»**, con un correo que existe y recibe
   de verdad. Nunca una dirección inventada.
6. **El botón de borrar nunca va a la vista**: dentro del menú de tres puntos,
   con confirmación aparte.
7. **El pie lleva el crédito de Windoce, LLC** con enlace a windoce.com en
   pestaña nueva. No se quita (lleva `nofollow` y `data-nosnippet`).
8. **Nada de datos de prueba ni datos reales de nadie** en placeholders o
   semillas. El placeholder describe el campo, no da ejemplos de personas.
9. **Antes de publicar un cambio que se vea, se prueba en el navegador** y se
   muestra la captura.
10. **Ningún enlace puede llevar a un 404** (`e2e/enlaces.spec.ts`).
11. **Ninguna contraseña se escribe a ciegas**: `<CampoClave>` con el ojito.
    Hay prueba contra cualquier `type="password"` suelto.
12. **Quien olvida su contraseña se recupera solo**, y la pantalla **nunca dice
    si el correo existe**.
13. **Se puede entrar y se puede salir.** Cerrar sesión avisa al servidor y
    hace **carga completa**: con navegación de cliente el encabezado se queda
    como estaba.

### Trampas del proyecto que ya costaron caro

- **NUNCA pedir una tabla entera** (`.select()` sin columnas): Drizzle lista
  todas las columnas del esquema, y una base que ya existe no recibe las
  nuevas → 500 en producción con todo perfecto en local.
- **Tablas nuevas, no columnas.** `schema.sql` solo trae `CREATE TABLE IF NOT
EXISTS`: una columna nueva NO llega sola a producción.
- **`filas × columnas ≤ 100` por sentencia** en la base de la nube.
- **Un archivo `"use server"` solo exporta funciones async.** Una constante o
  un tipo exportado rompe el módulo entero; `tsc` no lo ve, la compilación sí.
- **`npm run verify | grep …` devuelve el exit de `grep`.** Para encadenar:
  `npm run verify > log; s=$?; …; exit $s`.
- **El middleware se llama `src/middleware.ts`**, no `proxy.ts`: proxy compila
  como función Node y OpenNext solo acepta edge.
- **`public/sw.js` lo genera `npm run sw`** antes de `next build`. No volver a
  meter `withSerwistInit` en `next.config.ts`.
- **`next dev` MIENTE sobre los estados HTTP**: con streaming, `notFound()` y
  `permanentRedirect()` salen como 200 con la redirección en el cuerpo. Se
  mide contra la compilación de producción o el sitio publicado.
- **El service worker no guarda nada con sesión** y solo se registra en
  producción: lo que toque sesión, panel o comprobantes se comprueba en el
  sitio publicado.
- **Si nadie puede entrar, mira primero si llegan las cookies**:
  `/datos/salud` → `cookies.cuantas`. Cero = es el camino, no el código.

---

## Roles y alcance

Cualquier consulta que devuelva dinero o datos de pagadores **pasa por el
alcance** (`obtenerAlcance()`), incluidas las de apoyo.

| Rol         | Qué ve                                                     |
| ----------- | ---------------------------------------------------------- |
| `soporte`   | Toda la operación, todos los comercios, y la configuración |
| `validador` | Toda la operación y la cola de validación                  |
| `vendedor`  | Solo su comercio: sus ventas, sus cobros, su dinero        |
| `cliente`   | No entra al panel                                          |

**El mismo panel se LEE distinto según quién mire.** Al agregar una pantalla
con dinero, la pregunta obligatoria es _«¿cómo se lee esto desde la silla del
comercio?»_.

**`esEquipoInterno()` devuelve false mientras hay un comercio observado**
(«ver su panel»), y el middleware cierra los tramos del equipo. `esSoporteDeVerdad()`
NO mira el disfraz: la usan los retiros por Mercury y el recálculo de precios.

**Las tiendas nacen ACTIVAS** y el alta es inmediata: nadie espera aprobación.
El control se ejerce después, suspendiendo a quien no cumpla.

---

## Multi-país: el dominio decide el mercado

- `src/lib/mercado/mercados.ts` es **lista cerrada**: US (mercatren.com),
  CL (mercatren.cl), CO (mercatren.com.co), VE (mercatren.com.ve).
- **El país es obligatorio EN EL TIPO.** El filtro solo se fabrica dentro de
  `src/lib/mercado/repositorio.ts` (símbolo no exportado): pedir el catálogo
  sin país **no compila**. `tests/unit/muro-mercado.test.ts` cubre lo que el
  compilador no ve; `muro-cache.test.ts` exige el mercado en toda llave.
- **`tiendas.mercado` ≠ `tiendas.paisOrigen`**: el primero dice dónde se VENDE,
  el segundo de dónde SALE la mercancía. Confundirlos mandó 622 productos
  venezolanos a Merchant Center como entregables en EE. UU.
- **No se redirige por geolocalización, nunca.**
- **Toda consulta nueva del panel del equipo nace filtrando por
  `mercadoDelPanel()`.**
- **El código del proveedor jamás sale al público** (`catalogo/codigo.ts`).

---

## Publicar

**El push a main basta.** No dispares el flujo a mano después: cae en el mismo
grupo de concurrencia y **cancela al del push**.

```bash
gh run list --limit 3 --workflow=build.yml
```

Y después **mirar el sitio de verdad, saltando la caché** — el borde sirve la
página vieja unos minutos:

```bash
curl -s -H 'Cache-Control: no-cache' "https://mercatren.com/es/nosotros?v=$RANDOM" | grep "lo que cambiaste"
```

**Los tres dominios sirven el MISMO worker**: una publicación actualiza `.com`,
`.cl` y `.com.co` a la vez.

---

## Comandos

```
npm run dev             # servidor local
npm run build           # genera el service worker y compila
npm run verify          # TODO: tipos, lint, pruebas, auditoría, secretos, build
npm run test:run        # pruebas de unidad
npm run e2e             # punta a punta (apaga antes cualquier npm run dev)
npm run db:generar      # generar SQL de migración (NO la aplica)
npm run db:schema-cloud # regenerar schema.sql
npm run db:local        # migraciones + histórico en la base local
npm run db:cargar       # mandar un SQL a PRODUCCIÓN (pide TOKEN_MERCATREN)
npm run cuenta:crear    # crear una cuenta que entra al panel
npm run productos:importar · zelle:importar · iconos · cf:tipos · cf:build
```

**Las pruebas e2e NO llevan textos escritos a mano**: los sacan de
`messages/es.json` y buscan por rol. Cuatro publicaciones seguidas se cayeron
por eso sin que nadie lo notara.

**Secretos:** nunca en el repositorio. Local en `.dev.vars`, producción en el
panel de YaDominios Cloud. La lista está en `.env.example`.

**Logo:** `public/logo_mercatren/`. Las variantes `-oscuro` van sobre fondo
azul. Azul `#10263A`, naranja `#FF6B1A`.

---

## EL BLINDAJE: lo que no se puede apagar

`npm run verify` corre solo en cada `git push` (husky) y en GitHub. **Tres
cosas prohibidas**, que son justo las tentaciones cuando algo se pone rojo:

1. **Bajar el umbral de cobertura.** Si se pone rojo, falta la prueba del
   código nuevo.
2. **Agregar a `CONOCIDOS` de `scripts/auditoria.ts` sin mirarlo.**
3. **Saltarse un hook con `--no-verify`.** Se arregla el cambio, no se apaga
   el semáforo.

**Cada arreglo deja una prueba, y esa prueba se comprueba EN ROJO**: se vuelve
a meter el fallo a propósito y se confirma que falla. Una prueba que pasa con
el error delante no protege a nadie.

---

## ÍNDICE DEL HISTORIAL

**Antes de tocar una de estas piezas, lee su sección en `HISTORIAL.md`.** Cada
una cuenta un fallo real y el candado que lo tranca.

- [LA SOCIEDAD YA ES MERCATREN LLC (12 ago 2026)](HISTORIAL.md#la-sociedad-ya-es-mercatren-llc-12-ago-2026)
- [LA FIGURA JURÍDICA (regla de cabecera, agosto 2026)](HISTORIAL.md#la-figura-jurídica-regla-de-cabecera-agosto-2026)
- [SI NADIE PUEDE ENTRAR, MIRA SI LLEGAN LAS COOKIES (3 sep 2026)](HISTORIAL.md#si-nadie-puede-entrar-mira-si-llegan-las-cookies-3-sep-2026)
- [ANTES DE AFIRMAR QUE UN PAGO FUNCIONA: `VERIFICAR-PAGOS.md`](HISTORIAL.md#antes-de-afirmar-que-un-pago-funciona-verificar-pagosmd)
- [EL ORDEN DE TRABAJO ESTÁ EN `CRONOGRAMA.md`](HISTORIAL.md#el-orden-de-trabajo-está-en-cronogramamd)
- [LO QUE FALTA SE MIRA EN `PENDIENTES.md`](HISTORIAL.md#lo-que-falta-se-mira-en-pendientesmd)
- [Y el detalle de cada tema, en su plan](HISTORIAL.md#y-el-detalle-de-cada-tema-en-su-plan)
- [Perímetro del proyecto (REGLA CRÍTICA)](HISTORIAL.md#perímetro-del-proyecto-regla-crítica)
- [Cómo está armado](HISTORIAL.md#cómo-está-armado)
- [Reglas propias de este proyecto](HISTORIAL.md#reglas-propias-de-este-proyecto)
- [El trabajador de la aplicación instalable NO guarda nada con sesión](HISTORIAL.md#el-trabajador-de-la-aplicación-instalable-no-guarda-nada-con-sesión)
- [Esto es un servicio para MUCHOS comercios (regla de cabecera)](HISTORIAL.md#esto-es-un-servicio-para-muchos-comercios-regla-de-cabecera)
- [Panel de administración](HISTORIAL.md#panel-de-administración)
- [El comercio se administra solo](HISTORIAL.md#el-comercio-se-administra-solo)
- [Las tiendas nacen ACTIVAS (15 ago 2026)](HISTORIAL.md#las-tiendas-nacen-activas-15-ago-2026)
- [La tienda recién creada le daba 404 a su propio dueño (14 ago 2026)](HISTORIAL.md#la-tienda-recién-creada-le-daba-404-a-su-propio-dueño-14-ago-2026)
- [El comercio piloto](HISTORIAL.md#el-comercio-piloto)
- [Pagos por Zelle](HISTORIAL.md#pagos-por-zelle)
- [Lo que se le cuenta al público](HISTORIAL.md#lo-que-se-le-cuenta-al-público)
- [Catálogo y sincronización](HISTORIAL.md#catálogo-y-sincronización)
- [El catálogo de Estados Unidos (15 ago 2026)](HISTORIAL.md#el-catálogo-de-estados-unidos-15-ago-2026)
- [El carrito y la compra](HISTORIAL.md#el-carrito-y-la-compra)
- [Correos del sistema (Cloudflare Email Service)](HISTORIAL.md#correos-del-sistema-cloudflare-email-service)
- [Por qué Google decía «Windoce, LLC» (14 ago 2026)](HISTORIAL.md#por-qué-google-decía-windoce-llc-14-ago-2026)
- [Lo escrito NO se pierde: borrador en todos los formularios (12 ago 2026)](HISTORIAL.md#lo-escrito-no-se-pierde-borrador-en-todos-los-formularios-12-ago-2026)
- [Los buscadores del panel: uno solo, y dónde van (16 ago 2026)](HISTORIAL.md#los-buscadores-del-panel-uno-solo-y-dónde-van-16-ago-2026)
- [El botón que desbloqueó las ventas de EE. UU. (16 ago 2026)](HISTORIAL.md#el-botón-que-desbloqueó-las-ventas-de-ee-uu-16-ago-2026)
- [El checkout no tenía dónde escribir la dirección (18 ago 2026)](HISTORIAL.md#el-checkout-no-tenía-dónde-escribir-la-dirección-18-ago-2026)
- [EL CIRCUITO DE EE. UU. YA SE PAGA SOLO CON EL SALDO (27 ago 2026)](HISTORIAL.md#el-circuito-de-ee-uu-ya-se-paga-solo-con-el-saldo-27-ago-2026)
- [TRAER EL ALMACÉN COMPLETO DE CJ, DE UN GOLPE (2 sep 2026)](HISTORIAL.md#traer-el-almacén-completo-de-cj-de-un-golpe-2-sep-2026)
- [UNA PRUEBA DEL EQUIPO SE CIERRA, NO SE DESCARTA (4 sep 2026)](HISTORIAL.md#una-prueba-del-equipo-se-cierra-no-se-descarta-4-sep-2026)
- [PROBAR UNA COMPRA A CJ PEGANDO EL ENLACE, SIN PASAR POR STRIPE (5 sep 2026)](HISTORIAL.md#probar-una-compra-a-cj-pegando-el-enlace-sin-pasar-por-stripe-5-sep-2026)
- [LA FICHA DE PRODUCTO SABE PARA QUÉ TIENDA ES Y DE QUÉ PAÍS (5 sep 2026)](HISTORIAL.md#la-ficha-de-producto-sabe-para-qué-tienda-es-y-de-qué-país-5-sep-2026)
- [VENEZUELA SE MUDÓ A SU PROPIO DOMINIO (6 sep 2026, para el lunes 8)](HISTORIAL.md#venezuela-se-mudó-a-su-propio-dominio-6-sep-2026-para-el-lunes-8)
- [LAS FOTOS NUEVAS SE LLAMAN COMO EL PRODUCTO, Y CADA UNA DICE QUÉ SE VE (6 sep 2026)](HISTORIAL.md#las-fotos-nuevas-se-llaman-como-el-producto-y-cada-una-dice-qué-se-ve-6-sep-2026)
- [LOS PUNTOS DE CJ SON EL PRESUPUESTO DEL DÍA, Y EL STOCK SE LLEVABA LA MITAD (4 sep 2026)](HISTORIAL.md#los-puntos-de-cj-son-el-presupuesto-del-día-y-el-stock-se-llevaba-la-mitad-4-sep-2026)
- [EL AFINADO CORRE SOLO, Y «SIN PUNTOS» NO ES UNA AVERÍA (4 sep 2026)](HISTORIAL.md#el-afinado-corre-solo-y-sin-puntos-no-es-una-avería-4-sep-2026)
- [EL VIGILANTE, Y NADA DE CJ A LA VENTA SIN EL ÚLTIMO FILTRO (2 sep 2026)](HISTORIAL.md#el-vigilante-y-nada-de-cj-a-la-venta-sin-el-último-filtro-2-sep-2026)
- [EL RELOJ DE GITHUB NO CORRE CADA 15 MINUTOS: EL SITIO TIENE RELOJ PROPIO (3 sep 2026)](HISTORIAL.md#el-reloj-de-github-no-corre-cada-15-minutos-el-sitio-tiene-reloj-propio-3-sep-2026)
- [EL TABLERO DEL VIGILANTE Y EL HISTORIAL DE FALLOS (3 sep 2026)](HISTORIAL.md#el-tablero-del-vigilante-y-el-historial-de-fallos-3-sep-2026)
- [LAS FOTOS DE LOS COMERCIOS SE TRAEN SOLAS, Y UNA ROTA NO SE ENSEÑA (3 sep 2026)](HISTORIAL.md#las-fotos-de-los-comercios-se-traen-solas-y-una-rota-no-se-enseña-3-sep-2026)
- [EL IVA DEL COMERCIO VA DENTRO DE SU PRECIO, NUNCA COMO RENGLÓN (3 sep 2026)](HISTORIAL.md#el-iva-del-comercio-va-dentro-de-su-precio-nunca-como-renglón-3-sep-2026)
- [LA PRIMERA COMPRA PAGADA MURIÓ POR UN SKU (18 ago 2026)](HISTORIAL.md#la-primera-compra-pagada-murió-por-un-sku-18-ago-2026)
- [LAS DEVOLUCIONES: LA DIRECCIÓN NO SE PUBLICA (18 ago 2026)](HISTORIAL.md#las-devoluciones-la-dirección-no-se-publica-18-ago-2026)
- [EL SITIO FORZABA HTTPS TAMBIÉN EN DESARROLLO (18 ago 2026)](HISTORIAL.md#el-sitio-forzaba-https-también-en-desarrollo-18-ago-2026)
- [LAS VENTAS DE ESTADOS UNIDOS: LA PAUSA SE LEVANTÓ (26 ago 2026)](HISTORIAL.md#las-ventas-de-estados-unidos-la-pausa-se-levantó-26-ago-2026)
- [Los catálogos ya no envejecen solos (15 ago 2026)](HISTORIAL.md#los-catálogos-ya-no-envejecen-solos-15-ago-2026)
- [Seguridad y dinero: lo que se cerró el 12 ago 2026 (bloque 3)](HISTORIAL.md#seguridad-y-dinero-lo-que-se-cerró-el-12-ago-2026-bloque-3)
- [Los formularios: una sola regla por tipo de dato](HISTORIAL.md#los-formularios-una-sola-regla-por-tipo-de-dato)
- [La fortaleza de la contraseña](HISTORIAL.md#la-fortaleza-de-la-contraseña)
- [El correo del registro tiene que poder recibir (14 ago 2026)](HISTORIAL.md#el-correo-del-registro-tiene-que-poder-recibir-14-ago-2026)
- [El login: escudo anti-fuerza bruta](HISTORIAL.md#el-login-escudo-anti-fuerza-bruta)
- [Los datos bancarios NO van en el código (REGLA CRÍTICA)](HISTORIAL.md#los-datos-bancarios-no-van-en-el-código-regla-crítica)
- [El comprobante de pago](HISTORIAL.md#el-comprobante-de-pago)
- [LA AUDITORÍA DEL 21 DE AGOSTO: CINCO COSAS QUE ESTABAN MAL (21 ago 2026)](HISTORIAL.md#la-auditoría-del-21-de-agosto-cinco-cosas-que-estaban-mal-21-ago-2026)
- [COBRAR SIN API, Y REENVIARLE EL ENLACE A QUIEN DE VERDAD PAGA (21 ago 2026)](HISTORIAL.md#cobrar-sin-api-y-reenviarle-el-enlace-a-quien-de-verdad-paga-21-ago-2026)
- [EL FLETE Y EL MANEJO, QUE NO TENÍAN DÓNDE IR (21 ago 2026)](HISTORIAL.md#el-flete-y-el-manejo-que-no-tenían-dónde-ir-21-ago-2026)
- [ENTRANDO COMO UN COMERCIO SE VEÍA EL PANEL DEL SUPERADMIN (21 ago 2026)](HISTORIAL.md#entrando-como-un-comercio-se-veía-el-panel-del-superadmin-21-ago-2026)
- [EL W-8BEN-E ACEPTABA «ESTADOS UNIDOS» COMO PAÍS (21 ago 2026)](HISTORIAL.md#el-w-8ben-e-aceptaba-estados-unidos-como-país-21-ago-2026)
- [ZELLE NO SALÍA EN NINGÚN ENLACE DE COBRO (22 ago 2026)](HISTORIAL.md#zelle-no-salía-en-ningún-enlace-de-cobro-22-ago-2026)
- [POR QUÉ DESDE WHATSAPP NO SALEN LOS BANCOS (22 ago 2026)](HISTORIAL.md#por-qué-desde-whatsapp-no-salen-los-bancos-22-ago-2026)
- [EL PDF QUE SE LE MANDA A LOS BANCOS DECÍA «WINDOCE» 54 VECES (22 ago 2026)](HISTORIAL.md#el-pdf-que-se-le-manda-a-los-bancos-decía-windoce-54-veces-22-ago-2026)
- [LA PÁGINA DE PAGO POR ZELLE, GUIADA — Y EL TUTORIAL DEL W-8BEN-E (22 ago 2026)](HISTORIAL.md#la-página-de-pago-por-zelle-guiada--y-el-tutorial-del-w-8ben-e-22-ago-2026)
- [LA DEMOSTRACIÓN DEL PANEL: UNA TIENDA QUE VENDIÓ $6.000 (22 ago 2026)](HISTORIAL.md#la-demostración-del-panel-una-tienda-que-vendió-6000-22-ago-2026)
- [LA PORTADA POR RONDAS, LA FLECHA QUE VUELVE A LA TIENDA, LOS SIMILARES Y «LO QUE ESTABAS MIRANDO» (23 ago 2026)](HISTORIAL.md#la-portada-por-rondas-la-flecha-que-vuelve-a-la-tienda-los-similares-y-lo-que-estabas-mirando-23-ago-2026)
- [LAS TIENDAS CHICAS DE PRIMERO, CJ «VARIADITO», LA FOTO QUE ROTA Y DÓNDE SE RECLAMA (23 ago 2026)](HISTORIAL.md#las-tiendas-chicas-de-primero-cj-variadito-la-foto-que-rota-y-dónde-se-reclama-23-ago-2026)
- [AGENTES DE IA, METADATOS, BANNERS Y EL BLOG (23 ago 2026)](HISTORIAL.md#agentes-de-ia-metadatos-banners-y-el-blog-23-ago-2026)
- [Ventas a crédito del comercio a su cliente (6 ago 2026)](HISTORIAL.md#ventas-a-crédito-del-comercio-a-su-cliente-6-ago-2026)
- [Borrón y cuenta nueva del histórico (10 ago 2026)](HISTORIAL.md#borrón-y-cuenta-nueva-del-histórico-10-ago-2026)
- [Zelle en los enlaces de cobro, con conciliación estricta (16 ago 2026)](HISTORIAL.md#zelle-en-los-enlaces-de-cobro-con-conciliación-estricta-16-ago-2026)
- [La auditoría del sistema de cobro por enlace (16 ago 2026)](HISTORIAL.md#la-auditoría-del-sistema-de-cobro-por-enlace-16-ago-2026)
- [Cobrar por Mercatren desde el sistema del comercio (10 ago 2026)](HISTORIAL.md#cobrar-por-mercatren-desde-el-sistema-del-comercio-10-ago-2026)
- [Un país = un dominio = un catálogo (17 ago 2026)](HISTORIAL.md#un-país--un-dominio--un-catálogo-17-ago-2026)
- [UN PAÍS SE ABRE CON LA LISTA COMPLETA, NUNCA POR PIEZAS (REGLA — 28 ago 2026)](HISTORIAL.md#un-país-se-abre-con-la-lista-completa-nunca-por-piezas-regla--28-ago-2026)
- [CHILE Y COLOMBIA: EL CÓDIGO COMPLETO EN UN DÍA (27 ago 2026)](HISTORIAL.md#chile-y-colombia-el-código-completo-en-un-día-27-ago-2026)
- [LA PUBLICACIÓN SE CAYÓ POR EL PESO DEL WORKER (17 ago 2026)](HISTORIAL.md#la-publicación-se-cayó-por-el-peso-del-worker-17-ago-2026)
- [Los retiros salen por la API de Mercury (16 ago 2026)](HISTORIAL.md#los-retiros-salen-por-la-api-de-mercury-16-ago-2026)
- [El comercio ya no elige el carril bancario (16 ago 2026)](HISTORIAL.md#el-comercio-ya-no-elige-el-carril-bancario-16-ago-2026)
- [Sacar el dinero desde cualquier país (10 ago 2026)](HISTORIAL.md#sacar-el-dinero-desde-cualquier-país-10-ago-2026)
- [Ver el panel como lo ve un comercio (10 ago 2026)](HISTORIAL.md#ver-el-panel-como-lo-ve-un-comercio-10-ago-2026)
- [Los cuatro huecos que quedaban en los cobros (10 ago 2026 · Fases 2–5)](HISTORIAL.md#los-cuatro-huecos-que-quedaban-en-los-cobros-10-ago-2026--fases-25)
- [Zelle blindado contra la captura falsa (10 ago 2026 · Fase 1 del plan de pagos)](HISTORIAL.md#zelle-blindado-contra-la-captura-falsa-10-ago-2026--fase-1-del-plan-de-pagos)
- [El panel se reordenó por TRABAJO, no por mecanismo (11 ago 2026)](HISTORIAL.md#el-panel-se-reordenó-por-trabajo-no-por-mecanismo-11-ago-2026)
- [El mismo panel, leído por el comercio (11 ago 2026)](HISTORIAL.md#el-mismo-panel-leído-por-el-comercio-11-ago-2026)
- [Cómo se pagó cada venta, y una sola cifra para el comercio (10 ago 2026)](HISTORIAL.md#cómo-se-pagó-cada-venta-y-una-sola-cifra-para-el-comercio-10-ago-2026)
- [Las dos facturas de cada venta (7 ago 2026 · Fase 1 de `PLAN.md`)](HISTORIAL.md#las-dos-facturas-de-cada-venta-7-ago-2026--fase-1-de-planmd)
- [Las preguntas de cada producto (10 ago 2026 · Fase 2 de `PLAN-CONFIANZA.md`)](HISTORIAL.md#las-preguntas-de-cada-producto-10-ago-2026--fase-2-de-plan-confianzamd)
- [EL NÚMERO DE FACTURA NO SE ADIVINA: SALE DE UNA SERIE (26 ago 2026)](HISTORIAL.md#el-número-de-factura-no-se-adivina-sale-de-una-serie-26-ago-2026)
- [COBRAR UNA FACTURA EN VARIAS PARTES (26 ago 2026)](HISTORIAL.md#cobrar-una-factura-en-varias-partes-26-ago-2026)
- [COBRAR NO PUEDE DEPENDER DE CUADRAR PRODUCTOS (26 ago 2026)](HISTORIAL.md#cobrar-no-puede-depender-de-cuadrar-productos-26-ago-2026)
- [EL ENLACE OFRECÍA TARJETA CUANDO EL COMERCIO LA HABÍA QUITADO (26 ago 2026)](HISTORIAL.md#el-enlace-ofrecía-tarjeta-cuando-el-comercio-la-había-quitado-26-ago-2026)
- [DE LA CALCULADORA AL COBRO, SIN CAMBIAR DE PANTALLA (26 ago 2026)](HISTORIAL.md#de-la-calculadora-al-cobro-sin-cambiar-de-pantalla-26-ago-2026)
- [LA FUGA DEL PROCESADOR EN LOS COBROS POR ENLACE (26 ago 2026)](HISTORIAL.md#la-fuga-del-procesador-en-los-cobros-por-enlace-26-ago-2026)
- [TRANSFERENCIA ACH DIRECTA EN EL COBRO POR ENLACE (26 ago 2026)](HISTORIAL.md#transferencia-ach-directa-en-el-cobro-por-enlace-26-ago-2026)
- [CUADRAR UNA FACTURA CON CANTIDADES ENTERAS (26 ago 2026)](HISTORIAL.md#cuadrar-una-factura-con-cantidades-enteras-26-ago-2026)
- [«SHORTS» NO SE TRADUCE, Y LA HILERA SE COLAPSABA (25 ago 2026)](HISTORIAL.md#shorts-no-se-traduce-y-la-hilera-se-colapsaba-25-ago-2026)
- [LOS VIDEOS SE MEZCLAN ENTRE TODOS LOS COMERCIOS (25 ago 2026)](HISTORIAL.md#los-videos-se-mezclan-entre-todos-los-comercios-25-ago-2026)
- [LAS SECCIONES DE VIDEO DE MERCATREN Y EL ENLACE CON PIN (24 ago 2026)](HISTORIAL.md#las-secciones-de-video-de-mercatren-y-el-enlace-con-pin-24-ago-2026)
- [NADIE ESPERA A QUE LO APRUEBEN: EL ALTA ES INMEDIATA (24 ago 2026)](HISTORIAL.md#nadie-espera-a-que-lo-aprueben-el-alta-es-inmediata-24-ago-2026)
- [EL VIDEO SE COMPRIME EN EL NAVEGADOR, COMO LAS FOTOS (24 ago 2026)](HISTORIAL.md#el-video-se-comprime-en-el-navegador-como-las-fotos-24-ago-2026)
- [EL VISOR INMERSIVO EN EL TELÉFONO, LA VENTANA DE PRECARGA Y LAS VISTAS (24 ago 2026)](HISTORIAL.md#el-visor-inmersivo-en-el-teléfono-la-ventana-de-precarga-y-las-vistas-24-ago-2026)
- [EL CORAZÓN QUE NO ANOTABA, EL ESPACIADOR Y EL ALGORITMO DE «LO TUYO PRIMERO» (24 ago 2026)](HISTORIAL.md#el-corazón-que-no-anotaba-el-espaciador-y-el-algoritmo-de-lo-tuyo-primero-24-ago-2026)
- [«AVÍSAME CUANDO ENTRE UN PAGO»: EL WEBHOOK AL SISTEMA DEL COMERCIO (24 ago 2026)](HISTORIAL.md#avísame-cuando-entre-un-pago-el-webhook-al-sistema-del-comercio-24-ago-2026)
- [UN CARRITO NO PUEDE MEZCLAR DESTINOS (24 ago 2026)](HISTORIAL.md#un-carrito-no-puede-mezclar-destinos-24-ago-2026)
- [QUE EL SITIO VUELE: LA CACHÉ DE LA PORTADA Y DE LOS VIDEOS (24 ago 2026)](HISTORIAL.md#que-el-sitio-vuele-la-caché-de-la-portada-y-de-los-videos-24-ago-2026)
- [LOS SHORTS DE MERCATREN: CADA COMERCIO ENSEÑA SU TIENDA EN VIDEO (23 ago 2026)](HISTORIAL.md#los-shorts-de-mercatren-cada-comercio-enseña-su-tienda-en-video-23-ago-2026)
- [DOCS: SE LLAMA «DOCS», SE VE COMO LA DE YADOMINIOS Y CADA GUÍA ES SU PÁGINA (23 ago 2026)](HISTORIAL.md#docs-se-llama-docs-se-ve-como-la-de-yadominios-y-cada-guía-es-su-página-23-ago-2026)
- [El blog y la documentación](HISTORIAL.md#el-blog-y-la-documentación)
- [El blindaje (6 ago 2026)](HISTORIAL.md#el-blindaje-6-ago-2026)
- [Publicar: el push basta, pero hay que MIRAR el run (corregido 7 ago 2026)](HISTORIAL.md#publicar-el-push-basta-pero-hay-que-mirar-el-run-corregido-7-ago-2026)
- [EL CATÁLOGO DE EE. UU. SE PUEDE BUSCAR EN ESPAÑOL (19 ago 2026)](HISTORIAL.md#el-catálogo-de-ee-uu-se-puede-buscar-en-español-19-ago-2026)
- [LAS BICICLETAS ESTABAN EN REPUESTOS DE CARRO (19 ago 2026)](HISTORIAL.md#las-bicicletas-estaban-en-repuestos-de-carro-19-ago-2026)
- [EL PRECIO DE EE. UU. NO LLEVABA EL ENVÍO DENTRO (19 ago 2026)](HISTORIAL.md#el-precio-de-ee-uu-no-llevaba-el-envío-dentro-19-ago-2026)
- [A GOOGLE SE LE MANDABAN 622 PRODUCTOS QUE NO SE PUEDEN ENTREGAR (19 ago 2026)](HISTORIAL.md#a-google-se-le-mandaban-622-productos-que-no-se-pueden-entregar-19-ago-2026)
- [CANCELAR UN COBRO YA CREADO (20 ago 2026)](HISTORIAL.md#cancelar-un-cobro-ya-creado-20-ago-2026)
- [CJ ACEPTA UNA LLAMADA POR SEGUNDO. UNA. (20 ago 2026)](HISTORIAL.md#cj-acepta-una-llamada-por-segundo-una-20-ago-2026)
- [LA MARCA DE UN FALLO NO VA EN EL CAMPO QUE VE EL COMPRADOR (20 ago 2026)](HISTORIAL.md#la-marca-de-un-fallo-no-va-en-el-campo-que-ve-el-comprador-20-ago-2026)
- [EL FORMULARIO FISCAL DEL COMERCIO EXTRANJERO (21 ago 2026)](HISTORIAL.md#el-formulario-fiscal-del-comercio-extranjero-21-ago-2026)
- [EL ASIENTO PARA XERO SE EXPORTA, NO SE INTEGRA (21 ago 2026)](HISTORIAL.md#el-asiento-para-xero-se-exporta-no-se-integra-21-ago-2026)
- [Comandos](HISTORIAL.md#comandos)
- [El perfil del comercio y los envíos (7 ago 2026)](HISTORIAL.md#el-perfil-del-comercio-y-los-envíos-7-ago-2026)
