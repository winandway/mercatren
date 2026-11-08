# La ficha de Mercatren en Google Play

> Creada el 27 oct 2026. Es la fuente de lo que se pega en Play Console. Si se
> cambia algo en la consola, se cambia aquí también.

## Datos de la app

| Casilla                        | Valor                                                    |
| ------------------------------ | -------------------------------------------------------- |
| Cuenta de desarrollador        | Divoox (organización), en la cuenta de Google de Windoce |
| Paquete                        | `com.mercatren.app` (no se puede cambiar nunca)          |
| Tipo                           | App · Gratis                                             |
| Idioma principal               | Inglés (Estados Unidos)                                  |
| Traducción                     | Español (Estados Unidos)                                 |
| Categoría                      | Compras (Shopping)                                       |
| Correo de contacto             | hola@mercatren.com                                       |
| Sitio web                      | https://mercatren.com                                    |
| Política de privacidad         | https://mercatren.com/en/privacy                         |
| Borrar la cuenta (Data safety) | https://mercatren.com/en/delete-account                  |
| Países                         | Solo Estados Unidos (el .com vende solo allí)            |
| Anuncios                       | No tiene                                                 |

## Textos en inglés (principal)

**Nombre** (27/30)

```
Mercatren: Shop U.S. Stores
```

**Descripción corta** (58/80)

```
Shop from independent U.S. stores, delivered to your door.
```

**Descripción completa** (1124/4000)

```
Mercatren brings independent stores together in one place. Browse, compare, and check out securely with your card. Every order is sold and invoiced by Mercatren LLC, a U.S. company based in Michigan.

WHAT YOU CAN DO
• Browse and search products from independent stores.
• See the full price up front, with shipping included where it applies. No surprises at checkout.
• Pay securely with your credit or debit card.
• Follow every order from payment to delivery, with the tracking number right in your account.
• Open your own store and sell with the same account: add products with your phone's camera.
• Report a product or a store, and block a seller, right from the product page. You can see and undo your blocks in Account.

WHY MERCATREN
• One account to shop, track orders, and sell.
• Clear prices and a documented record of every purchase.
• Fully bilingual: use the app in English or Spanish.
• A real team behind it. Questions? Write to hola@mercatren.com.

YOUR DATA, YOUR CHOICE
You can delete your account at any time, right from the app or at mercatren.com/delete-account.

Mercatren LLC · Novi, Michigan, USA
```

## Textos en español

**Nombre** (29/30)

```
Mercatren: tiendas de EE. UU.
```

**Descripción corta** (68/80)

```
Compra en tiendas independientes de EE. UU. y recíbelo en tu puerta.
```

**Descripción completa** (1185/4000)

```
Mercatren reúne tiendas independientes en un solo lugar. Mira, compara y paga con tu tarjeta de forma segura. Cada pedido lo vende y lo factura Mercatren LLC, una empresa de Estados Unidos con sede en Michigan.

LO QUE PUEDES HACER
• Ver y buscar productos de tiendas independientes.
• Ver el precio completo desde el principio, con el envío incluido donde aplica. Sin sorpresas al pagar.
• Pagar de forma segura con tu tarjeta de crédito o débito.
• Seguir cada pedido desde el pago hasta la entrega, con el número de guía en tu cuenta.
• Abrir tu propia tienda y vender con la misma cuenta: sube productos con la cámara del celular.
• Denunciar un producto o una tienda y bloquear a un vendedor, desde la ficha del producto. Ves y deshaces tus bloqueos en Cuenta.

POR QUÉ MERCATREN
• Una sola cuenta para comprar, seguir tus pedidos y vender.
• Precios claros y un registro documentado de cada compra.
• Totalmente bilingüe: usa la app en español o en inglés.
• Un equipo real detrás. ¿Preguntas? Escríbenos a hola@mercatren.com.

TUS DATOS, TU DECISIÓN
Puedes borrar tu cuenta cuando quieras, desde la app o en mercatren.com/delete-account.

Mercatren LLC · Novi, Michigan, EE. UU.
```

## Notas de la versión (nuevas, 8 nov 2026 — sin subir)

Inglés:

```
Shop from independent U.S. stores and pay securely with your card. Report a product or a store, or block a seller, from the three-dot menu. You can see and undo your blocks in Account.
```

Español:

```
Compra en tiendas independientes de EE. UU. y paga con tu tarjeta de forma segura. Denuncia un producto o una tienda, o bloquea a un vendedor, desde el menú de tres puntos. Ves y deshaces tus bloqueos en Cuenta.
```

## Lo que hay que cambiar en la consola (8 nov 2026 — NO se sube sin el sí de Richard)

La consola guarda todavía la ficha del 27 oct, que promete miles de
productos, búsqueda por foto, videos de tiendas y casillero en Miami. El texto
de arriba (nombre, descripción corta y completa, en-US, es-US y es-419) ya no
dice nada de eso y es el que se pega. Además:

- **Notas de la versión**: las de este archivo, en los tres idiomas.
- **Política de privacidad**: cambiar a https://mercatren.com/en/privacy
  (la consola tiene la dirección vieja en español, que redirige).
