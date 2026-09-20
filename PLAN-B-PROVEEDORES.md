# Plan B de proveedores: qué tan sólido es CJ y quién más tiene almacén en Estados Unidos

> **Estudio del 20 de septiembre de 2026**, pedido por Richard: «no quiero que lo
> que estoy construyendo sea un castillo de naipes». Todo lo que lleva cifra
> salió de una fuente leída ese día (lista al final). Lo que no se pudo
> comprobar dice **por confirmar**; nada está contestado de memoria.
>
> Regla del sistema que manda en este estudio: **el almacén queda en el país
> donde se vende.** Y un requisito técnico que descarta a muchos: Mercatren no es
> una tienda de Shopify, así que el proveedor tiene que tener **API propia**.

---

## 1. La respuesta corta

1. **CJ es grande de verdad, pero su reputación está inflada** y las quejas que
   se repiten son justo las que nos dolerían: existencias del almacén de EE. UU.
   que resultan falsas, guías de rastreo que no se mueven y pedidos retenidos
   semanas.
2. **Nuestra promesa «2 a 5 días hábiles» es más rápida que la de CJ.** CJ
   promete 2–5 días de _tránsito_ **más** 1–5 días de _preparación_, y aclara que
   la preparación no va incluida. Aunque CJ cumpla a la perfección, nosotros
   incumplimos.
3. **No es un castillo de naipes**: lo construido (catálogo, traducción, títulos,
   fotos, buscador, feed de Google, cobro, facturas) no depende de CJ. Lo que es
   de CJ es traer el catálogo y mandar el pedido: eso se reemplaza o se duplica
   con otro proveedor sin rehacer la tienda.
4. **Plan B con almacén en EE. UU. y API: TopDawg y Wholesale2B**, y **vidaXL**
   para hogar y jardín. Para España y Rumanía, **BigBuy** (Valencia) en vez de CJ.
5. **No cargar más catálogo de CJ hasta medir el pedido de prueba** (desde el
   lunes 21 sep), con la vara de la sección 4.

---

## 2. CJ Dropshipping, con números

| Dato                             | Cifra                                                                                                                                                                                     | Fuente                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| Usuarios registrados             | más de 320.000                                                                                                                                                                            | reseñas del sector, 2026 |
| Pedidos al mes                   | más de 1 millón                                                                                                                                                                           | ídem                     |
| Instalaciones en Shopify         | 71.000 (la 2.ª app de dropshipping más instalada)                                                                                                                                         | ídem                     |
| Tienda de apps de Shopify        | 4,9/5 con 2.858 reseñas; 64 de una estrella (2 %)                                                                                                                                         | apps.shopify.com         |
| Trustpilot                       | **puntuación retirada «por incumplir las normas»; Trustpilot dice haber quitado reseñas falsas**. 13.454 reseñas, 96 % de cinco estrellas, casi todas elogiando a un agente por su nombre | trustpilot.com           |
| SmartCustomer (antes Sitejabber) | **3,2/5** con 86 reseñas: 56 % cinco estrellas, **36 % una estrella**; «actividad sospechosa de reseñas» bajo investigación desde jul 2024                                                | smartcustomer.com        |

**Lectura:** donde las reseñas se piden (Trustpilot, Shopify) sale casi perfecto;
donde no se piden, un tercio es de una estrella. El tamaño es real; la nota no.

### Las quejas que se repiten (reseñas de una estrella, 2026)

- **«Las existencias confirmadas del almacén de EE. UU. resultaron falsas»** —
  tuvo que devolver el dinero y parar su publicidad (may 2026).
- **8 de 10 pedidos sin existencias, guías falsas y envíos de más de 25 días**
  marcados «en tránsito» (ene 2026).
- **Productos retenidos 18 días** sin envío ni respuesta clara (may 2026).
- **Un mes atascado** tras llegar al aeropuerto de destino; respuestas genéricas
  y el comercio reembolsó de su bolsillo (jul 2026).
- Subidas de tarifa de hasta 30 % sin explicación y un agente que tarda una
  semana en responder (sep 2026).
