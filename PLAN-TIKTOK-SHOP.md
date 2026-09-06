# Plan: vender en TikTok Shop solo lo nuestro

> Escrito el 6 de septiembre de 2026, el día que TikTok aprobó la cuenta de
> empresa de MERCATREN en TikTok Shop (Seller Center dice «Approved» y pide
> «complete 2 steps to begin selling»). Lo pidió Richard con dos condiciones
> que mandan sobre todo lo demás: **solo los productos de nuestra propia
> tienda** —las marcas de la casa de Estados Unidos— y **nada de marcas
> chinas ni de terceros**. Y sin tocar código hasta acordar el plan.
>
> Todo lo de abajo está comprobado contra las páginas oficiales de TikTok
> Shop (Seller University y Partner Center) el 6 sep 2026. Lo que salió de
> guías de terceros va marcado así. **Cuando algo de aquí cambie, se
> actualiza este archivo en el mismo trabajo.**

## En dos líneas

TikTok Shop no «se conecta» con Mercatren con un botón: los botones que hay
son para Shopify, WooCommerce y Amazon. Para una tienda propia, TikTok da un
**Partner Center** donde uno registra su propia aplicación («Custom app»,
para la tienda de uno), y esa aplicación es la que publica productos,
recibe los pedidos y devuelve el número de guía. Eso es lo que hay que
construir: un puente entre Mercatren y TikTok, con Mercatren en el medio
(precio, factura, compra a CJ, tracking), exactamente como hoy.

## Cómo funciona una venta por TikTok, en palabras normales

1. Alguien ve el producto en TikTok (en el video, en la vitrina de la
   cuenta o en la pestaña Shop) y lo compra **dentro de TikTok**. Paga a
   TikTok, no a nosotros.
2. TikTok nos avisa del pedido con la dirección del comprador. Mercatren lo
   recibe como recibe hoy una venta de la web: lo compra a CJ, CJ despacha
   desde su almacén de Estados Unidos.
3. Mercatren le devuelve a TikTok el número de guía. **Eso tiene que pasar
   en 2 días hábiles** o TikTok lo cuenta como despacho tardío.
4. TikTok le cobra al comprador, se queda su comisión (6 %) y nos paga a
   nuestro banco. Mercatren LLC sigue siendo quien vende y factura: el
   modelo de compra y reventa no cambia, solo cambia la vitrina.

Ejemplo con números: una lámpara que en mercatren.com se vende a $40. En
TikTok, de esos $40 TikTok se queda $2,40 (6 %) y nos paga $37,60. De ahí
sale lo que le pagamos a CJ (producto + flete) y lo que queda es nuestro.
**En TikTok no interviene Stripe**, así que el precio se arma distinto al de
la web: costo + flete + 6 % de TikTok + nuestro margen. Eso es una fórmula
nueva por canal, y se escribe cuando toque el código.

## Las reglas de TikTok que deciden el diseño (comprobadas el 6 sep 2026)

