# Plan: cerrar los bloqueantes del lanzamiento

Lo que faltaba de la auditoría, hecho de corrido. Los correos que faltan y el
checklist de verificación al aprobar comercios van en la tanda siguiente.

- [x] 1. Los productos nuevos salen primero TAMBIÉN en las bandas de la
      portada (hoy solo en la parrilla y el catálogo), y el sello "Nuevo"
      aguanta fechas que llegan como texto en las tandas del scroll.
- [x] 2. Versionado legal desde cero: lo anterior era un demo. Términos y
      privacidad quedan como PRIMERA versión real, vigente 5 de agosto de
      2026; el documento del modelo pasa de "V3" a "V1"; el generador del PDF
      se actualiza y el PDF se regenera.
- [x] 3. Aceptación de términos con registro: tabla nueva `aceptaciones`
      (quién, cuándo, qué versión), casilla obligatoria sin premarcar en el
      registro de compradores y en el alta de comercio.
- [x] 4. El checkout deja de pedir dirección de entrega: pide QUIÉN RETIRA
      (nombre y teléfono) y muestra en qué ciudad se retira lo comprado.
- [x] 5. El formulario de producto pide el depósito/ciudad; si la tienda no
      tiene depósitos, elegir la ciudad le crea uno. Sin esto, el producto de
      un comercio nuevo no sale en los filtros por ciudad.
- [x] 6. Tipos, lint, pruebas, verificación en el navegador y publicar.
