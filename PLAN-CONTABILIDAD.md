# Contabilidad, facturación y cómo se le paga a un comercio

> **ESTADO AL 21 AGO 2026 — ejecutado lo que era código.**
> ✅ construido y publicado · ⚠️ solo lo puede hacer él (ver el final)
>
> Escrito el 21 de agosto de 2026, después de conectar Xero con Chase y con
> Stripe. Todo lo que dice este documento sobre impuestos y sanciones **está
> buscado en fuentes de agosto de 2026 y citado abajo**, no sacado de memoria.
>
> **Y nada de esto reemplaza al contador ni al abogado.** Lo que hay aquí es el
> trabajo previo: los hechos ordenados y las preguntas concretas, para que esa
> consulta cueste media hora y no tres.

---

# BLOQUE 1 · Xero: qué falta

## Lo que ya está conectado

| Fuente | Qué le da a Xero |
| ------ | ---------------- |
| **Chase** | El movimiento del banco: lo que entra y lo que sale |
| **Stripe** | Los cobros con tarjeta y sus comisiones |

Con eso Xero ya sabe **cuánto dinero se movió**. Lo que todavía no sabe es
**qué se vendió, a quién, y cuánto costó** — que es de donde sale el margen.

## Lo que falta, y no es una conexión

Faltan las dos puntas del par de facturas:

1. **La factura de venta** de Mercatren al comprador. Existe, la emite el
   sistema sola, pero Xero no la ve.
2. **La factura de compra** del comercio a Mercatren. Es el costo de la
   mercancía, y sin ella el margen que declara Xero es el bruto entero.

## MI RECOMENDACIÓN: NO conectar Mercatren con Xero todavía

Sé que suena al revés de lo que se espera, y por eso lo explico.

Hoy hay **tres órdenes de compra en total**: $7.71, $27.74 y $30.91. Construir
una integración con la API de Xero para eso es semanas de trabajo, una
credencial más que mantener, y una pieza que se rompe sola cuando Xero cambia
algo — todo para automatizar tres asientos al mes que se escriben en diez
minutos.

**Lo correcto ahora es un asiento mensual a mano**, con dos renglones por
período:

```
Ingresos por ventas .................... el bruto que cobró Stripe
Costo de mercancía vendida ............. lo que se le paga a los comercios
```

Esos dos números salen del panel con el botón de **«Descargar en Excel»** de
Órdenes y de Cobros, que ya existe y ya lleva el BOM y los decimales para que
Excel no rompa nada.

**Cuándo sí conectar:** cuando el asiento mensual pase de una hora, o cuando
haya más de unas 50 órdenes al mes. Antes de eso, la integración cuesta más de
lo que ahorra.

- [ ] ⚠️ **1.1** Crear en Xero una **cuenta puente para Stripe** («Stripe
      clearing»). Es la forma estándar: entra el bruto de la venta, sale la
      comisión de Stripe, y la cuenta cierra en cero en cada liquidación. Sin
      ella, el ingreso queda registrado por el neto y el margen sale inflado.
- [ ] ⚠️ **1.2** Crear la cuenta de **«Costo de mercancía vendida»** y la de
      **«Comisiones de procesador»**, separadas. Son dos costos de dos dueños
      distintos y juntarlos hace imposible ver cuál se lleva qué.
- [x] ✅ **1.3** El asiento mensual, escrito como procedimiento de dos pasos en
      este mismo archivo, para que lo pueda hacer cualquiera.
- [ ] ⚠️ **1.4** Cargar en Xero, como proveedores, a los comercios que ya
      facturan. Hoy son dos.

---

# BLOQUE 2 · Cómo debería funcionar la facturación

Ya está construida y funcionando. Se escribe aquí porque **es lo que hay que
explicarle al contador**, y hasta ahora solo vivía en el código.

## Cada venta emite DOS documentos, y esa pareja es el modelo entero

```
1. Mercatren LLC  →  factura al comprador          (la venta)
2. El comercio    →  factura a Mercatren LLC       (la compra de mercancía)
```

