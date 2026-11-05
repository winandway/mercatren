# Análisis: Mercatren con la app primero, en vez de un país por dominio

> Pedido por Richard el 5 nov 2026: _«eso de armarlo por países está bien,
> pero tiene mucho trabajo el mantenimiento. Analízalo usted misma»_.
> Datos de la base real al 5 nov 2026, antes y después de borrar lo de CJ.

## La respuesta corta

**Tienes razón: los países cuestan más de lo que dan.** Recomiendo **una sola
Mercatren** (mercatren.com, en dólares, para Estados Unidos), **la app como
puerta principal**, y **congelar Chile, Colombia y España**. Venezuela se
decide aparte, porque es la única con comercios reales vendiendo.

## Lo que hay hoy, con números

| País                     | Tiendas reales (sin CJ)                   | Pedidos de verdad     | Cobro con tarjeta           |
| ------------------------ | ----------------------------------------- | --------------------- | --------------------------- |
| Estados Unidos (.com)    | 2 de comercios, más la de Mercatren       | 5                     | Probado (31 ago)            |
| Venezuela (.com.ve)      | 6 comercios                               | 11                    | No aplica: cobran por Zelle |
| Chile (.cl)              | 1                                         | 0                     | Sin probar                  |
| Colombia (.com.co)       | 0 (la única que hay es de CJ, suspendida) | 1, que falló al pagar | Sin probar                  |
| España (dentro del .com) | 0                                         | 0                     | Cerrado al público          |

**En limpio:** Chile, Colombia y España no tienen comercios propios ni ventas.
Su catálogo era el de CJ, que ya no existe.

## Lo que cuesta mantener cada país

Cada país suma, aunque no venda:

- **Su moneda en los cobros:** el peso chileno no tiene centavos y el
  colombiano rompió una compra real por los decimales. Cada moneda pide su
  propia compra de prueba, y la regla de la casa no deja abrir sin ella.
- **Sus impuestos:** Mercatren LLC está inscrita en el IVA digital de Chile
  desde el 18 ago 2026, con declaración trimestral. Sin ventas no hay que
  declarar, pero el registro sigue vivo y hay que vigilarlo.
- **Su dominio, sus textos legales, su mapa del sitio y su ficha en Google.**
- **Su parte del código:** el «muro» que separa el catálogo por país, las
  tasas de cambio, los envíos por país y las pruebas de cada uno. Cada
  arreglo hay que probarlo cuatro veces.

## Por qué la app primero tiene sentido

- **Una sola cuenta para todo:** comprar, crear la tienda y vender, que ya es
  como funciona Mercatren por dentro.
- **El teléfono es donde está la gente** que vende por WhatsApp y redes, que
  es justo el comercio que llega a Mercatren.
- **La web no se pierde:** sigue ahí, para quien entra por un enlace o desde
  la computadora.

## Lo que la app necesita para que Apple y Google la acepten

La app de hoy muestra el sitio dentro de una ventana. **Apple ya la rechazó
por eso** (normas 4.2 y 4.3): pide algo que sea más que un sitio reempacado.
Si la app va a ser el centro, tiene que ser una app de verdad:

1. **Crear la tienda y subir productos con la cámara**, en pantallas propias.
2. **Avisos al teléfono** (venta nueva, pedido en camino). La llave de avisos
   de Apple ya está guardada.
3. **Pedidos y mensajes del comprador** en pantallas propias.
4. **Comprar** con el cobro con tarjeta que ya existe. Lo físico no paga
   comisión a Apple.

Se hace por partes y se prueba con usuarios reales en TestFlight antes de
enviar, porque Apple lo pregunta.

## Lo que recomiendo, en orden

1. **Ya (hecho hoy):** Mercatren abierta sin CJ, todas las páginas
   funcionando, la IA, el reloj y los robots apagados para no volver al gasto.
2. **Congelar Chile, Colombia y España:** sus dominios mandan a mercatren.com
   y su cobro queda cerrado. Chile: confirmar con el contador qué pide el
   registro del IVA si no hay ventas.
3. **Venezuela, decisión tuya:** son los únicos comercios vendiendo de verdad.
   O se quedan como están en su dominio, o pasan a ser tiendas dentro de la
   única Mercatren.
4. **La app de verdad**, por partes, empezando por crear la tienda y subir
   productos desde el teléfono. Es un trabajo grande: lo encarga Gerencia
   como meta, con su plan.
5. **Los robots de Google,** solo cuando haya tiendas y productos que mostrar,
   y con el consumo de la base vigilado.

## Lo que decides tú

- ¿Se congelan Chile, Colombia y España?
- ¿Qué pasa con Venezuela?
- ¿Se arranca la app de verdad como próxima meta?