| Regla                                                                                                                                                                                                                                          | De dónde sale                                                 | Qué significa para nosotros                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Un pedido normal tiene que estar «In Transit» en 2 días hábiles** desde que entra (vigente desde el 26 ene 2026). Si en 5 días hábiles no hay guía, TikTok lo cancela solo.                                                                  | Seller University: Fulfillment Policy y Late Dispatch Rate    | CJ tiene que despachar en 1–2 días. **Hay que medirlo antes de vender**: cuánto tardó CJ en mover las dos compras de prueba del 5 sep.                         |
| Si más del **10 %** de los pedidos salen tarde, TikTok castiga (límite de pedidos, pagos demorados). Guías válidas: **95 % o más**.                                                                                                            | Seller University: LDR y VTR                                  | El puente tiene que subir la guía real de CJ en cuanto exista, solo, sin que nadie la copie a mano.                                                            |
| **Las etiquetas de USPS deben comprarse dentro de TikTok Shipping** desde el 1 ene 2026; una etiqueta USPS comprada por fuera se rechaza. UPS, FedEx y DHL no tienen esa regla.                                                                | Anuncio de TikTok (resumido por GeekSeller, ParcelPath)       | **CJ despacha muchas veces con USPS con su propia etiqueta.** Es la pregunta abierta número uno: hay que probarla con un pedido real antes de abrir la tienda. |
| TikTok anunció que el «Seller Shipping» (despachar con transportista propio) se acababa el 31 mar 2026, y **lo revirtió el 17 feb 2026**. Sigue permitido.                                                                                     | Digiday, Easyship (23 feb 2026)                               | El modelo con CJ sigue siendo válido. Si vuelven a anunciarlo, se revisa este plan.                                                                            |
| Un vendedor local de EE. UU. despacha desde Estados Unidos.                                                                                                                                                                                    | Seller University (envío) y la propia CJ                      | Solo productos del **almacén de EE. UU.** de CJ. Nada de China, nada de Chile/Colombia.                                                                        |
| **«No brand» es solo para productos de verdad sin marca.** Poner «No brand» a algo que lleva una marca visible se sanciona.                                                                                                                    | Seller University: Brand Authorization e IP Policy            | Publicar como «No brand» SOLO lo que no lleve marca ni logo en el producto ni en las fotos. Es justo lo que pidió Richard.                                     |
| Para usar **nuestro propio nombre de marca** en la casilla «Brand», TikTok exige el número de registro de la marca en la USPTO (no vale «pendiente») y manda un código al abogado de registro.                                                 | Seller University: Brand Authorization                        | Las tiendas de la casa (Sole & Thread, Ridgeback…) **no** pueden ir en la casilla de marca hoy. Decisión de Richard: registrar una marca o ir sin marca.       |
| Comisión de TikTok: **6 %** del precio en casi todo (5 % en joyería y usado), sin cuota mensual ni por publicación. Vigente desde el 31 oct 2024.                                                                                              | Seller University: Referral Fees                              | Entra en la fórmula de precio del canal.                                                                                                                       |
| Los vendedores nuevos que hacen su primera venta en 60 días pagan **3 % durante 30 días** (guías de terceros; comprobar en Seller Center).                                                                                                     | OneCart, FastMoss, Darkroom                                   | Conviene que la primera venta real ocurra cuando el circuito ya esté probado, para aprovechar el mes barato.                                                   |
| La aplicación propia se crea en **Partner Center** como «Custom app» (para la tienda de uno), con el mismo acceso que las públicas. La aprobación tarda **2–3 días hábiles** (terceros). Hay «tiendas de desarrollo» para probar sin clientes. | Partner Center (App development overview), Unified.to, KeyAPI | Registro primero, código después. Las esperas de TikTok marcan el ritmo, no nosotros.                                                                          |

## Lo que NO se va a hacer, y por qué

- **Conectar CJ directo a TikTok** (CJ tiene su propio conector). Publicaría
  el catálogo de CJ tal cual —sus fotos, sus nombres, sus marcas chinas— y
  sacaría a Mercatren del medio: sin nuestro precio, sin nuestra factura, sin
  nuestro control de qué se vende. Es exactamente lo contrario de lo pedido.
- **Publicar el almacén completo.** En TikTok se empieza con **pocos
  productos elegidos a mano** (5 a 20), sin marca, con fotos limpias, que
  CJ tenga en Estados Unidos con stock. TikTok limita a los vendedores
  nuevos y castiga rápido; cien mil fichas de golpe es la forma de que
  cierren la cuenta la primera semana.
- **Vender marcas de terceros** ni «inspiradas en». Ni una.
- **Chile y Colombia por TikTok.** Es otra cuenta, otro país y otras
  reglas. Cuando EE. UU. funcione, se mira.

## Las decisiones que solo Richard toma (antes de arrancar)

1. **¿Con qué productos empezamos?** Propuesta: entre 5 y 20 productos de
   nuestras tiendas de EE. UU. que (a) no lleven ninguna marca visible,
   (b) tengan stock en el almacén de CJ en Estados Unidos, (c) tengan buen
   margen después del 6 % de TikTok, y (d) sean de una o dos categorías que
   se presten a video (hogar, cocina, mascotas, accesorios).
2. **¿Marca propia o «No brand»?** Registrar una marca en la USPTO cuesta
   dinero y meses, y TikTok no acepta registros pendientes. Recomendación:
   **arrancar como «No brand»**, y decidir el registro cuando haya ventas.
3. **¿Quién graba los videos?** TikTok Shop vende por video. Sin contenido no
   hay ventas aunque el puente funcione perfecto. Los quince videos de
   «Tu Próximo Producto Ganador» son un punto de partida.
4. **¿Creadores afiliados sí o no?** TikTok deja pagarle una comisión a
   creadores que enseñen el producto. Es dinero extra por venta y se decide
   producto por producto. No hace falta para arrancar.

## El roadmap, paso a paso

Cada paso dice quién lo hace y cómo se sabe que quedó. **No se pasa al
siguiente sin la comprobación del anterior.** Y no se anuncia nada ni se
manda a nadie a comprar por TikTok hasta el paso 9: es la regla de la casa
(`VERIFICAR-PAGOS.md`).

