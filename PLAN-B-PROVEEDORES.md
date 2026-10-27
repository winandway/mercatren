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

## 0. El veredicto, en una línea

> **Actualizado el 13 oct 2026:** CJ **no pasó** la vara (sección 4) y los
> paquetes de prueba tardaron **38 días** del pago a la puerta (sección 4, «La
> llegada»). Quién lo reemplaza: secciones 7 y 8. Lo de abajo es el veredicto
> del 20 sep, cuando todavía no había nada medido.

**Seguimos con CJ, pero a prueba: hoy no se cambia y tampoco se le invierte más
hasta medir tres compras reales.** Si dos de tres llegan bien, seguimos; si no,
se conecta TopDawg o Wholesale2B. La versión para leer (6 páginas, con la
comparación y los pros y contras) está en PDF, fuera del repositorio:
`~/Mercatren-privado/estudio-proveedores/MT-Estudio-CJ-y-plan-B.pdf`.

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

| Proveedor                       | Mercancía en EE. UU.                                                               | API para tienda propia                                                            | Costo                                                      | Reputación                                                                                                  | Veredicto                                                      |
| ------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **CJ Dropshipping** (el de hoy) | Solo una parte del catálogo, y la manda el proveedor de cada producto              | Sí, completa y **ya conectada**                                                   | **0 USD/mes**                                              | Trustpilot le retiró la puntuación por reseñas falsas; 3,2/5 donde no se piden. Promete 3 a 10 días hábiles | **Seguir, a prueba**                                           |
| **TopDawg**                     | 3.000+ proveedores de EE. UU., 500.000 productos, 2–5 días por USPS/UPS/FedEx      | Sí, **solo en el plan Premier**                                                   | Premier 139,99 USD/mes (anual); hay plan gratis para mirar | Trustpilot 4,6 — **pero solo 22 reseñas**; atienden por teléfono                                            | **Candidato 1.** Muestra chica: hay que probarlo con un pedido |
| **Wholesale2B**                 | 100+ proveedores, 1,5 millones de productos                                        | Sí: catálogo, inventario en vivo, pedidos ilimitados, guía de rastreo por webhook | Plan API **99 USD/mes**; se paga con saldo prepago         | Trustpilot 4,2 (438 reseñas; 13 % una estrella: «más caro que eBay», depósitos y comisiones)                | **Candidato 2.** El riesgo es el margen, no la entrega         |
| **vidaXL (DropshippingXL)**     | Almacenes propios en Norteamérica y Europa, 150.000 productos, 2–5 días hábiles    | Sí: pedidos, inventario, precios y rastreo, incluida en la suscripción            | Suscripción mensual — **precio por confirmar**             | Un solo fabricante: hogar, jardín, muebles                                                                  | **Fuerte para hogar y jardín**, y sirve también para Europa    |
| Spocket                         | Proveedores de EE. UU. y Europa, 2–7 días                                          | Sí, credenciales para tienda propia                                               | Suscripción                                                | Trustpilot 4,2 (10.663); quejas de **cobros tras la prueba gratis y reembolsos que no llegan**              | Posible; ojo con la facturación                                |
| Zendrop                         | Parte del catálogo en EE. UU.                                                      | Sí (API y servidor MCP)                                                           | Suscripción                                                | Trustpilot 4,6 (20.650), pero una reseña cita **«45 días es el estándar para pedidos a EE. UU.»**           | **Mismo riesgo que CJ**: mucho sale de China. No es plan B     |
| Doba                            | Proveedores de EE. UU.                                                             | Sí                                                                                | Suscripción                                                | **Trustpilot 2,7** (45 % una estrella; un caso con 3.241 USD sin reembolsar)                                | **Descartado**                                                 |
| **BigBuy** (Europa)             | Almacén propio en Valencia; 180.000 productos; sale en 24–48 h, Europa en 2–5 días | Sí, REST (hace falta su pack de ecommerce — precio por confirmar)                 | —                                                          | El mayorista de dropshipping más grande de Europa                                                           | **Para España y Rumanía, en vez de CJ**                        |

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

### El resultado de la vara: CJ NO PASA (medido el 1 oct 2026)

Dos pedidos medidos, los dos pagados el **5 sep**, el mismo cargador USB-C
(`vid 2069951802154856450`), los dos «SpeedX US to US #2»:

| Qué se mide       | La vara                  | Lo medido                                                                                             | ¿Pasa? |
| ----------------- | ------------------------ | ----------------------------------------------------------------------------------------------------- | ------ |
| Guía de rastreo   | en 72 h y que se mueva   | creada el **17 sep** (12 días); primer escaneo del transportista el **30 sep** (25 días)              | NO     |
| Días a la entrega | 8 días hábiles o menos   | **sin entregar el 1 oct**: 18 días hábiles y contando                                                 | NO     |
| Si algo falla     | respuesta en 3 días háb. | el correo a soporte **rebotó** (16 sep); contestaron el **25 sep**, 7 días hábiles, sin dar las guías | NO     |

Rastreo de la de las 20:56 (`YWE00001552040292`), visto por Richard el 1 oct:
«orden de envío creada» 17 sep → «recibido en ONT01» (Ontario, CA) 30 sep →
«salió de las instalaciones» 1 oct. La de las 18:41 (`YWE00001552040285`) iba
igual.

**Dos de tres tenían que cumplir todo. Con dos ya reprobados, ninguna tercera
medida lo cambia: CJ no pasa.** Y lo lento no es solo el transportista: entre
el pago y la etiqueta pasaron doce días, antes de que el paquete existiera para
nadie.

**Lo que esto deja en rojo, hoy:** cada ficha de EE. UU., la página de entrega
y la política prometen **«2 a 5 días hábiles»**. Lo medido es un mes. Toda venta
de catálogo de CJ que entre ahora es una queja o un contracargo en camino, y
Merchant Center lo cruza con las entregas reales.

### La llegada: 38 días del pago a la puerta (13 oct 2026)

Los dos paquetes llegaron **juntos** a Novi (Michigan) el **martes 13 oct, a
las 7:30 pm**. Los dos son el mismo cargador USB-C de pared de 24 W, pesan
0,16 kg y traen etiqueta de **Yanwen Express** (las guías empiezan por `YWE`)
con remitente un almacén de **Ontario, California**, rotulado «Delta Deliver
Direct». En CJ el transporte figura como «SpeedX US to US #2».

| Tramo                     | Desde         | Hasta          | Días naturales | Días hábiles | Quién lo tenía                                      |
| ------------------------- | ------------- | -------------- | -------------- | ------------ | --------------------------------------------------- |
| Pago → etiqueta           | sáb 5 sep     | jue 17 sep     | 12             | 8            | CJ y su almacén: el envío ni existía                |
| Etiqueta → primer escaneo | jue 17 sep    | mié 30 sep     | 13             | 9            | entre el almacén y el transportista: no se movió    |
| Primer escaneo → entrega  | mié 30 sep    | mar 13 oct     | 13             | 8            | Yanwen y su red de reparto                          |
| **Total**                 | **sáb 5 sep** | **mar 13 oct** | **38**         | **25**       | la vara pedía **8 hábiles o menos**: tres veces más |

Los días hábiles descuentan sábados, domingos, el Día del Trabajo (7 sep) y el
Día de la Raza (12 oct).

**El rastreo completo** de `YWE00001552040292` (hora local; el otro iba igual),
copiado por Richard de 17track el 13 oct:

| Fecha y hora   | Dónde                             | Qué dice                          |
| -------------- | --------------------------------- | --------------------------------- |
| 17 sep · 22:57 | CA 90640 (Montebello)             | orden de envío creada             |
| 30 sep · 18:38 | CA 91752 (Eastvale, «ONT01»)      | recibido                          |
| 30 sep · 19:00 | CA 90640                          | salió de la instalación           |
| 1 oct · 01:36  | CA 90640                          | recibido en instalación de paso   |
| 1 oct · 01:38  | CA 90640                          | salió de la instalación           |
| 2 oct · 15:55  | IL 60131 (Franklin Park, Chicago) | recibido en instalación de paso   |
| 2 oct · 19:43  | IL 60131                          | salió de la instalación           |
| 3 oct · 05:53  | IL                                | procesando en instalación de paso |
| 3 oct · 19:52  | IL                                | en camino a la siguiente          |
| 8 oct · 23:07  | IL 60005 (Arlington Heights)      | en tránsito, salida               |
| 13 oct · 10:37 | MI                                | en reparto                        |
| 13 oct · 19:30 | Novi, MI                          | entregado                         |

**Lo que se lee en el rastreo:**

1. **Dos tercios del tiempo (25 de 38 días) pasaron antes de que ningún
   transportista tuviera el paquete.** Doce días para crear la etiqueta y trece
   más para que alguien la escaneara. Eso no es el camión: es el almacén.
