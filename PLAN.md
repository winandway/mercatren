# Plan: la dirección de Estados Unidos en el checkout

> 18 ago 2026. Lo destapó el dueño comprando un producto de CJ: eligió «que me
> lo envíen» y **no hay dónde escribir la dirección**. No estaba haciendo nada
> mal — el checkout se construyó para el retiro en depósito de Venezuela.
>
> **Y es peor de lo que se ve en pantalla.** Comprobado contra la
> documentación oficial de CJ: `shippingProvince` (el estado) es OBLIGATORIO
> y hoy se manda `entrega.referencia`, que va vacío. El pedido se rechazaría.
> El código postal no se manda en absoluto.

- [x] Paso 1: `src/lib/entrega/destino.ts` — decidir qué pide cada destino
      (retiro en Venezuela vs. envío a Estados Unidos). Puro, con pruebas.
- [x] Paso 2: Las casillas de Estados Unidos en el checkout: calle, casa o
      apartamento, ciudad, **estado** y **código postal**. Bilingüe.
- [x] Paso 3: `crearPedido` guarda esos campos, y los EXIGE cuando el destino
      es Estados Unidos. El servidor manda, no el formulario.
- [x] Paso 4: `cj/pedidos.ts` manda `shippingProvince` y `shippingZip` de
      verdad, no la referencia prestada.
- [x] Paso 5: Que el estado de EE. UU. se elija de una lista, no a mano — CJ
      lo compara y «Florida» no es lo mismo que «FL».
- [x] Paso 6: Probar en el navegador el camino completo de un producto de CJ,
      con captura.
- [ ] Paso 7: `npm run verify`, publicar, y dejar la guía de la compra de
      prueba escrita para el dueño.
