# Plan: cerrar lo que falta para que el modelo se sostenga solo

> Escrito el 7 de agosto de 2026, después del informe
> `docs/mercatren-informe-precios-declaracion.pdf`.
>
> **Por qué existe este documento.** El informe dejó una lista de cosas que
> faltan. Al ir a actualizar el proyecto de consulta del equipo, el dueño lo
> paró con una observación correcta: _un prompt que dice "esto todavía no está
> hecho" no sirve para nada_. Primero se cierra lo que se puede cerrar, y con
> eso ya hecho se actualiza al resto del equipo.
>
> Así que este plan solo tiene **lo que depende de nosotros**. Lo que depende
> del contador, del abogado o del registro del estado está al final, aparte y
> marcado, para no confundirlo con trabajo pendiente.

- ✅ = hecho y verificado en el sitio publicado
- 🔨 = en curso
- ⬜ = pendiente
- 🔒 = bloqueado esperando a alguien de fuera (dice a quién)

---

## Marcador

| Fase                                  | Estado |
| ------------------------------------- | ------ |
| 1 · Las dos facturas de cada venta    | 🔨     |
| 2 · El cierre del período             | ⬜     |
| 3 · El impuesto a la venta, preparado | ⬜     |
| 4 · Dejar de llamarlo «billetera»     | ⬜     |

**Fase 1, al detalle** _(7 ago 2026)_ — el motor está hecho y subido; faltan
las pantallas:

| Parte                                              | Estado |
| -------------------------------------------------- | ------ |
| Tablas y numeración correlativa atómica            | ✅     |
| Emitir al confirmarse el pago (tarjeta y Zelle)    | ✅     |
| Que el comprador vea y descargue su factura        | ⬜     |
| Que el comercio adjunte su factura contra la orden | ⬜     |
| Que el panel enseñe las órdenes sin factura        | ⬜     |

**Con las cuatro cerradas**, el prompt del equipo pasa de _"faltan estas cosas"_
a _"el sistema hace esto"_, que es justo lo que pidió el dueño.

---

## Por qué en este orden

No es capricho: cada fase necesita a la anterior.

1. **Las facturas primero** porque son el corazón del modelo. Todo el resto —
   los términos, el documento que revisó el abogado, la página «Quiénes
   somos»— se sostiene sobre «dos facturas por venta». Hoy el sistema no emite
   ninguna. Es la distancia más grande entre lo que se promete y lo que se
   hace, y además es lo único de la lista que un auditor pediría primero.

2. **El cierre después**, porque un cierre suma facturas. Hacerlo antes sería
   sumar pedidos, que no es lo mismo: un pedido puede no llegar a ser venta.

3. **El impuesto tercero**, porque se calcula sobre la factura. La máquina se
   deja lista y en cero hasta que el contador diga el número; así el día que
   responda, es cambiar un valor y no reescribir el checkout.

4. **El renombre al final** porque es el más aburrido y el más riesgoso: toca
   la base y no cambia nada de cara al cliente. Va cuando lo demás funcione.

---

## FASE 1 · Las dos facturas de cada venta

**El problema.** El modelo dice que en cada operación hay dos facturas: la de
compra al proveedor y la de venta al comprador. El sitio lo dice, los términos
lo dicen y el PDF que revisó el abogado lo dice. **El sistema no genera
ninguna de las dos.** Lo único que hay es una hoja de tique interna que lleva
escrito en el propio papel que no es la factura del cliente.

### Lo que se construye

**1.1 · La factura de venta (Mercatren → comprador).** La emitimos nosotros,
así que la generamos nosotros.

- Numeración **correlativa y sin huecos**: `MT-F-000001`. Un salto en la
  serie es lo primero que mira una revisión.
- Se emite **cuando el pago queda confirmado**, no al crear el pedido. Un
  pedido sin pagar no es una venta y no puede tener factura.
- **Una vez emitida no se toca.** Si hay que corregir algo, se emite una nota
  de crédito; jamás se edita el documento original ni se reusa un número.
- Bilingüe, con el idioma que tenga guardado el comprador en su cuenta.

**1.2 · La orden de compra (Mercatren → proveedor).** Esta es la otra mitad, y
tiene una diferencia que hay que respetar: **la factura de compra la emite el
comercio, no nosotros.** No se puede fabricar un documento a nombre de otro.

Lo que sí hacemos, y es lo que le falta hoy al comercio para poder facturarnos:

- Generar la **orden de compra** con todo lo que necesita: qué se compró, a
  qué precio, a quién se entrega, con su número y su fecha.
- Que el comercio pueda **adjuntar su factura contra esa orden** desde su
  panel, y que quede el par completo.
- Que en el panel se vea, de un vistazo, **qué órdenes todavía no tienen su
  factura de compra**. Sin eso, el hueco no se descubre hasta la auditoría.

**1.3 · Tablas nuevas, no columnas.** Regla del proyecto: `schema.sql` solo
trae `CREATE TABLE IF NOT EXISTS`, así que una base que ya existe no recibe
columnas nuevas y la pantalla revienta con 500. Van tablas propias:
`facturas`, `lineas_factura`, `ordenes_compra`.