2. **El camión no fue lo lento, fueron las paradas.** De California a Chicago
   tardó dos días. Después se quedó **cinco días en Illinois** (3 al 8 oct) y
   otros **cinco para llegar a Michigan**, que está al lado. Y dio vueltas:
   Montebello, Eastvale, otra vez Montebello, Chicago, Arlington Heights.
3. **El transporte lo eligió nuestro código, y eligió el más barato.** Tanto
   la compra de prueba (`masBarato` en `src/lib/cj/probar-compra-nucleo.ts`)
   como las ventas reales (`transporteReal` en `src/lib/cj/pedidos.ts`) ordenan
   las opciones de CJ por precio y se quedan con la primera. Con un paquete de
   0,16 kg, la más barata es una red de consolidación, no USPS ni UPS. **Esa
   parte de la culpa es nuestra y se puede cambiar.**
4. **La caja (que no traiga factura, precios ni propaganda, y que sea el
   producto de la ficha) queda por revisar**: Richard la abre y se anota aquí.

**Por qué un paquete de dentro de EE. UU. tardó más que uno de China:** lo
estudia la sección 8, separando la parte del almacén, la del proveedor y la
del transporte.

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

---

## 7. El estudio del 7 oct 2026: quién reemplaza a CJ

> Pedido por Richard el 7 oct, con el paquete de prueba en Illinois a los 32
> días: «busquemos una empresa que sea seria… que antes de agregarla miremos que
> sí funciona en Estados Unidos, por las reseñas». Investigado con fuentes leídas
> ese mismo día (lista completa al final de esta sección).

### El veredicto

**Ningún proveedor de catálogo general pasa la vara con evidencia
independiente.** Las promesas de varios encajan; los datos medidos por
vendedores reales no existen o no se pudieron leer (Reddit bloquea las lecturas
automáticas y quedó sin verificar para todos).

- **Probar primero: TopDawg.** Es el único generalista cuyos proveedores están
  todos en EE. UU. y cuya API cubre las tres piezas que hacen falta: catálogo
  con stock y precio, crear pedidos y leer guías. **La API no se paga hasta que
  pase la prueba.**
- **Respaldo: Wholesale2B**, usando solo sus proveedores de EE. UU.
- **Vía de fondo para electrónica:** un distribuidor con almacén propio (Petra
  Industries o D&H). Piden cuenta de revendedor y el margen está sin verificar.

**El riesgo que hay que tener presente:** TopDawg y Wholesale2B **no tienen
almacén propio**. Son redes de proveedores de terceros y cada uno despacha lo
suyo: el mismo modelo que falló con CJ, donde los productos los mandaba el
proveedor de cada ficha. La diferencia es que en TopDawg todos están en EE. UU.
Por eso la prueba de tres pedidos va antes de pagar nada.

### Resumen por candidato

| Candidato                                             | Veredicto                    | Despacha desde                            | API para sitio propio                        | Costo con API                                  | Reputación                                 |
| ----------------------------------------------------- | ---------------------------- | ----------------------------------------- | -------------------------------------------- | ---------------------------------------------- | ------------------------------------------ |
| **TopDawg**                                           | DUDOSO, el mejor para probar | Red de 3.000+ proveedores de EE. UU.      | Sí, solo en el plan Premier                  | $199,99/mes o $1.679,88/año + $0,75 por pedido | Trustpilot 4,6 (23) · BBB A+               |
| **Wholesale2B**                                       | DUDOSO                       | EE. UU., Canadá, Reino Unido y AliExpress | Sí, con webhook de guías                     | $99,99/mes o $899,91/año                       | Trustpilot 4,0 (441; 13 % de una estrella) |
| vidaXL                                                | FALLA                        | Stock en EE. UU.                          | Sí                                           | €30/mes (dato de 2023)                         | vidaXL.us 2,2 (906) · caja con su marca    |
| BigBuy                                                | FALLA para EE. UU.           | España                                    | Sí                                           | €69–99/mes + €90 de alta                       | Sirve para España y Rumanía                |
| Spocket                                               | FALLA                        | EE. UU. y Europa                          | No verificada                                | $39,99–299,99/mes                              | 4,2 (10.664), quejas de cobros             |
| Syncee                                                | FALLA                        | Marketplace                               | No para revendedores                         | $39,99–99,99/mes                               | 4,3 (625)                                  |
| Doba                                                  | FALLA                        | EE. UU.                                   | Solo por integradores                        | No verificado                                  | 2,9 (95; 44 % de una estrella)             |
| Inventory Source                                      | FALLA (es software)          | Conecta distribuidores                    | Si se pide                                   | $299/mes mínimo                                | 1,7 (128)                                  |
| SaleHoo                                               | FALLA (directorio)           | —                                         | —                                            | $9–499/mes                                     | —                                          |
| Modalyst                                              | FALLA                        | —                                         | Solo Shopify/Wix/BigCommerce (no verificado) | —                                              | —                                          |
| AliExpress EE. UU.                                    | DUDOSO, tirando a FALLA      | Vendedores locales sueltos                | Con aprobación                               | Gratis                                         | Sin datos de cumplimiento                  |
| Zendrop                                               | FALLA                        | Almacén solo con tu propio inventario     | No crea pedidos                              | $49–79/mes                                     | 4,6 (20.662)                               |
| Printful                                              | **PASA, solo estampados**    | Plantas propias en NC y TX                | Sí, completa y gratis                        | Sin cuota                                      | 4,2 (7.920)                                |
| Printify                                              | DUDOSO, solo estampados      | Red de imprentas                          | Sí                                           | —                                              | 4,5 (7.668)                                |
| Faire                                                 | FALLA                        | No hace dropshipping                      | —                                            | —                                              | —                                          |
| D&H, Petra, CWR, FragranceX, HomeRoots, GreenDropShip | DUDOSO                       | **Almacenes propios**                     | API o FTP                                    | Cuenta de revendedor                           | Mayoristas B2B                             |

### Lo importante de los dos primeros

**TopDawg.** Su web habla de 3.000+ proveedores verificados de EE. UU. con envío
de 2 a 5 días; **despachan los proveedores, no TopDawg** (su origen es
distribuidor de artículos para mascotas). No hay ningún tiempo medido por
vendedores: solo su promesa de guía en 1 día hábil. La API va en el plan
Premier y, según la documentación de Flxpoint, cubre inventario con precio y
cantidad, envío de pedidos y lectura de envíos con guía; no hay documentación
pública. Trustpilot 4,6 con 23 reseñas, sin aviso de reseñas falsas; la única
queja visible (julio 2026) fue un reembolso de suscripción anual, resuelto por
el director. BBB A+, acreditado desde 2020, fundado en 2004, 5 quejas cerradas
en tres años.

| Plan                               | Mensual | Anual                       | Por pedido |
| ---------------------------------- | ------- | --------------------------- | ---------- |
| Business (prueba gratis de 7 días) | $49,99  | $34,99/mes ($419,88/año)    | $1,50      |
| Scale                              | $99,99  | $69,99/mes ($839,88/año)    | $1,25      |
| Premier (con API)                  | $199,99 | $139,99/mes ($1.679,88/año) | $0,75      |

El precio mayorista real no se ve sin cuenta: **el margen de 30 % queda sin
verificar**. La caja neutra por defecto, sin verificar; el remito con marca
propia aparece desde Scale. Fuerte en mascotas; también ropa, hogar,
electrónica, salud y belleza.

**Wholesale2B.** «100+ proveedores de EE. UU., Canadá, Reino Unido y
AliExpress»: **hay que filtrar por proveedor**. Da un reporte del promedio de
días de despacho de cada uno. API a $99,99/mes con catálogo, inventario,
pedidos y guías por webhook, pagando con monedero prepagado. Quejas recientes:
dinero de un pedido cancelado atrapado en el monedero (22 sep 2026), precios de
EE. UU. más caros que en tiendas (9 sep), API pagada que no se pudo activar y
nadie respondió (14 ago).

**vidaXL falla** porque la caja lleva su marca y en EE. UU. hay clientes con casi
un mes sin guía. **Printful pasa, pero solo para productos estampados**: plantas
propias, 5 a 9 días hábiles en total y API completa gratis; sirve para una línea
de marca propia, no reemplaza a CJ.

### La prueba de tres pedidos con TopDawg

1. **Cómo, sin pagar la API:** plan Business con su prueba gratis de 7 días,
   pedidos a mano. **Las membresías no se reembolsan**: si no pasa, se cancela
   antes de que termine la prueba. Si pasa, recién ahí Premier.
2. **Los tres, pagados el mismo día hábil por la mañana**, de tres proveedores
   distintos en tres estados distintos, cada uno con más de 10 unidades en stock
   y costo menor a unos $40: un accesorio electrónico chico (como el cargador
   USB-C que falló con CJ), un artículo de hogar o cocina mediano, y uno de
   mascotas.