**La segunda la emite el comercio, no nosotros.** No se fabrica un documento a
nombre de otro. Lo que hace el sistema es darle la orden de compra con todo lo
que necesita —qué se vendió, cuánto se le paga, cuándo— y guardar su factura
contra ella.

Sin esa segunda factura hay un ingreso sin su costo. Y de esa resta sale lo que
se declara:

```
Ingreso bruto (103)  −  Costo de mercancía (100)  =  Margen (3)
```

## Y una excepción que ya está en el código

**A las tiendas del catálogo de Estados Unidos no se les pide factura.** «Sole
& Thread», «Ridgeback Outdoors» y las demás son marcas de la casa: por dentro
vende y factura Mercatren LLC. Nadie se factura a sí mismo.

Ahí el costo lo respalda **la factura de CJ**, que es a quien de verdad se le
compra la mercancía.

- [ ] ⚠️ **2.1** Pedirles a los dos comercios sus facturas pendientes: $27.74 y
      $30.91, las dos de Inversiones multiservicios.
- [x] ✅ **2.2** Guardar las facturas de CJ del catálogo de EE. UU. Hoy la
      compra queda registrada en el panel, pero el PDF de CJ no se archiva en
      ningún lado.

---

# BLOQUE 3 · ¿Bley necesita una LLC para venderle a Mercatren?

## NO. Y no es una opinión.

Un comercio venezolano puede venderle mercancía a una empresa de Estados
Unidos sin tener ninguna entidad allá. Es lo más normal del comercio
internacional: exactamente igual que cuando una tienda de aquí le compra a un
fabricante en China.

### Lo que dice la ley, con su fundamento

**1 · No se le emite un 1099.** Los formularios 1099 son para personas y
empresas de Estados Unidos. A un proveedor extranjero que trabaja fuera del
país no se le emite ninguno.

**2 · Lo que sí se le pide es el formulario W-8BEN-E.** Es el que declara que
la empresa no es estadounidense. Lo llena el comercio, se guarda en el archivo
y no se manda a ninguna parte. Vale tres años.

**3 · No hay retención, y este es el punto que lo cierra.** El ingreso por la
venta de mercancía comprada se ubica **donde pasa la propiedad de la
mercancía** — es la regla del *title passage* de las secciones 861(a)(6) y
862(a)(6) del código fiscal. La mercancía de Bley se entrega en Venezuela, así
que ese ingreso es de fuente extranjera para ellos: **no lleva retención y no
va en un 1042-S.**

### Qué hace falta de verdad, entonces

- [x] ✅ **3.1** Pedirle a cada comercio extranjero su **W-8BEN-E** firmado,
      antes del primer pago. Cinco minutos, se guarda y ya.
- [ ] ⚠️ **3.2** Un acuerdo de compraventa por escrito con cada uno: qué se
      compra, a qué precio, quién asume qué. Hoy la relación funciona pero no
      está firmada.
- [ ] ⚠️ **3.3** Que la factura del comercio diga que la entrega ocurre en su
      país. Es lo que respalda el punto 3 si algún día alguien pregunta.

---

# BLOQUE 4 · El plan B de Deea International LLC

> La idea: si Bley crece y pasa de $3.000 al día, que **Deea International LLC**
> —de una amiga, en Estados Unidos— le compre a Bley y le venda a Mercatren,
> cobrando un 2 %.

## Mi lectura, y va con las cartas boca arriba

**Ese plan no resuelve el problema que parece resolver, y crea tres nuevos.**

**No resuelve nada fiscal**, porque no había nada que resolver: el bloque 3
demuestra que Bley puede facturarle a Mercatren directamente sin tener entidad
en Estados Unidos.

**Y lo que sí es un problema de verdad, tampoco lo resuelve** — ver el bloque 5.

### Los tres problemas que agrega

**1 · El trabajo se mueve, no desaparece.** Deea tendría que hacer exactamente
lo mismo que haría Mercatren: pedirle el W-8BEN-E a Bley, pagarle a Venezuela,
guardar sus facturas. Más su propia declaración, su propia contabilidad y su
propio banco.

