# Cuando el que paga NO es el que debe

> 19 ago 2026. Lo destapó el dueño con un croquis de Ferremateriales Bley: hay
> un segundo tipo de cobro que nunca entró en el plan.
>
> **Esto es el plano. Todavía no hay código.** Antes de escribir una línea hay
> cuatro preguntas que solo puede contestar la sesión de Bley, y una que tiene
> que mirar el abogado.

---

## El caso, en una frase

**Ferretería B le debe a Ferremateriales Bley, pero quien pone el dinero es un
cliente de la Ferretería B.** Ese pago entra a Bley y baja la deuda de la B —
no la del que pagó.

| | Tipo 1 · ya funciona | Tipo 2 · falta |
| --- | --- | --- |
| Quién debe | El cliente de Bley | Ferretería B |
| Quién paga | **él mismo** | **otra persona** |
| Qué baja | su deuda | la deuda de la B |

En el tipo 1 deudor y pagador son la misma persona, y por eso el sistema de hoy
alcanza. **Todo el trabajo nuevo sale de separarlos.**

---

## LO QUE YA EXISTE Y NO HAY QUE VOLVER A HACER

Antes de planear nada, lo que ya está construido y sirve tal cual:

- **El enlace se le manda a quien sea.** `POST /datos/socios/cobro` recibe
  `correo`, y ese correo no tiene por qué ser el del deudor. **El tipo 2 ya se
  puede disparar hoy** — lo que falla es lo que ve quien recibe el enlace.
- **El cobro por tarjeta y por Zelle**, con su conciliación, su recibo y su
  acreditación a la billetera del comercio.
- **La numeración de conciliación** (`Mercatren F-00123`), que es lo que ata la
  transferencia con la factura en el extracto del banco.

---

## EL PROBLEMA DE VERDAD, Y NO ES TÉCNICO

Hoy la página de pago dice **«Paga tu compra»** y el nombre del comercio. Nada
más.

Quien paga en el tipo 2 vería una factura que él nunca hizo, de una ferretería
que a lo mejor ni conoce. Dos finales, los dos malos:

1. **No paga.** Se asusta y llama. La venta se cae.
2. **Paga, y semanas después no reconoce el cargo** en su estado de cuenta.
   Eso es un contracargo, y en tarjeta se puede reclamar hasta 120 días después.

**El trabajo no es mover dinero de otra forma: es decir en pantalla qué se está
pagando y de quién es la deuda.**

---

## LO QUE HAGO YO (Mercatren)

Tres cosas, y ninguna toca cómo se mueve el dinero.

### 1 · El contrato acepta al deudor, aparte del pagador

`POST /datos/socios/cobro` suma dos campos **opcionales** — opcionales a
propósito, para que el tipo 1 siga funcionando sin tocar una línea en el
sistema de Bley:

```
{ "monto": 300.00, "referencia": "F-00456",
  "correo": "quien-paga@…",        ← a quién le llega el enlace (ya existe)
  "nombre": "Quien paga",           ← (ya existe)
  "deudor": "Ferretería B",         ← NUEVO: de quién es la deuda
  "tipo": "abono" }                 ← NUEVO: es un abono, no una compra
```

### 2 · La pantalla, el correo y el recibo lo dicen

Con `deudor` presente, donde hoy dice «Paga tu compra» pasa a decir **«Abono a
la cuenta de Ferretería B»**, y debajo, en chico, quién lo cobra. El correo y
el recibo, igual.

**Sin eso, lo demás no sirve de nada.** Es el 90 % del valor de este trabajo.

### 3 · Queda escrito quién pagó por quién

En `cobros_solicitados`, para que meses después se pueda demostrar quién puso
el dinero de qué deuda. Sin ese rastro, un contracargo no se puede defender.

**Lo que NO cambia:** el dinero sigue el mismo camino de siempre — Mercatren
cobra y le acredita a Bley en su billetera. Aquí no se inventa ningún carril
nuevo.

---

## LO QUE LES TOCA A ELLOS (sesión de Ferremateriales Bley)

- **Preguntar a quién se le manda el enlace** en el momento de registrar el
  abono: los contactos del deudor, más «otro correo».
- **Mandar el nombre del deudor** en el campo nuevo.
- **Bajar la deuda del DEUDOR cuando Mercatren diga «pagado»** — no la del que
  pagó. Es el error más fácil de cometer y el más caro de encontrar después.
- **Quién puede hacerlo:** el vendedor sobre sus clientes, y el superadmin sobre
  todos.

---

## LAS CUATRO PREGUNTAS PARA LA SESIÓN DE BLEY

Sin estas respuestas no se escribe código, porque cada una cambia el diseño:

1. **¿Dónde vive la deuda?** Mercatren tiene su propio módulo de créditos
   (`creditos_cliente`) y Bley tiene su pantalla «Deudas de clientes».
   **Comprobado: hoy no se hablan.** Si las dos llevan la cuenta, tarde o
   temprano dicen números distintos del mismo dinero — y ahí el comercio deja
   de creerle al sistema. **Hay que elegir una, y que la otra la lea.**
2. **¿El pagador tercero es una ficha en su sistema, o solo un correo suelto?**
   Cambia si hay que crearle cliente o basta con guardar el correo.
