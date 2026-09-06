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

## Dónde estamos hoy (6 sep 2026, por la tarde)

| Paso                                                                              | Estado                     | Qué lo frena                                                                                             |
| --------------------------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------- |
| Cuenta de TikTok Shop                                                             | ✅ Aprobada                | —                                                                                                        |
| 0.1 Certificados del fabricante                                                   | 🔴 Trancado                | **No sabemos quién fabrica la máquina.** Se pidió por CJ y no hay ninguna unidad en la mano ahora mismo. |
| 0.2 Fotos de las etiquetas FCC y de seguridad                                     | 🔴 Trancado                | Lo mismo: sin unidad no hay fotos.                                                                       |
| 0.3 Pesar y medir la caja                                                         | 🔴 Trancado                | Lo mismo.                                                                                                |
| 0.4 Las seis decisiones                                                           | ⬜ Pendiente de Richard    | Se pueden tomar hoy.                                                                                     |
| 0.5 Ajustes en Seller Center (banco, direcciones, envío, impuestos, devoluciones) | ⬜ Pendiente de Richard    | Se puede hacer hoy.                                                                                      |
| Fase 1 Calificación de Electrónica                                                | ⬜ Espera a 0.1–0.2        | —                                                                                                        |
| Fase 2 Publicar en TikTok Shop                                                    | ⬜ Espera a la fase 1      | —                                                                                                        |
| Contenido y campañas hacia la ficha de Mercatren                                  | ⬜ **Se puede empezar ya** | Ver la sección «Mientras llega la máquina».                                                              |

### Cómo se destranca lo del fabricante

1. **Pedir unidades a Novi ahora**: al menos una para abrir y fotografiar, y
   dos o tres más como stock real para vender con el software puesto. CJ
   tarda entre 3 y 9 días hábiles desde su almacén de EE. UU. El saldo de CJ
   ($127 el 5 sep) no alcanza para una máquina de ~$700: hay que recargar o
   pagar con tarjeta en el panel de CJ. Decisión y dinero de Richard.
2. **La etiqueta del equipo dice quién lo fabrica.** Todo aparato con Wi-Fi
   vendido en EE. UU. lleva un **FCC ID** en su etiqueta (a veces dentro del
   menú del sistema). Los primeros 3 o 5 caracteres son el código del
   fabricante, y se busca en https://fccid.io o en
   https://www.fcc.gov/oet/ea/fccid: sale el nombre de la empresa, el manual
   y las fotos del laboratorio. **Es la forma segura de saber el
   fabricante**, mejor que cualquier deducción. Ojo: si el FCC ID es del
   módulo Wi-Fi y no del equipo entero, el fabricante que sale es el del
   módulo; en ese caso el certificado que TikTok pide es el del equipo, y
   hay que ir a CJ por él.
3. **Ante TikTok somos revendedores.** Compramos hecho a CJ, así que lo que
   TikTok pide de un revendedor es **la factura de compra (de los últimos
   365 días) más las fotos de las etiquetas** con el marcado FCC y el de
   seguridad eléctrica. No hace falta conocer al fabricante para esa ruta;
   sí hace falta que las etiquetas existan. La factura de CJ sale de su
   panel (Mis pedidos → factura). Si TikTok la rechaza por no ser «del
   fabricante», entonces sí toca pedirle el certificado a CJ o al
   fabricante que diga el FCC ID.
4. **Si la máquina NO trae marcado FCC ni de seguridad eléctrica**, no entra
   en TikTok Shop, y en rigor tampoco debería venderse en Estados Unidos por
   ningún canal: la marca FCC es obligatoria por ley para equipos con radio.
   En ese caso hay que cambiar de proveedor o de modelo antes de seguir.

### Lo que hay que saber de la ficha en la web, hoy

