# Plan: una sola Mercatren, con la app al centro, para vender en muchos países

> Pedido por Richard el 5 nov 2026: menos gasto, un sistema de dropshipping que
> funcione, una sola tienda y una app en vez de un dominio por país, y cómo
> ganar dinero con eso. Lo que lleva cifra salió de una fuente leída ese día
> (lista al final) o de la base de Mercatren. Lo que es propuesta nuestra lo
> dice.

## 1. Mi opinión, en corto

**Tienes razón.** Los grandes no abren un sitio por país: tienen **una marca,
una app y una cuenta**, y lo que cambia es **el país de la persona**. De ahí
salen la moneda, el idioma, lo que se le puede enviar y cómo paga. 180 países
con 180 dominios serían 180 sitios que mantener, probar y pagar. Con una sola
Mercatren, encender un país nuevo es encender una fila en una lista, después
de probar su cobro, sus impuestos y su proveedor.

Los dominios que ya existen (.cl, .com.co, .com.ve) se quedan como están. No
estorban y casi no consumen.

## 2. Cómo lo hacen los grandes (comprobado el 5 nov 2026)

| Empresa        | Qué vimos                                                                                                                                                                                                                                                                             | Qué aprendemos                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Temu**       | Un solo dominio, `temu.com`. Al entrar pone dos cookies: `region` (el país) y `currency` (la moneda). Los países van como ruta dentro del mismo sitio (`/mx`, `/es`). Además abrió vendedores locales que tienen su inventario y despachan ellos mismos.                              | **El país es un dato de la persona, no un dominio.** Y vendedores locales que despachan desde su país.      |
| **AliExpress** | Una sola marca, con un subdominio por idioma (`es.aliexpress.com`). Su crecimiento viene de **almacenes locales**: en Europa ya despacha más desde almacenes locales que desde China, en unos 27 a 30 países.                                                                         | **La entrega rápida sale de tener el producto en el país.** No de un dominio por país.                      |
| **Etsy**       | Un solo `etsy.com`, con vendedores de muchos países que crean su tienda. Cobra por publicar (0,20 dólares cada 4 meses), un 6,5 % de cada venta, el procesamiento del pago (3 % más 0,25 dólares en EE. UU.), anuncios fuera de Etsy (12 a 15 %) y un plan Plus de 10 dólares al mes. | **Es nuestro modelo:** la gente crea su tienda y la plataforma gana en cada venta, en anuncios y en planes. |
| **Shein**      | Una marca, pero con un subdominio por país (`us.shein.com`).                                                                                                                                                                                                                          | El contraejemplo: hasta ellos centralizan la marca y la app; el subdominio es un detalle.                   |

**El cobro en la moneda de cada país ya existe en Stripe:** con su «precio
adaptativo», el comprador paga en su moneda en más de 150 países. Al comercio
no le cuesta nada y el comprador paga entre un 2 y un 4 % por el cambio. Ojo
técnico: no funciona con la forma de cobro que usamos hoy (el formulario propio
con intentos de pago). Habría que pasar al pago alojado de Stripe, o seguir
convirtiendo nosotros, como ya hacemos con el peso chileno, el colombiano y el
euro.

## 3. Cómo no volver a las facturas altas

Lo que de verdad gastaba, medido en Mercatren:

- **La base de datos:** en septiembre llegó a 134 mil millones de filas
  leídas en un mes, con 109 dólares de sobrecosto y camino a 775 al mes. La
  causa fueron los robots (unas 310.000 visitas al día) y conteos rehechos en
  cada visita.
- **La IA de Google:** unos 280 dólares al mes, sin ventas detrás.
- **Las fotos del proveedor:** 48 GB guardados de 56.000 productos que casi
  no se vendían.
- **El reloj de cada minuto,** que recorría el catálogo entero contra el
  proveedor.

Las reglas para que no vuelva (propuesta nuestra, casi todo ya está puesto):

1. **Catálogo pequeño y vendible:** solo lo que se puede entregar y deja
   margen. Nada de traer 50.000 productos de golpe. _Puesto: importación masiva
   cerrada en el código._
2. **Nada se cuenta por visita:** los conteos y listados se calculan una vez y
   se guardan. _Puesto._
3. **Robots con freno:** hoy cerrados. Se abren solo para páginas que venden,
   con caché en el borde y sin dejarles recorrer búsquedas. _Puesto el cierre;
   la apertura, cuando haya catálogo._
