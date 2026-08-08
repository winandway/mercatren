# Plan: la vitrina — sincronización de verdad y cuánto se ha vendido

> Escrito el 8 de agosto de 2026, a pedido del dueño después de hablar con
> Ferremateriales Bley C.A. **No se ejecuta todavía**: queda guardado para
> arrancarlo cuando él lo diga.

## De dónde sale esto

El comercio observó algo que vale oro y que conviene no perder de vista:

> _La gente entra a Mercatren, mira el producto, **no compra por el sitio**, y
> después se aparece en la tienda a comprarlo._

Es decir: Mercatren ya le está vendiendo, aunque la venta se cierre en el
mostrador. Es una **vitrina**, y el dueño está de acuerdo en que eso cuenta.
De ahí salen dos pedidos:

1. Saber si su tienda está **conectada y sincronizada** de verdad.
2. Que en cada producto se vea **cuánto se ha vendido**, sumando también lo que
   se vende en su local — porque es venta real y eso empuja a comprar.

---

## Lo primero: HOY BLEY NO ESTÁ SINCRONIZADO

Comprobado en la base, no supuesto:

| Qué                       | Cómo está                                 |
| ------------------------- | ----------------------------------------- |
| Fuente de catálogo        | Existe la fila, pero **`url` está vacía** |
| Último resultado          | «Importación manual de 689 productos»     |
| Última sincronización     | La de esa carga a mano                    |
| Robot que sincronice solo | **No hay ninguno**                        |

Traducido: su catálogo **se cargó una vez, a mano, desde un archivo**. No hay
nada conectado. Si en su sistema cambió un precio o se acabó un producto,
Mercatren no se entera.

La máquina para conectarlo **ya está construida** (`fuentes_catalogo` guarda
`url`, `token` y `cada_minutos`; en «Mi tienda → Sincronizar mi catálogo» el
comercio pega la dirección y Mercatren la lee). Lo que falta es que **su
sistema publique el archivo en una dirección** y que alguien la pegue ahí.

**Esa es la respuesta a su pregunta, y hay que dársela tal cual.** Decirle que
está sincronizado cuando no lo está sería justo lo contrario de lo que este
proyecto hace con los datos.

---

## FASE 1 · Conectarlo de verdad

**Depende de él, no de nosotros.** Su sistema —el que le desarrollamos— tiene
que publicar su catálogo en una dirección fija que Mercatren pueda leer, con el
mismo formato del archivo de exportación que ya se usó para la carga manual.

Pasos:

1. Que su sistema exponga el archivo en una dirección (con token, para que no
   sea pública).
2. Pegar esa dirección en «Mi tienda → Sincronizar mi catálogo».
3. Comprobar una sincronización completa: que actualice precios y existencias
   sin duplicar nada. El importador ya empareja por `fuente_id` + `externo_id`,
   así que reimportar **actualiza**, no duplica.
4. **Falta construir el robot**: hoy la sincronización se dispara a mano desde
   el panel. `cada_minutos` está en la tabla pero nadie lo usa. Hay que
   agregarle un disparo automático.

---

## FASE 2 · Cuánto se ha vendido, contado de verdad

**La idea del comercio es buena y el número puede ser real.** No hay que
inventarlo: se puede **deducir de las existencias**.

Si Mercatren registró un producto con 80 unidades y en la siguiente
sincronización vienen 74, se vendieron 6 — se hayan vendido por el sitio o en
el mostrador. Eso es exactamente la vitrina que él describe.

### Lo que se construye

- Tabla nueva `ventas_producto` (nueva, no columnas: así llega sola a
  producción) con el acumulado por producto y de dónde salió cada suma.
- En **cada sincronización**, comparar las existencias que vienen con las que
  había. Si bajaron, esa diferencia es una venta y se acumula.
- En la ficha del producto y en la tarjeta del catálogo: **«Se han vendido N»**.

### Las tres trampas de contar así, y cómo se evitan

1. **Reponer inventario no es vender.** Si las existencias SUBEN, no se cuenta
   nada. Solo las bajadas suman.
2. **Un ajuste de inventario tampoco.** Si de golpe bajan 400 unidades, eso es
   una corrección o un error de carga, no cuatrocientas ventas. Hay que poner
   un tope por sincronización y dejar el resto marcado para revisar.
3. **La primera sincronización no cuenta nada.** No hay un «antes» con qué
   comparar.

### Y una regla de honestidad

El número se enseña **solo cuando es de verdad**. Un «Se han vendido 0» no se
dibuja — igual que no enseñamos cuántas ventas lleva un comercio hasta que el
número acompañe.

---

## FASE 3 · Las estrellas — aquí hay que hablar antes de programar

El comercio pidió **ponerle tres o cuatro estrellas a cada producto**. Esa parte
**no se puede hacer así**, y conviene decirlo antes de que se ilusione:

**Unas estrellas que nadie puso son una reseña falsa.** No es un tecnicismo:

- Mercatren vende a compradores en **Estados Unidos**, donde las reseñas
  inventadas están reguladas y multadas por la FTC. El sitio entero está
  construido sobre poder explicarle cada cosa a un banco o a un regulador —
  esto sería la única pieza que no resistiría esa mirada.
- Y es que además **no hace falta**. Lo que de verdad convence a alguien que
  duda no es una estrella sin nombre: es **«se han vendido 47»**, que sí es un
  hecho comprobable, y que sale gratis de la fase 2.

### Lo que sí se puede hacer, y es mejor

| En vez de            | Se hace                                             |
| -------------------- | --------------------------------------------------- |
| Estrellas inventadas | **«Se han vendido N»**, real, de la sincronización  |
| Estrellas inventadas | **«Los más vendidos»** de ese comercio              |
| Estrellas inventadas | Sello de **empresa verificada** (ya está)           |
| Estrellas inventadas | **Estrellas de verdad**: que las ponga quien compró |

Las estrellas reales son una fase aparte y perfectamente posible: solo puede
puntuar quien tiene un pedido pagado de ese producto, una vez por pedido. Al
principio habrá pocas, y está bien — cuando aparezcan, valen.

**Esto no es una negativa al comercio: es la versión que no se le cae encima
después.** Y le da lo que quería, que es que su producto se vea vendido.

---

## Qué preguntar al comercio

1. ¿Su sistema puede publicar el catálogo en una dirección fija? (Es lo que
   desbloquea todo.)
2. ¿Cada cuánto quiere que se sincronice? Cada 15 minutos es el valor que ya
   trae la tabla.
3. Cuando se enseñe «se han vendido N», ¿desde cuándo cuenta? ¿Desde hoy, o
   quiere arrancar con el histórico que él tenga?

---

## Orden

1. **Fase 1** primero, porque sin sincronización no hay de dónde sacar las
   ventas.
2. **Fase 2** en cuanto la sincronización corra sola un par de días y se vea que
   los números tienen sentido.
3. **Fase 3** (estrellas reales) cuando haya pedidos pagados suficientes para
   que no se vea vacía.