**2 · Un 2 % a cambio de nada visible.** Deea no tendría inventario, ni asumiría
la devolución, ni el contracargo, ni el riesgo de que la mercancía no llegue.
Un intermediario que no asume ningún riesgo y cobra un porcentaje es, a ojos de
cualquiera que audite, una empresa puesta en medio para algo — y toca explicar
para qué. **La explicación tiene que existir antes de montarlo, no después.**

**3 · «Una amiga» es una frase que en un expediente se lee distinto.** No tiene
nada de malo hacer negocios con conocidos, pero cuando hay una relación
personal detrás de un intermediario que cobra un porcentaje, eso se llama
operación con parte relacionada y se mira con lupa. El precio tiene que ser el
de mercado y hay que poder demostrarlo.

### Cuándo SÍ tendría sentido

No lo descarto del todo, porque hay un caso en que sí sirve: **si Deea de
verdad hace algo.** Si compra la mercancía y la tiene, si asume la devolución,
si le paga a Bley por adelantado y corre ese riesgo, o si tiene una vía para
pagarle a Venezuela que Mercatren no tiene. Ahí el 2 % es el precio de un
servicio real y la estructura se sostiene sola.

**Lo que no se sostiene es un intermediario que solo firma papeles.**

- [ ] ⚠️ **4.1** Antes de montar nada: escribir en una línea **qué hace Deea
      que Mercatren no pueda hacer**. Si esa línea no sale, la respuesta es que
      no hace falta.
- [ ] ⚠️ **4.2** Si sale: llevársela al contador y al abogado **juntos**, antes
      de la primera operación. No después.

---

# BLOQUE 5 · El problema de verdad, y no es el que estábamos mirando

> Esto es lo que encontré investigando, y no era lo que buscaba.

**Pagarle a Venezuela desde un banco de Estados Unidos es legal hoy, y aun así
casi ningún banco lo hace.**

En abril de 2026 el Tesoro de Estados Unidos levantó buena parte de las
sanciones al banco central venezolano con las licencias generales 56 y 57, y
eso desbloqueó formalmente las transferencias en dólares. **Pero la letra
pequeña la escriben los bancos, no el Tesoro:** los bancos corresponsales
estadounidenses siguen sin procesar pagos a Venezuela aunque estén autorizados,
porque el costo de cumplimiento les sale más caro que lo que ganan.

**Traducido a nuestro caso:** el día que Bley venda de verdad, el sistema va a
generar su retiro correctamente, y es muy posible que **Mercury simplemente no
lo ejecute**.

Y aquí está lo que hay que ver: **Deea International LLC tiene exactamente el
mismo problema.** Es una empresa de Estados Unidos, con bancos de Estados
Unidos, con los mismos bancos corresponsales. Poner una LLC en medio no crea
una vía de pago que no existe.

- [ ] ⚠️ **5.1** **Preguntarle a Mercury, por escrito y antes de necesitarlo**,
      si ejecutan wires a Venezuela y bajo qué condiciones. Es una pregunta de
      cinco minutos que hoy no tiene respuesta y de la que depende todo lo
      demás.
- [ ] ⚠️ **5.2** Si la respuesta es que no: **ese** es el problema que hay que
      resolver, y ahí sí puede tener sentido un tercero — pero uno que tenga la
      vía de pago, no uno que solo facture.
- [ ] ⚠️ **5.3** Mientras tanto, no prometerle a ningún comercio venezolano un
      plazo de pago que dependa de un wire que nadie ha probado.

---

# El orden en que yo lo haría

1. **5.1** — preguntarle a Mercury. Es gratis, son cinco minutos, y de la
   respuesta depende si el bloque 4 tiene sentido siquiera.
2. **3.1** — pedir los W-8BEN-E. También es de hoy y sin costo.
3. **1.1 y 1.2** — las cuentas de Xero. Media hora.
4. **2.1** — cobrarle las dos facturas pendientes a Inversiones multiservicios.
5. **1.3** — escribir el procedimiento del asiento mensual.
6. **4.1** — la pregunta de una línea sobre Deea. Solo después de saber lo de
   Mercury.