3. **A tres regiones:** Novi (Michigan), una dirección del sur o del oeste, y el
   casillero de Miami.
4. **Se anota con fecha y hora:** pago, aceptación del proveedor, guía creada,
   primer escaneo del transportista y entrega. Además: días hábiles totales; si
   la caja trae factura, precios, propaganda o marca; si el producto es igual a
   la ficha; el costo puesto (producto, envío y $1,50) contra el precio de venta
   después de Stripe; y, en el tercero, una consulta al soporte para medir cuánto
   tarda en responder.
5. **Pasa si:** los tres tienen guía real que se mueve en 72 horas o menos; al
   menos dos de tres llegan en 8 días hábiles o menos y ninguno pasa de 10;
   ninguna caja trae factura, precios ni propaganda; el soporte contesta en un
   día hábil; y el margen es de 30 % o más en los tres.
6. **Si no pasa:** la misma prueba con Wholesale2B. Mientras tanto se abre su
   cuenta gratis, que no pide tarjeta, y se comparan los mismos tres productos.

**Mientras ningún proveedor pase, la promesa de «2 a 5 días hábiles» sigue en
rojo.**

### Lo que no se pudo verificar

Todo lo de Reddit; los precios mayoristas reales (piden cuenta); la
documentación pública de la API de TopDawg; la caja neutra por defecto en
TopDawg y Wholesale2B; Wholesale2B en BBB; el precio 2026 de vidaXL en EE. UU.;
y las páginas oficiales de BigBuy, Faire, FragranceX, Printify y la ayuda de
Printful, que dieron error 403. Lo que salió solo del resumen del buscador está
marcado como no verificado.

### Fuentes (todas leídas el 7 oct 2026)

- https://www.trustpilot.com/review/topdawg.com
- https://topdawg.com/
- https://topdawg.com/pricing
- https://apps.shopify.com/topdawg
- https://apps.shopify.com/topdawg/reviews
- https://help.flxpoint.com/kb/general-supplier-integrations/top-dawg-as-a-source
- https://www.bbb.org/us/fl/fort-lauderdale/profile/wholesalers-and-distributors/topdawg-0633-9001951
- https://launchpadreviews.bearblog.dev/topdawg-dropshipping-review/
- https://techbullion.com/best-dropshipping-platforms-for-retailers-2026-aliexpress-vs-topdawg-u-s-supplier-alternatives/
- https://www.wholesale2b.com/dropship-api-plan.html
- https://www.wholesale2b.com/wholesale2b-prices.html
- https://www.wholesale2b.com/best-dropship-api-services.html
- https://www.wholesale2b.com/wholesale2b-vs-topdawg.html
- https://www.trustpilot.com/review/wholesale2b.com
- https://www.capterra.com/p/200240/Wholesale2B/
- https://b2b.vidaxl.com/pages/8-api
- https://www.trustpilot.com/review/vidaxl.com
- https://kasareviews.com/dropshippingxl-review-pros-cons/
- https://www.dropxl.com/wholesale-usa.html
- https://www.trendtrack.io/blog-post/bigbuy-review
- https://www.spocket.co/pricing
- https://www.trustpilot.com/review/spocket.co
- https://www.capterra.com/p/205029/Spocket/reviews/
- https://syncee.com/pricing
- https://www.trustpilot.com/review/syncee.com
- https://www.trustpilot.com/review/doba.com
- https://www.inventorysource.com/pricing/
- https://www.trustpilot.com/review/inventorysource.com
- https://gousdirect.com/
- https://www.salehoo.com/pricing
- https://www.modernretail.co/technology/aliexpress-is-ramping-up-its-outreach-and-offerings-for-us-sellers/
- https://support.zendrop.com/en/articles/9981459-understanding-zendrop-pricing-plans-a-complete-guide
- https://support.zendrop.com/en/articles/14461568-zendrop-mcp-server
- https://www.trustpilot.com/review/zendrop.com
- https://www.printful.com/shipping
- https://developers.printful.com/docs/
- https://www.trustpilot.com/review/printful.com
- https://www.trustpilot.com/review/printify.com
- https://help.flxpoint.com/kb/general-supplier-integrations/fragrancex-as-a-source
- https://www.trustpilot.com/review/fragrancex.com
- https://help.flxpoint.com/kb/general-supplier-integrations/homeroots-as-a-source
- https://flxpoint-help-center.onrender.com/kb/electronics/petra-industries-as-a-source
- https://en.wikipedia.org/wiki/D%26H_Distributing

---

## 9. El arranque (27 oct 2026): CJ en pausa, TopDawg primero

**Lo que ya se hizo.** Richard pausó la venta de CJ en Estados Unidos: las
fichas se quedan a la vista (adornan la app y sirven para medir la carga),
pero no se pueden comprar, y el feed de Google y los datos de cada ficha dicen
«sin existencias» (comprobado en vivo el 27 oct). Interruptor: `EN_PAUSA` en
`src/lib/ventas/pausa.ts`.

**El orden, sin cambios respecto de la sección 8:**

1. **TopDawg, plan Business con su prueba gratis** (la API solo si pasa).
   Tres pedidos de tres proveedores en tres estados, a Novi, a otra región y
   al casillero de Miami. Unos $90 a $135.
2. **Si TopDawg no pasa: Wholesale2B** (su cuenta gratis no pide tarjeta).
3. **En paralelo, Amazon MCF** para los cinco a diez más vendidos.
4. **España: BigBuy**, cuando haya una dirección allá que reciba y abra los
   paquetes. España ya está abierta dentro de mercatren.com (sección
   «ESPAÑA SE ABRE…» de `HISTORIAL.md`).

**Lo que necesita a Richard, y nada más:**

- 👤 Aprobar el presupuesto de la prueba de TopDawg (unos $90 a $135 más la
  cuota por pedido).
- 👤 Abrir la cuenta de TopDawg con el correo de Mercatren y la tarjeta (la
  IA no crea cuentas ni pone tarjetas). Al terminar, la IA elige los tres
  productos con la vara de la sección 8 y le pasa la lista para que confirme
  cada compra.

**Lo que hace la IA en cuanto entre el primer producto que no sea de CJ:**
la pausa hoy mira el PAÍS (`US`), porque hoy todo lo de Estados Unidos es de
CJ. Antes de publicar un producto de TopDawg, la pausa tiene que pasar a
mirar el PROVEEDOR, o el producto nuevo nacería pausado.

## 8. El estudio del 13 oct 2026: de quién fue la culpa, y quién lidera cada país

> Pedido por Richard el 13 oct, el día que llegaron los paquetes: separar si
> la culpa fue del proveedor puntual dentro de CJ o del transporte barato,
> buscar la empresa que lidere Estados Unidos y la que lidere España, y armar
> pruebas con varios transportes. Investigado con fuentes leídas ese día (lista
> al final de la sección). Lo que no se pudo comprobar dice **sin verificar**.
> No se compró nada, no se abrió ninguna cuenta y no se llenó ningún
> formulario.

### El veredicto, en cinco líneas

1. **Dos tercios del retraso (25 de 38 días) pasaron antes de que un transportista tuviera el paquete.** Es culpa del **proveedor** que despacha ese cargador dentro de CJ (almacén «L2US», producto de tipo «lo envía el proveedor»), no del almacén propio de CJ. CJ es corresponsable porque lo vende como «almacén de EE. UU.» y no lo vigila.
2. **El último tercio (13 días) es del transporte barato:** la guía es de Yanwen Express y el canal se llama «SpeedX US to US #2». Las dos son redes de reparto por encargo, sin activos propios, con Trustpilot de 1,3 y 1,1. **Lo eligió nuestro código por ser el más barato.**
3. **Un paquete de China llega hoy en una mediana de 10 días** porque entra en un flujo masivo diario hacia la misma red; un paquete suelto de un proveedor chico de EE. UU. espera recogida, espera camión lleno y espera reparto.
4. **Si se sigue probando con CJ:** solo productos con stock físico de CJ verificado (tipo «ordinario», existencias de CJ mayores que cero, almacén verificado) y transporte **USPS Ground Advantage** o **UPS Ground** por nombre. Nunca «el más barato».
5. **EE. UU.:** TopDawg primero, Wholesale2B de respaldo, y en paralelo inventario propio de los más vendidos en **Amazon Multi-Channel Fulfillment** (3 días hábiles, sin mínimos publicados). **España:** BigBuy sigue siendo el candidato, con reputación floja; Printful Barcelona solo para estampados.

---

### Los tres tramos, con la culpa repartida