- Disputas por «no es lo descrito» rechazadas en automático; un vendedor con
  43.000 USD de compras esperó 18 días por un solo pedido.

### Lo que CJ promete, con sus palabras

- Preparación: **1–3 días** si el producto está en su almacén, **3–5 días** si no.
- Tránsito desde su almacén de EE. UU.: **2–5 días**.
- **«El tiempo de preparación no está incluido en el tiempo de envío estimado.»**
- Solo una fracción del catálogo está de verdad en EE. UU.: sin filtrar por
  almacén, sale de China (CJPacket, 7–17 días).

**Y un dato nuestro**, medido con un pedido pagado (13 sep): los productos de
EE. UU. que vendemos son `SUPPLIER_SHIPPED_PRODUCT` — los manda **el proveedor
de cada producto**, no un almacén de CJ. La puntualidad depende de cientos de
proveedores distintos; CJ es el intermediario.

---

## 3. Quién más tiene almacén en Estados Unidos y API

| Proveedor                   | Mercancía en EE. UU.                                                               | API para tienda propia                                                            | Costo                                                      | Reputación                                                                                        | Veredicto                                                      |
| --------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **TopDawg**                 | 3.000+ proveedores de EE. UU., 500.000 productos, 2–5 días por USPS/UPS/FedEx      | Sí, **solo en el plan Premier**                                                   | Premier 139,99 USD/mes (anual); hay plan gratis para mirar | Trustpilot 4,6 — **pero solo 22 reseñas**; atienden por teléfono                                  | **Candidato 1.** Muestra chica: hay que probarlo con un pedido |
| **Wholesale2B**             | 100+ proveedores, 1,5 millones de productos                                        | Sí: catálogo, inventario en vivo, pedidos ilimitados, guía de rastreo por webhook | Plan API **99 USD/mes**; se paga con saldo prepago         | Trustpilot 4,2 (438 reseñas; 13 % una estrella: «más caro que eBay», depósitos y comisiones)      | **Candidato 2.** El riesgo es el margen, no la entrega         |
| **vidaXL (DropshippingXL)** | Almacenes propios en Norteamérica y Europa, 150.000 productos, 2–5 días hábiles    | Sí: pedidos, inventario, precios y rastreo, incluida en la suscripción            | Suscripción mensual — **precio por confirmar**             | Un solo fabricante: hogar, jardín, muebles                                                        | **Fuerte para hogar y jardín**, y sirve también para Europa    |
| Spocket                     | Proveedores de EE. UU. y Europa, 2–7 días                                          | Sí, credenciales para tienda propia                                               | Suscripción                                                | Trustpilot 4,2 (10.663); quejas de **cobros tras la prueba gratis y reembolsos que no llegan**    | Posible; ojo con la facturación                                |
| Zendrop                     | Parte del catálogo en EE. UU.                                                      | Sí (API y servidor MCP)                                                           | Suscripción                                                | Trustpilot 4,6 (20.650), pero una reseña cita **«45 días es el estándar para pedidos a EE. UU.»** | **Mismo riesgo que CJ**: mucho sale de China. No es plan B     |
| Doba                        | Proveedores de EE. UU.                                                             | Sí                                                                                | Suscripción                                                | **Trustpilot 2,7** (45 % una estrella; un caso con 3.241 USD sin reembolsar)                      | **Descartado**                                                 |
| **BigBuy** (Europa)         | Almacén propio en Valencia; 180.000 productos; sale en 24–48 h, Europa en 2–5 días | Sí, REST (hace falta su pack de ecommerce — precio por confirmar)                 | —                                                          | El mayorista de dropshipping más grande de Europa                                                 | **Para España y Rumanía, en vez de CJ**                        |

**Por confirmar antes de pagar nada:** si la API de TopDawg deja _crear_ pedidos
(su página dice «API y CSV» sin detalle), el precio de vidaXL y del pack de
BigBuy, y los precios reales de mercancía comparable en cada uno.

**Dropi (Colombia): descartado.** Nunca respondió y su correo corporativo rebota.

---

