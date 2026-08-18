# Plan: el checkout de Estados Unidos, y el envío que no se está cobrando

> 18 ago 2026. Tres cosas encadenadas, en este orden.

## 1 · La persistencia del formulario — ✅ HECHA

- [x] Comprobado: el borrador guarda los ocho campos, incluido el desplegable
      del estado, y sobrevive a cerrar el navegador.
- [x] **Fallo encontrado y arreglado:** la restitución corría UNA sola vez, y
      las casillas de Estados Unidos todavía no existían —llegan cuando el
      servidor dice a qué país va el pedido—. Se perdía la dirección entera y,
      peor, **el aviso decía «recuperamos lo que estabas escribiendo» con el
      formulario en blanco**. Un mensaje que miente es un fallo completo.
- [x] Ahora un observador rellena las casillas que aparecen tarde, y **solo si
      están vacías**: nunca puede pisar lo que la persona acaba de escribir.
      Dos pruebas nuevas.

## 2 · El formulario inteligente por origen (pedido del dueño)

- [x] Paso 1: En los productos de una **API** (CJ hoy, Dropi mañana) **no se
      pregunta** «lo busco en su local». En Estados Unidos se trabaja a nivel
      nacional; no hay local a donde ir. Solo envío.
- [x] Paso 2: Los textos dejan de hablar de retirar: «¿Quién retira el pedido?»
      y «Nombre de quien retira» no tienen sentido cuando solo se despacha.
- [x] Paso 3: Que se lea que **el envío ya está incluido en el precio**, no un
      «$0.00» que parece que falta cobrarlo.
- [x] Paso 4: Los comercios de Venezuela **no se tocan**: ahí sí se puede
      retirar o pedir envío, y las dos opciones se quedan.

## 3 · EL ENVÍO NO SE ESTÁ COBRANDO (lo grave)

**Comprobado en el código: `desglosarUs(costoCentavos, 0)`.** El envío entra
como CERO al calcular el precio publicado, así que el 30 % está aplicado solo
sobre el costo del producto. La fórmula es correcta; el dato que le entra, no.

Con un producto de $6:

| Envío real | Precio hoy | Debería ser | Lo que queda |
| ---------- | ---------- | ----------- | ------------ |
| $0         | $9,39      | $9,39       | +$2,82       |
| $2         | $9,39      | $12,37      | +$0,82       |
| $4         | $9,39      | $15,35      | **−$1,18**   |
| $6         | $9,39      | $18,33      | **−$3,18**   |

**Con envío de $4 o más, cada venta pierde dinero.** Y los 78 productos
publicados hoy tienen el envío en cero.

- [ ] Paso 5: Traer de CJ el costo de envío real de cada producto (su API tiene
      `freightCalculate`; hay que comprobar qué devuelve y contra qué dirección).
- [ ] Paso 6: Meterlo en `precioPublicadoUs`, que ya está escrita y probada
      para recibirlo — hoy nadie la llama.
- [ ] Paso 7: **Recalcular los 78 productos publicados** antes de abrir la
      venta. Con el orden de siempre: recalcular precios → cargar → publicar.
- [ ] Paso 8: Una alarma en el panel si un producto queda con margen negativo,
      para que no vuelva a pasar en silencio.
