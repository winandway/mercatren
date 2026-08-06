# Plan: B1 — los correos que faltan

Cerrar los avisos que hoy no salen. Un pedido que se paga y nunca vuelve a
escribir deja al cliente entrando al sitio a ver si pasó algo, y a un comercio
esperando una transferencia sin saber si se hizo.

- [x] 1. Averiguar dónde se retira un pedido: helper que, dado un pedido, saca
      los depósitos de la mercancía comprada (ciudad, nombre, dirección).
- [x] 2. Textos nuevos en `messages/es.json` y `messages/en.json`: retiro
      solicitado (al equipo), retiro pagado, retiro rechazado, pedido listo
      para retirar, pedido entregado, producto agotado. Inglés de nativo.
- [x] 3. Las funciones de envío en `src/lib/correo/correos.ts`, una por
      momento del negocio, siguiendo el patrón de las 9 que ya existen.
- [x] 4. Disparar los tres de retiros desde `src/lib/retiros/acciones.ts`
      (pedirRetiro → equipo; marcarRetiroPagado y rechazarRetiro → comercio).
- [x] 5. Disparar los dos del pedido desde `avanzarPedido`, con el lugar de
      retiro dentro del correo de "listo para retirar".
- [x] 6. El correo de "gracias por tu compra" dice **dónde se retira** cada
      cosa, no solo el total.
- [x] 7. Aviso al comercio cuando una venta deja un producto en cero, para que
      reponga o lo despublique.
- [x] 8. Prueba de unidad: todo correo nuevo tiene sus dos idiomas y ninguno
      usa vocabulario prohibido por la figura jurídica.
- [x] 9. Tipos, lint, pruebas, compilación y publicar.
- [x] 10. Actualizar `ROADMAP.md`: B1 en ✅ y el marcador al día.