- El POS está cargado **a mano** en Mercatren: no tiene identificador de
  CJ (comprobado el 6 sep con «Solo mirar»). Una venta en mercatren.com
  **no** dispara una compra a CJ: queda como una orden normal en Panel →
  Órdenes y **hay que despacharla a mano desde Novi** y marcarla enviada.
  Eso está bien para el modelo (nosotros ponemos el software), pero solo
  funciona si hay unidades en Novi.
- Las **52 existencias** de la ficha no son reales mientras no haya
  máquinas en Novi. Hay que ponerle el número verdadero (hoy, cero) para no
  vender lo que no hay. Se cambia desde Panel → Mis productos, sin código.
- El cobro con tarjeta en la web ya está probado (MT-000004 y MT-000011).
  Así que **mandar tráfico de TikTok a esa ficha es vender ya**, con
  Mercatren cobrando y nosotros despachando, sin esperar a TikTok Shop.

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

| #   | Quién | Qué                                                                                                                                                                                                                                  | Cómo se sabe que quedó                                                             |
| --- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| 0.0 | 👤    | **Pedir a Novi unidades del POS por CJ**: una para abrir y fotografiar, y dos o tres de stock real. Recargar CJ o pagar con tarjeta.                                                                                                 | Las máquinas están en Novi. Fecha de llegada anotada en «Decisiones tomadas».      |
| 0.1 | 👤    | Con la máquina en la mano: leer el **FCC ID** de la etiqueta, buscarlo en fccid.io para saber el fabricante, bajar la **factura de CJ**, y pedir a CJ o al fabricante el **certificado de conformidad** (FCC + seguridad eléctrica). | Factura y certificado guardados en `~/Mercatren-privado/tiktok/` (fuera del repo). |
| 0.2 | 👤    | **Fotografiar** la etiqueta del equipo y la del adaptador de corriente donde se vean el marcado FCC y el de seguridad eléctrica. Nítidas, planas, sin pegatina encima de otra.                                                       | Las fotos en la misma carpeta.                                                     |
| 0.3 | 👤    | **Pesar y medir la caja** tal como se va a despachar.                                                                                                                                                                                | Peso y medidas escritos aquí abajo, en «Decisiones tomadas».                       |
| 0.4 | 👤    | Tomar las seis decisiones de arriba.                                                                                                                                                                                                 | Escritas aquí abajo.                                                               |
| 0.5 | 👤    | En Seller Center: cuenta bancaria de cobro, dirección de almacén (Novi), dirección de devoluciones (Novi), plantilla de envío «envío gratis», y mirar Taxes y Returns.                                                               | Ningún aviso rojo en Home.                                                         |

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

## Mientras llega la máquina: contenido y campañas (se puede empezar hoy)

Lo que TikTok Shop necesita (calificación, ficha en la tienda, afiliados,
anuncios de tienda, LIVE con carrito) espera a la máquina. **Lo que NO
espera es la audiencia y el tráfico.** El destino mientras tanto es la ficha
de Mercatren, que cobra con tarjeta y ya está probada:

```
https://mercatren.com/es/producto/punto-de-venta-pos-2
```

Comprobado el 6 sep 2026 contra la documentación de TikTok para anunciantes:

