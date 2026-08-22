# Roadmap de Mercatren

> **Qué es esto.** La lista de lo que falta, ordenada por lo que desbloquea a lo
> demás — no por lo que apetece hacer. Cuando el dueño pregunte «¿qué tenemos
> pendiente?», se contesta desde aquí.
>
> **La regla que manda sobre todas:** primero lo formal y lo legal, después lo
> que crece. Un negocio que factura mal o cobra a nombre equivocado no se
> arregla creciendo — se arregla parando.
>
> Última revisión: 21 de agosto de 2026.

---

## ✅ Cobrar sin API, con flete y manejo (21 ago 2026)

**Hecho y publicado.** El comercio pide el cobro desde **Panel → Cobros →
Enlaces de cobro**, sin necesitar un programador, y puede **reenviarle el enlace
a quien de verdad va a pagar** — que casi nunca es el cliente que compró.

- **Flete y transporte** y **Manejo y servicios adicionales** se suman al total y
  salen **desglosados en la página de pago**, cada uno con la explicación que
  escribió el comercio.
- «Manejo» es el término de la industria (_handling_): embalaje especial, carga y
  descarga, acarreo, subir a un piso. **No es un «otros gastos»** — se separa del
  flete porque lo cobra otra gente y porque un renglón sin nombre es lo que hace
  que un cliente llame al banco.
- El enlace **se copia** para mandarlo por WhatsApp, que es como se manda de
  verdad.
- Reenviar **no cambia la referencia ni el enlace**: en el extracto del banco
  sigue apareciendo el mismo número.
- Comprobado a **375 px**, que es desde donde cobra la mayoría.

### Lo que queda de esto

- [ ] **El flete y el manejo en el checkout de la tienda**, no solo en el cobro
      por enlace. Hoy un comprador del catálogo no puede pagar un flete acordado
      aparte.
- [ ] **Que el comercio guarde sus tarifas** (su flete habitual, su cargo por
      piso) para no reescribirlas en cada cobro.
- [ ] **El desglose dentro de la factura de venta.** Hoy se ve en la página de
      pago; en el documento todavía va en una sola línea.

## Dónde estamos hoy

| Pieza                            | Estado                            |
| -------------------------------- | --------------------------------- |
| Mercatren LLC (Michigan) + EIN   | ✅ 11 ago 2026                    |
| Banco Mercury                    | ✅ Checking ••9805                |
| Stripe                           | ✅ activa                         |
| Banco Chase (para Zelle)         | ✅ aprobada, con fondo inicial    |
| Correos @mercatren.com           | ✅ buzón real en Google Workspace |
| El sitio dice Mercatren LLC      | ✅ publicado y comprobado         |
| Candado de aprobación en Mercury | ✅ todos los pagos, desde $0      |
| Google Merchant Center           | ⏸ 3 de 5 — parado en envíos       |
| Catálogo de Estados Unidos       | 🟡 78 productos, en la tienda ya  |

**Lo que esto significa:** la sociedad existe y puede operar. Lo que todavía no
ocurre es que el dinero entre a su nombre.

---

## BLOQUE 1 — Cerrar el traspaso (bloquea todo lo demás)

Mientras esto no esté, **un cobro con tarjeta sigue entrando en la cuenta de
Windoce, LLC** y le aparece así al comprador. Nada de lo que viene después
importa hasta cerrarlo.

1. ~~**Claves de Stripe** al panel de YaDominios.~~ ✅ 14 ago 2026 — las tres
   cargadas y comprobadas contra producción: el webhook contesta `400 sin
firma` (no `503 sin configurar`), así que están las dos que él exige, y
   `400 firma invalida` ante una firma falsa, así que la verificación corre con
   el `whsec_` nuevo.
2. ~~**Webhook de Stripe.**~~ ✅ 14 ago 2026 — destino `mercatren-llc` activo en
   **`https://mercatren.com/datos/stripe`**, con **siete** eventos: `payment_intent.succeeded`,
   `payment_intent.payment_failed`, los tres `charge.dispute.*`,
   `charge.refunded` y `radar.early_fraud_warning.created`.

   Los dos últimos se agregaron el 13 ago 2026. `charge.refunded` tapa el
   hueco de devolver **desde el panel de Stripe** en vez del nuestro: el dinero
   salía y aquí el pedido seguía diciendo «pagado». El aviso de fraude llega
   ANTES de que haya contracargo, que es la única ventana para no despachar la
   mercancía y devolver por decisión propia.

   **La dirección es esa, sin `/aviso` al final.** Aquí decía
   `/datos/stripe/aviso` y esa ruta nunca existió: el archivo está en
   `src/app/datos/stripe/route.ts`. Configurado así, Stripe habría llamado a
   un 404, habría dado el aviso por fallido y el comprador se quedaría con su
   pedido en «esperando el pago» teniendo el dinero ya cobrado.
   `tests/unit/rutas.test.ts` comprueba contra el disco que la constante
   apunte a un `route.ts` que existe.

3. **Zelle de Chase.** ✅ Dado de alta y activo (13 ago 2026). **Ojo con el
   correo: es `pagos@mercatren.com`, no `zelle@`** — el banco no aceptó
   registrar el seller directamente y hubo que darlo de alta de otra forma.

   ✅ Las dos variables cargadas el 14 ago 2026: `ZELLE_CORREO_RECEPTOR` =
   `pagos@mercatren.com` y `ZELLE_NOMBRE_RECEPTOR` = `Mercatren LLC`. Van
   siempre juntas: con el nombre nuevo sobre la cuenta vieja, el comprador ve
   un nombre que no le cuadra con lo que busca en su banco y no paga.

4. **Datos de Mercury** para los retiros: `PAGO_CUENTA`, `PAGO_RUTA_ACH`,
   `PAGO_RUTA_WIRE`.
5. **Emisor de las facturas**: `EMISOR_IDENTIFICACION` y `EMISOR_DIRECCION`.
6. **La cuenta bancaria de los depósitos en Stripe** (pestaña «Cuentas externas
   vinculadas»): tiene que ser el Mercury de **Mercatren LLC**, Checking ••9805.
   Si ahí queda la de Windoce, todo cobra igual y el dinero sigue cayendo en la
   sociedad vieja **sin dar ningún error**.
7. **La pestaña «Verificada» de Stripe sin nada pendiente.** Mientras haya algo
   abierto, Stripe cobra pero retiene los depósitos.
8. **Send test webhook** desde Stripe: tiene que devolver 200.
9. **Una venta de prueba de punta a punta**, de verdad y con dinero real: pagar
   con tarjeta, ver que entra en Mercury, que se emite el par de facturas, y
   que el neto aparece en la billetera del comercio.