4. **IA con tope diario y apagada por defecto.** Se enciende solo para lo que
   cobra. _Puesto._
5. **Nada que corra cada minuto:** se trabaja con avisos (cuando pasa algo) y
   tareas cortas, no recorriendo todo una y otra vez. _Puesto._
6. **Fotos solo de lo que está a la venta,** comprimidas. _Puesto para lo nuevo._
7. **Una alarma de consumo cada hora:** filas leídas y escritas de la base y
   tamaño del almacén, con tres niveles: verde, aviso y emergencia. En
   emergencia, la tienda se cierra con una sola línea (el cierre por código ya
   existe). _Por hacer: lo hace el gerente que ya revisa cada hora._
8. **Un tope de gasto escrito por mes** y proveedores prepago, para que nada
   cobre sorpresas.

**La app ayuda:** guarda en el teléfono lo ya visto, no la recorren robots y
pide solo lo que la persona mira.

## 4. Cómo queda una sola Mercatren

- **Un solo sitio, mercatren.com, y una app** para iPhone y Android, con la
  misma cuenta.
- **Al registrarse, la persona elige su país.** De ahí salen la moneda, el
  idioma, qué se le puede enviar, cómo paga y, si vende, cómo cobra y qué
  formulario de impuestos llena (el de comercios fuera de EE. UU. ya existe).
- **El precio se guarda en dólares** y se muestra y cobra en la moneda de la
  persona.
- **Cada país tiene su catálogo:** lo que hay en su país (vendedores locales y
  el proveedor de esa región), para que llegue rápido.
- **Una lista de «países encendidos».** Un país se enciende solo cuando están
  probados su cobro con una compra real, sus impuestos y su proveedor. Es la
  lista de abrir un país que ya tenemos, pero dentro de la app y sin dominio.

**El riesgo grande no es técnico, es de impuestos.** Mercatren LLC compra y
revende por cuenta propia, así que en cada país donde venda puede tener
obligaciones: el IVA de Europa, el del Reino Unido, el de Chile (ya inscritos
desde agosto). Por eso los países se encienden de uno en uno, con el contador,
y no todos a la vez.

## 5. La app: lo que tiene que tener

Apple ya rechazó la app de hoy porque es el sitio dentro de una ventana.
Tiene que ser una app de verdad:

1. Registro con país y moneda.
2. **Crear la tienda y subir productos con la cámara del teléfono.**
3. Catálogo, búsqueda y la ficha del producto.
4. Carrito y pago con tarjeta. Los productos físicos no pagan comisión a
   Apple ni a Google.
5. Pedidos, seguimiento y **avisos al teléfono** (venta nueva, pedido en
   camino). La llave de avisos de Apple ya está guardada.
6. Después: mensajes entre comprador y vendedor, y videos cortos de las
   tiendas (ya existen en la web).

**Una sola base de código para iPhone y Android** (propuesta nuestra), que
hable con el mismo servidor de hoy. Se prueba con usuarios reales en TestFlight
antes de enviarla, porque Apple lo pregunta.

## 6. El dropshipping

Ya está estudiado (`PLAN-B-PROVEEDORES.md`). CJ no pasó la prueba: 38 días de
la compra a la puerta. Lo que toca:

- **Estados Unidos:** probar primero **TopDawg** (todos sus proveedores en EE.
  UU., con una API para el catálogo, los pedidos y las guías), con
  **Wholesale2B** de respaldo. Y lo que más se venda, con inventario propio en
  el servicio de despacho de Amazon (3 días hábiles).
- **España:** BigBuy, con su reputación vigilada.
- **La regla:** tres compras reales antes de vender, un catálogo corto (de
  200 a 500 productos con margen comprobado) y el almacén en el país donde se
  vende.

## 7. Cómo ganar dinero

Cinco fuentes, de la más rápida a la más grande (los precios los decides tú):

| Fuente                       | Cómo funciona                                                                                | Referencia del mercado                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Margen en cada venta**     | Va dentro del precio (hoy 3 % con tarjeta y 6 % con Zelle). Con el tiempo, subir por tramos. | Etsy se queda con un 9,5 a 11 % efectivo                     |
| **Catálogo propio**          | Productos del proveedor de dropshipping, con margen de 25 a 30 %.                            | Ya está así para EE. UU. (30 %)                              |
| **Plan Pro para vendedores** | Mensual: más productos, tienda destacada, estadísticas, su propio dominio.                   | Etsy Plus, 10 dólares al mes                                 |
| **Productos promocionados**  | El vendedor paga para salir primero en la app y en los videos.                               | Los anuncios de Etsy cuestan 12 a 15 % de la venta atribuida |
| **Servicios**                | Casillero en Miami, cobro por enlace y envíos.                                               | Ya construidos                                               |

