# Plan: vender el POS de QRBott en TikTok Shop

> Escrito el 6 de septiembre de 2026, el día que TikTok aprobó la cuenta de
> empresa de MERCATREN en TikTok Shop, y **corregido esa misma tarde**: la
> primera versión hablaba del catálogo de Estados Unidos entero y estaba
> mal. Richard lo dijo así: _«si yo tuviese una tienda dentro de Amazon, tú
> no vas a conectar Amazon directamente… TikTok se conecta a MI tienda»_.
>
> **El alcance es UN producto nuestro, propio, y el envío lo hacemos
> nosotros con las etiquetas de TikTok.** Sin CJ, sin marcas de nadie, sin
> catálogo. Lo demás es complejo y puede trancar la cuenta; se deja fuera.
>
> Todo lo de abajo está comprobado contra las páginas oficiales de TikTok
> Shop (Seller University y Partner Center) el 6 sep 2026. Lo que salió de
> guías de terceros va marcado. **Cuando algo cambie, se actualiza este
> archivo en el mismo trabajo.**

## El producto

| Dato                | Valor                                                                                                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ficha               | https://mercatren.com/es/producto/punto-de-venta-pos-2                                                                                                                             |
| Nombre              | Punto de Venta POS · terminal todo en uno con doble pantalla, impresora térmica y lector de códigos integrados                                                                     |
| Marca               | **QRBott** (así está escrita en la ficha; ver la decisión de marca más abajo)                                                                                                      |
| Precio en Mercatren | $1.009,89 con el envío incluido                                                                                                                                                    |
| Existencias         | 52                                                                                                                                                                                 |
| Tienda              | `mercatren-estados-unidos` — **ojo: esa tienda tiene además 28 productos de CJ**. La conexión con TikTok se hace por PRODUCTO, nunca por tienda entera, o esos 28 se irían con él. |
| Conectividad        | Wi-Fi y Ethernet → para TikTok es un producto electrónico **con Wi-Fi**: pide el marcado FCC.                                                                                      |
| Despacho            | Desde Novi, Michigan (la dirección de la sociedad), con etiquetas compradas dentro de TikTok Shipping.                                                                             |

## Cómo sería una venta, en palabras normales

1. Alguien ve el POS en un video o en la pestaña Shop y lo compra dentro de
   TikTok. Le paga a TikTok.
2. A nosotros nos llega el pedido en Seller Center (y en la app de vendedor
   del teléfono). Alguien en Novi empaca el equipo, **compra la etiqueta en
   Seller Center** («Arrange shipment»: TikTok elige transportista, USPS,
   UPS o FedEx, según el tamaño y peso) y la imprime.
3. Se entrega el paquete al transportista o se pide recogida. **Tiene que
   estar «en tránsito» en 2 días hábiles.** El número de guía lo pone
   TikTok solo: no hay que copiar nada.
4. TikTok le cobra al comprador, se queda el 6 %, descuenta la etiqueta
   después de la entrega, y nos paga al banco.

Con números, sobre el precio actual de $1.009,89:

| Concepto                                       | Monto                                                                |
| ---------------------------------------------- | -------------------------------------------------------------------- |
| Paga el comprador                              | $1.009,89                                                            |
| Comisión de TikTok (6 %)                       | −$60,59 (los primeros 30 días, 3 %: −$30,30 según guías de terceros) |
| Etiqueta de TikTok Shipping, paquete de ~10 kg | −$30 a −$60 **(estimado; se sabe al comprar la primera)**            |
| Nos queda                                      | ≈ $890 a $920                                                        |

El precio en TikTok lo ponemos nosotros: puede ser el mismo de la web o
uno propio. En TikTok no interviene Stripe.

## Las reglas de TikTok que mandan aquí (comprobadas el 6 sep 2026)

