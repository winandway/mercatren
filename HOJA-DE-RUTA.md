# Hoja de ruta

Lo que falta por construir, en orden de importancia. Lo que ya está hecho no se
lista aquí: está en el sitio.

Lo que depende de ti vive aparte, en `BLOQUEADO.md`.

---

## 1. Órdenes como tiques imprimibles

**Qué se quiere:** que la ficha del pago —la que ya se ve bonita al abrir un
pago en el panel— tenga forma de **tique imprimible**, y que la sección
**Órdenes** deje de estar vacía y se llene con esos pagos.

**La regla de negocio:** todo pago aprobado **ya está pagado y ya está
entregado**. No se espera a que el cliente vaya al negocio ni a que nadie
confirme nada: al aprobar el pago, la orden nace directamente en estado
`entregado`. Por eso "productos por entregar" siempre da cero.

**Qué hay que hacer:**

- Darle forma de tique a la ficha del pago: cabecera con la marca, el monto
  grande, los datos del pago, la comisión y el neto, y una línea de corte.
  Que se imprima bien en papel de recibo y en hoja normal (`@media print`).
- Llenar **Órdenes** con los pagos aprobados: cada pago aprobado es una orden
  entregada, con su número, su fecha, su monto y el comercio.
- Buscador dentro de Órdenes: por número de confirmación, por monto, por banco,
  por comercio y por fecha.
- Botón de imprimir en cada tique, y descarga en PDF si sale barato.

**Ojo con esto:** las órdenes que nacen de un pago aprobado y las órdenes que
nacen del carrito son la misma sección pero no el mismo camino. Las del carrito
sí pasan por "esperando el pago". Las del pago aprobado entran ya cerradas.

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
