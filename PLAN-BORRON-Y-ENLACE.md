# Plan: borrón y cuenta nueva, y cobrar desde el sistema del comercio

> Dictado por el dueño el 10 de agosto de 2026. Dos trabajos seguidos, sin
> parar entre uno y otro.

## PUNTO 1 · Borrón y cuenta nueva

### Lo que hay hoy en producción

| Qué                                                      | Cuánto                        |
| -------------------------------------------------------- | ----------------------------- |
| Bley · entradas aprobadas (histórico importado)          | 666 · $337,261.22             |
| Bley · retiros ya hechos (histórico)                     | 70 · $302,859.50              |
| Bley · **saldo que figura a su favor**                   | **$24,283.75**                |
| Bley · pendientes de validar                             | 3 · $404.50 + $322.00 + $2.48 |
| Inversiones Multiservicios · venta con tarjeta MT-000002 | $31.87                        |

**Todo lo de Bley viene de la tienda anterior y YA SE LIQUIDÓ ALLÁ.** El dueño
pagó ese dinero y entregó esa mercancía antes de mudarse a Mercatren. Que
figure como pendiente es un espejismo del importador: se trajo el histórico
para tener el rastro, no para volver a pagarlo.

**La única venta real de Mercatren es la de Armando**, con tarjeta, $31.87.

### Cómo se cierra sin borrar nada

**NO se borra un solo registro.** El histórico es el rastro de operaciones
reales y tiene que poder consultarse. Lo que se hace es **registrar que ya se
liquidó**, que es lo que de verdad pasó:

- [x] Los 3 pendientes pasan a `aprobado`: fueron pagos reales que sí se
      recibieron. Dejarlos colgados es lo que hace que la cola diga que hay
      trabajo cuando no lo hay
- [x] El pedido MT-000269 (el de $2.48) pasa a `entregado`: se cobró y se
      entregó
- [x] **Un retiro de cierre** por el saldo exacto que queda, marcado como
      liquidado en el sistema anterior. Con eso la billetera de Bley da $0.00
      y el histórico sigue entero
- [x] Comprobar que Armando queda con su $30.91 disponible y que Bley queda
      en cero

**POR QUÉ UN RETIRO Y NO UN BORRADO.** El saldo se CALCULA (entradas − retiros),
no se guarda. Un retiro de cierre es la única forma de dejarlo en cero diciendo
la verdad: «esto ya se pagó». Borrar las entradas sería fabricar un pasado que
no ocurrió, y el día que alguien pregunte por un pago de julio no habría nada.

### El comercio tiene que ver su dinero sin depender de nadie

- [ ] Resumen del panel: que un comercio entre y vea de una lo que vendió, lo
      que tiene disponible y el botón para sacarlo
- [ ] Comprobar de punta a punta que una venta con tarjeta cae sola en su
      billetera y queda lista para retirar

## PUNTO 2 · Cobrar por Mercatren sin salir del sistema del comercio

Es la **primera etapa** del documento `mercatren-api-integraciones.pdf`: el
enlace de pago. Las otras tres (abonos del crédito, productos, cuadre del mes)
quedan para después, como dice el propio documento.

### Lo que tiene que pasar un martes cualquiera

1. La cajera de Bley arma la venta como todos los días.
2. A la hora de cobrar, además de efectivo y pago móvil, ve **«Cobrar por
   Mercatren»**.
3. Lo toca y sigue atendiendo al siguiente.
4. **El correo con el enlace sale solo**, en ese mismo momento.
5. Quien paga —el cliente o su familiar en Estados Unidos— abre y paga con
   tarjeta o por Zelle.
6. La factura de Bley se marca pagada **sola**.

### En Mercatren

- [x] Tabla `cobros_solicitados` (tabla nueva, llega sola a producción)
- [x] `POST /datos/socios/cobro` — el comercio pide un cobro con su llave:
      monto, referencia de su factura, y a quién cobrarle
- [x] La cuenta del cliente se abre sola si no la tenía
- [x] El correo con el enlace sale en ese mismo momento
- [x] Página pública `/cobro/<enlace>` donde se paga con tarjeta o por Zelle
- [x] Al confirmarse el cobro, el neto entra a la billetera del comercio
- [x] `GET /datos/socios/cobro/<id>` para que el sistema del comercio sepa si
      ya se pagó
- [x] Pruebas de las reglas puras: qué monto se acepta, cuándo caduca un
      enlace, qué se le enseña a quien paga

### En el sistema de Bley

- [x] Componente «Cobrar por Mercatren» listo para la caja, y la función de
      servidor que guarda el token
- [x] La llamada a Mercatren con el monto y el cliente de la factura
- [ ] Guardar el cobro contra la factura, para poder consultarlo
- [ ] Marcar la factura como pagada cuando el cobro entre

### Cierre

- [x] `npm run verify` en verde en Mercatren
- [ ] Comprobar en el navegador
- [ ] Documentar en los dos `CLAUDE.md`
- [ ] Publicar Mercatren y comprobar que quedó en verde
