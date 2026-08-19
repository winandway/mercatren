# La prueba de CJ, paso a paso

> 18 ago 2026. Qué hacer ahora con MT-000004, cómo se paga, cómo se sabe que el
> producto viene, y **qué falta antes de abrir la venta al público**.
>
> Esto está escrito para volver a leerlo. Si mañana alguien —o yo en otra
> sesión— tiene que preguntar otra vez qué se hizo, este documento estaba mal
> hecho.

---

## Dónde estamos

MT-000004 **está pagada de verdad**: el comprador (tú, como Soporte) metió la
tarjeta, Stripe lo confirmó, y el dinero está en la cuenta de Mercatren LLC.

Lo que faltaba era la otra mitad: **comprarle ese producto a CJ**. Eso murió el
18 de agosto con «No variants found for provided SKUs», porque le mandábamos el
SKU del producto donde su API pide el de la variante. **Ya está arreglado y
publicado.**

---

## PASO 1 · Crear el pedido en CJ · lo haces tú, 10 segundos

Entra a **Panel → Pedidos al proveedor**. Sobre MT-000004 hay un botón
**«Volver a intentarlo»**.

**Qué pasa exactamente al pulsarlo:**

1. Mercatren le pregunta a CJ qué variantes tiene ese producto.
2. Elige la más barata —que es la que se le cobró al comprador— y se queda
   escrito cuál fue.
3. Le pregunta a CJ qué transportes hay de verdad para esa dirección y con
   cuánto cuesta el envío.
4. Crea el pedido en CJ con la dirección del comprador, y CJ devuelve el
   **enlace de pago**.

**Cómo sabes que quedó bien:** la fila deja de estar en rojo, pasa a **«Por
pagar»** y aparecen dos botones: **«Pagar este pedido»** y **«Ya lo pagué»**.
Además te llega un correo a `soporte@mercatren.com` con el enlace.

**Si vuelve a salir en rojo**, el mensaje que sale es el que dio CJ, entero. No
hay que adivinar: dice qué le faltó.

---

## PASO 2 · Mirar ANTES de pagar · 30 segundos, y es el paso que más importa

Debajo de la fila sale **qué se le pidió a CJ**, renglón por renglón:

```
1 × Cartera plegable de cuero   [Black-M]  · la eligió el sistema entre 12
```

**Si la etiqueta sale en ÁMBAR**, quiere decir que ese producto tenía varias
tallas o colores y **el comprador nunca eligió** — nuestra ficha lo publica como
una sola cosa. La eligió el sistema, y la eligió por precio.

**Aquí es donde se cancela si está mal.** No ha salido un centavo todavía: el
pago a CJ lo pulsa una persona, y esa persona eres tú. Si sale en gris, es que
solo había una variante y no hay nada que decidir.

**Mira también el correo**: dice el transporte y **cuánto cuesta el envío**. Ese
número es el que decide si esta venta gana o pierde dinero (ver el paso 5).

---

## PASO 3 · Pagar con tarjeta · lo haces tú, en la pasarela de CJ

Pulsa **«Pagar este pedido»**. Abre en pestaña nueva la pasarela de CJ.

**Por qué es un botón y no algo automático:** comprobado en su documentación —
**la API de CJ no puede cobrar una tarjeta guardada.** Sus tres formas de pago
descuentan del saldo de la billetera, que se recarga por Payoneer o
transferencia, con tres días de espera. Lo que sí devuelve es un enlace de pago
(`payType=1`), y por ahí sí entra la tarjeta. **No hace falta cargar saldo.**

**Anota dos cosas mientras pagas**, porque su documentación no las dice:

- Qué tarjetas acepta (Visa, Mastercard, Amex…).
- Si cobra alguna comisión encima.

**Al volver, pulsa «Ya lo pagué».** Eso guarda quién lo pagó y cuándo. Marcar y
pagar son dos actos separados a propósito: el pago ocurre en la pasarela de CJ,
fuera de este sistema, y fingir que lo sabemos sería inventar un dato.

---

## PASO 4 · Cómo garantizas que el producto llega

Tres cosas, en orden:

**1. El pedido existe en CJ y está pagado.** Se comprueba en su panel
(`app.cjdropshipping.com` → Orders). Nuestro número (MT-000004) viaja dentro,
así que se puede atar con el suyo cuando haya que reclamar algo semanas después.

