# CJ Dropshipping: pago con tarjeta, devoluciones y avisos automáticos

> Investigación del 18 ago 2026, contra la documentación oficial de CJ y la de
> Google Merchant Center. Lo que no se pudo confirmar en una fuente oficial va
> marcado como tal; nada de esto sale de memoria.

---

## 1 · ¿SE PUEDE PAGARLE A CJ CON TARJETA? — SÍ

Y era la pregunta que decidía si se abre la venta.

**La tarjeta es uno de sus métodos oficiales.** Su lista de formas de pago
incluye PayPal, transferencia, Western Union, saldo de tienda, **tarjeta de
crédito**, Payoneer, Payssion y Midtrans. Sobre la tarjeta dicen literalmente:

> «Our app.cjdropshipping.com is available with Credit Card Payment when you
> place the order»

Y además: «we can send you a link for credit card payment, you can pay it by
any kinds of credit card».

### Cómo encaja con lo que ya está construido

Su API tiene tres formas de pagar un pedido, y **la que usamos es la correcta**:

| `payType`          | Qué hace                               | ¿Sirve?                                            |
| ------------------ | -------------------------------------- | -------------------------------------------------- |
| **1** (el nuestro) | Devuelve `cjPayUrl`: la pasarela de CJ | ✅ **Sí** — ahí se paga con tarjeta                |
| 2                  | Descuenta del saldo de la billetera    | ❌ Exige cargar saldo por Payoneer o wire (3 días) |
| 3                  | Crea el pedido sin iniciar el pago     | Solo para casos raros                              |

Nuestro `src/lib/cj/pedidos.ts` ya manda `payType: 1` y guarda el `cjPayUrl` en
el botón **«Pagar con tarjeta»** del panel. **No hace falta cargar billetera.**

**Lo único que la documentación NO dice** es qué marcas de tarjeta acepta esa
página ni si cobra comisión. Eso se sabe con la compra de prueba: al abrir el
enlace se ve la pasarela y su desglose.

---

## 2 · LAS DEVOLUCIONES — Y AQUÍ ESTÁ EL PROBLEMA DE VERDAD

### Lo que dice CJ, con sus palabras

> «Products can only be returned to their **China warehouse**»

**Incluso lo que sale de sus almacenes de Estados Unidos se devuelve a China.**
No hay dirección de devolución en EE. UU.: buscada en su política de disputas,
en su centro de ayuda y en su artículo de devoluciones, no existe.

Y lo desaconsejan ellos mismos: el envío internacional «es caro», tarda «al
menos 3 meses» en llegar a su almacén de China, y **«la mayoría de los
productos devueltos se pierden o llegan dañados»**.

Plazos: **30 días** desde que el cliente recibe para pedir la devolución, y
**10 días** desde la firma para despacharla. Hay que abrir una disputa en
`My CJ → Orders → Disputes → Return` y elegir «Order Returned».

### Por qué esto choca de frente con Google

Google endureció su política de devoluciones en 2024, y desde **abril de 2026**
su verificación automática **cruza la dirección de devolución contra la
identidad declarada del comercio, y comprueba el código postal contra las APIs
de los transportistas**.

Traducido: **un comercio que dice ser Mercatren LLC de Michigan y declara una
dirección de devolución en China es exactamente el patrón que Google marca.**
El dropshipping no está prohibido —Google permite el envío directo del
proveedor—; lo que suspende cuentas es la identidad que no cuadra.

### LA SALIDA, Y ES LA CORRECTA PARA NUESTRO MODELO

**La dirección de devolución es la de Mercatren LLC, no la de CJ.**

No es un truco: **es lo que ya dice el modelo de negocio**. Mercatren compra la
mercancía a nombre propio y la revende; el vendedor de cara al comprador es
Mercatren LLC, así que el que responde por una devolución es Mercatren LLC.
Declarar la dirección de CJ sería declarar como vendedor a alguien que no lo es.

```
Mercatren LLC
30080 Montmorency Drive
Novi, MI 48377
Estados Unidos
```

Esa es la dirección registrada de la sociedad, la misma del EIN y la del banco.
Cuadra con todo lo que Google ya puede verificar.

**Lo que hay que decidir (negocio, no código):** qué se hace con el producto
devuelto cuando llegue a Novi. Devolverlo a China casi nunca compensa —lo dice
CJ—, así que las opciones reales son quedárselo, revenderlo o desecharlo. Con
productos de $6 a $30, tirarlo suele salir más barato que el flete. **Eso hay
que decidirlo ANTES de publicar la política**, porque la política dice qué
promete Mercatren.