| Herramienta                                    | Sirve para                                                                                                      | Qué pide                                                                                                                                                       | Costo                                                                                          |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Videos orgánicos** en la cuenta de la tienda | Construir audiencia latina y probar qué mensajes funcionan                                                      | Cuenta de empresa (ya), enlace a la ficha en la biografía                                                                                                      | $0                                                                                             |
| **Promote** (botón dentro de la app)           | Empujar un video que ya funciona; objetivo «visitas al sitio» o «mensajes»                                      | Nada más que el video                                                                                                                                          | Desde $3–10 por día, 1 a 7 días. Más caro por vista que Ads Manager, pero sin montar nada.     |
| **TikTok Ads Manager**                         | Campañas de verdad: tráfico o conversiones a la ficha, con segmentación por idioma español y por estado         | Cuenta en ads.tiktok.com (Business Center) y método de pago. Para medir compras hace falta el **píxel de TikTok** en mercatren.com (código, chico, va después) | Mínimo oficial: **$50/día por campaña y $20/día por grupo de anuncios**                        |
| **Spark Ads**                                  | Poner dinero detrás de un video orgánico (o de un creador) sin rehacerlo                                        | Autorizar el video desde la app                                                                                                                                | Los mismos mínimos de Ads Manager                                                              |
| **Afiliados** (creadores a comisión)           | Que otros vendan el POS por un porcentaje                                                                       | **El producto publicado en TikTok Shop** (fase 2)                                                                                                              | Comisión que fijamos nosotros; las guías hablan de 10–15 % en plan abierto y más si se negocia |
| **GMV Max** (anuncios de TikTok Shop)          | Anuncios automáticos que optimizan ventas de la tienda; desde julio de 2025 es el ÚNICO tipo de anuncio de Shop | El producto en TikTok Shop y Business Center                                                                                                                   | Presupuesto y retorno objetivo que fijamos                                                     |
| **LIVE con carrito**                           | Vender en directo enseñando el POS                                                                              | El producto en Shop, y TikTok pone un mínimo de seguidores para vender en LIVE (cambia; se mira en la app)                                                     | $0                                                                                             |

### A quién le hablamos y cómo

TikTok publicó su propio estudio sobre el público hispano en EE. UU.: la
mayoría es bilingüe y **responde mejor a anuncios que mezclan los dos
idiomas** que a los de un solo idioma; la **voz en español** es lo que más
mueve al público que prefiere el español (57 % más dispuesto a ver más
anuncios de esa marca), y valoran las referencias a la vida cotidiana, no
solo a la herencia. Ads Manager deja segmentar por **idioma de la app y por
idioma del contenido que la persona consume**, además de por estado.

Traducido a nuestro caso: **hablado en español, subtítulos en inglés,
palabras clave en los dos idiomas** («POS», «punto de venta», «tu negocio»,
«no monthly fees»). Público: dueños de negocios pequeños, 25 a 54 años,
Estados Unidos, idioma español; empezando por Florida, Texas, California,
Nueva York, Nueva Jersey, Illinois, Georgia y Arizona.

### Qué videos grabar (con la máquina en la mano, o con la que ya usa un cliente)

Todos verticales, de 15 a 45 segundos, con el gancho en los primeros 2
segundos y el precio dicho sin vergüenza: es un equipo de $1.000 y quien lo
busca lo compara con cuotas mensuales.

1. **«Cobra en 5 segundos»**: escanear, cobrar, imprimir el ticket. Un solo
   plano, sin hablar, con el sonido de la impresora.
2. **«Lo que te cobra un POS de alquiler al año vs. este»**: la cuenta en
   pantalla. Sin nombrar marcas ajenas.
3. **La segunda pantalla**: el cliente ve su total, y entre ventas sale la
   publicidad del negocio. Grabado desde el lado del cliente.
4. **«Enciende y vende»**: de la caja al primer ticket en un minuto. Sin
   instalar nada, sin licencias.
5. **El inventario que se descuenta solo**: vender tres cervezas y ver el
   stock bajar en el celular.
6. **Los reportes desde el celular**: «¿cuánto vendí hoy?» desde la casa.
7. **Un día en una panadería / taquería / licorería / salón** con el POS:
   una serie, un negocio por episodio. Este es el que construye audiencia.
8. **Preguntas reales respondidas**: «¿funciona sin internet?», «¿imprime
   en español?», «¿qué pasa si se va la luz?». Un video por pregunta.
9. **Unboxing con la prueba de la etiqueta**: qué trae la caja, el adaptador,
   el rollo de papel. Sirve también de prueba de lo que se entrega.
10. **Testimonio de un dueño latino** contando qué usaba antes. El más
    valioso de todos; se graba cuando haya un cliente contento.
11. **Comparación de tamaño y peso** al lado de una caja registradora
    vieja.
