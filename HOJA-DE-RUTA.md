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

## 4. Retiros del comercio

Que el comercio pueda sacar su saldo. Va después de la billetera y del WaaS.

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

## 7. Alta de comercios por su cuenta

Que un comercio nuevo se registre solo, cargue su tienda y empiece a vender sin
que nadie del equipo tenga que crearle nada a mano.