| Tramo                            | Fechas                  | Días naturales / hábiles | De quién es la culpa                                                                                                                                                                                                                              | Evidencia                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------------------------- | ----------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Pago → etiqueta**           | sáb 5 sep → jue 17 sep  | 12 / 8                   | **Del proveedor del almacén «L2US» dentro de CJ** (principal). CJ, corresponsable: lo lista como almacén de EE. UU. sin vigilar su preparación. Nuestro código, corresponsable menor: no filtró por stock propio de CJ ni por tiempo de despacho. | La API de CJ define el tipo 5 como producto que el proveedor prepara y envía directamente. Nuestro pedido pagado salió con ese tipo, almacén «L2US» y envío cero (registro del proyecto). CJ promete 1–3 días de preparación con stock propio y 3–5 sin él; 8 hábiles es el doble del peor caso. Reseñas de 2026 en la tienda de Shopify describen pedidos retenidos 18 días y stock de EE. UU. que no existía.                                                                                       |
| **2. Etiqueta → primer escaneo** | jue 17 sep → mié 30 sep | 13 / 9                   | **Del proveedor que imprimió la etiqueta sin entregar el paquete**, y de la red barata que no recoge a diario en un almacén de poco volumen. Reparto exacto **sin verificar**.                                                                    | «Etiqueta creada» significa que el transportista tiene los datos pero no el paquete; lo normal es 24 a 48 horas. La propia guía de SpeedX lo define igual. eBay y Amazon solo cuentan como enviado un escaneo real, justamente porque imprimir antes es un truco conocido para «parar el reloj». La recogida de Yanwen Express se programa y solo cubre ciertas zonas.                                                                                                                                |
| **3. Primer escaneo → entrega**  | mié 30 sep → mar 13 oct | 13 / 8                   | **Del transporte barato** (Yanwen Express sobre la red de SpeedX, probablemente). **Y nuestro**, porque nuestro código lo eligió.                                                                                                                 | California → Illinois en unas 38 horas: el camión no fue lo lento. Luego, 5 días quieto en Illinois y 4 y medio para ir de Arlington Heights a Michigan (unas 5 horas de carretera, aprox.). Yanwen Express: Trustpilot 1,3 con 93 % de una estrella, y una queja de septiembre de 2026 desde Ann Arbor, Michigan, por 10 días de retraso. SpeedX: 1,1 con 5.614 reseñas y 93 % de una estrella. Estas redes trabajan con conductores por encargo y, según FreightWaves, ninguna gana dinero todavía. |

**Días hábiles:** descuentan sábados, domingos, el Día del Trabajo (7 sep) y el 12 de octubre. Total: 38 naturales, 25 hábiles.

---

### A. Los tres tramos, uno por uno

#### A1. Pago → etiqueta (12 días): proveedor, no almacén de CJ

**Lo que CJ es por dentro, según su propia API.** La documentación oficial de productos de CJ clasifica cada producto con un tipo:

| Tipo                         | Qué significa                           | Quién prepara y envía |
| ---------------------------- | --------------------------------------- | --------------------- |
| 0 · ordinario                | inventario y envío gestionados por CJ   | **CJ**                |
| 4 · de proveedor             | el proveedor colabora con el inventario | **CJ** envía          |
| 5 · enviado por el proveedor | el proveedor gestiona y despacha        | **el proveedor**      |

Y separa dos existencias: **existencias de CJ** (stock físico en su almacén) y **existencias de fábrica** (stock «virtual» del proveedor). También marca si el almacén está **verificado** (1) o **pendiente de verificar** (2), trae un **ciclo de entrega** en días (ejemplo «3-5») y permite filtrar el listado por **tiempo de despacho de 24, 48 o 72 horas**.

**Nuestro cargador era de tipo 5** (registro del proyecto: pedido pagado con almacén «L2US», envío cero porque el proveedor lo incluye en el precio). El blog de CJ explica que sus «almacenes de proveedor» llevan envío gratis y se encuentran filtrando por almacén de EE. UU. con envío gratis: es exactamente el tipo de ficha que nuestro catálogo trajo. **No era un paquete del almacén propio de CJ en Chino o Nueva Jersey**: era la bodega de un tercero que vende a través de CJ.

**Dónde están los almacenes propios de CJ en EE. UU.** El blog de CJ y las reseñas hablan de dos grandes en Nueva Jersey y Chino (California), y otras fuentes dicen «tres» sin nombrarlos. **Sin verificar** en una página oficial actual (el sitio de CJ redirige a una validación y no se deja leer).

**Lo que CJ promete:** preparación de 1 a 3 días con stock propio y 3 a 5 sin él (su blog), más 2 a 7 días de tránsito desde EE. UU. según reseñas; su app dice 4 a 10 días en total para EE. UU. **Ocho días hábiles solo de preparación** está por encima de cualquiera de esas promesas.

**Quejas de 2025–2026 que calzan con lo nuestro** (reseñas de una estrella en la tienda de apps de Shopify, calificación global 4,9 con 2.874 reseñas):

- mayo 2026: pedidos retenidos 18 días sin envío ni respuesta clara;
- mayo 2026: stock de EE. UU. que aparecía en el inventario y desapareció al pedir;
- septiembre 2026: el almacén de EE. UU. no siempre tiene el mismo producto y los envíos son lentos.

**Conclusión del tramo:** el proveedor de «L2US» tardó el doble del peor plazo que CJ promete. CJ no lo frenó ni avisó. Y nosotros no filtramos: con el filtro de tipo 0, existencias de CJ mayores que cero y almacén verificado, ese cargador no habría entrado al catálogo.

#### Confirmado con la API de CJ, el mismo 13 oct

Consultado con la sonda de solo lectura (`/product/query`,
`/product/stock/queryByVid` y `getOrderDetail`), después de escribir lo de
arriba:

| Dato                        | Lo que contestó CJ                                                                  |
| --------------------------- | ----------------------------------------------------------------------------------- |
| Tipo de producto            | **`SUPPLIER_SHIPPED_PRODUCT`**: lo prepara y lo manda el proveedor                  |
| Proveedor                   | una comercializadora de **Guangzhou (China)**, que vende bajo otro nombre de tienda |
| Almacén del pedido          | «L2US Warehouse», **no** una bodega propia de CJ                                    |
| Transporte                  | «SpeedX US to US #2», envío **$0**                                                  |
| Lo cobrado                  | $11,40 (producto) + $0 (envío)                                                      |
| Tiendas que lo venden en CJ | 35                                                                                  |
| Existencias en EE. UU. hoy  | **ninguna**: CJ solo lo lista en China, con cero                                    |

**Lo que eso significa:** el tramo 1 es del proveedor, como decía el estudio,
y ahora con el dato de CJ en la mano. Y hay un aviso aparte: **la ficha sigue
publicada en Mercatren a $19,68 con 192 unidades guardadas**, cuando CJ ya no
tiene ninguna en EE. UU. La compra no llega a cobrarse (el stock se pregunta
antes de cobrar), pero la ficha engaña: el refresco del stock no la alcanzó.

**Cuántas fichas son de este tipo:** no se guarda el tipo de producto, así que
el número exacto falta. La pista: el 13 sep se pusieron a la venta **41.796
fichas de EE. UU.** que estaban en revisión porque el proveedor cotizaba el
envío en cero, que es justo la marca de este tipo (ver HISTORIAL, «el flete $0
de EE. UU. es gratis de verdad»). **Lo más probable es que la gran mayoría del
catálogo de EE. UU. sea del mismo tipo que tardó 38 días.**

#### A2. Etiqueta → primer escaneo (13 días): una etiqueta sin paquete

**El patrón es conocido.** «Etiqueta creada» (USPS lo llama «pre-shipment», UPS «label created», FedEx «shipment information sent») quiere decir que el remitente compró la etiqueta, pero el transportista todavía no tiene el paquete. Lo normal es que el primer escaneo llegue en 24 a 48 horas. La guía de rastreo de SpeedX dice lo mismo y recomienda reclamar al vendedor si no cambia en tres días hábiles. Trece días no es un retraso del transportista: es un paquete que nadie entregó.

**Por qué se hace.** En marketplaces, el reloj del vendedor se mide con la «fecha de envío». Imprimir la etiqueta temprano hace parecer que salió a tiempo. Por eso eBay y Amazon solo cuentan como enviado el primer escaneo real del transportista (foros de vendedores de eBay y Amazon). CJ, en cambio, sí parece aceptar la etiqueta como «enviado» (registro del proyecto: la guía apareció el 17 de septiembre y CJ no la marcó como problema). **Sin verificar** que el proveedor lo hiciera a propósito; lo que sí se ve es que la etiqueta existió trece días sin paquete.

**La parte del transportista.** Yanwen Express no recoge en cualquier sitio: la integración de Teapplix dice que la recogida cubre códigos postales cerca de grandes aeropuertos y ciudades en California, Texas, Illinois, Nueva Jersey, Nueva York, Pensilvania, Ohio, Washington y Georgia, y que hay que programarla. Una bodega chica con pocos paquetes al día puede esperar a juntar volumen. **Sin verificar** cuánto de los trece días fue espera de recogida y cuánto fue el proveedor.

