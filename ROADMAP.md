# Roadmap de Mercatren

> **Qué es esto.** La lista de lo que falta, ordenada por lo que desbloquea a lo
> demás — no por lo que apetece hacer. Cuando el dueño pregunte «¿qué tenemos
> pendiente?», se contesta desde aquí.
>
> **La regla que manda sobre todas:** primero lo formal y lo legal, después lo
> que crece. Un negocio que factura mal o cobra a nombre equivocado no se
> arregla creciendo — se arregla parando.
>
> Última revisión: 14 de agosto de 2026.

---

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
2. **El importador**, con el filtro por almacén. ← aquí estamos
3. **Los productos cargados**, 250–300.
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