### Fase 0 · Dejar la cuenta lista (esta semana)

| #   | Quién | Qué                                                                                                                                                                                                                                    | Cómo se sabe que quedó                                                                                                      |
| --- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 0.1 | 👤    | Tomar las cuatro decisiones de arriba (productos, marca, videos, afiliados).                                                                                                                                                           | Están escritas en este archivo, en la sección siguiente.                                                                    |
| 0.2 | 👤    | En Seller Center comprobar que están cargados: la cuenta bancaria donde TikTok paga (Chase o Mercury), la dirección de devoluciones (Novi, la misma del registro), la dirección de almacén de salida, y la configuración de impuestos. | Seller Center no muestra ningún aviso rojo en Home ni en «Settings».                                                        |
| 0.3 | 💻    | Medir con las dos compras de prueba del 5 sep (PRUEBA-20260905184139 y …205642) **cuántos días tardó CJ en entregar una guía y con qué transportista**.                                                                                | Los dos números escritos aquí. Si CJ tardó más de 2 días hábiles, se cambia de transportista o de producto antes de seguir. |
| 0.4 | 💻    | Preguntarle a CJ (soporte o su propia guía de TikTok) **qué etiqueta usan para pedidos de TikTok**: si compran la de USPS por fuera, TikTok la rechaza.                                                                                | Respuesta escrita aquí, con fecha.                                                                                          |

### Fase 1 · La aplicación en Partner Center (una semana, por las esperas de TikTok)

| #   | Quién | Qué                                                                                                                                                                                                         | Cómo se sabe que quedó                                                               |
| --- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1.1 | 👤    | Registrarse en **partner.us.tiktokshop.com** como desarrollador de la propia tienda («Seller in-house developer»), con el MISMO correo que administra la tienda. Yo te paso el croquis casilla por casilla. | Partner Center dice que la cuenta de desarrollador está aprobada (2–3 días hábiles). |
| 1.2 | 💻    | Preparar en Mercatren la dirección de vuelta que TikTok pide en el formulario de la app (la «Redirect URL»), para que exista antes de que la pegues.                                                        | La dirección responde en producción.                                                 |
| 1.3 | 👤    | Crear la app: tipo **Custom app**, mercado Estados Unidos, la dirección de vuelta que te doy, y los permisos de productos, pedidos, envíos e inventario. Croquis incluido.                                  | TikTok muestra el **App Key** y el **App Secret**.                                   |
| 1.4 | 👤    | Pegar App Key y App Secret en las variables del sitio en YaDominios Cloud (te digo el nombre exacto de cada casilla).                                                                                       | El canario `/datos/salud` dice `tiktok: configurado`.                                |
| 1.5 | 👤    | Abrir el enlace de autorización que genera Mercatren, entrar con la cuenta de la tienda y pulsar «Authorize».                                                                                               | Panel → Equipo → TikTok Shop dice «Tienda MERCATREN conectada» con la fecha.         |

### Fase 2 · El puente (código, unos 4–6 días de trabajo míos)

| #   | Quién | Qué                                                                                                                                                           | Cómo se sabe que quedó                                                              |
| --- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 2.1 | 💻    | En Mis productos, una marca **«Publicar en TikTok»** por producto, solo para productos de EE. UU. sin marca. Nada se publica solo.                            | La marca existe, y un producto de Venezuela o de Chile no la tiene.                 |
| 2.2 | 💻    | El precio del canal: fórmula propia (costo + flete + 6 % + margen), separada de la de la web, pura y con pruebas.                                             | Una prueba con números fijos, comprobada en rojo.                                   |
| 2.3 | 💻    | Publicar la ficha en TikTok: título limpio (sin marcas, sin código de CJ), fotos, precio, stock, categoría de TikTok, «No brand».                             | El producto aparece en Seller Center → Products con estado «Live» o «In review».    |
| 2.4 | 💻    | Recibir el pedido de TikTok (aviso automático) y crearlo en Mercatren como una venta más, con su factura de Mercatren LLC y **la compra a CJ que ya existe**. | Un pedido de prueba de TikTok aparece en Panel → Órdenes y en Pedidos al proveedor. |
| 2.5 | 💻    | Devolverle a TikTok la guía de CJ en cuanto exista, y el stock cada vez que cambie.                                                                           | El pedido en Seller Center pasa a «In Transit» solo, con la guía correcta.          |
| 2.6 | 💻    | El vigilante mira TikTok: pedidos sin guía a las 24 h en rojo, y el conteo de los cuatro indicadores de TikTok en su tablero.                                 | Correo del vigilante con la sección de TikTok.                                      |

