# Cómo probar los cobros, paso a paso

> Escrito el 10 de agosto de 2026, al terminar las fases 1 a 5 de
> `PLAN-PAGOS.md`. Está pensado para probarlo **tú, en el sitio publicado**,
> sin tocar código y sin arriesgar dinero de verdad.

**Antes de empezar, dos cosas:**

1. Entra al panel con una cuenta de **Soporte**. Varias de estas pruebas solo
   se ven con esa cuenta: al comercio, a propósito, no se le enseñan.
2. Ten a mano el panel de Stripe (`dashboard.stripe.com`). Lo vas a usar en
   dos pruebas.

---

## Prueba 1 · El mismo comprobante de Zelle no se puede cobrar dos veces

**Qué se está probando:** que si alguien manda una captura que ya se aprobó
antes, el sistema no la deje pasar aunque el validador se distraiga.

1. Entra a **Panel → Por validar**.
2. Mira si alguna tarjeta tiene un recuadro **rojo** que diga _«Este código de
   confirmación ya se aprobó en…»_. Si lo hay, pulsa **Aprobar y acreditar**.
3. **Lo que tiene que pasar:** sale un aviso diciendo que no se puede acreditar
   dos veces el mismo pago, y el comprobante **sigue pendiente**.
4. Comprueba que no se movió nada: entra a **Billetera** y confirma que el
   saldo del comercio quedó igual.

**Si no tienes ningún caso así**, puedes provocarlo: haz una compra de prueba
por Zelle y, al subir la captura, escribe un número de confirmación que ya
hayas usado y aprobado en otra compra.

**Ojo con esto:** un código que aparece en un comprobante **rechazado** NO
bloquea, y está bien que sea así. Si a alguien le rechazan un comprobante y
corrige la transferencia, tiene que poder volver a intentarlo.

---

## Prueba 2 · Las señales que ve el validador

**Qué se está probando:** que quien revisa no aprueba a ciegas.

1. **Panel → Por validar**.
2. En cada tarjeta, debajo de los datos, tienen que aparecer los avisos que
   correspondan:

| Aviso                               | Color    | ¿Bloquea? |
| ----------------------------------- | -------- | --------- |
| El código ya se aprobó en otro pago | rojo     | **Sí**    |
| Esa misma captura ya se aprobó      | rojo     | **Sí**    |
| El monto no cuadra con el pedido    | amarillo | No        |
| Sin número de confirmación          | amarillo | No        |
| A este comprador ya le rechazaron X | amarillo | No        |

3. **Entra ahora con la cuenta del comercio** y abre esa misma sección.
   **Lo que tiene que pasar:** el comercio ve sus pagos pero **no ve ninguna
   de estas señales**. No le toca a él juzgar el comprobante de su propio cobro.

---

## Prueba 3 · Lo que ve el comprador antes de pagar por Zelle

**Qué se está probando:** que nadie se quede esperando sin saber cuánto tarda.

1. Agrega algo al carrito por más de $200 y ve al checkout.
2. En **Zelle**, tiene que decir que una persona lo verifica contra el banco y
   que normalmente es **el mismo día hábil**.
3. Termina el pedido y entra a la pantalla de subir la captura. Ahí tienen que
   estar dos frases:
   - Debajo del número de confirmación: que con ese número el pago se
     encuentra enseguida.
   - En un recuadro gris: que lo confirma una persona y cuánto tarda.

---

## Prueba 4 · Un cobro con tarjeta que se pierde y se recupera solo

Esta es la más importante de todas y la que **más vale la pena hacer**, porque
prueba justo el caso que antes te dejaba sin la venta.

**Qué se está probando:** que si el aviso de Stripe no llega, el pago no se
pierde.

1. En el panel de Stripe, entra a **Developers → Webhooks** y **desactiva
   temporalmente** el endpoint de Mercatren (o pausa el envío).
2. Haz una compra de prueba con tarjeta en el sitio.
3. **Lo que tiene que pasar de entrada:** en Stripe el cobro aparece como
   `succeeded`, pero en Mercatren el pedido sigue en **«Esperando el pago»**.
   Eso es exactamente el problema que había.
4. Ahora **abre la página de tu pedido** como comprador (el enlace que te
   llegó, o **Devoluciones y pedidos**).
5. **Lo que tiene que pasar:** al cargar, el pedido pasa solo a **Pagado**. Se
   descuenta el inventario, se le acredita al comercio y se emiten las
   facturas.