| Regla                                                                                                                                                                                                                                                                                                                                                                                                                      | De dónde sale                                              | Qué significa para nosotros                                                                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Electrónica es una categoría con calificación previa.** Antes de publicar hay que pasar por «Qualification Center» con papeles; la mayoría se revisa en unos 6 días.                                                                                                                                                                                                                                                     | Seller University: Your Guide to Category Qualification    | **Es el camino crítico.** Sin esos papeles no se publica nada, con código o sin código.                                                                                                                              |
| Para electrónica piden: (a) **Certificado de conformidad** del laboratorio (emitido en los últimos 2 años, con las normas probadas: seguridad eléctrica y FCC), y (b) **una foto del producto o su caja donde se vea el marcado de seguridad eléctrica y el marcado FCC** (obligatorio si tiene Wi-Fi o Bluetooth). Si somos revendedores: la **factura de compra al fabricante** (de los últimos 365 días) más las fotos. | Seller University: Electronic Products Requirements        | Hay que pedirle al fabricante del POS el certificado FCC y el de seguridad eléctrica (UL/ETL o equivalente), tener la factura de compra a mano, y fotografiar las etiquetas del equipo y del adaptador de corriente. |
| **Despacho «en tránsito» en 2 días hábiles** desde que entra el pedido (vigente desde el 26 ene 2026). Sin guía en 5 días hábiles, TikTok lo cancela solo. Más del 10 % tarde → castigos.                                                                                                                                                                                                                                  | Seller University: Fulfillment Policy y Late Dispatch Rate | Alguien en Novi tiene que poder empacar y despachar en dos días, siempre. Es una persona y un proceso, no código.                                                                                                    |
| **TikTok Shipping**: la etiqueta se compra en Seller Center, TikTok elige el transportista, la guía se sube sola, y el costo se descuenta del pago después de la entrega. Pide peso y medidas exactos y una plantilla de envío. La recogida gratis («Collection by TikTok») no cubre Michigan.                                                                                                                             | Seller University: What is TikTok Shipping?                | Esto resuelve de raíz la regla de las etiquetas USPS (solo valen las compradas dentro de TikTok). Hay que pesar y medir la caja del POS antes de publicar.                                                           |
| **«No brand» es solo para productos que de verdad no llevan marca.** Para poner un nombre de marca hace falta el número de registro en la USPTO ya aprobado (no «pendiente»); TikTok manda un código al abogado de registro.                                                                                                                                                                                               | Seller University: Brand Authorization e IP Policy         | El POS lleva el nombre QRBott. Si la marca está registrada, se hace la autorización con el número. Si no, se publica como «No brand» **y se arranca el registro**. Decisión de Richard.                              |
| Comisión de TikTok: **6 %** (vigente desde el 31 oct 2024), sin cuota mensual ni por publicación. Primer mes al 3 % si la primera venta cae en los primeros 60 días (terceros).                                                                                                                                                                                                                                            | Seller University: Referral Fees · OneCart, FastMoss       | Está en la tabla de números de arriba.                                                                                                                                                                               |
| Un vendedor local de EE. UU. despacha desde Estados Unidos.                                                                                                                                                                                                                                                                                                                                                                | Seller University                                          | Novi cumple.                                                                                                                                                                                                         |
| Para una tienda propia no hay botón de conexión (los que hay son Shopify, WooCommerce y Amazon). Lo que TikTok da es el **Partner Center** para registrar una aplicación propia («Custom app»).                                                                                                                                                                                                                            | Partner Center: App development overview                   | Para UN producto despachado por nosotros **no hace falta al principio**: se publica y se atiende desde Seller Center. El puente con Mercatren va después, y solo para ese producto.                                  |

## Lo que NO se va a hacer

- **Conectar la tienda entera.** `mercatren-estados-unidos` tiene 28
  productos de CJ. La conexión, cuando exista, es por producto marcado.
- **CJ en el medio.** Ni para este producto ni para ningún otro en TikTok.
- **El almacén de CJ, Chile, Colombia, más productos.** Después, y cada uno
  con su propio plan.
- **Tocar el proyecto QRBot.** El producto se vende desde Mercatren; el
  software del POS es de otra sesión.

## Las decisiones que solo Richard toma

1. **¿QRBott está registrada en la USPTO?** Y con qué grafía: en la ficha
   dice «QRBott» con dos tes. Si está registrada → autorización de marca con
   el número. Si no → «No brand» ahora y registro en paralelo (meses).
2. **¿Somos fabricante/importador o revendedor ante TikTok?** Si el POS se
   compra hecho y se le carga nuestro software, lo más seguro es tener las
   DOS cosas: el certificado del fabricante Y la factura de compra.
3. **¿Quién empaca y despacha en Novi en 2 días hábiles?** Nombre, y qué
   pasa cuando esa persona no está.
4. **¿Cuántas unidades se ponen en TikTok?** Recomendación: **5 o 10, no
   las 52**, hasta que el puente sincronice el stock con la web. Así no se
   vende por dos canales lo que ya no hay.
