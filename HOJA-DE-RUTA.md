# Hoja de ruta

Lo que falta por construir, en orden de importancia. Lo que ya está hecho no se
lista aquí: está en el sitio.

Lo que depende de ti vive aparte, en `BLOQUEADO.md`.

---

## ~~1. Órdenes como tiques imprimibles~~ — HECHO

Cada pago aprobado sale ya como **tique imprimible** en **Órdenes**, con su
buscador (confirmación, banco, últimos cuatro, monto, comercio). Al imprimir se
esconde todo lo demás de la pantalla y queda la hoja sola.

La regla de negocio quedó aplicada: **un pago aprobado ya está pagado y ya está
entregado**, así que la pestaña "Entregado" cuenta esas ventas y "Preparando"
queda en cero. No se espera a que nadie confirme nada.

Lo único que quedó fuera: la descarga en PDF. Imprimir desde el navegador ya
permite "Guardar como PDF", así que no compensa el trabajo extra por ahora.

**Ojo al tocarlo:** las órdenes que nacen de un pago aprobado y las que nacen
del carrito son la misma sección pero no el mismo camino. Las del carrito sí
pasan por "esperando el pago". Las del pago aprobado entran ya cerradas.

---

## 2. Pago con el saldo de la billetera

Quien ya tiene saldo acreditado debería poder pagar con él, sin volver a
transferir. Es el paso que le da sentido a la billetera.

---

## 3. Pago con tarjeta (Stripe Connect)

Comisión del 5%, con el pago dividido entre el comercio y Mercatren. La pieza
está configurada; falta la pantalla de cobro.

---

## ~~4. Retiros del comercio~~ — HECHO

El comercio pide su dinero desde **Retiros** y elige cómo: a otro comercio de
Mercatren, ACH o wire. El monto **se aparta al pedirlo**, no al pagarlo, así
que la billetera enseña tres números: lo que tiene, lo que está en trámite y
lo que puede pedir hoy.

Al equipo le entra en una cola. **Esto no mueve dinero**: alguien hace la
transferencia en el banco y luego toca "Ya lo pagué", que es lo que hace bajar
el saldo y deja la referencia. Por eso el botón no se llama "Pagar".

**Ojo:** los 70 retiros del histórico siguen en `pagos_zelle`, congelados. Los
nuevos viven en la tabla `retiros`. El saldo suma los dos conjuntos, que no se
pisan (`src/lib/zelle/billetera.ts`).

---

## 5. Envío e impuestos

Hoy van en cero a propósito: se acuerdan con cada comercio. Cuando se definan,
entran en `crearPedido()` y en el total.

---

## 6. Conectar la billetera con el WaaS de tokiia.com

Hoy el saldo que guardamos es un espejo. Cuando se conecte, la fuente de verdad
pasa a ser el proveedor y hay que sincronizar. Los campos
`billeteras.proveedorBilleteraId` y `sincronizadoEn` ya están para eso.

---

## ~~7. Alta de comercios por su cuenta~~ — HECHO

Se registra en `/vender`, llena los datos de su empresa —todos obligatorios— y
la tienda nace **pendiente** hasta que el equipo la aprueba desde Cuentas. Al
entrar ve la guía de los cuatro primeros pasos.

---

## 8. Envío e impuestos

(antes el punto 5, se mantiene) Hoy van en cero a propósito.

---

## 9. Aviso al comercio cuando le piden un retiro

Hoy el retiro entra en la cola y se ve al abrir el panel. Falta el correo que
avise al equipo de que hay dinero esperando, y el que le confirme al comercio
que ya salió su transferencia. Los 7 correos que ya existen son el molde.