**Métodos de pago en Stripe: solo los que cuesten como la tarjeta.** El precio
publicado se calcula con la tarifa de tarjeta (2.9 % + $0.30). Klarna, Affirm y
compañía cobran cerca del 6 % y con un margen del 3 % cada venta por ahí es una
pérdida — sin error en ninguna pantalla. Apagadas el 14 ago 2026. El criterio es
el COSTO, no el país: los métodos europeos que cuesten igual o menos se quedan
encendidos, porque Europa está en el plan.

**El corte contable es un hecho, no una fecha:** el primer dólar que Stripe
liquide en la cuenta de Mercatren LLC. Ni un hueco ni un solapamiento.

---

## ANTES DE ABRIR AL PÚBLICO — la lista del lanzamiento (15 ago 2026)

> Comprobado en producción el 14 ago 2026 de madrugada: las 13 rutas críticas
> responden 200, el webhook contesta `400 sin firma` (las claves están) y
> `400 firma invalida` (la verificación corre), y el crédito del pie ya sale
> con `nofollow`.

### Lo que hay que hacer ANTES de la primera venta, no después

1. **`EMISOR_IDENTIFICACION` y `EMISOR_DIRECCION` en YaDominios.** Es lo único
   de esta lista que **no se puede arreglar después**: cada factura copia los
   datos del emisor DENTRO del documento, para siempre. Las que se emitan sin
   esas variables saldrán con el nombre solo, sin EIN ni dirección, y así se
   quedan. Corregirlas es reeditar un documento contable ya emitido.
   - `EMISOR_IDENTIFICACION` → el EIN, como en la carta CP 575
   - `EMISOR_DIRECCION` → `30080 Montmorency Drive, Novi, MI 48377`

2. **La pestaña «Verificada» de Stripe sin nada pendiente.** Mientras haya algo
   abierto, Stripe cobra pero retiene los depósitos.

3. **Probar el envío de correo** (Panel → Configuración → Probar el envío). El
   buzón del equipo pasó a `soporte@mercatren.com` el 14 ago; de esos avisos
   depende que alguien mire la cola de retiros.

4. **Send test webhook** desde Stripe: tiene que devolver 200.

5. **Una compra de prueba de un dólar, con tarjeta de verdad.** Que el pedido
   pase solo a «pagado», que se emitan las dos facturas, que el neto aparezca en
   la billetera del comercio y que el dinero se vea en Mercury.

### Lo que puede esperar unos días

- **`PAGO_CUENTA`, `PAGO_RUTA_ACH`, `PAGO_RUTA_WIRE`.** Sin ellas, la ficha del
  pedido no ofrece transferencia bancaria y lo dice — no inventa datos. Tarjeta
  y Zelle funcionan igual.
- **Los retiros salen a mano desde Mercury.** El comercio los pide en el panel y
  una persona los ejecuta en el banco. Funciona; solo es trabajo manual.

### Lo que NO está y hay que saber que no está

- **Envío e impuestos van en CERO.** Se acuerdan con cada comercio por fuera.
  Un comprador que pida algo pesado no ve ningún costo de envío.
- **Las existencias se descuentan al confirmarse el pago, no al hacer el
  pedido.** Dos personas pueden comprar la última unidad; el validador tiene que
  mirar el stock antes de aprobar.
- **Un pedido que mezcla varios comercios deja el pago sin comercio asignado** y
  lo resuelve el equipo a mano. Repartir un pago entre comercios es una decisión
  de negocio.
- **Klarna y Affirm están apagadas** porque cobran cerca del 6 % y el margen es
  3 %. Se encienden cuando el margen pase del 6.5 %.

---

## MAÑANA — el primer retiro de verdad (15 ago 2026)

**Armando (MEGAYES) pide su dinero.** Se cumplen los tres días de la
transferencia ACH a la cuenta de Mercury de Mercatren LLC, así que el dinero ya
habrá caído y el retiro se puede ejecutar.

Es la primera vez que el circuito completo corre de punta a punta con dinero de
un comercio real: él lo pide en el panel → el monto se aparta de su saldo → al
equipo le entra en la cola → una persona lo transfiere desde Mercury → se marca
«Ya lo pagué».

**Qué mirar mientras pasa:**

- Que los datos bancarios de Colombia salgan completos y copiables uno por uno
  (`/panel/retiros`, tarjeta «Datos para transferir»). Es el punto donde un
  wire mal dirigido se queda semanas dando vueltas entre bancos.
- Que el monto apartado cuadre con lo que baja de su saldo.
- Que el desglose de arriba sume el bruto exacto: lo que pagaron los
  compradores − Stripe − Mercatren = lo que le queda. Un centavo que no cuadre
  en una pantalla de dinero rompe la confianza en todo lo demás.
- Que al marcar «Ya lo pagué» el movimiento quede con su autor y su fecha.

---

## COBRAR TAMBIÉN POR ACH Y POR WIRE (pedido el 14 ago 2026)

Hoy el comprador solo tiene **tarjeta y Zelle**. Zelle tiene tope diario y a
mucha gente no le alcanza para comprar una moto o algo grande — justo las
ventas que más margen dejan. Un ACH o un wire no tienen ese tope.

**Lo que falta, y no es solo enseñar el número de cuenta:**

1. **Un cuarto método.** Hoy `METODOS_PAGO` es `["stripe", "zelle",
"billetera"]`. Entra `transferencia`, con su pantalla y su rastro.
2. **Su comprobante y su cola de validación**, igual que Zelle: un ACH no avisa
   a nadie cuando llega. Alguien tiene que comprobarlo contra Mercury y
   aprobarlo, y de ahí sale la acreditación al comercio.
3. **Las variables del banco**: `PAGO_CUENTA`, `PAGO_RUTA_ACH`,
   `PAGO_RUTA_WIRE`, `PAGO_BENEFICIARIO`, `PAGO_BANCO`. Ya están declaradas y
   la ficha las usa; sin ellas dice que no está configurado y **no inventa
   datos**.
4. **El precio.** Un ACH entrante no cuesta lo que una tarjeta. Si se cobra el
   mismo precio publicado, ahí hay margen de más; si se le hace su propia
   fórmula, hay que meterla en `dinero.ts` con sus pruebas, como las otras dos.
5. **Decir cuánto tarda.** Un ACH se demora días. Quien no lo sabe cree que su
   pedido se trabó.

**Ojo con el vocabulario:** es el pago de una compra, no una transferencia de
dinero. En pantalla va como «pagar por transferencia bancaria», nunca como
«enviar dinero».

---

## SABER POR DÓNDE ENTRA CADA DÓLAR (pedido el 14 ago 2026)

Todo el dinero entra ahora directo a Mercatren LLC, y no hay ninguna pantalla
que diga **cuánto entró por tarjeta, cuánto por Zelle y cuánto por
transferencia**. Hoy el tablero suma todo junto.