5. **¿Precio en TikTok?** El mismo $1.009,89, o uno propio.
6. **Devoluciones.** Para un equipo de $1.000 hay que leer en Seller Center
   → Returns qué plazo da TikTok al comprador y quién paga el envío de
   vuelta, antes de publicar. La dirección de devolución es Novi.

## El roadmap, paso a paso

Cada paso dice quién lo hace y cómo se sabe que quedó. No se pasa al
siguiente sin la comprobación del anterior. **Sin código hasta la fase 4.**

### Fase 0 · Papeles y decisiones (esta semana)

| #   | Quién | Qué                                                                                                                                                                            | Cómo se sabe que quedó                                                        |
| --- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| 0.1 | 👤    | Pedirle al fabricante del POS el **certificado de conformidad** (FCC + seguridad eléctrica, de los últimos 2 años) y tener la **factura de compra** a mano.                    | Los dos archivos guardados en `~/Mercatren-privado/tiktok/` (fuera del repo). |
| 0.2 | 👤    | **Fotografiar** la etiqueta del equipo y la del adaptador de corriente donde se vean el marcado FCC y el de seguridad eléctrica. Nítidas, planas, sin pegatina encima de otra. | Las fotos en la misma carpeta.                                                |
| 0.3 | 👤    | **Pesar y medir la caja** tal como se va a despachar.                                                                                                                          | Peso y medidas escritos aquí abajo, en «Decisiones tomadas».                  |
| 0.4 | 👤    | Tomar las seis decisiones de arriba.                                                                                                                                           | Escritas aquí abajo.                                                          |
| 0.5 | 👤    | En Seller Center: cuenta bancaria de cobro, dirección de almacén (Novi), dirección de devoluciones (Novi), plantilla de envío «envío gratis», y mirar Taxes y Returns.         | Ningún aviso rojo en Home.                                                    |

### Fase 1 · Calificación de Electrónica (unos 6 días de espera de TikTok)

| #   | Quién | Qué                                                                                                                                                          | Cómo se sabe que quedó                                                |
| --- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| 1.1 | 👤    | Seller Center → My Account → Qualification Center → Category Qualification → Electronics → subir los papeles de la fase 0. Croquis casilla por casilla, mío. | Qualification Center dice «Approved» en Electronics.                  |
| 1.2 | 👤    | Si QRBott está registrada: Brand Authorization con el número de registro; el código llega al abogado de registro y hay 10 días para ponerlo.                 | La marca aparece autorizada. Si no hay registro, este paso no existe. |

### Fase 2 · Publicar el POS a mano (un día)

| #   | Quién | Qué                                                                                                                                                                                                       | Cómo se sabe que quedó                                                       |
| --- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 2.1 | 💻    | Preparar el texto de la ficha para TikTok en inglés y en español, a partir de la ficha de Mercatren: título limpio, puntos clave, sin código interno.                                                     | El texto está en este archivo para copiar y pegar.                           |
| 2.2 | 👤    | Seller Center → Products → Add product → «Add manually»: título, fotos (las de Mercatren), categoría Electrónica, marca (según la decisión 1), precio, **stock de 5 o 10**, peso y medidas. Croquis, mío. | El producto sale «Live» en Products (TikTok revisa la ficha uno o dos días). |
| 2.3 | 👤    | Enlazar el producto a la vitrina de la cuenta y a un video corto del POS funcionando (imprimiendo un ticket, escaneando).                                                                                 | El video muestra el producto con el enlace de compra.                        |

### Fase 3 · La primera venta, mirada paso a paso

| #   | Quién | Qué                                                                                                                                                                                                                       | Cómo se sabe que quedó                                                               |
| --- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 3.1 | 👤    | Al primer pedido (real o de prueba tuya): empacar, comprar la etiqueta en Seller Center, imprimir, despachar **el mismo día o el siguiente**. Yo te paso el croquis de «Arrange shipment» antes de que llegue el primero. | Seller Center muestra el pedido «In Transit» dentro de los 2 días hábiles, con guía. |
| 3.2 | 👤    | Ver que el paquete llegue y que TikTok haga el pago al banco (menos el 6 % y la etiqueta).                                                                                                                                | El pago aparece en Seller Center → Finance y en el banco.                            |
| 3.3 | 💻    | Anotar en `VERIFICAR-PAGOS.md` el canal TikTok como PROBADO, con fecha y número de pedido, y el costo real de la etiqueta en este archivo.                                                                                | Las líneas existen.                                                                  |