## 4. La vara para medir a CJ (desde el lunes 21 sep)

Se mide **el pedido de prueba ya pagado**, y después dos más de productos y
proveedores distintos. CJ pasa si **dos de tres** cumplen todo:

| Qué se mide           | Pasa si…                                                   |
| --------------------- | ---------------------------------------------------------- |
| Guía de rastreo       | aparece en 72 h **y se mueve** (no una guía inventada)     |
| Días hasta la entrega | **8 días hábiles o menos** desde el pago                   |
| Lo que llega          | es el producto de la ficha, completo y sin daño            |
| La caja               | sin factura ni precios de CJ, sin propaganda del proveedor |
| Si algo falla         | CJ responde con solución en 3 días hábiles                 |

Se anota cada fecha (pago, salida, entrega) en `VERIFICAR-PAGOS.md`.

---

## 5. Qué se hace, en orden

1. **Congelar la carga de catálogo nuevo de CJ** hasta tener las tres medidas.
   Lo ya publicado se queda.
2. **Medir** con la vara de arriba.
3. **Corregir la promesa del sitio con el dato real.** Hoy dice «2 a 5 días
   hábiles» en cada ficha, en `/entrega` y en la política; lo que CJ promete,
   sumando preparación, es 3 a 10. Se cambia en los tres sitios y en Merchant
   Center a la vez.
4. **Mientras tanto, y gratis** (lo hace Richard: son cuentas a su nombre): abrir
   la cuenta gratuita de TopDawg y la de Wholesale2B para ver catálogo y precios
   reales, y pedir la cuenta B2B de vidaXL. **No pagar ningún plan de API
   todavía.**
5. **Si CJ no pasa:** se contrata el plan con API del candidato que mejor precio
   dio y se escribe su adaptador (traer catálogo + crear pedido + leer guía). La
   tienda no se toca.
6. **España y Rumanía:** cuando se abran, con BigBuy; no con CJ.

---

## 6. Por qué no es un castillo de naipes

Lo que hay en `src/lib/cj/` es lo único atado a CJ: leer su catálogo, cotizar su
flete, crear y pagar el pedido. Todo lo demás —las tablas de productos y
tiendas, la traducción y los títulos, las fotos, el buscador, los conteos, el
feed de Google, el cobro, las facturas, las devoluciones— trabaja sobre
«productos de una tienda en un país», sin saber de qué proveedor salieron.
Cambiar o sumar un proveedor es escribir una pieza nueva al lado de `cj/`, no
rehacer la tienda.

**Lo que sí se perdería** si CJ saliera del todo: las fichas de productos que
solo tiene CJ, con su traducción y sus fotos. Por eso el orden es medir primero.

---

## Fuentes (leídas el 20 sep 2026)

- https://www.trustpilot.com/review/cjdropshipping.com
- https://www.smartcustomer.com/reviews/cjdropshipping.com
- https://apps.shopify.com/cucheng/reviews?ratings%5B%5D=1
- https://blog.cjdropshipping.com/detail/1317027229632208897
- https://blog.cjdropshipping.com/detail/Unlock-3-Day-Delivery-with-CJ-s-New-US-Warehouses
- https://www.dailyfulfill.com/cj-dropshipping-shipping-times-promise-vs-reality-2026/
- https://revenuegeeks.com/software/cjdropshipping
- https://topdawg.com/
- https://www.trustpilot.com/review/topdawg.com
- https://www.wholesale2b.com/dropship-api-plan.html
- https://www.wholesale2b.com/best-dropship-api-services.html
- https://www.trustpilot.com/review/wholesale2b.com
- https://www.trustpilot.com/review/zendrop.com
- https://support.zendrop.com/en/articles/14461568-zendrop-mcp-developer-documentation
- https://www.trustpilot.com/review/spocket.co
- https://www.trustpilot.com/review/doba.com
- https://www.woosa.com/blog/vidaxl-dropshipping/
- https://www.bigbuy.eu/en/shipment-and-delivery.html
- https://www.bigbuy.eu/en/technology-dropshipping-wholesale-purchasing.html