Hace falta para tres cosas distintas:

- **Cuadrar con el banco.** Stripe deposita en tandas y Zelle entra suelto; sin
  separar por método, cuadrar el extracto de Mercury es a ojo.
- **Saber cuánto cuesta cobrar.** Cada método deja un margen distinto: la
  tarjeta paga 2.9 % + $0.30 al procesador y Zelle no paga nada. Sin el
  desglose no se sabe cuál conviene empujar.
- **El 1099-K.** Stripe reporta solo lo suyo. Lo que entró por Zelle y por
  transferencia también es ingreso y hay que poder separarlo para el contador.

**El dato ya está guardado** —cada pago sabe su método— así que esto es una
pantalla, no una migración: un desglose por método en el tablero y en la
exportación a Excel, con su filtro por fechas.

---

## EL CATÁLOGO DE ESTADOS UNIDOS (arrancado el 15 ago 2026)

Es lo que desbloquea Google Merchant Center, parado en el paso 4 de 5 desde el
12 de agosto porque no hay una tienda con entrega real en EE. UU.

**Proveedor: CJ Dropshipping.** Sin pago mensual, almacenes en EE. UU. con
entrega de 2 a 5 días, y catálogo parecido al nuestro —herramientas, hogar,
electrónica— y no solo moda. Cuenta creada y llave cargada el 15 ago 2026.

### El orden, y por qué NO se toca el frente todavía

1. ~~Cuenta y llave de CJ~~ ✅
2. ~~El importador, con el filtro por almacén~~ ✅ (15 ago)
3. **Los productos cargados**, 250–300. ← aquí estamos: **78 puestos**
4. **Recién entonces el selector de destino en el encabezado.**

Un selector que ofrece «Estados Unidos» y lleva a un catálogo vacío es peor que
no tener selector: es exactamente la tergiversación que suspende cuentas de
Merchant Center, y además le enseña una tienda vacía a un comprador real.

### Las decisiones de diseño que ya están tomadas

**La pregunta es «¿a dónde lo enviamos?», no «¿dónde estás?».** Quien compra
está en Miami y la entrega es en Maracaibo; preguntar por la ubicación de la
persona da siempre el dato equivocado.

**NUNCA se adivina por la conexión.** El 100% de los compradores de Venezuela
navegan desde Estados Unidos: detectar por IP le daría el catálogo equivocado a
toda la clientela actual.

**El destino sale del país de la TIENDA, no de una columna nueva.** Todo
producto cuelga de una tienda y toda tienda ya declara su `paisOrigen`, así que
el dato ya está en la base. Evita una columna nueva, que aquí es un problema
real: `schema.sql` solo trae `CREATE TABLE IF NOT EXISTS` y una columna nueva no
llega sola a producción.

**El catálogo de EE. UU. cuelga de una tienda interna nuestra.** Mercatren LLC
es quien vende y factura allá, y eso es justo lo que Merchant Center necesita:
un solo vendedor responsable con una política de envío y una de devoluciones —
no un mercado de terceros que habría que demostrar tienda por tienda. Por eso
en EE. UU. no se abren tiendas de terceros.

**El destino sigue al contenido.** Abrir un producto de Bley cambia el destino a
Venezuela solo: la clientela que llega por WhatsApp nunca cae en el catálogo
equivocado sin que haya que explicarle nada.

**Un destino por carrito.** Un taladro de Texas y un tubo de PVC de Maracaibo no
caben en la misma caja.

`src/lib/destino/reglas.ts`, puro, 13 pruebas.

### Lo decidido el 15 ago 2026

- **El envío va GRATIS, con su costo dentro del precio.** Es lo que espera un
  comprador estadounidense y en Merchant Center es una etiqueta visible. Además
  deja un solo número que cuadrar entre la ficha y lo declarado, en vez de dos.
- **30 días de devolución, contados desde que el cliente RECIBE.** Google
  rechaza los plazos contados desde la compra.
- **El margen del catálogo de EE. UU. es 30 %, no el 3 % de Venezuela**
  (`COMISION_US_PB`).

### Por qué el margen aquí es 30 % y no 3 %

Son dos negocios distintos, y confundirlos costaba dinero en cada venta.

En Venezuela, Mercatren es un **mercado**: el comercio pone la mercancía, la
despacha y responde por ella. El 3 % es limpio porque no ponemos capital ni
asumimos el riesgo de la cosa vendida.

En Estados Unidos, Mercatren **compra, paga el envío, atiende al comprador y
asume la devolución y el contracargo**. Eso es venta al por menor.

Comprobado contra el mercado: el estándar del dropshipping es **15–30 % neto**,
con bruto de 30–50 % antes de publicidad, y por debajo del 10 % se considera
insostenible en cuanto aparecen devoluciones.

**Con el 3 %, un producto de $30 de costo dejaba 97 centavos** — un solo
contracargo se comía treinta ventas. Con el 30 % deja $13.55.

| Costo en CJ | Se publica a | Stripe | Nos queda |
| ----------- | ------------ | ------ | --------- |
| $9.00       | $13.86       | $0.70  | $4.16     |
| $14.00      | $21.32       | $0.92  | $6.40     |
| $30.00      | $45.16       | $1.61  | $13.55    |
| $58.00      | $86.89       | $2.82  | $26.07    |
| $135.00     | $201.64      | $6.15  | $60.49    |

**La escalera de cada 60 días NO se aplica a este catálogo.** Aquella sube el 3 %
hacia el 8 % para el mercado de Venezuela; esto ya nace en su banda de mercado.

---

## LO QUE FALTA DEL FRENTE (pedido el 15 ago 2026 · se hace el 16)

El catálogo de Estados Unidos ya se ve mezclado con el de Venezuela y cada
producto de allá lleva su banderita. Lo que sigue es lo que el dueño vio al
usarlo, en sus palabras, y en el orden en que lo dijo.

### 1. Los productos salen en BLOQUE, no mezclados

Salen hileras enteras con banderita seguidas de hileras enteras sin ella.
Parece dos tiendas pegadas con cinta, no una sola. La causa es que los 78 de
Estados Unidos entraron el mismo día y el orden manda la fecha.

**Hay que intercalarlos**, y no es solo estética: una hilera entera de
lámparas en inglés le dice al comprador venezolano que esa parte no es para
él, y deja de bajar.

Dos cosas que no se pueden romper al hacerlo:

- **La portada usa una semilla para no “bailar”** entre una carga y la
  siguiente. La mezcla tiene que respetarla o los productos se cambiarán de
  sitio cada vez que alguien refresque.
- **Los departamentos siguen mandando.** Mezclar no es revolver: dentro de
  «Ferretería y construcción» se intercalan los de ferretería, no se cuelan
  carteras.

### 2. La ficha del producto no dice que el envío es GRATIS