**Lo que no se pudo aclarar:**

- **«Delta Deliver Direct».** Existe un servicio con ese nombre: **DeliverDirect, de Delta Cargo** (la división de carga de Delta Air Lines), lanzado en 2024 con la empresa de software SmartKargo. Lleva paquetes de hasta 25 libras en la bodega de vuelos de pasajeros, con opciones de 1, 2 y 3 días, y usa socios de primera y última milla que no nombra. **No se encontró ninguna relación pública con CJ, Yanwen ni SpeedX.** Hipótesis, sin verificar: el tramo Montebello → zona de O'Hare en unas 38 horas es compatible con un vuelo o con un camión de dos conductores.
- **La dirección del remitente** (4501 E Airport Dr, Ontario, CA 91761) es un edificio industrial de varios inquilinos junto al aeropuerto de Ontario, ofrecido en alquiler por Cushman & Wakefield en 2025. No se encontró quién lo ocupa.
- **«ONT01».** ONT es el código del aeropuerto de Ontario, California. El escaneo dice código postal 91752 (Eastvale, Jurupa Valley, Mira Loma), una zona llena de almacenes a unos minutos de allí. Lo más probable es que sea el código interno de la primera instalación de la red. **Sin verificar.**

#### A3. Primer escaneo → entrega (13 días): la red barata

**Quién movió el paquete.** La guía empieza por YWE y el sitio de **Yanwen Express** (yanwenexpress.com) se presenta como un servicio de **última milla dentro de EE. UU.** que trabaja con socios de reparto (DSP). Es el brazo doméstico de Yanwen, el consolidador chino. El canal de CJ se llama «SpeedX US to US #2», y la ruta coincide con la red de **SpeedX**: SpeedX publica empleos de supervisión de su centro en **Montebello, CA** (donde aparecen tres escaneos) y abrió en diciembre de 2025 un **superhub de 200.000 pies cuadrados a minutos de O'Hare**, que es donde queda Franklin Park. **Probable, sin verificar:** SpeedX como red y Yanwen Express como etiqueta y reparto.

**Lo que se sabe de estas redes:**

| Red                | Qué es                                                                                                    | Reputación (leída hoy)                                                                                                                                                                                                                                                 | Cómo opera                                                                                                                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SpeedX**         | Paquetería de bajo costo nacida en 2022; clientes: Shein, Temu, TikTok Shop y Amazon (FreightWaves, WCPO) | Trustpilot **1,1 de 5**, 5.614 reseñas, **93 % de una estrella**; quejas de entregas falsas, paquetes quietos días y sin teléfono de soporte. BBB: sin perfil oficial encontrado                                                                                       | Más de 12.000 códigos postales (su web); unos tres cuartos del país; ~1 millón de paquetes diarios con conductores independientes en su propio auto; promete entrega al día siguiente o en dos días |
| **Yanwen Express** | Última milla en EE. UU. con socios de reparto                                                             | Trustpilot **1,3 de 5**, 98 reseñas, **93 % de una estrella**; septiembre 2026: una queja desde **Ann Arbor, Michigan**, por 10 días de retraso; paquetes tirados al patio o dados por entregados sin llegar. Su chat dice que «en reparto» puede tardar de 1 a 5 días | No publica plazos, centros ni teléfono                                                                                                                                                              |

**La lectura del rastreo, tramo por tramo:**

