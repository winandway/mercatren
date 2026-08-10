# Plan: cerrar los huecos de los cobros (fases 2 a 5)

> Escrito el 10 de agosto de 2026, después de revisar el código de cobros con
> el dueño. La fase 1 (blindar Zelle contra la captura falsa) ya está publicada.
>
> Va en su propio archivo y no en `PLAN.md` porque ese es otro plan, el del
> informe de precios del 7 de agosto, y sigue vivo.

## Lo que se encontró, y por qué cada cosa importa

**Stripe da certeza — el riesgo está al revés.** El webhook verifica la firma,
es idempotente, el monto sale de la base y si no está configurado no procesa
nada. Un cobro confirmado no se puede falsificar. El hueco es el opuesto: **si
el aviso de Stripe no llega, nadie se entera**. Nada le pregunta a Stripe si un
pedido está pagado. El comprador pagó y el pedido se queda «esperando el pago»
para siempre: sin descontar stock, sin acreditar al comercio, sin factura.

**Los contracargos no existen para el sistema.** Una tarjeta se revierte hasta
120 días después. Hoy eso pasaría sin un solo aviso, con el comercio ya cobrado
y la mercancía entregada.

**Las dos facturas están, pero separadas.** La nuestra al comprador en
`/factura/<numero>`; la del comercio a nosotros en Órdenes de compra. No hay un
sitio donde se vea el par de una venta, que es justo lo que sostiene la figura
de compra y reventa.

**La entrega se marca pero no deja constancia de quién.** Se guarda la fecha, no
la persona.

## Los pasos

### Fase 2 — un cobro con tarjeta no se puede perder

- [x] Sacar la acreditación del webhook a un módulo propio, para que el webhook
      y el respaldo hagan EXACTAMENTE lo mismo y no se separen con el tiempo
- [x] `conciliarPedido()`: le pregunta a Stripe por el intento del pedido y, si
      está cobrado, acredita igual que el webhook (misma función idempotente)
- [x] Llamarlo solo cuando el comprador abre su pedido y sigue sin pagar: es
      gratis, es el momento en que importa, y no hace falta ningún cron
- [x] Acción para el equipo: botón «Comprobar el cobro» en la ficha del pedido
- [x] Pruebas del módulo puro que decide si un intento de Stripe cuenta como
      cobrado

### Fase 3 — un contracargo no puede pasar en silencio

- [x] Tabla `disputas` (tabla nueva, no columnas: así llega sola a producción)
- [x] Escuchar `charge.dispute.created` y `charge.dispute.closed` en el webhook
- [x] Guardar la disputa y marcar el pedido, sin deshacer nada por nuestra
      cuenta: revertirle el saldo a un comercio es decisión de negocio
- [x] Avisar al equipo por correo en cuanto entra una
- [x] Enseñarla en la ficha del pedido, en rojo y con lo que hay que hacer
- [x] Pruebas de las reglas puras de la disputa

### Fase 4 — las dos facturas de una venta, en un solo sitio

- [x] Ficha de la orden de compra (`/panel/ordenes-compra/<id>`) con sus
      renglones, usando la consulta que ya existía sin pantalla
- [x] En la ficha del pedido del panel: enlace a la factura de venta y a la
      factura que subió el comercio, para el equipo
- [x] Cerrar el círculo: de la orden de compra al pedido y del pedido a la
      orden de compra

### Fase 5 — constancia de la entrega

- [x] Tabla `hitos_pedido`: qué pasó, quién lo hizo y cuándo
- [x] Registrarlo al avanzar el pedido y al confirmarse el pago
- [x] Enseñar la línea de tiempo en la ficha del pedido

### Cierre

- [x] `npm run verify` completo en verde
- [x] Comprobar en el navegador y con capturas
- [x] Documentar en `CLAUDE.md`
- [x] Publicar y comprobar que la publicación quedó en verde
- [x] Escribir el tutorial de cómo probar todo esto