Hoy quien abre un producto de Estados Unidos **no sabe si el envío está
incluido ni a dónde llega**. Eso es exactamente lo que se pregunta antes de
comprar, y si no lo encuentra, se va.

Arriba, pegado al precio, donde sí se lee:

- **Envío gratis a cualquier parte de Estados Unidos.**
- Llega en **2 a 5 días hábiles**.
- **El precio que ves es el precio final** (el envío ya va dentro).

**ANTES de escribirlo hay que confirmar con CJ hasta dónde llega de verdad:**
Alaska, Hawái y Puerto Rico no siempre entran en el envío estándar. Prometer
un destino al que el proveedor no despacha no es un texto mal redactado — es
un pedido cobrado que hay que cancelar y devolver.

### 3. El consejo del casillero, para quien está fuera de Estados Unidos

Más abajo en la ficha, sin ruido y sin competirle al botón de comprar: quien
esté en Colombia, Chile, Panamá, México o España puede **alquilar un casillero
en Estados Unidos**, poner esa dirección al comprar, y la empresa del casillero
se encarga de llevárselo a su país. Nosotros lo llevamos gratis hasta el
casillero.

Es lo que la gente ya hace, y decírselo nosotros evita que se vaya sin
preguntar. Tres reglas para que sea un consejo y no un problema:

- **Es un consejo, no un servicio nuestro.** No se nombra ni se recomienda una
  empresa concreta sin un acuerdo firmado; si algún día se nombra, se dice que
  no tenemos relación con ella.
- **No se promete nada del tramo internacional**: ni plazo, ni costo, ni
  aduana. Ahí no mandamos nosotros.
- **La devolución de esos casos hay que pensarla aparte.** Nuestra política de
  30 días no puede cubrir un producto que ya salió del país; hay que decirlo
  antes, no cuando el comprador reclame.

### 4. El buscador se achicó, y el buscador es la INSIGNIA

Palabras del dueño: _«el buscador es la insignia de nosotros, no puede
achicarse y ponerse todo feo»_. Tiene que volver a ser largo y grande.

### 5. El encabezado con sesión iniciada está recargado

Y es la causa de lo anterior: con sesión hay cuatro cosas peleándose el ancho
—Panel · Hola, Soporte / Cuenta y listas · Hola, / Devoluciones y pedidos ·
Carrito— y lo que se comen es el buscador.

- **«Devoluciones y pedidos» no merece un sitio propio en la barra.** Va dentro
  del menú de la cuenta o dentro de «Todo».
- **«Cuenta y listas» se queda**, pero compacto.
- **«Panel» está bien** donde está.

Falta la captura que el dueño va a mandar para afinar el detalle.

### Y lo que quedó abierto de este mismo día

- **Un carrito puede mezclar destinos.** Un tubo de Caracas y una cámara de
  Estados Unidos no se pueden entregar juntos, y hoy nada lo impide.
  `cabenJuntos()` en `src/lib/destino/reglas.ts` está escrito y probado, y
  **todavía no está puesto en el carrito ni en el checkout**. Es lo más
  urgente de esta lista: se cobra un pedido que no se puede despachar.
- **El selector de destino del encabezado** (el croquis del 15 ago), que es la
  otra mitad de la misma historia.
- **`/datos/google` manda el catálogo entero**, incluidos los productos
  venezolanos, que no se pueden entregar en Estados Unidos. Hay que separarlo
  **antes** de conectar Merchant Center: es motivo de suspensión.
- **Las fichas de CJ están en inglés en los dos idiomas.** Falta el título en
  español y una descripción propia — sin eso, Merchant Center las trata como
  fichas pobres. No se inventan traducciones automáticas.
- **Las estrellas de valoración** de productos y de comercios. Pedido el 14 ago
  y todavía sin hacer; va completo o no va.
- **Los avisos por Telegram.** Pedido el 14 ago, nunca existió.

## LAS TIENDAS POR RUBRO Y LA NAVEGACIÓN (pedido el 15 ago 2026)

### 6. Al entrar en una categoría, la barra de categorías DESAPARECE

Desde la portada se ven los 23 departamentos en la tira de arriba y funciona
precioso. Se toca uno, se entra… **y la tira ya no está**. Para ir a otra
categoría hay que devolverse con el botón de atrás.

Eso es un callejón sin salida: quien está navegando por gusto —que es quien más
compra— se topa con una pared en el segundo clic. La tira tiene que quedarse,
con la categoría en la que estás marcada.

### 7. VARIAS TIENDAS DE ESTADOS UNIDOS, UNA POR RUBRO

Hoy todo lo de Estados Unidos cuelga de una sola tienda. Con 10.000 o 20.000
productos dentro, eso se ve mal y se ve a monopolio: una tienda que lo vende
todo no se parece a nada real.

**El plan:** varias tiendas, cada una con su nombre propio y su rubro — una de
repuestos de carro, otra de muebles, otra de carteras, y así. El comprador ve
un mercado con muchos vendedores, que es lo que es Mercatren.

**Por dentro no cambia nada:** la compra a CJ y la factura las hace
**Mercatren LLC**, directo, igual que hoy. El nombre de la tienda es
presentación.

**LA REGLA QUE NO SE NEGOCIA, y es la que hace que esto sea legítimo:** en la
ficha de cada producto y en cada tienda se lee **quién vende y factura**
(«Vendido y facturado por Mercatren LLC»). Con esa línea son marcas de la casa,
como Amazon Basics o las marcas propias de cualquier cadena — perfectamente
normal. Sin ella son vendedores inventados, y eso es tergiversación: causa de
suspensión en Merchant Center y de contracargos ganados por el comprador. La
línea puede ir discreta; lo que no puede es faltar.

Lo que hay que construir:

- **En el panel, dar de alta una tienda de la casa**: nombre, rubro y su ficha.
  Solo el equipo interno.
- **El producto cae solo en la tienda de su rubro.** Ya se calcula el
  departamento al agregarlo desde CJ (`src/lib/cj/departamento.ts`); esa misma
  decisión elige la tienda. Si estando en la de repuestos se agrega una cartera,
  la cartera **se va sola a la de carteras** — no se queda donde no va.
- **Repartir los 78 que ya están.** Hoy cuelgan todos de
  `tienda-mercatren-us`. Hay que moverlos a la tienda que les toca, sin romper
  sus direcciones web ni sus fotos.
- **Un rubro sin tienda propia se queda en la tienda general.** Nunca se
  descarta un producto por no tener dónde ponerlo.

### 8. El mapa del almacén en cada tienda

Que quien entra vea **dónde está el almacén**: un punto en una ciudad de
Estados Unidos y flechas saliendo hacia todo el país. Cada tienda nueva lleva
el suyo.

