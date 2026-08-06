# Pago por partes en Mercatren

> Documento de trabajo, 6 ago 2026. Nace de una pregunta de **MEGAYES**
> (distribuidor de repuestos de moto, Venezuela): sus clientes le compran
> $2.000 y él les da 30 días para pagar, abonando poco a poco. ¿Cómo se hace
> eso en Mercatren?
>
> **Este documento está pendiente de revisión del abogado del proyecto.** La
> parte de qué figura usar no es una decisión técnica.

---

## Lo primero: por qué no podemos "dar crédito"

Hay que decirlo claro antes de diseñar nada, porque cambia todo el diseño.

**Windoce, LLC compra la mercancía al comercio y se la revende al comprador.**
Si el comprador se lleva el producto hoy y termina de pagarlo en 30 días,
**quien puso el dinero durante esos 30 días fue Windoce, LLC**. Eso ya no es
vender: es **prestar**, y prestar dinero en Estados Unidos exige licencias
estatales de prestamista, con sus intereses regulados y sus reportes.

No es una tecnicidad: es la misma clase de problema que ya nos obligó a
reescribir todo el sitio en agosto para dejar de parecer _money transmission_.
Un modelo de crédito nos mete en una categoría todavía más regulada.

**Entonces la regla es:** el producto se entrega **cuando está pagado**. Lo que
sí se puede es dejar que se pague **en varias veces**.

---

## Lo que sí se puede: apartar y abonar

Es una figura comercial vieja y completamente normal en Estados Unidos —
_layaway_. Se llamaba "apartado" toda la vida:

1. El cliente elige el producto y **lo aparta** con un primer abono.
2. La mercancía **queda reservada** a su nombre: nadie más la puede comprar.
3. Va abonando **cuando quiere y lo que quiere**, sin fecha fija ni cuotas
   iguales.
4. Cuando el total llega al precio, **el pedido se libera** y se entrega.

Nadie prestó dinero. El comercio no entregó nada por adelantado. Windoce, LLC
no financió nada. Y el cliente consigue lo que de verdad quería: **no tener que
pagar los $2.000 de golpe**.

### El ejemplo de MEGAYES, tal cual lo planteó

| Momento | Qué hace el cliente | Qué ve en Mercatren                               |
| ------- | ------------------- | ------------------------------------------------- |
| Día 1   | Abona $500          | Apartado · abonado $500 de $2.000 · faltan $1.500 |
| Día 15  | Abona $1.200        | Apartado · abonado $1.700 de $2.000 · faltan $300 |
| Día 27  | Abona $300          | **Pagado** · el comercio prepara la entrega       |

Cada abono entra por los medios que ya funcionan (Zelle con su comprobante, o
tarjeta). Cada uno se valida igual que hoy. La única diferencia es que en vez de
un pago de $2.000 hay tres pagos que suman $2.000 contra el mismo pedido.

---

## Lo que hay que construir

Lo bueno: **la mitad ya existe**. Los pedidos, los pagos con comprobante, la
cola de validación y la billetera del comercio están hechos y funcionando.

### 1. Un pedido puede recibir varios pagos

Hoy un pedido espera un pago por su total. Hay que dejar que reciba varios y
que lleve la cuenta de lo abonado y lo que falta.

### 2. Estados nuevos del pedido

- **Apartado** — tiene al menos un abono, no llega al total.
- **Pagado** — la suma de abonos alcanzó el precio. Aquí se libera.
- **Vencido** — pasó el plazo sin completarse (ver más abajo).

### 3. La pantalla del cliente

Su pedido con una barra de avance: cuánto lleva, cuánto falta, la lista de sus
abonos con fecha, y un botón grande de **abonar**. Que en cualquier momento
pueda ver **exactamente** dónde está parado sin tener que preguntarle a nadie.

### 4. La pantalla del comercio

La lista de sus apartados: quién, cuánto lleva abonado, cuánto falta, desde
cuándo. Es lo que hoy MEGAYES lleva en un cuaderno o en su cabeza.

### 5. El dinero del comercio

**Cada abono validado se le acredita en el momento**, igual que hoy. No espera
a que el cliente termine. Su billetera ya sabe hacer esto.

### 6. Las existencias

Aquí hay una decisión de negocio que hay que tomar, y **la tiene que tomar el
comercio, no nosotros**:

- **Reservar al apartar** — la mercancía se saca del inventario desde el primer
  abono. El cliente tiene la certeza de que su producto está. Riesgo del
  comercio: si el cliente no termina, tuvo mercancía parada.
- **Reservar al completar** — se entrega de lo que haya cuando termine de
  pagar. Sin riesgo de inventario parado, pero el cliente puede quedarse sin su
  producto.

**Propuesta:** que sea un interruptor por comercio, y que la ficha diga cuál
aplica. Un cliente que abona $500 tiene derecho a saber si su producto está
apartado o no.

---

## Las tres preguntas que hay que decidir antes de construir

No son técnicas. Son de negocio y de abogado, y de ellas depende el diseño:

1. **¿Cuánto dura un apartado?** Sugerencia: 30 días, con aviso al cliente a los
   20 y a los 27. Sin plazo, hay mercancía reservada para siempre.

2. **¿Qué pasa si el cliente no termina de pagar?** Las opciones reales:
   devolverle lo abonado completo; devolvérselo menos un cargo por reposición
   (lo habitual en _layaway_); o dejarlo como saldo a favor para otra compra.
   **Esto tiene que estar escrito en los términos ANTES de aceptar el primer
   abono** — y en Estados Unidos varios estados regulan justamente esta parte.

3. **¿Hay un mínimo para el primer abono?** Lo normal es 10–20% del total. Sin
   mínimo, alguien aparta $2.000 con $5 y bloquea mercancía.

---

## Y si el comercio de verdad quiere fiarle a su cliente

Que quede claro, porque es la pregunta que va a volver: **si MEGAYES quiere
entregarle la mercancía a su cliente antes de cobrarla, puede hacerlo — pero
esa es una relación entre él y su cliente, fuera de Mercatren.** Él conoce a su
cliente y decide arriesgarse; nosotros no podemos poner el dinero en el medio.

Lo que sí podemos darle, y es lo que resuelve el 90% de los casos, es que **el
cliente pueda pagar en varias veces sin que nadie preste nada**.

---

## Orden sugerido para construirlo

1. Que un pedido acepte varios pagos y lleve la cuenta _(la base de todo)_
2. Los estados nuevos y el plazo
3. La pantalla del cliente con su avance
4. La lista de apartados del comercio
5. Los avisos por correo (abono recibido, faltan X días, completado)
6. El interruptor de reserva de existencias

**Antes del paso 1** hacen falta las respuestas a las tres preguntas de arriba y
el visto bueno del abogado sobre la figura del apartado y sobre qué pasa con el
dinero de un apartado que no se completa.