**Lo que más rinde a largo plazo son los promocionados y el plan Pro:** no
dependen de un proveedor ni de un envío.

## 8. El plan por fases

Cada fase es una meta que encarga Gerencia, con su prueba de «terminado».

| Fase                       | Qué se hace                                                                                             | Terminado cuando                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **0 · Esta semana**        | Sitio en vivo sin la pausa de la plataforma, Google Play reenviado, alarma de consumo cada hora.        | Privacidad y portada dan 200, y Google Play aprobó la app |
| **1 · Una sola Mercatren** | País y moneda al registrarse, la lista de países encendidos (EE. UU. primero), el catálogo por país.    | Una compra real con tarjeta en EE. UU., de punta a punta  |
| **2 · Proveedor**          | TopDawg conectado y tres compras de prueba que lleguen bien. Catálogo corto con margen comprobado.      | Tres paquetes entregados en el plazo prometido            |
| **3 · La app de verdad**   | Crear tienda, subir productos con la cámara, comprar, pedidos y avisos. TestFlight con usuarios reales. | Apple y Google la aprueban                                |
| **4 · Ganar más**          | Plan Pro y productos promocionados.                                                                     | Primer cobro de un plan y de un promocionado              |
| **5 · Más países**         | Uno por uno, con su cobro, sus impuestos y su proveedor probados. El orden lo deciden los datos.        | Cada país, con su compra real                             |

## 9. Las decisiones, tomadas (5 nov 2026)

Richard aprobó el plan entero y encargó (por Gerencia) que estas decisiones
se tomen «como lo hace el mercado» y queden escritas. Se pueden cambiar con
una línea; nada de esto cobra dinero real sin su sí.

1. **El modelo: una sola Mercatren con la app al centro.** Aprobado por
   Richard el 5 nov 2026.
2. **El primer proveedor: TopDawg**, con tres compras de prueba antes de
   vender. Las compras se le pasan a Gerencia antes de hacerlas. Hace falta
   la cuenta de TopDawg y su llave de la API, que solo puede abrir Richard.
3. **El plan Pro para vendedores: 9,99 dólares al mes**, con el primer mes
   gratis. La referencia es Etsy Plus, a 10 dólares; quedarse un centavo
   debajo es lo que hace el mercado. Incluye más productos publicados, la
   tienda destacada en su categoría y estadísticas.
4. **Los productos promocionados: pago por clic, con presupuesto diario.**
   Es como funcionan los anuncios de Etsy y de Amazon. Para empezar, 0,15
   dólares por clic y un presupuesto diario que pone el vendedor, de 1 a 50
   dólares. Nunca se cobra más que ese presupuesto.
5. **El país después de Estados Unidos: Venezuela.** Es el único con
   comercios vendiendo de verdad (11 pedidos) y cobra en dólares por Zelle,
   que ya está probado. **Después, España:** el euro ya está construido y
   BigBuy es el candidato a proveedor, pero falta una compra real en euros y
   el consejo del contador sobre el IVA. Chile y Colombia quedan congelados
   hasta tener comercios propios.

## 10. De la ventana a la app nativa, en una página

> Pedido por Gerencia el 5 nov 2026, antes de programar. Richard aprobó el
> plan entero y su prioridad es la app nativa. **Nada se sube a Apple hasta que
> Apple apruebe Divoox.**

**Hoy:** la app de iPhone (SwiftUI) y la de Android (una ventana de Chrome
de pantalla completa) muestran el sitio por dentro. Por eso Apple la rechazó.

**Mañana:** una app de verdad hecha con **Expo y React Native**, la misma base
que usa Divoox, con **un solo código para iPhone y Android**. Mantiene los
mismos identificadores (`com.mercatren.app`) y la misma llave de firma de
Android, así que las fichas de las tiendas siguen siendo las mismas.

### Qué se rehace (todo lo que ve la persona)

Las pantallas, en este orden:

1. **Bienvenida:** elegir país e idioma (el selector estilo Amazon). De ahí
   sale la moneda.
2. **Entrar y crear cuenta**, con el ojito en la contraseña y el borrador que
   no se pierde.