**No se miente y no hace falta:** el almacén está en Estados Unidos de verdad, y
el mapa dice eso. Es un dibujo nuestro, no un mapa de un tercero — nada de
incrustar Google Maps, que además cobra por carga.

## LA TIENDA MAYORISTA Y LA CLASIFICACIÓN (pedido el 15 ago 2026)

### 9. Lo que deja poco se vende POR LOTES ✅ (hecho el 15 ago)

La pantalla de selección marca en rojo los productos que dejan menos de dos
dólares: ahí **una sola devolución convierte la venta en pérdida**. Hasta ahora
la única salida era no agregarlos — y son justo los baratos, que es lo que más
se busca.

**Ahora van a una tienda mayorista y se venden de a diez.** El mismo producto
que deja $0.90 suelto deja nueve en un lote, y una devolución sobre un lote pesa
lo mismo que sobre una venta: deja de ser el riesgo que era.

Encaja con el consejo del casillero que ya está en la ficha: quien compra diez
unidades para llevárselas a su país por casillero **está haciendo exactamente lo
que este catálogo permite**. Ahí hay que hacer énfasis.

**El mínimo se comprueba en el SERVIDOR.** El carrito vive en el navegador y
cualquiera lo edita; si el mínimo solo estuviera en la pantalla se vendería una
unidad suelta, que es justo lo que esta tienda viene a evitar. Y **sube, nunca
baja**: quien pidió 25 se lleva 25.

### 10. Cambiar el departamento a mano ✅ (hecho el 15 ago)

Un kit de brochas de maquillaje apareció dentro de **Electrodomésticos**. Quien
filtra por un departamento y se topa con algo que no va deja de creerle al
filtro.

Ahora hay un desplegable **en la propia fila de Mis productos**: se ve el error
navegando y se corrige en el acto. Si para arreglarlo hubiera que abrir la
ficha, nadie lo arreglaría.

**Y lo que no se puede romper nunca:** cambiar el departamento **NO mueve el
producto de tienda**. La tienda dice _quién lo vende_; el departamento dice
_dónde se busca_. Una tienda que vende brochas puede tener una mal clasificada,
y corregirla no puede sacársela de su tienda ni cambiarle su dirección web —
eso rompería sus enlaces y lo que Google ya tenga guardado.

### 11. EL BARRIDO CON IA que reclasifica solo — PENDIENTE

A mano no se van a repasar mil productos. Ya tenemos el asistente con IA en el
panel; la idea es encargarle que recorra el catálogo y proponga el departamento
correcto de cada producto.

Cómo hacerlo sin romper nada:

- **Que PROPONGA, no que aplique.** Una pantalla con «este producto está en
  Electrodomésticos y debería estar en Belleza», y un botón para aceptar todas
  las que estén bien. Un barrido que reescribe el catálogo entero sin que nadie
  mire puede dejarlo peor de lo que estaba, y sin forma de saber qué cambió.
- **Solo el departamento.** Igual que la herramienta manual: nunca la tienda.
- **Por tandas y retomable**, como el botón de traer las fotos: mil productos no
  entran en una sola llamada.
- **Con tope de gasto escrito ANTES de encenderlo**, según la regla de la casa
  sobre modelos de IA.
- La herramienta manual se queda igual: cuantas más herramientas, mejor.

### 12. La pantalla de Tiendas USA ✅ (hecho el 15 ago)

Antes, al agregar un producto no quedaba **ni un número en pantalla**: no se
sabía si iban 78 o 400, ni qué departamento seguía vacío. Con mil productos por
delante eso es trabajar a ciegas.

Botón propio en el menú —**Tiendas USA**, aparte del de agregar, porque son dos
trabajos distintos— con el total hacia la meta de 1.000, cuántas tiendas hay,
cuántos productos tiene cada una, y **todos los departamentos incluidos los que
están en cero**: el hueco es lo que dice qué buscar mañana. Desde ahí se edita
el nombre y el logo de cada tienda.

## LA FICHA COMPLETA Y LAS OPINIONES (15 ago 2026)

### 13. El código ya no delata al proveedor ✅ (hecho)

`CJCS2493466` → **`MT-2493466`**. Los números —que son los que identifican el
producto— se conservan; solo se cambia el prefijo. El original queda entero en
la base: el día que haya que reclamarle a CJ, **el código que ellos entienden
es el suyo**. Los códigos de los comercios venezolanos NO se tocan: son suyos y
los usan en su propio sistema.

### 14. Las estrellas ✅ (hecho)

Tabla `valoraciones`, promedio calculado (nunca guardado), estrellas en la
ficha y formulario para quien compró.

- **Solo puntúa quien compró**, comprobado EN EL SERVIDOR. La pantalla solo
  evita enseñar un formulario que iba a ser rechazado.
- **Una por persona y producto**, con llave única en la base: sin eso, uno solo
  pone cien estrellas y el promedio deja de significar nada.
- **Se puede corregir la propia.** Quien probó el producto una semana después
  tiene derecho a cambiar de opinión; bloquearlo hace que escriba la queja en
  otro sitio.
- **Sin opiniones NO se dibuja «0 de 5»**: eso se lee como un producto malísimo
  cuando lo que pasa es que nadie opinó, y hundiría los 1.248 recién
  publicados.
- **Nunca se redondea hacia arriba.** Un 4,44 se enseña 4,4.

### 15. LA FICHA COMPLETA DESDE CJ — PENDIENTE, y es lo que desatasca Google

Hoy cada producto se guarda con título, precio, existencias, SKU y **una** foto.
El buscador de CJ (`listV2`) solo devuelve el resumen; la descripción, las demás
fotos, el material, el peso y las medidas están en **`/product/query`**, una
llamada por producto que nunca se hizo.

- Traerlo al agregar, y **un botón por tandas para los 1.248 ya cargados**,
  retomable como el de traer las fotos.
- Es lo que hace que Merchant Center deje de tratarlas como fichas pobres.
- **El título en español sigue pendiente y no se inventa** con traducción
  automática.

### 16. Las opiniones de CJ, CON SU ORIGEN DECLARADO — PENDIENTE

CJ las expone en **`/product/productComments`**: comentario, puntuación, fecha,
país y las fotos del comprador.

**Se pueden enseñar, pero nunca como propias.** Son de compradores de OTRAS
tiendas. Van en su propio bloque, diciendo de dónde vienen, y **jamás
promediadas con las estrellas de Mercatren**: nuestro número tiene que salir
solo de gente que nos compró a nosotros. Mezclarlas es exactamente lo que
sanciona la FTC, y es la misma línea que ya trazó `PLAN-CONFIANZA.md`.

## MERCATREN POR PAÍSES — mercatren.cl y los que vienen (17 ago 2026)