6. **No olvides volver a activar el webhook en Stripe.**

**La otra forma de probarlo**, sin salir del panel: con el pedido todavía sin
pagar, entra a **Panel → Órdenes → el pedido** y pulsa **«Comprobar el cobro»**.
Tiene que decirte si el cobro estaba hecho o si Stripe aún no lo confirma.

> Ese botón solo aparece en pedidos **de tarjeta que siguen sin pagar**, y solo
> para el equipo. En uno de Zelle no sale, porque no haría nada.

---

## Prueba 5 · Un contracargo

**Qué se está probando:** que si un comprador desconoce un cargo, te enteras el
mismo día.

Stripe tiene tarjetas de prueba justo para esto. En **modo de prueba**, paga
con esta tarjeta:

```
4000 0000 0000 0259
```

Esa compra se cobra bien y **a los pocos minutos genera un contracargo sola**.

**Lo que tiene que pasar:**

1. Te llega un **correo al buzón del equipo** con el asunto _«Contracargo en
   MT-0000XX»_, diciendo cuánto reclaman, el motivo y cuántos días quedan.
2. En **Panel → Órdenes → ese pedido**, arriba de todo y **en rojo**, aparece
   el recuadro del contracargo con el monto, el estado y el plazo.
3. Dice **las dos cosas**: que el dinero ya salió de la cuenta, y que **la
   venta NO se deshizo sola**.

**Esto último es a propósito y conviene que lo tengas claro:** el sistema no le
quita el saldo al comercio. Quién asume ese dinero lo decides tú — la disputa
todavía se puede ganar, y quitarle el dinero a un comercio por algo que a lo
mejor se recupera en dos semanas hace más daño que el propio contracargo.

---

## Prueba 6 · Las dos facturas de una venta

**Qué se está probando:** que el papeleo que sostiene la compra y la reventa se
ve de un vistazo.

1. **Panel → Órdenes → un pedido ya pagado**.
2. Busca el bloque **«Los documentos de esta venta»**. Tiene que enseñar:
   - **Factura de venta** — la que le emitimos al comprador. El número es un
     enlace: ábrelo y comprueba que la factura sale bien.
   - **Orden de compra a \<comercio\>** — con su monto, y **«Falta su factura»**
     mientras el comercio no haya subido la suya.
3. Pulsa el número de la orden de compra en **Panel → Órdenes de compra**.
   Tiene que abrirse su ficha con **qué se le compró** renglón por renglón.
4. Desde ahí, el número del pedido te devuelve a la ficha del pedido. **Ida y
   vuelta.**

**Para probar el círculo completo**, entra con la cuenta del comercio, ve a
**Órdenes de compra** y sube un archivo cualquiera como factura. Vuelve a la
ficha del pedido con la cuenta de Soporte: donde decía «Falta su factura» ahora
tiene que decir **«Facturada»** con el enlace al archivo.

---

## Prueba 7 · Quién marcó la entrega

**Qué se está probando:** que queda constancia de quién movió el pedido.

1. **Panel → Órdenes → un pedido pagado**, y márcalo como **Enviado** y luego
   como **Entregado**.
2. En esa misma ficha, busca el bloque **«Qué le fue pasando»**.
3. **Lo que tiene que pasar:** una línea por cada paso, con la fecha y **el
   nombre de quien lo hizo**. El primero, «Pagado», sale como **automático** —
   porque no lo hizo una persona, lo confirmó el cobro.

---

## Prueba 8 · Con qué se pagó cada venta

1. **Panel → Órdenes**. Cada venta lleva un sello: **Tarjeta · cobrado**,
   **Zelle · en revisión**, etc.
2. Abre una y mira **«Cómo se pagó»**: la forma, el estado y **la referencia**
   para ir a buscar el cobro (el `pi_…` en Stripe, o el código en el banco).
3. **Panel → Órdenes de compra**: la columna **«Pagado con»** dice lo mismo.

**Una cosa que tiene que cumplirse siempre:** en un pedido **sin pagar** con
tarjeta, la referencia **no se muestra**. Ese `pi_…` existe desde antes de que
entre el dinero, y verlo ahí haría creer que ya se cobró.

---

## Si algo no sale como dice aquí

Anótalo con **el número del pedido** y qué esperabas ver. Con eso se reproduce
en un minuto.

Y ten en cuenta que después de publicar un cambio pasan **unos 9 minutos** hasta
que se ve en el sitio: unos 5 de compilación y otros 4 hasta que el borde deja
de servir la página vieja.