- **Seguridad de los datos**: sumar «Identificadores del aparato» (Stripe) y
  quitar del motivo de Fotos la búsqueda por foto y de Otra información el
  documento del casillero (tabla de abajo, ya corregida).
- **Capturas**: las ocho de teléfono y las cuatro de tableta enseñan el
  catálogo de CJ borrado, la búsqueda por foto y el casillero. Se rehacen con
  `fuente/` cuando la tienda de Estados Unidos tenga productos reales; hasta
  entonces no hay qué fotografiar (decisión de Richard en `PENDIENTES.md`).

## Imágenes

Todas en esta carpeta, hechas con capturas reales del sitio (las plantillas y el
script para rehacerlas están en `fuente/`):

- Ícono 512 × 512: `icono-512.png`
- Gráfico destacado 1024 × 500: `grafico-destacado-en.png` y `grafico-destacado-es.png`
- Teléfono, 8 por idioma, 1080 × 1920: `telefono-en-01.png` … `telefono-es-08.png`
- Tableta, 4 por idioma, 1080 × 1920: `tableta-en-01.png` … `tableta-es-04.png`

## Reglas de los textos

- Nada de plazos de entrega: el «2 a 5 días» está desmentido por la medición de
  CJ (ver `PLAN-B-PROVEEDORES.md`).
- Nada del vocabulario prohibido del proyecto (`CLAUDE.md`): ni
  «transfronterizo», ni «agente», ni «billetera», ni «comisión».
- Mercatren LLC vende y factura: así se dice.

## Lo que se respondió en Play Console (27 oct 2026)

| Sección                    | Respuesta                                                                                                                      | Estado      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| Política de privacidad     | https://mercatren.com/en/privacy                                                                                               | Guardada    |
| Anuncios                   | No tiene                                                                                                                       | Guardada    |
| ID de publicidad           | No lo usa (la app no pide `AD_ID`)                                                                                             | Guardada    |
| Apps gubernamentales       | No                                                                                                                             | Guardada    |
| Funciones financieras      | Ninguna (Mercatren vende y factura; no es servicio de pagos)                                                                   | Guardada    |
| Apps de salud              | Ninguna                                                                                                                        | Guardada    |
| Clasificación (IARC)       | «El resto de los tipos de app»; contenido de usuarios con denuncia y bloqueo; lenguaje ligeramente obsceno posible en catálogo | Guardada    |
| Seguridad de los datos     | 14 tipos recopilados, ninguno compartido, cifrado en tránsito, cuenta con usuario y contraseña, borrado en /delete-account     | Enviada     |
| Detalles de acceso         | Cuenta «Mario Soporte» (revisor.usuario@mercatren.com); la contraseña la puso Richard                                          | Guardada    |
| Público objetivo           | Solo 18 años o más (se compra con tarjeta)                                                                                     | Bloqueada   |
| Ficha de Play Store        | en-US, es-US y es-419, con todas las imágenes                                                                                  | Guardada    |
| Configuración de la tienda | Compras · hola@mercatren.com · https://mercatren.com                                                                           | Guardada    |
| Países                     | Solo Estados Unidos                                                                                                            | Guardada    |
| Versión de producción      | 1 (1.0.0), notas en los tres idiomas                                                                                           | En revisión |

### Seguridad de los datos, tipo por tipo

Todos «recopilados», ninguno «compartido» (Stripe y los demás proveedores son
encargados nuestros; lo que va al comercio al que se le compra lo inicia la
persona). Ninguno efímero.

| Dato                        | ¿Obligatorio? | Para qué                                                                  |
| --------------------------- | ------------- | ------------------------------------------------------------------------- |
| Nombre                      | Sí            | Funciones, seguridad y fraude, administrar la cuenta                      |
| Correo                      | Sí            | Funciones, comunicaciones, seguridad, cuenta                              |
| ID de usuario               | Sí            | Funciones, cuenta                                                         |
| Dirección                   | Opcional      | Funciones, seguridad                                                      |
| Teléfono                    | Opcional      | Funciones, seguridad                                                      |
| Otra información personal   | Opcional      | Funciones, seguridad (datos fiscales y de cobro del comercio)             |
| Historial de compras        | Sí            | Funciones, seguridad, cuenta                                              |
| Información de pago         | Opcional      | Funciones, seguridad (la tarjeta la procesa Stripe)                       |
| Fotos                       | Opcional      | Funciones, seguridad (fotos de productos, comprobantes)                   |
| Videos                      | Opcional      | Funciones (videos de las tiendas)                                         |
| Archivos y documentos       | Opcional      | Funciones, seguridad                                                      |
| Interacciones en la app     | Sí            | Funciones, estadísticas, personalización                                  |
| Historial de búsqueda       | Opcional      | Funciones, estadísticas                                                   |
| Otro contenido de usuarios  | Opcional      | Funciones (comentarios, opiniones, preguntas)                             |
| Identificadores del aparato | Opcional      | Seguridad y prevención de fraude (los recoge Stripe al pagar con tarjeta) |