**El plan completo, por fases, vive en `PLAN-PAISES.md`.** La regla: un país
= un dominio = un catálogo, y cada país se opera como una empresa de ese
país. La fase 0 ya está en producción: mercatren.cl carga el sistema con el
catálogo en cero y la invitación a abrir tienda, sin enseñar ni un producto
de mercatren.com. Chile es el molde; México y Colombia se abren repitiendo
la rutina de la fase 5.

## RETIROS AUTOMÁTICOS POR LA API DE MERCURY (investigado el 16 ago 2026)

> Pedido del dueño, y tiene razón: con tres mil retiros nadie llena tres mil
> formularios a mano. Mercatren entra en Chile y Colombia, y el sistema tiene
> que escalar solo.

### SE PUEDE, Y EL ENDPOINT ES ESTE

**`POST /account/{accountId}/request-send-money`** — no `createTransaction`.
La diferencia es toda la historia:

|                    | `createTransaction`                     | **`request-send-money`**                     |
| ------------------ | --------------------------------------- | -------------------------------------------- |
| Wire internacional | ❌ solo `ach`, `check`, `domesticWire`  | ✅ **acepta `internationalWire`**            |
| Aprobación humana  | Sale de una                             | ✅ **queda esperando aprobación en Mercury** |
| Lista blanca de IP | ✅ obligatoria para tokens de escritura | ✅ **EXENTO**                                |

Los tres puntos importan, y el tercero es el que lo hace posible: nuestro sitio
corre en el borde y **no tiene una IP fija que se pueda declarar**. Con
`createTransaction` la lista blanca lo haría inviable; `request-send-money`
está exento por diseño, justo porque el dinero no sale sin que una persona lo
apruebe.

### EL FLUJO COMPLETO, SIN FORMULARIOS

1. El comercio pide su retiro en nuestro panel (ya funciona).
2. Nuestro sistema crea el **destinatario** en Mercury por API — con los datos
   que el comercio ya llenó, incluido el SWIFT y la dirección del titular.
3. Nuestro sistema crea la **solicitud de pago** con `internationalWire` o
   `ach` según el país (que ya lo decidimos nosotros).
4. Al dueño le aparece en Mercury **esperando su aprobación**. Un botón.
5. El **webhook** de Mercury nos avisa cuando sale, y el retiro se marca pagado
   solo, con su comprobante.

Cero transcripción. Escala a tres mil igual que a tres.

### LO QUE HAY QUE TENER EN CUENTA AL CONSTRUIRLO

- **`idempotencyKey` es obligatorio y es la red de seguridad**: repetir la
  misma llave devuelve 409 en vez de pagar dos veces. Se usa el id del retiro.
  Mercury además bloquea duplicados dentro de 24 horas.
- **`purpose` es obligatorio en los wires** (categoría del pago). Sin eso, el
  wire se rechaza.
- **El destinatario necesita `internationalWireRoutingInfo`** con IBAN/SWIFT y
  campos propios de cada país — que es justo lo que `paises.ts` ya modela.
- **Quien aprueba tiene que ser distinto de quien creó el token.** Es una regla
  de Mercury, no nuestra, y conviene saberla antes de crear el token.
- **Los tokens se degradan solos**: si en 45 días no se usan los permisos de
  escritura, Mercury los baja. Con retiros de verdad no aplica, pero durante
  las pruebas sí.

### LO ÚNICO QUE HACE FALTA Y NO ESTÁ EN EL CÓDIGO

El **token de la API de Mercury** y el **id de la cuenta**. Solo los puede
sacar el dueño, en su banco.

## PROBAR PROVEEDORES ANTES DE CASARSE CON UNO (decidido el 15 ago 2026)

> Decisión del dueño. Antes de meter $2.000 en una billetera, se compra con
> $100, se mide, y se compara contra otros. **Las ventas de EE. UU. quedan en
> pausa mientras tanto** (ver `EN_PAUSA` en `src/lib/ventas/pausa.ts`).

### Cómo se paga la prueba

**Con tarjeta, pedido por pedido.** CJ acepta tarjeta en el checkout de cada
orden; lo que NO acepta tarjeta es la carga de la billetera (ahí solo hay
WorldFirst, Payoneer y wire con mínimo de $2.000). Comprobado en su
documentación el 15 ago 2026.

**La API no puede pagar con tarjeta**: sus tres modos son página de pago, saldo,
o crear sin pagar. O sea que **sin saldo no hay automatización posible** — y por
eso la prueba se hace a mano, que además es lo correcto: no se automatiza lo que
todavía no se sabe si sirve.

**Payoneer no se recarga con tarjeta**, sino con transferencia bancaria (unos 3
días). Sería Mercury → Payoneer → CJ, tres saltos. Si de todos modos hay que
transferir, vale comparar contra la wire directa.

### Qué se mide en cada compra de prueba

Seis u ocho pedidos baratos, repartidos entre almacenes (EE. UU. y China) y
tipos de producto (tela, electrónico, frágil). Un pedido da un dato; ocho dan un
patrón, y dejan distinguir si falló el producto o falló el proveedor.

1. **Qué papel viene DENTRO de la caja.** El más importante. Si trae la factura
   del mayorista con el precio de compra, el comprador ve nuestro margen del
   30 % impreso: reclamo, contracargo y cliente perdido. Hay que saber si
   despachan en blanco o si hay que pedirlo.
2. **Desde qué almacén salió.** EE. UU. o China cambia el plazo de 5 a 20 días,
   y nuestra ficha ya le promete un plazo al comprador y le dibuja el mapa. Un
   plazo prometido y no cumplido es contracargo.
3. **Qué dirección de devolución trae.** Merchant Center exige política de
   devoluciones, y una devolución a China no se sostiene.
4. **Si el producto es el de la foto.** Merchant Center suspende por eso, y es
   lo que más pasa con catálogos de mayorista.
5. Tiempo real de llegada, empaque, y cómo se maneja la facturación.

### La comparativa

Dos o tres proveedores más, con saldo en cada uno y compras desde todos. Se
compara: calidad y velocidad de entrega, cómo llega el producto, qué trae la
caja, cómo se factura, y **cómo funciona su API** — si permite pagar sin saldo,
si expone existencias en tiempo real y si avisa de los cambios.

### Lo que sigue pendiente y bloquea a Google

- `/datos/google` manda el catálogo entero, incluidos los productos venezolanos.
  _(El dueño decidió el 15 ago 2026 no frenar por esto: los productos que
  funcionen son los que Google verá.)_
- Las fichas de CJ traen dos líneas en inglés y nada en español. La descripción
  propia por ficha sigue siendo el trabajo grande.

## LOS CATÁLOGOS DEJARON DE ENVEJECER SOLOS (15 ago 2026)