3. **Inicio:** las tiendas y los productos del país.
4. **Búsqueda.**
5. **Ficha del producto.**
6. **Carrito.**
7. **Pago** con la hoja de pago de Stripe para el teléfono (tarjeta, Apple Pay
   y Google Pay). Lo físico no paga comisión a Apple ni a Google.
8. **Mis pedidos** y su seguimiento.
9. **Crear mi tienda.**
10. **Subir un producto con la cámara** (fotos comprimidas en el teléfono).
11. **Mis ventas:** los pedidos de mi tienda.
12. **Avisos al teléfono:** venta nueva, pago recibido, pedido en camino.
13. **Mi cuenta:** datos, idioma, legales y borrar la cuenta.

Después, en otra meta: los videos cortos, los mensajes entre comprador y
vendedor, y el casillero.

### Qué se reutiliza del servidor (sin rehacer)

La base de datos, las cuentas (Better Auth tiene complemento oficial para
Expo), el cobro con Stripe del lado del servidor, los precios y las monedas,
las subidas al cubo, los correos, las páginas legales y el panel del equipo,
que sigue en la web. **El servidor de hoy es el mismo.**

### Qué se agrega al servidor

- **Una puerta de datos para la app**, en `/datos/app/v1` (nunca `/api`):
  catálogo, ficha, carrito, pedido, tienda, productos y subida de fotos. La
  web usa acciones del servidor que una app no puede llamar.
- **Una tabla de avisos:** el número de cada teléfono para mandarle avisos.
- **El envío de avisos:** la llave de avisos de Apple ya está guardada. Para
  Android hace falta un proyecto de Firebase (gratis). Si no existe uno que
  sirva, lo crea Richard: es la única pieza que depende de él.

### Cuánto cuesta Expo

- **Plan gratis:** según una guía de terceros, 15 compilaciones de Android y
  15 de iPhone al mes. Alcanza para empezar.
- **Starter:** 19 dólares al mes, con 45 dólares de crédito para compilar.
- **Production:** 199 dólares al mes, con 225 de crédito.
- Si Divoox ya paga un plan en la misma cuenta de Expo, Mercatren lo comparte.
  Se confirma en la página de precios de Expo el día de contratar. La decisión
  de pagar es de Richard.

### Cómo se trabaja

1. Primero la puerta de datos del servidor, con sus pruebas.
2. Después las pantallas, en el orden de arriba, probadas en el simulador.
3. TestFlight y la prueba interna de Google con usuarios reales, anotando lo
   que digan: Apple lo pregunta.
4. Solo cuando Gerencia lo diga, y después de que Apple apruebe Divoox, se
   envía a las tiendas, con el auditor de tiendas antes.

## Fuentes (leídas el 5 nov 2026)

- Temu y AliExpress: lectura directa de `temu.com` (cookies `region` y
  `currency`, rutas `/mx` y `/es`) y de `es.aliexpress.com`, desde esta
  máquina, el 5 nov 2026. Shein: `shein.com` redirige a `us.shein.com`.
- Etsy, tarifas 2026 (guías de terceros; confirmar en etsy.com antes de usar
  cifras exactas): https://checkoutpage.com/blog/etsy-fees ·
  https://app.craftybase.com/blog/the-complete-guide-to-etsy-fees ·
  https://www.growingyourcraft.com/blog/how-much-does-it-really-cost-to-sell-on-etsy
- Temu, vendedores locales (guías de terceros, cifras orientativas):
  https://www.ecomcrew.com/temu-opens-its-doors-to-european-local-sellers/ ·
  https://shopappy.com/ecommerce/temu/temu-local-vs-fully-managed
- AliExpress, almacenes locales:
  https://www.ecomcrew.com/aliexpress-turned-profitable-and-it-didnt-need-sales-growth-to-do-it/ ·
  https://www.retaildetail.eu/?p=33456 ·
  https://www.yicaiglobal.com/news/chinese-exporters-to-focus-on-localization-branding-ai-as-small-parcels-era-ends-insiders-say
- Stripe, precio adaptativo: https://docs.stripe.com/payments/checkout/adaptive-pricing
- Expo, precios: https://expo.dev/pricing · https://docs.expo.dev/billing/plans/ ·
  https://toolradar.com/tools/expo/pricing (tercero, para el plan gratis)
- Better Auth con Expo: https://better-auth.com/docs/integrations/expo
- Mercatren: `HISTORIAL.md` (emergencia de la base del 17 sep),
  `AUDITORIA-GASTOS.md` (IA de Google) y `PLAN-B-PROVEEDORES.md`.
