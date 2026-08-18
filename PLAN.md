# Plan: el checkout, de punta a punta y sin dejar a nadie en el aire

> 18 ago 2026. El dueño pagó de verdad (MT-000004, $7,95 — Stripe lo confirma
> como «Exitoso») y la pantalla siguió diciéndole «ahora falta el pago». Eso no
> es un detalle de acabado: es la pantalla mintiendo justo después de cobrar.

## 1 · Que no diga «falta el pago» cuando ya está pagado

- [x] Paso 1: El aviso verde de arriba está FIJO, sin mirar el estado. Se
      cambia por uno que sepa dónde está el pedido: recién creado, esperando
      verificación, o **pagado**.
- [x] Paso 2: El «Pagado» en gris chiquito al lado del número pasa a ser un
      aviso **verde y grande**: «Tu pedido está pagado». Es lo primero que
      quiere ver quien acaba de meter su tarjeta.

## 2 · Los pasos, para que nadie quede en el aire

- [x] Paso 3: Una tira de pasos arriba —1, 2, 3— que diga en qué va: «Paso 2
      de 3». Que se lea de un vistazo en el celular y en la computadora.
- [x] Paso 4: Al llegar al último, que se vea **terminado**, no que se corte.

## 3 · La factura, con cara de empresa

- [x] Paso 5: El logo de Mercatren arriba, con los colores de la casa (azul
      `#10263A` y naranja `#FF6B1A`).
- [x] Paso 6: El correo de contacto **`soporte@mercatren.com`**, que es el que
      recibe de verdad.
- [x] Paso 7: Que se imprima bien en una hoja y se vea bien en el celular.

## 4 · Cerrar

- [x] Paso 8: `npm run verify`, publicar y comprobar en pantalla.

> **BLOQUEADO, hace falta el dueño:** el token de la base de producción se
> reemplazó el 18 ago a las 22:11, así que no puedo comprobar contra
> producción. El nuevo está en YaDominios Cloud → tarjeta del sitio → «Ver
> token». No frena nada de lo de arriba.