> Lo destapó el dueño: la ferretería agregó lijas a su depósito y aquí no
> aparecían; vendían en su mostrador y nuestro stock no bajaba. Pidió una
> revisión honesta, sin adornos. Esta es.

### Lo que se encontró, dicho como es

Los dos caminos para mantener el catálogo al día **estaban construidos y
funcionaban**:

| Camino                         | Qué hace                                   |
| ------------------------------ | ------------------------------------------ |
| `POST /datos/socios/productos` | El sistema del comercio nos empuja cambios |
| `GET /datos/socios/cambios`    | Su sistema lee lo que cambió aquí          |
| `fuentes_catalogo.url` + botón | Nosotros leemos el archivo que él publica  |

Y nuestras propias ventas **sí descontaban stock** (`stripe/acreditar.ts` y
`zelle/acciones.ts`, con `MAX(0, existencias - cantidad)`).

**Lo que faltaba era el reloj.** Comprobado: ni `wrangler.jsonc`, ni
`yadominios.json`, ni ningún flujo de GitHub tenía un `cron`. Los tres caminos
eran botones, y nadie los pulsaba. Los catálogos se separaban un poco más cada
día sin que nada fallara ni se pusiera en rojo.

### 15. El robotito que sincroniza ✅ (hecho)

`.github/workflows/sincronizar.yml` cada 15 minutos →
`POST /datos/sincronizar` (con `SINCRONIZAR_LLAVE`) → recorre cada fuente con
dirección y la relee.

- **El reloj va fuera de la aplicación** porque Next sobre este adaptador no
  expone un `scheduled()`. GitHub Actions ya está montado y no cuesta nada: no
  hubo que crear ni un recurso nuevo en ninguna nube.
- **Sin la llave, la puerta responde 503 y no hace nada.** Una dirección que
  reescribe el catálogo de los comercios no puede quedar abierta porque una
  variable no esté puesta.
- **La llave se compara en tiempo constante** y a quien no corresponde se le
  devuelve **404**, no 401: así ni se le confirma que esto existe.
- **El fallo de una fuente no detiene a las demás**, y el motivo queda escrito
  en la respuesta. Una sincronización que falla en silencio es peor que no
  tenerla: se sigue confiando en un stock que ya no es cierto.
- **No se cancela la corrida en marcha** (al revés que la publicación). Cortarla
  a mitad dejaría la mitad de los productos con fecha nueva y la otra mitad con
  la vieja, y el barrido de «lo que ya no viene» los pasaría a borrador.

### 16. Que se VEA si un catálogo dejó de llegar ✅ (hecho)

Una fecha vieja se lee igual de bien que una nueva. Sin esto, el comercio
seguía confiando en un stock congelado y se enteraba vendiendo algo que ya no
tenía.

- `src/lib/catalogo/salud-sincronizacion.ts` — puro, **12 pruebas**.
- **La tolerancia NO es el intervalo.** El robotito corre cada 15 minutos, pero
  la alarma salta a los 60: GitHub retrasa las tareas programadas cuando anda
  cargado, y una pantalla que se pone roja cada vez que una corrida llega tarde
  enseña a ignorar el rojo.
- **«Nunca» y «sin dirección» no son «atrasada».** «Atrasada» le dice al
  comercio que algo se rompió; lo que le toca leer es qué le falta hacer.
- **Un reloj adelantado no dispara una alarma falsa** — lo cubre su prueba.
- **Panel → Configuración → Catálogos de los comercios**: los dos caminos
  juntos (quien empuja y a quien leemos), lo atrasado arriba y en ámbar. Con
  veinte comercios, el que está roto no puede quedar en el puesto diecisiete.
- En **Mi tienda** se dice ahora que **la lectura corre sola cada 15 minutos**.
  Sin esa línea, el botón se lee como «esto solo pasa si lo pulsas» — que es
  exactamente lo que hacía que nadie lo pulsara.

### Lo que falta, y no depende del código

1. **La dirección donde la ferretería publica su archivo de exportación**, en
   Panel → Mi tienda. Mientras esté vacía, el robotito no tiene qué leer de ese
   comercio (y la pantalla lo dice: «Falta poner la dirección de su archivo»).
2. **`SINCRONIZAR_LLAVE`**, la misma cadena en dos sitios: variable del sitio en
   YaDominios Cloud y secreto del repositorio en GitHub.

## LA ESCALERA DEL MARGEN — cada 60 días (decidido el 13 ago 2026)

Hoy el margen es **3 %** en los dos métodos. La meta es **8 %**, y se llega
subiendo por tramos: **cada 60 días se sube un escalón**, avisando antes. No de
un salto: un salto del 3 al 8 se nota en el precio de golpe y espanta al
comprador que ya conocía la tienda.

**EL ORDEN NO ES NEGOCIABLE, Y LOS PRECIOS VAN PRIMERO:**

1. `node scripts/recalcular-precios.ts`
2. `npm run db:cargar`
3. **Recién ahí** desplegar la constante del margen

El precio publicado lleva el margen dentro. Si sube la constante y los precios
se quedan como estaban, la diferencia sale del bolsillo del comercio en cada
venta, sin aparecer en ninguna pantalla. Haciéndolo en este orden, durante los
minutos de la publicación el error cuesta de NUESTRO lado — que es el único
lado donde puede costar.

**Las tres constantes tienen que cuadrar entre sí:** `COMISION_TARJETA_PB`,
`COMISION_ZELLE_PB` y `tiendas.comision_puntos_base`. Del 5 al 7 de agosto
estuvieron desincronizadas y ese punto salía del comercio sin verse.

**Y al pasar del 6.5 % se pueden volver a encender Klarna y Affirm.** Están
apagadas en Stripe porque cobran cerca del 6 % y con un margen del 3 % cada
venta por ahí es una pérdida. Con el margen por encima de su tarifa dejan de
serlo y pasan a ser ventas de más.

El plan completo está en `PLAN-COMISION.md`.

---

## BLOQUE 2 — Lo formal y lo legal (en paralelo, depende de terceros)

Se arranca YA porque el abogado y el contador tienen sus tiempos, no los
nuestros. No bloquea al bloque 1, pero sí a cualquier crecimiento serio.

1. **El puente Windoce → Mercatren, por escrito.** Durante meses la operación
   de Mercatren corrió a través de Windoce, LLC. Hoy no hay ningún papel que
   explique por qué. Un acuerdo corto entre las dos sociedades con la fecha de
   traspaso convierte «esto se ve raro» en «esto está documentado». **Es del
   abogado.**
2. **Cómo se declara la LLC de un solo miembro.** Por defecto es _disregarded
   entity_ y todo pasa a la declaración personal. Eso cambia cómo se reporta el
   1099-K, y el modelo entero se apoya en `bruto − costo de mercancía =
margen`. **Es del contador, y es la pregunta de esta semana, no de marzo.**
3. **Términos y privacidad revisados por el abogado.** Siguen pendientes desde
   que se escribieron.