---

## 3 · LOS AVISOS AUTOMÁTICOS — CJ SÍ TIENE WEBHOOK

Esto responde lo de «tengo que entrar a CJ para ver la factura». **No hará
falta.**

**Registro:** `POST https://developers.cjdropshipping.com/api2.0/v1/webhook/set`
con la cabecera `CJ-Access-Token`.

**Seis tipos de aviso**, y los cuatro primeros nos sirven:

| Tipo           | Para qué                                             |
| -------------- | ---------------------------------------------------- |
| `order`        | **El pedido cambió de estado** — incluye que se pagó |
| `logistics`    | **Se despachó, con su número de guía**               |
| `stock`        | El inventario cambió: evita vender lo que ya no hay  |
| `product`      | El producto cambió (precio, datos)                   |
| `makeup`       | Factura de ajuste — p. ej. diferencia de franqueo    |
| `privateOrder` | Órdenes privadas (SY)                                |

**Ejemplo real de lo que mandan:**

```json
{
  "messageId": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
  "type": "PRIVATE_ORDER",
  "messageType": "UPDATE",
  "params": {
    "orderId": "SY2606061320024499900",
    "orderNumber": "shop_order_123",
    "status": "SHIPPED",
    "paymentDate": "2026-06-04 12:00:00",
    "deliveryDate": "2026-06-05 09:00:00"
  }
}
```

**La firma se comprueba así**, y no es opcional — sin esto, cualquiera puede
mandarnos un «ya está pagado» falso:

```
sign = Base64( HmacSHA256( secreto = tu openId, mensaje = el cuerpo JSON crudo ) )
```

Llega en la cabecera `sign`. Es **el mismo mecanismo que ya usamos con Stripe**,
así que la pieza se calca.

**Tres exigencias suyas:** la URL tiene que ser **HTTPS pública** (nada de
localhost), hay que responder **200** y hay que hacerlo **en menos de 3
segundos** — o sea, se apunta el aviso y se procesa después, nunca se hace el
trabajo pesado dentro de la respuesta.

**`makeup` merece atención aparte:** es la factura de ajuste que CJ emite
cuando el franqueo real sale más caro que el cotizado. Es dinero que se paga
DESPUÉS, y hoy no lo veríamos venir. Con el envío ya entrando en cero al
calcular el precio (ver `PLAN.md`), esto se puede volver una sangría silenciosa.

---

## 4 · LOS PASOS QUE FALTAN PARA CERRAR

### Lo que le toca al dueño

1. **Pagar el pedido de prueba** con el botón «Pagar con tarjeta» del panel, y
   mirar en la pasarela de CJ: qué tarjetas acepta y si cobra comisión.
2. **Cuando llegue la caja**, comprobar lo que ya estaba anotado: si trae
   factura del mayorista con el precio de compra dentro, desde qué almacén
   salió, qué dirección de devolución trae impresa, y si es el producto de la
   foto.
3. **Decidir qué se hace con una devolución** que llegue a Novi: se revende, se
   guarda o se desecha.
4. **El token nuevo de la base** de producción (se reemplazó el 18 ago 22:11).

### Lo que hago yo, en cuanto haya luz verde

5. **El webhook de CJ** — registrar la URL, comprobar la firma HMAC, y que el
   pedido pase solo a «pagado» y luego a «enviado» con su guía. Es lo que quita
   el «tengo que entrar a CJ a mirar».
6. **La página de política de devoluciones** con la dirección de Mercatren LLC,
   el plazo de 30 días y quién paga el flete — y darla de alta en Merchant
   Center.
7. **El envío real en el precio** (`PLAN.md`, pasos 5-8). **Esto va ANTES de
   abrir la venta:** con envío de $4 o más, hoy cada venta pierde dinero.
8. **El aviso de `makeup`** en el panel, para que una diferencia de franqueo no
   pase en silencio.

---

## Fuentes

- Política de devoluciones de CJ: `cjdropshipping.com/dispute-policy.html` y
  `blog.cjdropshipping.com/detail/1331550742535688194`
- Métodos de pago: `blog.cjdropshipping.com/detail/payment-methods`
- API de pedidos y pagos:
  `developers.cjdropshipping.com/en/api/api2/api/shopping.html`
- Webhooks: `developers.cjdropshipping.com/en/api/api2/api/webhook.html`
- Google Merchant Center, política de devoluciones:
  `support.google.com/merchants/answer/15625417`