12. **Detrás de cámara en Novi**: empacando un pedido. Genera confianza en
    que hay alguien real despachando.

Ritmo: **un video al día** las primeras cuatro semanas, reusando tomas. Los
tres que mejor funcionen orgánicamente son los que se empujan con Promote y
después con Spark Ads.

### Cómo se arman las campañas, por etapas

| Etapa                                    | Cuándo                               | Qué se hace                                                                                                                                                                                                  | Presupuesto orientativo                                     |
| ---------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| **1. Orgánico + Promote**                | Desde hoy                            | Publicar a diario. A los 5–7 días, Promote a los 2–3 videos que mejor retienen, con objetivo «mensajes» (para un producto de $1.000 la gente pregunta antes de comprar) y «visitas al sitio» hacia la ficha. | $5–10 por día por video, 3–5 días                           |
| **2. Ads Manager, tráfico a la ficha**   | Cuando haya máquinas en Novi         | Una campaña, un grupo de anuncios, público hispano de EE. UU., 3 Spark Ads con los videos ganadores. Objetivo: tráfico, o conversiones cuando esté el píxel.                                                 | $20/día el grupo, $50/día la campaña; dos semanas de prueba |
| **3. Anuncios de TikTok Shop (GMV Max)** | Cuando el POS esté publicado en Shop | Los mismos videos, ahora con el carrito dentro de TikTok. Retorno objetivo fijado por nosotros.                                                                                                              | Se decide con los datos de la etapa 2                       |
| **4. Afiliados**                         | Con el POS en Shop                   | Plan abierto con una comisión fija, y plan dirigido invitando a 5–10 creadores hispanos de «negocios», «restaurantes», «emprendimiento».                                                                     | Solo se paga por venta                                      |
| **5. LIVE**                              | Cuando la cuenta cumpla el mínimo    | Un LIVE semanal enseñando el POS y contestando en vivo.                                                                                                                                                      | $0                                                          |

### Lo que hace falta del lado de Mercatren para medir (código, chico, después)

- El **píxel de TikTok** en mercatren.com (una etiqueta en la página y el
  evento de compra en el checkout), para que Ads Manager sepa qué anuncio
  vendió. Sin píxel se pueden comprar clics; no se pueden optimizar compras.
- Un **origen «TikTok»** en las órdenes (por el enlace con etiqueta
  `?utm_source=tiktok`), para ver en el panel cuántas ventas vinieron de ahí.

## Decisiones tomadas

_(vacío: se llena con las seis decisiones de Richard, más el peso y las medidas de la caja)_

## Preguntas abiertas

- ¿Quién fabrica la máquina? Lo dice el FCC ID de la etiqueta en cuanto haya
  una unidad en la mano. Y ¿trae marcado FCC y de seguridad eléctrica? Sin
  eso no hay calificación de Electrónica, y sin calificación no hay venta en
  TikTok Shop.
- ¿TikTok acepta la factura de CJ como «factura de compra» de un revendedor?
  Se sabe al subirla.
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
- TikTok Ads Manager · About Budget (mínimos oficiales): https://ads.tiktok.com/help/article/budget
- TikTok for Business · Bilingual ads for the Hispanic audience: https://ads.tiktok.com/business/en-US/blog/bilingual-ads-spanish-hispanic-audience
- TikTok Ads · About GMV Max migration for TikTok Shop Ads: https://ads.tiktok.com/help/article/gmv-max-migration-tiktok-shop-ads
- Búsqueda de FCC ID: https://fccid.io y https://www.fcc.gov/oet/ea/fccid
- TikTok Promote (guías de terceros: Sprout Social, MegaDigital): https://sproutsocial.com/insights/tiktok-promotion/
- Afiliados de TikTok Shop (guías de terceros: Hamster Garage, StarterX): https://www.hamstergarage.com/article/tiktok-shop-affiliate-program-guide-rates-fees