### Lo que se asume (y hay que confirmar con el contador)

El contenido mínimo de cada documento se arma con lo estándar: quién emite
(nombre, dirección, identificación fiscal), quién recibe, número, fecha,
renglones con descripción y precio, subtotal, impuesto y total. **Si el
contador agrega un campo, se agrega — no bloquea empezar.** La pregunta exacta
está en la sección 6 del informe.

### Cómo se sabe que está lista

- Una venta pagada genera su factura sola, con número correlativo.
- El comprador la ve y la descarga desde su pedido.
- El comercio ve su orden de compra y puede adjuntar su factura.
- El panel enseña las órdenes sin factura.
- Hay pruebas de la numeración (que no salte, que no repita, que aguante dos
  ventas a la vez) y del cálculo de cada documento.

---

## FASE 2 · El cierre del período

**El problema.** Cada cobro con tarjeta ya lleva pegado su desglose (ingreso
bruto, costo de mercancía, margen), pero **nadie lo suma**. Y los pagos por
Zelle ni siquiera pasan por el procesador, así que no aparecen en ningún
reporte suyo: entran directo al banco.

Dicho de otro modo: hoy, si el contador pide "cuánto vendiste en julio", la
respuesta hay que armarla a mano.

### Lo que se construye

- Una pantalla de **cierre** en el panel: se elige un período y sale el ingreso
  bruto, el costo de la mercancía y el margen, **con las dos vías de cobro
  sumadas** — tarjeta y Zelle.
- El detalle **descargable**, para que el contador lo cruce con el banco.
- Y el número que hoy falta: **cuánto entró por fuera del procesador**. Esa es
  la cifra que evita que la declaración no cuadre con el 1099-K.

### Cómo se sabe que está lista

El total del cierre de un período tiene que dar **exactamente** la suma de las
facturas de ese período. Si no cuadra al centavo, está mal — y hay una prueba
que lo comprueba con datos de las dos vías mezclados.

---

## FASE 3 · El impuesto a la venta, preparado

**El problema.** Hoy `impuestosCentavos` va en **cero fijo**, escrito en el
código. Vender mercancía a compradores en Estados Unidos puede generar
obligación de cobrar sales tax según el estado, y eso no lo decide el equipo
técnico.

**Lo que NO se hace:** inventar un porcentaje.

### Lo que se construye

La máquina, lista y en cero:

- El impuesto deja de ser un cero escrito a mano y pasa a ser **configurable
  por estado**, desde el panel.
- Sin configuración, sigue en cero y **el sitio funciona exactamente igual que
  hoy**. Nadie nota nada.
- La factura ya trae su renglón de impuesto (viene de la fase 1), así que el
  día que se active, aparece solo.

Así, cuando el contador responda, es cargar un número — no reescribir el
checkout, la factura y el cierre con el sitio en producción.

---

## FASE 4 · Dejar de llamarlo «billetera»

**El problema.** En el código y en la base, lo que se le debe a un comercio se
llama `billetera`, `saldo` y `movimientos_billetera`. Esas palabras describen
**custodia de dinero ajeno**, que es justo la figura que el abogado desarmó el
5 de agosto. Lo que de verdad es: una **cuenta por pagar** al proveedor.

De cara al público ya está corregido — hay una prueba que lo vigila. Esto es
por dentro.

### Por qué es delicado

Renombrar tablas en una base que ya tiene el histórico de un comercio real
(743 movimientos, $24,283.75 a su favor) no es un buscar-y-reemplazar. Se hace
con una migración que **conserva los datos**, con la base local primero, y con
el saldo comprobado antes y después: tiene que dar el mismo número al centavo.

Va última a propósito: no cambia nada para nadie y puede romperlo todo.

---

## Lo que NO depende de nosotros

Esto no es trabajo pendiente nuestro. Está aquí para que no se confunda con la
lista de arriba.

| Qué                                         | De quién depende | Estado                                                     |
| ------------------------------------------- | ---------------- | ---------------------------------------------------------- |
| Las cuatro preguntas contables              | El contador      | 🔒 Están en la sección 6 del informe, listas para reenviar |
| Revisión legal de términos y privacidad     | El abogado       | 🔒 Anotado desde antes                                     |
| Certificado de Mercatren LLC                | El estado        | 🔒 Presentado el 7 ago 2026, en revisión                   |
| Banco, Stripe y Merchant Center a su nombre | El dueño         | 🔒 Es la compuerta para cambiar el nombre en el sitio      |

**Sobre Mercatren LLC:** está presentado y pagado, así que se puede dar por
hecho salvo sorpresa. Pero el sitio **no cambia** hasta tener el certificado y
las cuentas a su nombre, porque si el cargo le aparece al comprador con un
nombre distinto al del sitio, eso son reclamos y contracargos.

---

## Cuando estén las cuatro fases

Se actualiza el proyecto de consulta del equipo con un prompt que diga **lo que
el sistema hace**, no lo que le falta. Eso era el punto de todo esto.