3. **¿Un abono puede cubrir deuda de varios deudores a la vez?** Por el croquis
   parece que no, pero conviene cerrarlo: repartir un pago entre deudas es una
   decisión de negocio que el sistema no debe adivinar.
4. **¿Qué pasa si el tercero paga de más?** ¿Queda a favor del deudor, se
   devuelve, o no se permite?

---

## LA QUE MIRA EL ABOGADO, Y NO ES MENOR

El croquis dice, con estas palabras: *«ese dinero iría directo a la ferretería
A a cubrir la deuda de la ferretería B»*.

**Así escrito, eso se lee como mover dinero de un tercero hacia otro** — que es
justo la figura que el abogado desarmó el 5 de agosto y la razón por la que
procesadores y bancos cierran cuentas.

**La lectura correcta, y la única que se puede escribir en el sistema:**
Mercatren cobra **el precio de una mercancía que ya se vendió**. Quién pone el
dinero es indiferente — igual que cuando alguien paga la cuenta de otro en un
restaurante. La mercancía la recibió Ferretería B; el pago la salda. Cada abono
sigue siendo **una compra-venta cerrada**, que es como ya está planteado el
módulo de crédito.

**Ninguna pantalla, ningún correo y ningún campo puede decir «pagar por cuenta
de», «abonar a la cuenta de un tercero» ni nada de la lista prohibida.** Se
dice **«Abono a la cuenta de Ferretería B»**, que describe qué se paga sin
describir un traslado de dinero ajeno.

Antes de publicar esto, que lo lea el abogado. Es media hora suya contra el
riesgo de la cuenta de Stripe.

---

## LO QUE CONTESTÓ LA SESIÓN DE BLEY (19 ago 2026)

Mandaron su propio plano y **coinciden en el diagnóstico**. Dos cosas cambiaron:

### La pieza que faltaba, y la puso el dueño

**La Ferretería B YA ESTÁ REGISTRADA como cliente de Bley.** Y Bley no tiene un
tipo de cliente sino tres: **ferreterías** que revenden, **personas** que
consumen, y **constructoras y fabricantes** que compran para su obra.

Eso quita el paso más frágil del plan de ellos: en su versión, B recibía el
enlace y lo **reenviaba** a su cliente. **Un reenvío que no ocurre es una venta
que no se cobra.** Como B ya está registrada, le dice al vendedor a quién
mandarle el cobro y el vendedor lo manda directo.

Y su primera pieza —«marcar quién es ferretería»— es **una casilla en una ficha
que ya existe**, no un módulo.

### Sus tres preguntas, contestadas

| | Su pregunta | Respuesta |
| --- | --- | --- |
| 1 | ¿La página puede decir «Ferretería B»? | **No así** |
| 2 | El aviso automático de pago | **Sí, lo construyo** |
| 3 | ¿Se puede repartir un cobro? | **No** |

**1 · El nombre en la página.** El cargo aparece en el estado de cuenta como
Mercatren, porque Mercatren cobra y factura. Página con un nombre y banco con
otro es un contracargo. Y la Ferretería B no tiene cuenta ni contrato aquí:
ponerla como vendedora sería **inventar un vendedor** — la misma tergiversación
que ya está prohibida para las tiendas de EE. UU.
**Lo que sí:** «Abono a tu cuenta con Ferretería B», con el nombre de B en
grande y, debajo, quién cobra y factura. Resuelve el reconocimiento sin tocar
el modelo.

**2 · El aviso.** Tienen razón: aquí paga un tercero que nadie está mirando. Ya
existe la consulta (`GET /datos/socios/cobro?referencia=…`), pero preguntar cada
rato no es enterarse. **El aviso tiene que decir DE QUÉ DEUDA era**, o su lado
no sabe cuál bajar.

**3 · Repartir el cobro.** La más peligrosa. Repartir entre dos destinatarios es
`transfer_data` + `application_fee_amount`, o sea **Stripe Connect** — prohibido
en este proyecto por escrito, y la figura que el abogado desarmó el 5 de agosto.
Aparte, la Ferretería B no tiene datos bancarios cargados: no hay a dónde
mandarle nada.
**Lo que sí:** el cobro se hace **solo por lo que B le debe a Bley**. Lo que
sobre entre B y su cliente se queda entre ellos. Un cobro, un destinatario.

### Lo que sigue abierto

De las cuatro preguntas originales, **sigue sin respuesta la más importante**:
¿dónde vive la deuda, en Mercatren o en Bley? Y se suma la del dueño: si el
cliente de B abona más de lo que B le debe a Bley, ¿se cobra solo hasta cubrir
esa deuda, o se cobra todo y B ajusta aparte?

El plano para el dueño está en `docs/Plano-cobro-ferreterias.pdf`
(`npm run docs:pdf-plano-ferreterias`).

---

## El orden

```
1. Las 4 preguntas → sesión de Bley          ← CONTESTADAS, menos «dónde vive la deuda»
2. La lectura legal → abogado
3. El contrato y las pantallas → yo
4. Su lado → ellos
5. El PDF para el vendedor, con las pantallas de verdad
```

**El PDF va de último, y a propósito**: un manual con pantallas que todavía no
existen es exactamente el que manda a la gente a buscar botones que nadie
construyó.