**2. CJ da un número de guía al despachar.** Hoy hay que ir a mirarlo a su
panel. **Con el webhook —que está pendiente— entraría solo** y el pedido pasaría
a «enviado» con su guía sin que nadie mire nada.

**3. Si algo sale mal, la garantía es de CJ.** Tienen 30 días desde la entrega
para reclamar y el trámite se abre en su panel (`Orders → Disputes`). **Pero
ojo: solo aceptan devoluciones en su almacén de China**, incluso lo que sale de
los suyos de Estados Unidos, y lo desaconsejan ellos mismos. Por eso la
dirección de devolución que le damos al comprador es la nuestra, en Novi.

**Lo que hay que comprobar cuando llegue la caja** (esto no lo puede hacer el
código, hay que abrirla):

- ¿Trae factura del mayorista con el precio de compra dentro? Si la trae, **el
  comprador ve nuestro margen** y hay que pedirle a CJ que la quite.
- ¿De qué almacén salió, de EE. UU. o de China? Cambia el plazo de 5 a 20 días,
  y la ficha ya promete uno.
- ¿Qué dirección de devolución trae impresa?
- ¿Es el producto de la foto?

---

## PASO 5 · Lo que FALTA antes de abrir la venta · lo hago yo

**No, todavía no se puede abrir el portal.** Y no es por una pantalla: es por un
número.

### El envío entra como CERO al calcular el precio

Hoy el precio publicado se calcula con el costo del producto y **el envío en
cero** (`desglosarUs(costo, 0)`). Pero el envío se paga igual. Medido con la
fórmula real del proyecto:

| Producto | Envío | Precio HOY | Lo que deja HOY | Precio correcto | Dejaría |
| -------- | ----- | ---------- | --------------- | --------------- | ------- |
| $6.00    | $4.00 | $9.39      | **−$1.18**      | $15.36          | +$4.61  |
| $6.00    | $7.00 | $9.39      | **−$4.18**      | $19.83          | +$5.95  |
| $15.00   | $5.00 | $22.81     | +$1.85          | $30.26          | +$9.08  |
| $30.00   | $8.00 | $45.16     | +$5.55          | $57.08          | +$17.12 |

**Cada venta de un producto barato pierde dinero, y no aparece en ninguna
pantalla.** Con los 78 productos publicados y precios de $6 a $30, la mayoría
está en la primera fila de esa tabla.

**Esto se arregla en cuanto la compra de prueba diga cuánto cobra CJ de verdad
por el envío.** Es el dato que falta: hoy es una suposición.

### Y lo que no bloquea la venta pero sí a Google

- **El webhook de CJ**: que el pedido pase solo a pagado y a enviado con su
  guía. Sin esto hay que entrar a su panel a mirar.
- **La página de política de devoluciones** con la dirección de Novi, y darla de
  alta en Merchant Center. Desde abril de 2026 Google cruza esa dirección contra
  la identidad declarada del comercio.
- **El aviso de `makeup`**: la factura de ajuste que CJ emite cuando el franqueo
  real sale más caro que el cotizado. Es dinero que se paga DESPUÉS y hoy no lo
  veríamos venir.

---

## El orden, y por qué es ese

```
1. Reintentar MT-000004        → tú, ahora
2. Mirar la variante            → tú, antes de pagar
3. Pagar con tarjeta            → tú, en CJ
4. Esperar la caja              → 5 a 20 días, y abrirla mirando
5. Con el envío real medido:
   · meter el envío en el precio → yo
   · recalcular los 78 productos → yo
   · el webhook                  → yo
6. Quitar la pausa              → una línea y un push
```

**La pausa se quita con una línea**: `EN_PAUSA = false` en
`src/lib/ventas/pausa.ts`. Va como constante y no como variable de panel a
propósito: el día que se levante hay que **probar que de verdad se puede
despachar**, y eso pasa por una publicación mirada, no por alguien tocando un
panel de madrugada.

**Mientras tanto el equipo SÍ puede comprar** —es como se prueba el circuito
completo sin abrirle la tienda al público— y el catálogo se sigue viendo y
Google lo sigue leyendo. Apagar las fichas tiraría el posicionamiento que ya
está corriendo.