4. **Regenerar los DOS PDF que nombran a la sociedad** con Mercatren LLC. Los
   revisó el abogado, así que el cambio pasa por él:
   - `public/docs/mercatren-modelo-de-negocio.pdf`
   - `docs/mercatren-ventas-a-credito.pdf` — este se le entrega a cada comercio
     que pide crédito, y hoy dice «Windoce, LLC compra y revende mercancía».
     Nombra a la sociedad equivocada como vendedora, en el documento que el
     comercio firma. Se regenera con `npm run docs:pdf-credito` desde
     `scripts/plantillas/credito-comercios.html` (4 líneas), pero **no se toca
     sin el abogado**.

   Ojo al hacerlo: el pie «Developed by Windoce LLC» de esos documentos **se
   queda**. Ese es el crédito del desarrollador, no la sociedad que vende.

5. **El flujo de facturación por escrito**, de la venta a los libros, para
   llevarlo a QuickBooks Online.
6. **La dirección publicada es una casa.** Sale en las facturas y en los
   términos. Cuando haya dirección comercial se cambia — después es reeditar
   documentos ya emitidos.

---

## BLOQUE 3 — Que el dinero no se pierda

Nada de esto da ingresos. Todo evita perderlos.

1. ~~**Prueba de entrega en el pedido.**~~ ✅ 12 ago 2026 — tabla
   `pruebas_entrega`: guía, foto, firma o nota, con quién la aportó. El
   comprador no puede subirla y solo el equipo puede quitarla.
2. ~~**Devoluciones desde el panel.**~~ ✅ 12 ago 2026 — dentro de los tres
   puntos, con motivo obligatorio. No descuenta el neto del comercio: quién
   asume la devolución se acuerda aparte.
3. **Retiros con la API de Mercury, tramo 1.** El comercio pide → Mercatren
   revisa → sale a Mercury como solicitud → un admin aprueba. Lo que resuelve
   no es aprobar: es dejar de copiar a mano el banco, la cuenta y la ruta, que
   es donde se manda plata a la cuenta equivocada. Solo ACH domésticos al
   principio.

   Hecho el 12 ago 2026: la regla de aprobación en Mercury (todos los pagos,
   desde $0, con separación de funciones), el cliente de la API con un token
   **sin `Send Money`**, y el botón «Probar la conexión con el banco» en
   Configuración. **Falta** el alta del destinatario en Mercury (a mano, una
   vez por comercio) y enganchar el botón de retiro del comercio.

4. **Rotar `SOCIO_LLAVE`.** Se pegó en un chat. Sigue viva.
5. ~~**Límite de intentos**~~ ✅ 12 ago 2026 — ocho por cuenta y cuarenta por
   dirección cada quince minutos, en entrar y en recuperar clave. Registro no:
   ahí no hay contraseña que adivinar.

---

## BLOQUE 4 — Crecer

Solo cuando el bloque 1 esté cerrado. Meter volumen con la facturación a
medias multiplica el problema, no los ingresos.

1. **Ferremateriales Bley.** Están los tres archivos escritos pero sin
   commitear, y el botón sin enganchar a ninguna pantalla. Falta emitir su
   token, cargarlo en su Cloudflare, publicar y decidir con ellos cómo se
   contabiliza esa venta en el cierre de caja. **No se les escribe hasta que el
   bloque 1 esté cerrado** — decisión del dueño, y es la correcta: Bley vende
   bastante y empeoraría el desorden de facturación.
2. **Una página de «cómo trabajar con Mercatren»**, abierta y sin login, para
   mandarle el enlace a cada comercio nuevo en vez de explicarlo otra vez.
3. ~~**Avisar al comprador del concepto del Zelle**~~ ✅ 12 ago 2026 — en rojo,
   debajo del monto, con `Mercatren MT-000002` en grande y su botón de copiar.
4. ~~**Aviso al equipo cuando entra una venta.**~~ ✅ 12 ago 2026.
5. **La tienda de Estados Unidos, y con ella el catálogo para Google Shopping.**
   Proyecto que el dueño ya tenía en la cabeza: una tienda dentro de Mercatren
   con mercancía que se entrega **en Estados Unidos**, algunas cosas nuevas y
   otras usadas.

   Desbloquea Merchant Center. El 12 ago 2026 se llegó hasta el paso de
   envíos y se paró en «Do it later» a propósito: Google compara lo que se
   declara con lo que ve un comprador estadounidense en la ficha, y hoy la
   ficha dice «lo retiras en el local del comercio», en Venezuela. Declarar un
   envío dentro de EE.UU. que no existe es tergiversación, y esa es la causa
   número uno de suspensión de una cuenta.

   Lo que hace falta, en orden:
   - Una tienda con dirección y entrega reales en Estados Unidos.
   - Marcar en el catálogo qué productos se entregan allá, y que
     `/datos/google` mande **solo esos** — hoy manda todo.
   - Sus fichas en inglés de nativo, no traducción: Google las lee desde allá.
   - Recién entonces, volver a Merchant Center, declarar el envío de verdad y
     terminar el paso 4 de 5.

   Mientras tanto **no se pierde nada**: el posicionamiento normal de Google
   —mapa del sitio, datos estructurados, fichas y documentación— no depende de
   Merchant Center y ya está corriendo.

6. **El correo de contacto público sigue siendo `@windoce.com`.** Es la
   mención de Windoce más visible que queda en el sitio, y la que hace que la
   IA de Google siga asociando Mercatren con Windoce. Ya hay buzón real en
   `@mercatren.com`, así que cambiarlo es una línea — falta decidir qué alias
   se publica.

---

## BLOQUE 5 — Deuda técnica escrita

Está anotada en `CLAUDE.md` con su porqué. Se cierra archivo por archivo, cada
uno con su prueba.

1. **`zod` en las acciones que faltan.** Eran 15 archivos, no 9. Cerrados los
   que tocan dinero (Zelle, comprobante, pedidos, cobros) con
   `src/lib/validacion/acciones.ts`; **faltan los demás**.
2. **Nonce por petición en la CSP**, para poder quitar `unsafe-inline`.
3. **`noUncheckedIndexedAccess`**: rompe en 16 sitios.
4. **Buscador global en el panel**: hoy hay que saber en qué sección mirar.

---

## Cómo se usa esta lista

- Se contesta **por bloques, en orden**. Un pendiente del bloque 3 no adelanta
  a uno del 1, por mucho que apetezca.
- El bloque 2 corre **en paralelo** desde el primer día: depende de terceros.
- Cuando algo se termina, se marca aquí en el mismo trabajo. Una lista
  desactualizada miente igual que un panel que dice «En vivo» con el sitio
  caído.