| De                              | A                                         | Tiempo                  | Qué pasó                                               |
| ------------------------------- | ----------------------------------------- | ----------------------- | ------------------------------------------------------ |
| 30 sep 18:38 · Eastvale (ONT01) | 1 oct 01:38 · Montebello                  | 7 horas                 | entrada a la red y clasificación                       |
| 1 oct 01:38 · Montebello        | 2 oct 15:55 · Franklin Park (zona O'Hare) | **~38 horas**           | el tramo largo, unas 2.000 millas (aprox.): **rápido** |
| 3 oct 19:52 · Illinois          | 8 oct 23:07 · Arlington Heights           | **5 días** sin escaneos | espera                                                 |
| 8 oct 23:07 · Arlington Heights | 13 oct 10:37 · en reparto en Michigan     | **4 días y medio**      | unas 5 horas de carretera (aprox.)                     |

**Por qué se queda cinco días en Illinois y otros cinco para cruzar a Michigan.** Las redes de consolidación retienen paquetes hasta llenar un camión hacia cada destino; las guías del sector hablan de 12 a 48 horas de espera **en rutas con volumen**, y advierten que los destinos con poco volumen son el punto débil. Michigan no aparece en la lista de zonas de recogida de Yanwen Express ni se encontró un centro de SpeedX allí. **Hipótesis, sin verificar:** el paquete esperó en Chicago a que hubiera carga suficiente hacia Detroit, y en Michigan lo repartió un socio local que salió con él cuando le tocó ruta. El lunes 12 de octubre (feriado federal) pudo sumar un día si en algún punto intervino USPS.

---

### B. Por qué EE. UU. → EE. UU. puede ser más lento que China → EE. UU.

**El dato que lo explica, medido por Parcelsapp en los últimos 60 días (hasta el 12 oct 2026):**

| Ruta                                                   | Mediana     | Rango típico (80 % central) | Entregas medidas |
| ------------------------------------------------------ | ----------- | --------------------------- | ---------------- |
| China → EE. UU., todas                                 | **10 días** | 6–18                        | 156.378          |
| China → EE. UU., última milla **SpeedX**               | **9 días**  | 6–15                        | 9.236            |
| China → EE. UU., última milla GOFO                     | 10 días     | 6–15                        | 46.292           |
| China → EE. UU., USPS                                  | 10 días     | 7–23                        | 13.130           |
| Hong Kong → EE. UU., YunExpress                        | 10–11 días  | —                           | 47               |
| **Nuestro cargador, EE. UU. → EE. UU., SpeedX/Yanwen** | **38 días** | —                           | 2                |

**La razón:** los paquetes chinos entran a EE. UU. ya **consolidados por el exportador** (Yanwen, YunExpress, Cainiao), en volúmenes enormes y diarios, directo a los centros de estas mismas redes. El camión sale lleno cada día. Nuestro paquete, en cambio, salió de una bodega chica de un proveedor: **sin flujo propio**, dependió de que alguien lo recogiera y de que hubiera carga para su destino. La misma red que es «rápida» para Temu es lenta para un paquete suelto.

**Además, el negocio cambió en 2025.** El 2 de mayo de 2025 terminó la exención de aranceles para paquetes chicos desde China, y desde el **29 de agosto de 2025** quedó suspendida para todos los países (orden ejecutiva 14324, aviso de Aduanas en el Registro Federal). Temu y Shein pasaron mercancía a almacenes en EE. UU. y las redes baratas de reparto (GOFO, UniUni, SpeedX, Yanwen Express) crecieron sobre ese volumen. Un senador pidió en mayo de 2026 al Departamento de Justicia investigar a estas redes respaldadas por capital chino; las empresas lo niegan (FreightWaves).

**Los plazos publicados de cada transportista:**

| Transportista                    | Plazo publicado                                     | Fuente                                                    | Para 0,16 kg (5,6 oz)                                                                                                                                                                                                                    |
| -------------------------------- | --------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **USPS Ground Advantage**        | **2 a 5 días**                                      | usps.com (oficial)                                        | Desde el 12 jul 2026, la tarifa comercial publicada cobra todo lo de menos de 1 libra al precio de 15,99 oz: **unos $8,40 en zona 8**; con tarifas negociadas, **$5,50–$6,36** (ship.com, julio 2026). Mostrador: desde $8,40 (usps.com) |
| **UPS Ground**                   | **1 a 5 días hábiles**                              | fuentes secundarias; la página oficial bloquea la lectura | sin cifra verificada para este peso                                                                                                                                                                                                      |
| **FedEx Ground / Home Delivery** | **1 a 5 días hábiles** en el territorio continental | PDF oficial de FedEx, temporada 2026                      | sin cifra verificada para este peso                                                                                                                                                                                                      |
| **SpeedX**                       | promete día siguiente o dos días                    | speedx.io                                                 | medido: 9 días de mediana como última milla desde China                                                                                                                                                                                  |
| **Yanwen Express**               | no publica                                          | yanwenexpress.com                                         | su chat: 1 a 5 días solo «en reparto»                                                                                                                                                                                                    |
| GOFO, UniUni, OnTrac             | no publican plazo en días                           | sus webs                                                  | OnTrac dice ser hasta dos días más rápido que el terrestre tradicional, sin cifra                                                                                                                                                        |

---

### C. Qué transportes ofrece CJ desde su almacén de EE. UU.

**La lista pública no se puede leer:** la calculadora y el blog de CJ redirigen a una validación. Lo que sí hay:

| Opción en el cotizador de CJ   | Visto en                                                   | Plazo que promete CJ                | Precio para 0,16 kg                | Comentario                                |
| ------------------------------ | ---------------------------------------------------------- | ----------------------------------- | ---------------------------------- | ----------------------------------------- |
| **SpeedX US to US #2**         | registro del proyecto (los dos pedidos)                    | sin verificar                       | **$0** (incluido por el proveedor) | la que eligió nuestro código; **38 días** |
| **USPS US to US**              | registro del proyecto (cotiza 0 en productos de proveedor) | sin verificar                       | 0 en productos de tipo 5           | USPS promete 2–5 días                     |
| **UPS US to US**               | registro del proyecto                                      | sin verificar                       | a veces 0: CJ no sabe cotizarlo    | UPS Ground 1–5 hábiles                    |
| **FedEx US to US**             | registro del proyecto                                      | sin verificar                       | a veces 0: CJ no sabe cotizarlo    | FedEx Ground 1–5 hábiles                  |
| CJPacket (Ordinary, Sensitive) | blog y API de CJ                                           | 7–15 días                           | —                                  | sale **de China**, no sirve               |
| USPS+                          | blog y ejemplo de la API de CJ                             | 2–5 días (ejemplo de la API, $4,71) | —                                  | China → almacén de EE. UU. → USPS         |

**Dos avisos de la documentación de CJ:**

1. El cotizador devuelve, por cada opción, el nombre, el **plazo en días** y el precio. Hay un segundo método más preciso que además dice por qué una opción no está disponible.
2. **En los productos de proveedor, normalmente el proveedor fija la logística** y CJ calcula con su plantilla. O sea: en un producto de tipo 5, pedir «USPS» puede no estar disponible o no cambiar nada del tramo 1.

**Cuál conviene para cumplir 2 a 5 días hábiles:**

- **Primera opción: USPS Ground Advantage** (cubre todas las direcciones, 2–5 días, seguro de $100 incluido). **Segunda: UPS Ground.**
- **Regla para el código:** lista blanca por nombre (USPS, UPS, FedEx), ordenar **por plazo** (que el plazo cotizado sea de 5 días o menos) y solo después por precio. Excluir SpeedX, Yanwen, GOFO y UniUni. Si una opción cotiza cero en un producto que no es de proveedor, tratarla como «sin cotización», como ya hace el proyecto.
- **La cuenta honesta:** aun con CJ perfecto, preparación de 1 a 3 días más USPS de 2 a 5 da **3 a 8 días hábiles**. «2 a 5 días hábiles» no se cumple con CJ. Mientras se use CJ, la promesa del sitio debería decir **3 a 8 días hábiles**.

---

### D. El proveedor líder para vender en EE. UU.

**No hay novedades de 2026 que cambien la preselección.** No se encontró ninguna noticia de 2026 sobre TopDawg ni Wholesale2B. Lo leído hoy:

| Candidato                          | Despacha desde                                                        | API para sitio propio                                       | Costo (leído hoy)                                                                                                                                                                                                                                   | Reputación (hoy)                                                                                                                                                | Veredicto                                                                 |
| ---------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **TopDawg**                        | Red de proveedores de EE. UU.; promete 2–5 días por USPS, UPS o FedEx | **Solo en Premier**                                         | Premier **$139,99/mes** facturado al año; Business $34,99/mes al año, con prueba gratis (duración no indicada hoy; el 7 oct se leyó 7 días)                                                                                                         | Trustpilot 4,5–4,6 con **solo 23 reseñas**; 91 % cinco estrellas, 9 % una                                                                                       | **Probar primero.** Mismo riesgo de fondo que CJ: despacha cada proveedor |
| **Wholesale2B**                    | 100+ proveedores (hay que filtrar los de EE. UU.)                     | Sí: catálogo, stock, pedidos ilimitados y guías por webhook | precio del plan API no visible hoy (el 7 oct: $99,99/mes); se paga con monedero o a mano                                                                                                                                                            | Trustpilot **4,0**, 441 reseñas, 13 % una estrella; 2026: dinero atrapado en el monedero, una API pagada sin soporte (agosto), precios más caros que en tiendas | **Respaldo**                                                              |
| **Amazon MCF** (inventario propio) | Almacenes de Amazon                                                   | Sí (apps y API propias)                                     | ≤ 4 oz, una unidad: **$7,34** estándar y **$10,70** exprés (amzprep, revisado 18 ago 2026) **más 3,5 %** de recargo (oficial); almacenaje $0,78 por pie cúbico ene–sep y $2,40 oct–dic; cuenta Professional **$39,99/mes** (oficial) con FBA activo | —                                                                                                                                                               | **La vía más rápida y sin mínimos publicados**                            |
| ShipBob                            | Sus almacenes                                                         | Sí                                                          | no publica tarifas; terceros: alta de $0 a $975 y mínimo de ~$275/mes o ~400 pedidos/mes                                                                                                                                                            | —                                                                                                                                                               | No conviene con poco volumen                                              |
| ShipMonk                           | Sus almacenes                                                         | Sí                                                          | no publica tarifas; su mínimo mensual es pedidos × tarifa del primer artículo, menos 20 %; cobra extra por tandas de menos de 50 pedidos                                                                                                            | —                                                                                                                                                               | Igual: para cuando haya volumen                                           |
| Petra Industries                   | Almacén propio, electrónica, envío ciego                              | FTP; API **sin verificar**                                  | cuenta de revendedor                                                                                                                                                                                                                                | —                                                                                                                                                               | Para electrónica, más adelante                                            |

**Amazon MCF, en concreto, para el cargador:**

- **Entrega estándar en 3 días hábiles, exprés en 2** (página oficial). Contando el día de preparación, el total queda en **3 a 4 días hábiles**: es lo único de la lista que cumple «2 a 5» con holgura.
- **Caja sin marca de Amazon por defecto** (página oficial).
- Costo por pedido del cargador: unos **$7,60** con el recargo. CJ lo daba «gratis» dentro de su precio de $11,40; aquí el envío se paga aparte, pero se cumple la promesa.
- Hace falta comprar el inventario por adelantado y mandarlo a Amazon. **Riesgo:** el dinero queda en mercancía y el almacenaje sube casi tres veces de octubre a diciembre.
- **Sin verificar:** que la cuenta de vendedor sea obligatoria aunque no se venda en Amazon (lo dicen guías de terceros, no la página oficial).

**Recomendación:** TopDawg con su prueba gratis; si falla, Wholesale2B. **Y en paralelo**, los 5 a 10 productos que más se vendan pasan a inventario propio en Amazon MCF. Es la única forma verificada de cumplir 2 a 5 días hábiles sin depender de cientos de proveedores.

---

### E. El proveedor líder para vender en España

**Antes de todo, una regla nueva que lo cambia:** desde el **1 de julio de 2026** la Unión Europea cobra un **derecho de aduana de 3 € por artículo** en paquetes de hasta 150 € que vienen de fuera de la UE (Comisión Europea). Vender a España desde EE. UU. o China encarece cada pedido. **El almacén tiene que estar dentro de la UE.**

| Candidato                    | Almacén                                                       | API                                                                                                                                                        | Costo                                                                                                                                                                                                            | Plazo en España                                                                                                                                                                                                                                       | Reputación (hoy)                                                                                                                                           | Veredicto                                                |
| ---------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **BigBuy**                   | Valencia (la ubicación exacta del almacén, **sin verificar**) | REST con JSON, entorno de pruebas, pedidos, costos de envío y seguimiento (según el buscador sobre su página oficial, que **no se dejó abrir**: error 403) | Pack Ecommerce: **89 € de alta + 89 €/mes**, o 74,17 €/mes pagando el año; Marketplaces 119 €/mes (DoDropshipping, actualizado 5 ago 2026). Otras fuentes dicen 69 € + 90 € de alta: **sin verificar** cuál rige | 24–48 h en la UE según reseñas de terceros; **sin verificar** en la fuente oficial. Transportistas mencionados: GLS, SEUR, TNT, DHL, UPS, Correos Exprés y Correos (resumen del buscador sobre su app oficial; esa app hoy figura como no disponible) | Trustpilot **3,0**, 4.729 reseñas, 81 % cinco estrellas y 13 % una; quejas de 2026: gran parte del catálogo agotado, soporte de semanas, reembolsos lentos | **Sigue siendo el candidato**, a prueba                  |
| **vidaXL / dropshippingXL**  | Venlo, Países Bajos                                           | Sí, con un token de la cuenta                                                                                                                              | ~30 €/mes (reseña de 2026)                                                                                                                                                                                       | **sin verificar**                                                                                                                                                                                                                                     | vidaXL.es **2,4**, 8.131 reseñas, 30 % una estrella; 2026: retrasos de 10 días en España; la caja lleva su marca (estudio del 7 oct)                       | Solo hogar, jardín y muebles                             |
| **Printful Barcelona**       | Sant Climent de Llobregat (Barcelona)                         | Sí, completa y gratis (estudio del 7 oct)                                                                                                                  | sin cuotas                                                                                                                                                                                                       | **3 días hábiles a España** después de producir; producción de 2 a 5 días hábiles (oficial)                                                                                                                                                           | 4,2 (estudio del 7 oct)                                                                                                                                    | **Pasa, solo estampados**                                |
| CJ en Europa                 | dice tener almacenes en Europa; en España, **sin verificar**  | la misma API                                                                                                                                               | —                                                                                                                                                                                                                | sin datos verificables                                                                                                                                                                                                                                | la de CJ                                                                                                                                                   | No, con lo visto en EE. UU.                              |
| Nedis, Infortisa, Globomatik | almacenes propios (Países Bajos, España)                      | **sin verificar**                                                                                                                                          | cuenta de revendedor; alta para empresa extranjera **sin verificar**                                                                                                                                             | —                                                                                                                                                                                                                                                     | —                                                                                                                                                          | Para electrónica, a investigar                           |
| Dropea                       | España y Portugal                                             | solo app de Shopify                                                                                                                                        | —                                                                                                                                                                                                                | 24–48 h según una reseña                                                                                                                                                                                                                              | 4,4 con 11 reseñas                                                                                                                                         | No: es contra reembolso y no tiene API para sitio propio |

**Un tema que no es de proveedor y hay que mirar aparte:** Mercatren LLC es una sociedad de EE. UU. Vender a consumidores en España con almacén en la UE implica IVA español y, probablemente, registro fiscal allí. **Sin verificar**; lo decide el contador antes de abrir el país.

---

### F. El plan de pruebas que separa proveedor de transporte

**La idea:** cambiar **una sola cosa por vez**. Si cambia el transporte y mejora solo el tramo 3, la culpa era del transporte. Si cambia el almacén y mejora el tramo 1, la culpa era del proveedor.

**Reglas comunes a todas las pruebas:**

- Se paga **el mismo día hábil por la mañana** (un martes), con la misma dirección de Novi y una segunda en otra región (sur u oeste).
- Se anota con fecha y hora: **pago, etiqueta, primer escaneo real, entrega**. Y el nombre exacto del transporte y la guía.
- **La vara de siempre:** guía con escaneo real en 72 horas o menos; entrega en **8 días hábiles o menos**; caja sin factura, precios ni propaganda; soporte que contesta en un día hábil.

#### Prueba 1 · CJ, dos por dos (separa almacén y transporte)

| Celda | Producto                                                                                    | Transporte                | Pedidos | Ya medido                  |
| ----- | ------------------------------------------------------------------------------------------- | ------------------------- | ------- | -------------------------- |
| A     | el cargador, **tipo 5** (proveedor «L2US»)                                                  | el más barato (SpeedX)    | —       | **sí: 38 días, dos veces** |
| B     | el mismo cargador, tipo 5                                                                   | **USPS o UPS** por nombre | 2       | —                          |
| C     | un accesorio parecido de **tipo 0**, existencias de CJ mayores que cero, almacén verificado | el más barato             | 2       | —                          |
| D     | el mismo de la celda C                                                                      | **USPS o UPS** por nombre | 2       | —                          |

**Costo:** 6 pedidos de unos $12 a $20 de producto más $0 a $9 de envío: **unos $100 a $160.**

**Ojo con la celda B:** el cargador ya no tiene existencias en EE. UU. (CJ, 13 oct). Se hace con otro accesorio de tipo «lo manda el proveedor» parecido en tamaño y precio.

**Qué decide qué:**

- Si en la celda B **CJ no ofrece USPS ni UPS** para ese producto, queda probado que el proveedor fija el transporte: **los productos de tipo 5 salen del catálogo de EE. UU.**
- Si B mejora el tramo 3 pero no el 1: la culpa del tramo 1 es del proveedor y la del 3 del transporte (lo esperado).
- Si C o D tardan más de **3 días hábiles** hasta la etiqueta: **el almacén propio de CJ también falla** y se sale de CJ en EE. UU.
- Si **D cumple 8 hábiles o menos en los dos pedidos**: CJ se queda, pero solo con stock propio verificado y USPS o UPS, y con la promesa del sitio en 3 a 8 días hábiles.

#### Prueba 2 · TopDawg (el candidato de EE. UU.)

- Plan Business con su prueba gratis; **se cancela antes de que termine** si no pasa. La API (Premier, $139,99/mes al año) solo se paga si pasa.
- **3 pedidos**, de 3 proveedores distintos en 3 estados, cada uno con más de 10 unidades en stock y costo menor a $40: un accesorio electrónico chico (el equivalente al cargador), uno de hogar o cocina y uno de mascotas.
- **Costo:** unos **$90 a $130** de productos, más la cuota por pedido (el 7 oct se leyó $1,50; hoy no se publica).
- **Pasa si** cumple la vara y además el margen es de 30 % o más en los tres. Si no pasa, la misma prueba con **Wholesale2B** (unos $100 a $130 más el plan API).

#### Prueba 3 · Amazon MCF con inventario propio (la vía de los más vendidos)

- Se compran **20 unidades** del cargador (u otro de los más vendidos) en un lote y se mandan a un almacén de Amazon. El tiempo de abastecimiento no lo sufre ningún cliente.
- Cuenta Professional ($39,99 el primer mes) y **3 pedidos MCF** estándar a tres regiones (unos $7,60 cada uno).
- **Costo:** unos **$180 a $250** en total (inventario sin verificar: de $5 a $8 la unidad; envío de entrada a Amazon sin verificar: de $15 a $25).
- **Pasa si** los tres llegan en **4 días hábiles o menos** desde el pago, en caja sin marca. Si pasa, los más vendidos se mudan a MCF y el sitio puede prometer «2 a 5 días hábiles» **solo en esas fichas**.

#### Prueba 4 · BigBuy (España)

- **Necesita una decisión de Richard:** una dirección en España que reciba los paquetes y los abra (un conocido, un casillero o un cliente piloto).
- Un mes de Pack Ecommerce, **3 pedidos** a dos ciudades de la península (una Madrid o Barcelona, otra mediana), productos de 15 a 25 €.
- **Costo:** **unos 250 a 290 €** (89 € de alta, 89 € del mes, ~60 € de productos y ~15 a 20 € de envíos). Conversión a dólares **sin verificar**.
- **Pasa si:** ningún pedido se cancela por falta de stock, sale del almacén en 1 día hábil y llega en **3 días hábiles o menos**, en caja neutra.
- **En paralelo y barato:** una muestra de Printful Barcelona (20 % de descuento y envío gratis en muestras), unos **15 a 25 €**, para medir producción más entrega en España.

#### El costo total del plan

| Prueba                        | Costo aproximado                            |
| ----------------------------- | ------------------------------------------- |
| 1 · CJ dos por dos            | $100 – $160                                 |
| 2 · TopDawg                   | $90 – $135                                  |
| 3 · Amazon MCF                | $180 – $250                                 |
| 4 · BigBuy + muestra Printful | 265 € – 315 €                               |
| **Total sin el respaldo**     | **unos $370 – $545 más unos 265 € – 315 €** |
| Si TopDawg falla: Wholesale2B | más unos $200 – $230                        |

**Orden recomendado:** la Prueba 1 y la 2 el mismo martes (lo que más se aprende por dólar), la 3 en cuanto llegue el lote, y la 4 cuando haya dirección en España.

---

### Lo que no se pudo verificar

- La relación entre «Delta Deliver Direct», Yanwen, SpeedX y el almacén de Ontario; qué es «ONT01».
- Que la red física fuera la de SpeedX (la ruta coincide, pero ningún documento público lo dice).
- La lista oficial y actual de transportes de CJ desde EE. UU., con plazos y precios (el sitio de CJ exige validación).
- La ubicación y el número actuales de los almacenes propios de CJ en EE. UU.
- El plazo oficial de UPS Ground (la página bloquea la lectura) y las tarifas de UPS y FedEx para 5,6 oz.
- Las tarifas oficiales 2026 de Amazon MCF (la cifra de $7,34 es de un tercero), y si la cuenta de vendedor es obligatoria sin vender en Amazon.
- Las tarifas oficiales de ShipBob y ShipMonk (no las publican).
- Los precios oficiales, la API, el almacén y los plazos de BigBuy (su web devuelve error 403); el precio actual del plan API de Wholesale2B; la cuota por pedido de TopDawg.
- El perfil de SpeedX en BBB.
- Si los almacenes de CJ en Europa incluyen España.
- El IVA y el registro fiscal que necesitaría Mercatren LLC para vender en España.

---

### Fuentes de la sección 8 (todas leídas el 13 oct 2026)

**CJ Dropshipping**

- https://developers.cjdropshipping.com/en/api/api2/api/product.html — tipos de producto (0, 4, 5), existencias de CJ contra existencias de fábrica, almacén verificado, ciclo de entrega y filtro de despacho de 24/48/72 horas.
- https://developers.cjdropshipping.com/zh/api/api2/api/logistic.html — el cotizador devuelve nombre, plazo y precio; en productos de proveedor el proveedor fija la logística; ejemplo USPS+ de 2–5 días a $4,71.
- https://blog.cjdropshipping.cn/detail/Unlock-3-Day-Delivery-with-CJ-s-New-US-Warehouses — promesa de 3 a 6 días con inventario de EE. UU. (11 oct 2024), sin nombrar transportistas.
- https://blog.cjdropshipping.cn/detail/1334727489640955906 — los «almacenes de proveedor» de CJ, con envío gratis y entrega en una semana (2020).
- https://blog.cjdropshipping.cn/detail/how-to-use-cj-us-warehouses-to-boost-dropshipping — envío nacional de 2 a 4 días (2020).
- https://apps.shopify.com/cucheng/reviews?ratings%5B%5D=1&sort_by=newest — calificación 4,9 con 2.874 reseñas; quejas de una estrella de mayo, julio y septiembre de 2026.
- Resúmenes del buscador sobre el blog de CJ (preparación de 1–3 y 3–5 días; Nueva Jersey y Chino), HustleGotReal (2–7 días desde EE. UU.) y la app de CJ (4–10 días).

**Rastreo, etiquetas y redes de reparto**

- https://www.yanwenexpress.com/ — Yanwen Express se presenta como última milla en EE. UU. con socios de reparto.
- https://www.trustpilot.com/review/www.yanwenexpress.com — 1,3 con 98 reseñas, 93 % de una estrella; queja de Ann Arbor (septiembre 2026); su chat dice 1 a 5 días en reparto.
- https://www.trustpilot.com/review/speedx.io — 1,1 con 5.614 reseñas, 93 % de una estrella.
- https://www.speedx.io/ — más de 12.000 códigos postales; servicios de día siguiente y de dos días.
- https://www.freightwaves.com/news/new-speedx-superhub-in-chicago-expedites-more-parcel-deliveries — superhub junto a O'Hare (dic 2025): 200.000 pies cuadrados, 500.000 envíos diarios, ~1 millón de paquetes al día con conductores independientes.
- https://www.freightwaves.com/news/sen-cotton-urges-doj-investigation-of-china-backed-parcel-carriers — redes sin activos, con contratistas y conductores por aplicación; pierden dinero según analistas (22 may 2026).
- https://www.wcpo.com/news/northern-kentucky/package-delivery-chaos-hits-northern-kentucky-as-speedx-misdelivers-hundreds-of-orders — SpeedX: nacida en 2022, clientes y entregas equivocadas (octubre 2025).
- https://urbanomnibus.net/2026/07/temus-last-mile/ — SpeedX con centro cerca del JFK; trabajo por encargo de estas redes (julio 2026).
- https://www.teapplix.com/help/?p=10063 — Yanwen Express como transportista doméstico; recogida solo en ciertas zonas y estados; nació repartiendo para Temu.
- https://www.easyshippingx.com/en/shipping-guides/us-last-mile-delivery-carriers-analysis/ — SpeedX opera tramos internacionales y domésticos; Yanwen Express trabaja con socios de reparto (vendedor de logística con interés comercial).
- https://www.17track.net/en/carriers/yanwen — Yanwen es sobre todo exportador; el prefijo no basta para saber el transportista.
- https://parcelsapp.com/en/delivery-times/china/united-states — China → EE. UU.: mediana de 10 días; SpeedX 9, GOFO 10, USPS 10 (60 días hasta el 12 oct 2026).
- https://parcelsapp.com/en/delivery-times/hong-kong/united-states — YunExpress, 10–11 días.
- Resúmenes del buscador sobre ShipBob, WismoLabs, The Letter Pilot y foros de eBay y Amazon — qué es «etiqueta creada», 24–48 horas normales y por qué los marketplaces exigen un escaneo real.
- Resumen del buscador sobre la guía de rastreo de SpeedX (StartupEditor) — «etiqueta creada» quiere decir que SpeedX no tiene el paquete.
- Resúmenes del buscador sobre empleos de SpeedX en Montebello (Indeed; la página dio 403) y sobre la consolidación (Fulfill, Shipware, Warp) — espera de 12 a 48 horas por camión lleno; los destinos de poco volumen son el punto débil.
- https://www.freightwaves.com/news/delta-cargos-deliverdirect-offers-e-commerce-delivery-at-the-speed-of-flight y https://www.smartkargo.com/casestudies/delta-airlines — qué es DeliverDirect de Delta Cargo.
- https://assets.cushmanwakefield.com/-/pmedia/220180/0/4501-e-airport-dr-unit-b-ares-brochure-2025.pdf (vía el buscador) — el edificio del remitente, en alquiler en 2025.

**Transportistas nacionales y aduanas**

- https://www.usps.com/ship/ground-advantage.htm — Ground Advantage: 2–5 días, hasta 70 lb, $100 de seguro, desde $8,40.
- https://support.pirateship.com/en/articles/15453569-july-2026-usps-rate-and-rule-changes — cambios de USPS del 12 jul 2026.
- https://www.ship.com/post/cheapest-way-to-ship-a-package-2026 — 4 oz a $5,50–$6,36 con tarifas negociadas; tarifa publicada de menos de 1 lb a $8,40 en zona 8.
- https://www.fedex.com/content/dam/fedex/us-united-states/services/2026_Peak_Last_Day_to_ship.pdf — FedEx Ground y Home Delivery: 1 a 5 días hábiles.
- https://www.ontrac.com/ y https://www.uniuni.com/ — no publican plazos en días.
- Resumen del buscador sobre el Registro Federal (2025-16802) y KPMG — exención de minimis suspendida para todos los países desde el 29 ago 2025.

**Proveedores de EE. UU. y almacenes logísticos**

- https://topdawg.com/pricing — planes y precios de hoy; API solo en Premier.
- https://www.trustpilot.com/review/topdawg.com — 4,5–4,6 con 23 reseñas.
- https://www.wholesale2b.com/dropship-api-plan.html — qué incluye el plan API.
- https://www.trustpilot.com/review/wholesale2b.com — 4,0 con 441 reseñas; quejas de 2026.
- https://supplychain.amazon.com/mcf — MCF: 3 días hábiles estándar, 2 exprés, caja sin marca, API, recargo de 3,5 %.
- https://amzprep.com/amazon-mcf-fees/ — tarifas de MCF 2026 para hasta 4 oz y almacenaje (revisado 18 ago 2026).
- https://sell.amazon.com/pricing — plan Professional a $39,99 al mes.
- https://www.shipmonk.com/pricing — cómo se calcula el mínimo mensual.
- Resúmenes del buscador sobre ShipBob (alta y mínimos de terceros), Petra Industries (Flxpoint, Sellercloud) y TopDawg (Spocket, PickYourApp).

**España y la Unión Europea**

- https://commission.europa.eu/news-and-media/news/ensuring-fairness-and-safety-eur3-customs-duty-low-value-parcels-2026-06-29_en (vía el buscador) — el derecho de 3 € por artículo desde el 1 jul 2026.
- https://dodropshipping.com/bigbuy-pricing-plans/ — precios de los packs de BigBuy (actualizado 5 ago 2026).
- https://www.trustpilot.com/review/bigbuy.eu — 3,0 con 4.729 reseñas; quejas de 2026.
- https://www.trendtrack.io/es/blog-post/resena-de-bigbuy-es-una-opcion-confiable-para-tu-sitio-de-dropshipping — 24–48 h en la UE y problemas de sincronización (competidor con interés).
- https://apps.shopify.com/bigbuy-synchronization-app — la app de BigBuy figura como no disponible.
- https://marketing4ecommerce.net/bigbuy-facturacion-internacionalizacion/ — 105 millones de euros, 20.000 m² y 300.000 referencias (dato de 2023).
- Resúmenes del buscador sobre la página de la API de BigBuy (REST, entorno de pruebas, pedidos y seguimiento) y sobre sus transportistas (GLS, SEUR, Correos Exprés…).
- https://www.trustpilot.com/review/vidaxl.es — 2,4 con 8.131 reseñas.
- https://www.printful.com/print-on-demand-spain — 3 días hábiles a España desde Barcelona.
- Resumen del buscador sobre la ayuda de Printful — producción de 2 a 5 días hábiles.
- Resúmenes del buscador sobre dropshippingXL (30 €/mes), Dropea, Infortisa y Globomatik.