---

## Fuentes

Todo lo de los bloques 3 y 5 sale de estas, consultadas el 21 ago 2026:

- Regla del *title passage* para mercancía comprada — secciones 861(a)(6) y
  862(a)(6): [Alston & Bird, sobre las reglas finales de la sección 863(b)](https://www.alston.com/en/insights/publications/2020/10/sourcing-the-source-of-inventory-sales)
- 1099 y proveedores extranjeros: [Tipalti](https://tipalti.com/blog/1099-for-foreign-contractors/) · [Greenback Tax Services](https://www.greenbacktaxservices.com/knowledge-center/1099s-foreign-contractors/)
- Formulario W-8BEN-E para entidades extranjeras: [Andrew Mitchel LLC](https://www.andrewmitchel.com/blog/2014_09_payments-to-foreign-contractor-entities-form-w-8ben-e/)
- Licencias generales 56 y 57 de la OFAC, abril 2026: [Crowell FinTalk](https://www.crowellfintalk.com/2026/04/ofac-expands-venezuela-sanctions-relief-new-general-licenses-56-and-57-and-guidance-on-reporting-obligations/) · [King & Spalding](https://www.jdsupra.com/legalnews/ofac-eases-sanctions-on-financial-1255141/)
- Los bancos corresponsales que no procesan aunque esté autorizado: [Interstice Digital](https://www.intersticedigital.io/research/how-to-pay-venezuelan-vendors-crypto-2026)
- Conciliación de Stripe en Xero con cuenta puente: [Bean Ninjas](https://beanninjas.com/blog/avoid-stripe-and-xero-headaches-step-by-step-guide/) · [Synder](https://synder.com/blog/how-to-reconcile-stripe-payments-in-xero/)


---

# LO QUE SE CONSTRUYÓ, Y LO QUE SOLO PUEDES HACER TÚ

## Construido y publicado

**3.1 · El formulario fiscal, dentro de Mercatren.** Ya no hay que pedirle el
W-8BEN-E por correo a nadie. El comercio entra a **Mi tienda**, llena unos
campos en español, firma, y sale su documento. Queda guardado en su ficha
—nadie tiene que mandarlo ni subirlo— y **sin él no se le paga un retiro**, lo
que convierte el papel en una pieza del sistema y no en un trámite que se
olvida.

**1.3 · El asiento del mes.** En **Configuración → Asiento contable del mes**,
con sus tres renglones: ingresos por el bruto, costo de mercancía y comisiones
del procesador. Se abre en Excel o se pega en Xero.

**2.2 · El archivo de las facturas de CJ.** La tabla está puesta para guardar
el PDF de cada compra al proveedor, que es el papel que respalda el costo de
las ventas de Estados Unidos.

## Lo que solo puedes hacer tú, y por qué

Ninguna de estas se dejó por falta de tiempo: **no son código.**

- **⚠️ 5.1 · Preguntarle a Mercury si ejecutan wires a Venezuela.** Es lo
  primero de toda la lista y son cinco minutos. De esa respuesta depende si el
  plan de Deea tiene sentido siquiera.
- **⚠️ 1.1, 1.2 y 1.4 · Las cuentas de Xero.** La cuenta puente de Stripe, las
  dos de costos separadas, y cargar a los comercios como proveedores. Eso vive
  en tu Xero, no en Mercatren.
- **⚠️ 2.1 · Cobrarle las dos facturas pendientes** a Inversiones
  multiservicios: $27.74 y $30.91.
- **⚠️ 3.2 y 3.3 · Los acuerdos de compraventa firmados** y que la factura del
  comercio diga dónde se entrega la mercancía. Eso lo redacta el abogado.
- **⚠️ 4.1 y 4.2 · La línea sobre Deea.** Qué hace que Mercatren no pueda. Si
  no sale, no hace falta.
- **⚠️ 5.2 y 5.3 · Qué hacer si Mercury dice que no.** Depende de la respuesta
  de 5.1.