### Detalles de acceso: lo que va en la casilla de instrucciones

```
Browsing the catalog, search, product pages and the cart work without signing in. Sign in with the account above to test checkout, order tracking (My orders), opening a store and adding a product (camera), reporting and blocking (three-dot menu on a product page; undo blocks in Account > Blocked sellers) and account deletion. Please do not complete a real card payment. To delete the account: My account > three-dot menu > Delete my account, then type DELETE. The same page is available at https://mercatren.com/en/delete-account
```

## Enviada a revisión (27 oct 2026)

Los doce cambios se mandaron a revisión el 27 oct 2026 por la tarde. La
«publicación administrada» está apagada: cuando Google la apruebe, sale sola
en Google Play. Google dice que suele tardar 7 días o menos.

## Lo que queda para publicar

1. Esperar la respuesta de Google (llega al correo de la cuenta de
   desarrollador y se ve en «Descripción general de la publicación»).
2. Cuando esté aprobada: la guía pública «La app de Mercatren» en Docs (es y
   en) con el enlace a Google Play, y el botón «Get it on Google Play» en el
   pie del sitio.

## Ficha para Venezuela (8 nov 2026, cargada como borrador por la API)

Gerencia decidió que la app nativa entra con Venezuela, el único país con
productos reales. Estos textos reemplazan a los de arriba en la consola. Los
países de distribución (solo Venezuela), la dirección de privacidad y la
seguridad de los datos se cambian en la consola: la API no los toca.

### Español (es-419 y es-US)

**Nombre** (30/30)

```
Mercatren: compra en Venezuela
```

**Descripción corta**

```
Compra en tiendas de Venezuela y retira tu pedido con el vendedor en tu ciudad.
```

**Descripción completa**

```
Mercatren reúne comercios de Venezuela en un solo lugar. Mira el catálogo, compara precios en dólares y haz tu pedido desde el celular. Cada pedido lo vende y lo factura Mercatren LLC, una empresa de Estados Unidos con sede en Michigan.

LO QUE PUEDES HACER
• Ver y buscar productos de comercios de Venezuela, con su foto y su precio.
• Hacer tu pedido y retirarlo con el vendedor, en tu ciudad. Te escribimos cuando esté listo.
• Pagar con Zelle en nuestra página web: te decimos a dónde enviarlo y subes el comprobante.
• Seguir tus pedidos desde tu cuenta.
• Abrir tu propia tienda y vender con la misma cuenta: sube productos con la cámara del celular.
• Denunciar un producto o una tienda y bloquear a un vendedor, desde el menú de tres puntos. Ves y deshaces tus bloqueos en tu cuenta.

POR QUÉ MERCATREN
• Una sola cuenta para comprar, seguir tus pedidos y vender.
• Precios claros y un registro de cada compra.
• En español o en inglés.
• Un equipo real detrás. ¿Preguntas? Escríbenos a hola@mercatren.com.

TUS DATOS, TU DECISIÓN
Puedes borrar tu cuenta cuando quieras, desde la app o en mercatren.com/delete-account.

Mercatren LLC · Novi, Michigan, EE. UU.
```

### Inglés (en-US)

**Nombre**

```
Mercatren: Shop Venezuela
```

**Descripción corta**

```
Shop stores in Venezuela and pick up your order from the seller in your city.
```

**Descripción completa**

```
Mercatren brings stores in Venezuela together in one place. Browse the catalog, compare prices in U.S. dollars, and place your order from your phone. Every order is sold and invoiced by Mercatren LLC, a U.S. company based in Michigan.

WHAT YOU CAN DO
• Browse and search products from stores in Venezuela, with photos and prices.
• Place your order and pick it up from the seller in your city. We'll message you when it's ready.
• Pay with Zelle on our website: we tell you where to send it and you upload the receipt.
• Track your orders from your account.
• Open your own store and sell with the same account: add products with your phone's camera.
• Report a product or a store, or block a seller, from the three-dot menu. You can see and undo your blocks in your account.

WHY MERCATREN
• One account to shop, track orders, and sell.
• Clear prices and a record of every purchase.
• In English or Spanish.
• A real team behind it. Questions? Write to hola@mercatren.com.

YOUR DATA, YOUR CHOICE
You can delete your account at any time, from the app or at mercatren.com/delete-account.

Mercatren LLC · Novi, Michigan, USA
```

### Notas de la versión 13

```
Ahora puedes comprar en tiendas de Venezuela: haz tu pedido, retíralo con el vendedor en tu ciudad y paga con Zelle en nuestra web.
```

```
You can now shop stores in Venezuela: place your order, pick it up from the seller in your city, and pay with Zelle on our website.
```

### Capturas de teléfono (las mismas en los tres idiomas)

`capturas-ve/01-bienvenida-venezuela-es.png`, `02-portada-venezuela-es.png`,
`03-ficha-producto-es.png`, `06-pedido-creado-pagar-en-la-web-es.png`,
`07-pais-vacio-muy-pronto-es.png`. La 04 lleva «Comprador Prueba» y la 05 es
de la máquina local: no se usan.