### Fase 4 · El puente con Mercatren (después, y solo para lo marcado)

Esto es lo que convierte «vender por TikTok» en «vender por TikTok desde
Mercatren»: el stock en un solo sitio, la venta registrada en Mercatren con
su factura de Mercatren LLC, y el precio cambiado una sola vez. **No hace
falta para vender; hace falta para no llevar dos inventarios a mano.**

| #   | Quién | Qué                                                                                                                                                                                                                                         | Cómo se sabe que quedó                                                         |
| --- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 4.1 | 👤    | Registrarse en partner.us.tiktokshop.com como desarrollador de la propia tienda («Seller in-house developer», mismo correo de la tienda) y crear la «Custom app». Croquis, mío. Se puede hacer en paralelo a la fase 1: es solo una cuenta. | App Key y App Secret a la vista (aprobación 2–3 días hábiles, según terceros). |
| 4.2 | 💻    | Marca **«Publicar en TikTok»** por producto en Mis productos. Solo aparece en productos de EE. UU. que despacha Mercatren, nunca en los de CJ.                                                                                              | La marca existe y un producto de CJ no la tiene.                               |
| 4.3 | 💻    | Stock: cada venta en TikTok baja el stock en Mercatren y al revés.                                                                                                                                                                          | Vender uno en TikTok deja 51 en la web.                                        |
| 4.4 | 💻    | El pedido de TikTok entra en Mercatren como venta (con su factura), y la guía de TikTok queda en el pedido.                                                                                                                                 | Panel → Órdenes muestra la venta con origen «TikTok».                          |
| 4.5 | 💻    | El vigilante avisa en rojo si un pedido de TikTok lleva 24 h sin guía.                                                                                                                                                                      | Correo del vigilante con la sección de TikTok.                                 |

## Decisiones tomadas

_(vacío: se llena con las seis decisiones de Richard, más el peso y las medidas de la caja)_

## Preguntas abiertas

- ¿El fabricante entrega el certificado FCC y el de seguridad eléctrica? Sin
  eso no hay calificación de Electrónica, y sin calificación no hay venta.
- ¿Cuánto cuesta de verdad la etiqueta de TikTok Shipping para la caja del
  POS? Se sabe en la primera compra y se anota aquí.
- ¿TikTok cobra y declara el impuesto de venta por nosotros? Es lo normal
  en un marketplace de Estados Unidos, pero se comprueba en Seller Center →
  Taxes antes de la primera venta, no se supone.

## Fuentes (leídas el 6 sep 2026)

- Seller University · Your Guide to Category Qualification: https://seller-us.tiktok.com/university/essay?knowledge_id=1707918207813422
- Seller University · Electronic Products Requirements: https://seller-us.tiktok.com/university/essay?knowledge_id=1418345612003114&lang=en
- Seller University · What is TikTok Shipping?: https://seller-us.tiktok.com/university/essay?knowledge_id=1830506744514347&lang=en
- Seller University · Fulfillment Policy: https://seller-us.tiktok.com/university/essay?knowledge_id=3995852763301633
- Seller University · Late Dispatch Rate: https://seller-us.tiktok.com/university/essay?knowledge_id=3668989549299511
- Seller University · Valid Tracking Rate: https://seller-us.tiktok.com/university/essay?knowledge_id=1274968588748558&lang=en
- Seller University · Customer Order Shipping Requirements: https://seller-us.tiktok.com/university/essay?knowledge_id=6837879804970754&lang=en
- Seller University · Brand Authorization: https://seller-us.tiktok.com/university/essay?knowledge_id=2419888845686570
- Seller University · Intellectual Property Policy: https://seller-us.tiktok.com/university/essay?knowledge_id=6837901778306818&lang=en
- Seller University · Referral Fees: https://seller-us.tiktok.com/university/essay?knowledge_id=5988482086864682
- Partner Center · App development overview: https://partner.tiktokshop.com/docv2/page/64f198e74830a5028854bf8f
- Partner Center US: https://partner.us.tiktokshop.com/
- Regla de etiquetas USPS 2026 (GeekSeller): https://www.geekseller.com/blog/tiktok-shop-usps-label-policy-change-for-2026-what-sellers-and-geekseller-users-need-to-know/
- Comisiones 2026 (OneCart): https://www.getonecart.com/tiktok-shop-seller-fees/
- Guía de la app custom (KeyAPI): https://www.keyapi.ai/blog/tiktok-shop-api-integration-guide-sellers/