### Fase 3 · Probar de punta a punta (una semana)

| #   | Quién | Qué                                                                                                                                         | Cómo se sabe que quedó                                                                                                                      |
| --- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1 | 💻    | Todo el circuito contra la **tienda de desarrollo** de TikTok (sin clientes reales): publicar, pedido, compra a CJ, guía de vuelta.         | Los pasos en verde en Panel → Equipo → TikTok Shop, con la respuesta cruda de TikTok en cada uno.                                           |
| 3.2 | 👤    | **Una compra real por TikTok**, con tu tarjeta, de uno de los productos publicados. Solo cuando yo diga que todo lo anterior está en verde. | TikTok muestra el pedido, Mercatren lo crea, CJ lo despacha, la guía vuelve a TikTok en menos de 2 días hábiles, y **te llega el paquete**. |
| 3.3 | 💻    | Marcar en `VERIFICAR-PAGOS.md` el canal TikTok como PROBADO, con la fecha y el número del pedido.                                           | La línea existe.                                                                                                                            |

### Fase 4 · Abrir (después de la prueba real)

| #   | Quién | Qué                                                                                                              | Cómo se sabe que quedó                                                         |
| --- | ----- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 4.1 | 👤    | Publicar los videos de los productos elegidos y enlazarlos a la vitrina.                                         | Los videos tienen el producto enlazado.                                        |
| 4.2 | 💻    | Revisar cada día, la primera semana, los cuatro indicadores de TikTok (despacho, guías, entrega, cancelaciones). | Ninguno fuera de rango; si alguno se acerca, se para de publicar y se corrige. |
| 4.3 | 👤    | Decidir si se suman más productos, afiliados, o el registro de marca.                                            | Decisión escrita aquí.                                                         |

## Decisiones tomadas

_(vacío: se llena cuando Richard decida los cuatro puntos de arriba)_

## Preguntas abiertas (se cierran en la Fase 0)

- ¿Con qué transportista y en cuántos días despachó CJ las pruebas del 5 sep?
- ¿CJ compra etiquetas de USPS por fuera de TikTok para pedidos de TikTok?
- ¿TikTok cobra y declara el impuesto de venta por nosotros (como Amazon)?
  Es lo normal en Estados Unidos para un marketplace, pero se comprueba en
  Seller Center → Taxes antes de la primera venta, no se supone.

## Fuentes (leídas el 6 sep 2026)

- Partner Center · App development overview: https://partner.tiktokshop.com/docv2/page/64f198e74830a5028854bf8f
- Partner Center US: https://partner.us.tiktokshop.com/
- Seller University · Fulfillment Policy: https://seller-us.tiktok.com/university/essay?knowledge_id=3995852763301633
- Seller University · Late Dispatch Rate: https://seller-us.tiktok.com/university/essay?knowledge_id=3668989549299511
- Seller University · Valid Tracking Rate: https://seller-us.tiktok.com/university/essay?knowledge_id=1274968588748558&lang=en
- Seller University · Customer Order Shipping Requirements: https://seller-us.tiktok.com/university/essay?knowledge_id=6837879804970754&lang=en
- Seller University · Brand Authorization: https://seller-us.tiktok.com/university/essay?knowledge_id=2419888845686570
- Seller University · Intellectual Property Policy: https://seller-us.tiktok.com/university/essay?knowledge_id=6837901778306818&lang=en
- Seller University · Referral Fees: https://seller-us.tiktok.com/university/essay?knowledge_id=5988482086864682
- Regla de etiquetas USPS 2026 (GeekSeller): https://www.geekseller.com/blog/tiktok-shop-usps-label-policy-change-for-2026-what-sellers-and-geekseller-users-need-to-know/
- Reversión del fin del Seller Shipping (Easyship, 23 feb 2026): https://www.easyship.com/blog/tiktok-shop-reverses-us-shipping-mandate
- Guía de la app custom (Unified.to): https://unified.to/blog/how_to_setup_a_tiktok_shop_application
- Guía de integración (KeyAPI): https://www.keyapi.ai/blog/tiktok-shop-api-integration-guide-sellers/
- Conector CJ ↔ TikTok US: https://cjdropshipping.com/article-details/A-Guidance-to-TikTok--US-Connection
- Comisiones 2026 (OneCart): https://www.getonecart.com/tiktok-shop-seller-fees/
