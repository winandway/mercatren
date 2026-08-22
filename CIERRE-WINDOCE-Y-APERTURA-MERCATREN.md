# Cierre de Windoce, LLC y apertura de Mercatren LLC

> Respuestas a las 30 preguntas, 21 de agosto de 2026.
>
> **Cómo leer este documento:**
> ✅ verificado contra el código, el sitio publicado o un registro público ·
> ❌ **no lo sé** y no lo voy a inferir ·
> ⚠️ la pregunta parte de algo que no es correcto, y se explica por qué.
>
> Nada de lo que sigue es asesoría fiscal ni legal. Es lo que el sistema hace
> hoy, dicho con precisión, para que el CPA y el abogado decidan sobre hechos.

---

# ANTES DE LAS PREGUNTAS: DOS COSAS QUE HAY QUE CORREGIR

## 🔴 1. Los $337,665.72 NO son facturación de Windoce, LLC

**Es el error más caro de todo el planteamiento, y hay que pararlo antes de que
llegue al contador.**

Esa cifra es el **histórico de Ferremateriales Bley C.A**: pagos que ese comercio
recibió **en su propio sistema anterior**, antes de mudarse a Mercatren. Se
importaron a la base para tener el rastro —para poder contestar el día que
alguien pregunte por un pago de julio— y están marcados como `origen = 'import'`.

**Ese dinero nunca entró a una cuenta de Windoce, LLC ni de Mercatren LLC.** No
lo cobró ninguna de las dos, no lo facturó ninguna de las dos, y no hay un
depósito bancario detrás de ninguna de las dos.

Son 743 movimientos: **666 entradas aprobadas por $337,261.22**, 5 rechazadas y
2 pendientes. Todo eso ya estaba liquidado en el sistema previo de Bley antes de
la mudanza, y así quedó registrado el 10 de agosto con un retiro de cierre de
$24,990.86 (`cierre-bley-2026-08-10`).

**Si el CPA toma esa cifra como ingresos de Windoce, LLC:**

- declara $337 mil que la sociedad nunca recibió,
- crea una discrepancia enorme contra lo que reportaron el banco y Stripe,
- y paga impuestos sobre dinero de otra empresa.

**Lo que sí facturó el sistema es de otro orden de magnitud.** No puedo darte la
cifra exacta sin consultar la base de producción (ver «Lo que necesito», al
final), pero por lo documentado son **tres órdenes de compra y un puñado de
ventas de decenas de dólares** — no cientos de miles.

**Al contador hay que entregarle dos cosas separadas y rotuladas:**

| Qué                                              | Qué es                                    | Va al cierre             |
| ------------------------------------------------ | ----------------------------------------- | ------------------------ |
| Histórico Zelle (`origen='import'`)              | Operaciones de la tienda anterior de Bley | **NO.** Es de un tercero |
| Ventas del sistema (`origen='live'` + `pedidos`) | Lo que de verdad cobró la sociedad        | **SÍ**                   |

## 🔴 2. La cuenta 850 de Xero contradice los términos publicados

La pregunta 9 dice que en Xero se creó **«850 · Customer funds to be liquidated
(Current Liability)»**.

Esa cuenta describe un modelo en el que Mercatren **recibe dinero de otros y lo
tiene que entregar**. Es exactamente la figura que el abogado desarmó el 5 de
agosto de 2026, y es la definición de _money transmission_ en Estados Unidos.

**Los términos que están publicados ahora mismo en mercatren.com dicen lo
contrario, con estas palabras:**

> «Mercatren LLC actúa como **principal** en las dos puntas de la operación:
> compra la mercancía para sí y la revende al comprador. La propiedad de la
> mercancía pasa del proveedor a Mercatren LLC, y de Mercatren LLC al
> comprador.»

> «Mercatren LLC **no actúa como agente**, fiduciario ni depositario de ninguna
> de las partes, y **no recibe ni administra dinero de terceros**.»

**Un libro contable que dice «fondos de clientes por liquidar» es un documento
que contradice el contrato con esos mismos clientes.** En una revisión, un
banco, un procesador o un regulador lee los libros — y ahí diría que sí
administramos dinero ajeno.

**Recomendación: esa cuenta se elimina o se renombra, y la decisión la firma el
CPA con el abogado delante.** No es un ajuste de nomenclatura: es cuál de los dos
modelos es el verdadero, y hoy el sitio, los términos y el código dicen
revendedor bruto. El detalle está en la respuesta 9.

---

# A · ENTIDAD

### 1. ¿A nombre de qué empresa se emitieron las facturas de venta de las tres órdenes de 2026?

**⚠️ Depende de la fecha exacta de cada una, y una parte no la puedo confirmar.**

Lo verificado: el sitio dejó de emitir a nombre de Windoce, LLC y pasó a
Mercatren LLC en el commit `bd40a33`, del **12 de agosto de 2026 a las 12:41**,
publicado ese mismo día alrededor de las **16:58**.

- Factura emitida **antes** del 12 ago 2026 ~17:00 → dice **Windoce, LLC**
- Factura emitida **después** → dice **Mercatren LLC**

**Una factura no se reescribe:** copia los datos del emisor dentro del documento
al emitirse (`facturas.emisor_nombre`), así que las viejas siguen diciendo lo que
decían. Eso es lo correcto.

**❌ Qué fecha tiene cada una de las tres, no lo sé** — está en la base de
producción y no tengo acceso de lectura en esta sesión.

**🔴 Y hay un riesgo aparte que sí es seguro:** el nombre sale del código, pero
**el número fiscal y la dirección del emisor salen de variables de entorno**
(`EMISOR_IDENTIFICACION`, `EMISOR_DIRECCION`) que se cambian en el panel de
hosting, no en el código. Si esas no se cambiaron el mismo día, **hay facturas
que dicen «Mercatren LLC» con el EIN y la dirección de Windoce, LLC**. Eso es un
documento contable interno inconsistente y hay que revisarlo una por una.

### 2. ¿Cuál es el EIN y la cuenta bancaria de cada una?

**Mercatren LLC — ✅ verificado** (registro público de Michigan + carta CP 575):

| Dato                    | Valor                                                     |
| ----------------------- | --------------------------------------------------------- |
| EIN                     | **42-4386110** (sin guion donde lo rechacen: `424386110`) |
| Identification # (LARA) | 900260648                                                 |
| Constituida             | **11 ago 2026**                                           |
| Chase                   | `BUS COMPLETE CHK`, corriente terminada en **1098**       |
| Mercury (Column N.A.)   | corriente terminada en **9805**                           |
| Informe anual vence     | **15 feb 2027**                                           |

Los números completos no están en el repositorio, que es público: viven en
`~/Mercatren-privado/BANCOS-Y-REGISTRO.md`.

**Windoce, LLC — ❌ no lo sé.** No tengo su EIN ni su cuenta. Lo único que me
consta es que está registrada en **Delaware** y que su nombre legal **lleva
coma** (`Windoce, LLC`), a diferencia de Mercatren LLC, que va sin ella.

### 3. ¿Desde qué fecha exacta opera Mercatren LLC como entidad operativa?

**Hay tres fechas distintas y conviene no mezclarlas:**

| Fecha                | Qué ocurrió                                            | Estado              |
| -------------------- | ------------------------------------------------------ | ------------------- |
| 7 ago 2026           | Se firmaron las Articles of Organization               | ✅                  |
| **11 ago 2026**      | **Michigan las procesó — es la fecha de constitución** | ✅ registro público |
| 12 ago 2026 ~17:00   | El sitio empezó a facturar a su nombre                 | ✅                  |
| ❌ **sin confirmar** | **El primer dólar que Stripe liquidó en su cuenta**    | ❌                  |

La fecha que vale para formularios es la **del registro (11 ago)**, no la de la
firma. Yo mismo me equivoqué recomendando la de la firma y el registro público lo
corrigió.

**El corte contable acordado no es una fecha del calendario: es un hecho — el
primer dólar que Stripe liquide en la cuenta de Mercatren LLC.** Si eso ya
ocurrió y cuándo, **no lo sé**: hay que mirarlo en el panel de Stripe.

### 4. ¿Los libros de Xero son de Mercatren LLC o de Windoce, LLC? ¿Conversion date? ¿Balances de apertura?

**❌ No lo sé. Los montaste tú y yo no tengo acceso a Xero.**

Lo que sí puedo decir es qué debería ser, y por qué:

- **Son dos juegos de libros, no uno.** Son dos sociedades distintas, en dos
  estados distintos, con dos EIN distintos y dos bancos distintos. Meterlas en el
  mismo archivo hace imposible el cierre de una y la apertura limpia de la otra.
- **Xero está conectado a Chase y a Stripe, que son de Mercatren LLC.** Así que
  lo que estás montando son, de hecho, **los libros de Mercatren LLC**.
- **Windoce, LLC necesita su propio cierre**, con sus propias cuentas y su propio
  banco. Si nunca llevó libros formales, eso es lo primero que hay que decirle al
  CPA (ver pregunta 27, que es más grave de lo que parece).
- **Mercatren LLC arranca con balance de apertura en cero**, salvo el aporte
  inicial del socio. No hereda saldos de Windoce: son entidades separadas, y
  cualquier traspaso de activos entre ellas es una operación que hay que
  documentar aparte.

---

# B · MODELO DE NEGOCIO

### 5. En la factura al comprador, ¿quién aparece como vendedor de registro?

**✅ Mercatren LLC.** El campo `facturas.emisor_nombre` se rellena con la
constante de la sociedad al emitir. Con la salvedad de la pregunta 1: las
anteriores al 12 de agosto dicen Windoce, LLC.

### 6. ¿Mercatren toma título de la mercancía?

**✅ Sí, y está escrito en el contrato publicado**, textualmente:

> «La propiedad de la mercancía pasa del proveedor a Mercatren LLC, y de
> Mercatren LLC al comprador.»

No es instantáneo por accidente: es la cláusula central del modelo, y es lo que
sostiene que el ingreso sea propio y no una comisión sobre dinero ajeno.

### 7. ¿Quién asume la devolución, el contracargo y la mercancía que no llega?

**Depende del catálogo, y son dos respuestas distintas:**

|                | Catálogo de EE. UU. (CJ)  | Catálogo de Venezuela |
| -------------- | ------------------------- | --------------------- |
| Margen         | 30 %                      | 3 %                   |
| Devolución     | **Mercatren LLC** ✅      | ⚠️ sin decidir        |
| Contracargo    | **Mercatren LLC** ✅      | ⚠️ sin decidir        |
| Quién despacha | Mercatren (vía proveedor) | El comercio           |

**EE. UU. — ✅ verificado.** Mercatren compra, despacha y asume la devolución y
el contracargo. Por eso el margen es 30 % y no 3 %. La mercancía vuelve a la
dirección de Michigan y **Mercatren asume lo que valga**.

**Venezuela — 🔴 esto es un hueco de verdad, no un detalle.** El sistema registra
el contracargo, avisa al equipo y lo pinta en rojo, pero **NO le descuenta nada
al comercio**, a propósito: quién lo asume es una decisión de negocio que **no
está tomada ni escrita en ningún lado**. Lo mismo con las devoluciones.

Hoy, en la práctica, **el que se come el contracargo es Mercatren**, porque el
dinero ya salió de la cuenta y a nadie se le descuenta. Eso funciona con tres
ventas y no funciona con trescientas. **Va en los acuerdos escritos con cada
comercio (pregunta 29), y es de las primeras cosas que hay que cerrar.**

### 8. ¿Los términos publicados dicen agente o vendedor?

**✅ Vendedor. Principal en las dos puntas.** Leído hoy del sitio publicado:

> «...compras un producto a Mercatren LLC y designas la dirección donde debe
> entregarse. Mercatren LLC adquiere esa mercancía al proveedor a nombre propio
> y te la revende.»

> «Mercatren LLC no actúa como agente, fiduciario ni depositario de ninguna de
> las partes, y no recibe ni administra dinero de terceros.»

Y al comercio: «el precio al que nos vendes lo fijas tú. El precio al que
Mercatren LLC revende al comprador lo fijamos y lo publicamos nosotros, e incluye
nuestro margen comercial.»

### 9. La cuenta 850 asume agente neto; el plan usa COGS. ¿Cuál aplica?

**⚠️ Aplica revendedor bruto con COGS, y la cuenta 850 hay que eliminarla o
renombrarla.** Esta es la pregunta más importante de las treinta.

**Todo lo que existe hoy dice revendedor bruto:**

| Dónde                  | Qué dice                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------- |
| Términos publicados    | «actúa como principal», «la propiedad pasa»                                         |
| Código (`sociedad.ts`) | Mercatren compra y revende                                                          |
| Stripe                 | 1099-K **del bruto**, a nombre de Mercatren                                         |
| Cobros                 | Cobro propio, **sin Stripe Connect ni pago dividido**                               |
| Vocabulario prohibido  | «liquidar», «fondos», «por cuenta de» — con prueba automática que falla si aparecen |

**Lo único que dice agente neto es esa cuenta de Xero.**

**Y hay una razón concreta por la que no se usó Connect:** un cobro dividido
(`transfer_data` + `application_fee_amount`) le diría a Stripe que el dinero es
del comercio y que nos quedamos una comisión. El 1099-K del bruto le saldría **al
comercio**, y a nosotros solo el de la comisión. Esa es exactamente la figura de
intermediario que se desarmó.

**Y el riesgo de dejar la cuenta 850 puesta no es contable, es existencial:**
Stripe va a reportar al IRS el bruto que cobró Mercatren. Si los libros declaran
solo el neto, **la diferencia entre lo que Stripe reporta y lo que la sociedad
declara dispara la auditoría**. Es literalmente el escenario que el modelo
completo existe para evitar.

**Lo correcto en los libros:**

```
Ingreso bruto (103)  −  Costo de mercancía vendida (100)  =  Margen (3)
```

**Qué hacer con la 850:** no la toques tú. **Va al CPA con esta pregunta
concreta:** _«Los términos publicados dicen que la sociedad es principal y toma
título. ¿Puede quedarse en el plan de cuentas una Current Liability llamada
"Customer funds to be liquidated"?»_ La respuesta va a ser que no, pero quien la
firma es él.

---

# C · FLUJO DE DINERO

### 10. ¿Cuál es la cuenta operativa: Chase o Mercury?

**✅ Las dos están vivas** (comprobado el 19 de agosto con los documentos
oficiales), y hacen cosas distintas:

|                  | Chase ...1098         | Mercury ...9805                             |
| ---------------- | --------------------- | ------------------------------------------- |
| Titular          | MERCATREN LLC         | MERCATREN LLC                               |
| Producto         | `BUS COMPLETE CHK`    | Corriente (por dentro es Column N.A.)       |
| Para qué         | Cuenta operativa      | **De aquí salen los pagos a los comercios** |
| Conectada a Xero | ✅ (tú lo conectaste) | ❌ que yo sepa                              |

**Los pagos a los comercios salen de Mercury**, por su API
(`src/lib/retiros/a-mercury.ts`), con aprobación humana dentro de Mercury.

**⚠️ Dos avisos concretos:**

1. **Falta cargar `MERCURY_CUENTA_ID`** en el panel del sitio. Sin esa variable,
   el sistema no sabe de qué cuenta sacar el dinero y **los retiros automáticos
   no funcionan todavía**. `MERCURY_TOKEN` ya está.
2. **Si Mercury no está conectado a Xero, los libros están incompletos.** Xero
   ve lo que entra por Chase y Stripe, pero no ve salir el dinero a los
   comercios, que es el costo de mercancía. Eso hay que conectarlo o cargarlo a
   mano.

### 11. ¿A qué cuenta liquida Stripe?

**❌ No lo sé con certeza, y aquí tengo información contradictoria en mis propias
notas** — una dice Mercury, otra dice que el banco de Mercatren LLC es Chase.

**No lo voy a adivinar: se mira en Stripe → Settings → Bank accounts and
scheduling, en treinta segundos.** Y es importante que quede escrito, porque de
eso depende contra qué cuenta concilia el CPA.

### 12. ¿Desde qué cuenta se le paga a los comercios?

**✅ Mercury**, por `request-send-money`. Se eligió ese método y no
`transactions` por tres razones comprobadas en su documentación:

- acepta **wire internacional** (el otro solo ACH doméstico), y once de los doce
  países cobran por wire;
- **espera aprobación humana** dentro de Mercury: el dinero no sale solo;
- **está exento de la lista blanca de IP**, y el sitio corre en el borde sin IP
  fija — con el otro método la automatización sería imposible.

### 13. ¿Se sigue cobrando por Zelle o Stripe lo reemplazó?

**✅ Conviven los dos, y es deliberado.** Ambos están activos en el código, y el
comprador elige en el checkout.

|                  | Margen Mercatren | Procesador    | Lo que paga el comprador por $100 |
| ---------------- | ---------------- | ------------- | --------------------------------- |
| Tarjeta (Stripe) | 3 %              | 2.9 % + $0.30 | **$106.59**                       |
| Zelle            | 3 %              | ninguno       | **$103.10**                       |

**Por Zelle el comprador paga menos**, y la diferencia entera es del procesador,
no del margen. Zelle se mantiene porque es lo que usa la clientela venezolana; a
cambio, el comprobante lo valida **una persona**, no un sistema.

### 14. Si conviven, ¿qué porcentaje va por cada uno?

**❌ No lo sé.** Ese dato está en la base de producción (`pedidos.metodo_pago`) y
no tengo acceso de lectura en esta sesión.

**Lo que sí sé es que hoy es un número engañoso:** el histórico importado son 268
pagos Zelle de la tienda anterior de Bley, y las ventas propias del sistema son
un puñado. Cualquier porcentaje que salga de ahí va a decir «99 % Zelle» y no va
a describir el negocio real de Mercatren LLC.

---

# D · CATÁLOGO DE EE. UU. Y CJ

### 15. En Sole & Thread y Ridgeback Outdoors, ¿quién es el vendedor de registro?

**✅ Mercatren LLC.** Esas no son empresas distintas: son **tiendas de la casa**,
una por rubro, para que diez mil productos colgando de un solo nombre no se lean
como un depósito.

**La regla que hace esto legítimo, y está en el código:** en la ficha de cada una
de esas tiendas **se lee quién vende y factura** — «Vendido y facturado por
Mercatren LLC». Con esa línea son marcas de la casa, como las marcas propias de
cualquier cadena. Sin ella serían vendedores inventados, y eso es tergiversación:
causa de suspensión en Merchant Center y de contracargos que el comprador gana.

Por dentro, la compra al proveedor y la factura las hace Mercatren LLC directo.
**No se emite orden de compra a esas tiendas**: nadie se factura a sí mismo. El
costo lo respalda la factura del proveedor.

### 16. ¿Desde dónde despacha CJ físicamente: China o EE. UU.?

**❌ No está comprobado, y es un pendiente conocido y escrito.**

Lo que sé:

- El sistema **le pide a CJ inventario de EE. UU.** (`DESDE = "US"` en
  `src/lib/cj/pedidos.ts`), que es el que hace el plazo corto.
- Hay **una pista real**: un error que devolvió CJ en una compra menciona
  `(Elk Grove Village, IL, US) Insufficient inventory` — un almacén suyo en
  Illinois.
- **Pedir inventario de EE. UU. no garantiza que despache desde EE. UU.**

**El mapa que ve el comprador en la ficha no responde esto.** Dice «en qué estado
hay un almacén», lo cual es cierto, pero **el estado se deriva del identificador
de la tienda**, no del almacén real de ese producto. Es presentación, no
operación — está documentado así a propósito, pero no sirve como dato.

**Cómo se resuelve:** con las compras de prueba, mirando de dónde salió el
paquete. Ya está anotado como pendiente, junto con qué papel viene dentro de la
caja (si trae la factura del mayorista con el precio de compra, el comprador ve
nuestro margen).

**Importa más de lo que parece:** de China cambia el plazo de 5 a 20 días —y la
ficha ya promete uno—, y cambia quién es el importer of record (pregunta 19).

### 17. ¿Mercatren está registrada para sales tax en algún estado?

**❌ No lo sé, y no hay ni una señal de ello en el sistema.** Busqué «sales tax»
y «nexus» en todo el repositorio: **cero menciones**. Si hay un registro estatal,
existe fuera del sistema y yo no lo sé.

### 18. ¿Se está cobrando sales tax hoy? ¿Con qué criterio?

**✅ NO se cobra, y lo puedo señalar con el dedo.**

En `src/lib/pedidos/acciones.ts:422`, al crear cada pedido:

```
impuestosCentavos: 0,
```

Es un **cero literal**, no un cálculo que dé cero. Aplica a **todas** las ventas,
las de Venezuela y las de Estados Unidos. La factura tiene una línea de impuestos
que solo se dibuja si el importe es mayor que cero — y nunca lo es.

**Criterio: ninguno. No hay lógica de impuestos en el sistema.** Está documentado
como una decisión provisional («envío e impuestos van en cero por ahora»), tomada
cuando el catálogo era solo venezolano y se retiraba en depósito.

**Eso dejó de ser inocuo el día que entró el catálogo de Estados Unidos**, porque
ahí hay mercancía tangible entregándose en domicilios de EE. UU.

### 19. ¿Quién es el importer of record en lo que sale de China?

**❌ No lo sé.** Depende de cómo CJ declare cada envío y de si el paquete sale de
China o de su almacén de EE. UU. — que es justo lo que la pregunta 16 dice que no
está comprobado.

**Es una pregunta para CJ por escrito, y para el abogado después.** No se
responde leyendo nuestro código, porque el despacho lo hace un tercero.

### 20. ¿Hay W-8BEN-E de CJ en archivo?

**✅ No, no hay ninguno, y el sistema no puede archivarlo tal como está.**

El módulo de formularios fiscales que se construyó **solo cubre comercios**: la
tabla `formularios_fiscales` cuelga de `tienda_id` como llave primaria. CJ no es
una tienda en el sistema — es un proveedor.

**Y ojo con la dirección de esta pregunta, porque es al revés de lo que parece:**
el W-8BEN-E se le pide a quien **nos cobra**. A CJ le pagamos, así que sí es un
proveedor extranjero al que en principio correspondería pedírselo.

**Pero si lo que se le compra es mercancía y la propiedad pasa fuera de Estados
Unidos, ese ingreso no es de fuente estadounidense** (regla del _title passage_,
secciones 861(a)(6) y 862(a)(6)) — que es exactamente el mismo razonamiento por
el que a Bley no se le retiene nada. **Dónde pasa la propiedad en el caso de CJ
depende de la respuesta a la pregunta 16.**

**Esto va al CPA, con la pregunta 16 respondida primero.**

---

# E · NÚMEROS

### 21. Las tres órdenes ($7.71, $27.74, $30.91): ¿es lo que pagó el comprador o el margen?

**⚠️ Ninguna de las dos. La pregunta ofrece dos opciones y la respuesta es una
tercera, y confundirlas descuadra el asiento entero.**

Esos montos son **órdenes de compra**: lo que **Mercatren le paga al comercio**.
O sea, el **costo de mercancía vendida**.

El caso documentado lo muestra completo:

| Concepto                             | Importe                                    |
| ------------------------------------ | ------------------------------------------ |
| Lo que pagó el comprador (MT-000002) | **$31.87**                                 |
| Margen de Mercatren (3 %)            | $0.96                                      |
| **Orden de compra al comercio**      | **$30.91** ← este es el número de tu lista |

**En un asiento, ese $30.91 va al lado del COSTO, nunca al del ingreso.**

**Las tres son de la misma naturaleza.** Están listadas juntas en el plan de
contabilidad como «tres órdenes de compra en total: $7.71, $27.74 y $30.91» — o
sea, las tres son costo de mercancía, no ingreso.

**❌ De qué pedido y de qué comercio sale cada una, no lo sé** sin consultar la
base. En el panel se ve: Órdenes de compra → la ficha de cada una dice de qué
pedido salió, con qué método se cobró y su referencia.

**Y un dato pendiente que el CPA tiene que conocer:** la orden de compra de la
MT-000002 se emitió con el 3 % guardado cuando la tarjeta iba al 2 %. **Dice
$30.91 y debería decir $31.23.** Corregir un documento contable ya emitido es
decisión tuya y del contador, no mía.

### 22. El ejemplo «103 − 100 = 3», ¿es ilustrativo o real?

**✅ Ilustrativo.** Son números redondos escritos para explicar la mecánica del
bruto contra el neto. Las cifras reales son las de la pregunta 21.

### 23. ¿La comisión es 3 % fijo o varía por comercio?

**✅ Varía por comercio: es una columna en la base** (`tiendas.comision_puntos_base`),
no una constante global. Hoy todos los comercios venezolanos están en el valor
por defecto, **300 puntos base = 3 %**.

**Y hay un segundo margen que no es el 3 %:**

| Catálogo           | Margen   | Por qué                                                     |
| ------------------ | -------- | ----------------------------------------------------------- |
| Venezuela          | **3 %**  | El comercio pone la mercancía y responde por ella           |
| **Estados Unidos** | **30 %** | Mercatren compra, despacha y asume devolución y contracargo |

**Y el margen va a subir por tramos**, con aviso previo, hasta 8–10 % en menos de
un año. Comparación: Amazon cobra 15 % en la mayoría de categorías y Mercado
Libre entre 11,8 % y 20 %.

**Lo crítico para el CPA:** el margen **va dentro del precio publicado**, no se
cobra aparte. Cuando el margen sube, **hay que recalcular los precios ANTES** de
subir la constante, o la diferencia sale del bolsillo del comercio en cada venta.

### 24. ¿Volumen esperado a 6 y 12 meses, en órdenes por mes?

**❌ No lo sé, y no es algo que yo pueda estimar: es una proyección de negocio
tuya.**

Lo único que puedo aportar como base: hoy el sistema tiene **28 comercios
registrados**, **1.071 productos** en el catálogo que ve Google y **tres órdenes
de compra en total**. Las ventas de Estados Unidos están **en pausa a propósito**
hasta comprobar que se puede despachar.

---

# F · PLATAFORMA

### 25. ¿Genera números correlativos? ¿Con qué formato?

**✅ Sí, cuatro series distintas:**

| Documento                        | Formato            | Cómo se numera      |
| -------------------------------- | ------------------ | ------------------- |
| Pedido                           | `MT-000001`        | `COUNT(*) + 1`      |
| **Factura de venta**             | **`MT-F-000001`**  | **Serie atómica**   |
| **Orden de compra**              | **`MT-OC-000001`** | **Serie atómica**   |
| Referencia de cobro del comercio | `F-00123`          | La pone el comercio |

**Las facturas y las órdenes NO usan `COUNT(*)`, y la diferencia importa.** Un
correlativo de factura no puede saltar ni repetir, y es lo primero que mira una
revisión. `COUNT(*) + 1` falla de dos formas: dos cobros simultáneos piden el
mismo número (con Stripe pasa de verdad, manda los avisos en paralelo), y si se
borra una fila, el siguiente número repite uno ya emitido.

Se toma con un `UPDATE ... RETURNING` sobre `series_documento`, que en SQLite es
una sola operación atómica. Comprobado contra la base, no solo en pruebas.

### 26. ¿Dónde se guardan hoy las facturas de los comercios?

**✅ En el almacenamiento de archivos del sitio, con su registro en la base:**

| Qué                                   | Dónde                                                         | Quién la ve                          |
| ------------------------------------- | ------------------------------------------------------------- | ------------------------------------ |
| Factura que **el comercio** nos emite | `facturas-compra/` + `ordenes_compra.factura_proveedor_clave` | El comercio que la subió y el equipo |
| Factura del **proveedor de EE. UU.**  | `facturas-proveedor/` + tabla `facturas_proveedor`            | **Solo el equipo**                   |
| Factura de venta al comprador         | Tablas `facturas` y `lineas_factura`                          | El comprador y el equipo             |

**La segunda es de hoy, 21 de agosto.** Hasta esta mañana la tabla existía y
nadie escribía en ella — la casilla estaba marcada sin que el trabajo existiera.
Ya se archiva desde Panel → Pedidos al proveedor.

**La del proveedor es privada a cajón cerrado** porque lleva el precio al que
compramos: con esa carpeta abierta, cualquiera calcula el margen restando.
Comprobado con tres sesiones: equipo 200, comercio 404, sin cuenta 404.

---

# G · LO QUE NO ESTABA EN MI DOCUMENTO

### 27. Windoce, LLC no declara desde 2023 y tiene tres miembros. ¿Por qué no aparece en tus prioridades?

**Porque no lo sabía. Me lo estás diciendo ahora por primera vez, y no voy a
fingir que lo había considerado.**

Nada de eso está en el repositorio, en mis notas ni en ningún documento del
proyecto. Lo único que me constaba de Windoce, LLC es que está en Delaware y que
su nombre lleva coma.

**Y sí, afecta — bastante:**

**Tres miembros cambian la naturaleza de la sociedad.** Una LLC con más de un
miembro **no es** una disregarded entity: por defecto tributa como **partnership**
y presenta **Formulario 1065** con un **Schedule K-1 por cada miembro**. Mercatren
LLC es de **miembro único**, que es otra cosa completamente distinta. **No son
dos versiones de lo mismo: son dos regímenes fiscales.**

**Tres años sin declarar es un problema con su propio reloj.** La multa por no
presentar el 1065 se cuenta **por mes y por miembro**, así que con tres miembros
crece tres veces más rápido. No es una cifra que yo deba estimarte — **es lo
primero que el CPA tiene que cuantificar**, porque puede ser más grande que
cualquier otra cosa de esta lista.

**¿Afecta que Mercatren arranque limpia?** En lo formal, no: son entidades
separadas, con EIN, estado y banco distintos. Mercatren LLC arranca con su propio
balance de apertura.

**En lo práctico, sí, por tres vías:**

1. **Los miembros son personas, y las personas se repiten.** Si tú eres miembro
   de las dos, tu situación personal ante el IRS arrastra lo de Windoce.
2. **Si hubo actividad de Mercatren facturada por Windoce** —y la hubo, todo lo
   anterior al 12 de agosto— **ese ingreso pertenece a los libros de Windoce**, y
   no se pueden cerrar sin declararlo.
3. **Los otros dos miembros.** Si Windoce tiene tres miembros y Mercatren uno
   solo, hay que poder explicar por qué el negocio se mudó a una sociedad donde
   los otros dos no están. **Eso es una pregunta para el abogado, no para el
   contador**, y conviene tener la respuesta escrita antes de que alguien la
   haga.

**Reordeno mis prioridades con esto encima: Windoce pasa a ser tan urgente como
lo de Mercury.** Un cierre no se puede hacer sobre libros que nunca se abrieron.

### 28. ¿Evaluaste exposición de sales tax por economic nexus?

**No. No la evalué, y no aparece en ninguno de los documentos del proyecto.**

Lo que sí puedo decirte, con datos:

- **No se cobra un centavo de impuesto en ninguna venta** (pregunta 18: cero
  literal en el código).
- No hay ni una mención de «sales tax» o «nexus» en todo el repositorio.
- Mercatren LLC está en **Michigan**, y ahí tiene presencia física: es su
  domicilio registrado **y la dirección de devoluciones**.
- El catálogo que se le manda a Google tiene **1.071 productos** de mercancía
  tangible entregable en Estados Unidos.
- Hoy las ventas de EE. UU. están **en pausa**, así que el volumen todavía es
  mínimo. **Ese es el momento correcto para resolverlo** — antes de acumular
  meses de ventas sin cobrar impuesto.

**Lo que hace falta y no puedo darte yo:** dónde hay nexus, desde qué umbral en
cada estado, si el marketplace facilitator recae en nosotros o en el proveedor, y
si Michigan aplica desde la primera venta por domicilio.

**Es de las tres cosas más importantes que van al CPA, y va con esta pregunta
literal:** _«Somos una LLC de Michigan que vende mercancía tangible a
consumidores en todo Estados Unidos, con despacho por un tercero, y hoy no
cobramos sales tax en ninguna venta. ¿Dónde tenemos obligación de registro, desde
qué momento, y qué hacemos con lo ya vendido?»_

### 29. ¿Hay acuerdo escrito con algún comercio?

**Que me conste, ninguno.** No hay contratos firmados en el repositorio, y en el
plan de contabilidad está listado como pendiente sin empezar.

**Lo que sí existe** son los **términos de servicio publicados**, que un comercio
acepta al registrarse. Son un contrato de adhesión y dicen cosas importantes (que
él fija su precio, que Mercatren revende con su margen).

**Lo que NO cubren, y es justo lo que se necesita:**

- **quién asume la devolución y el contracargo** (pregunta 7 — hoy nadie lo tiene
  escrito, y de hecho lo asume Mercatren);
- **que la entrega ocurre en el país del comercio** — que es la base entera de que
  no haya retención, y hoy no está escrito en ninguna factura;
- **la comisión pactada** y cómo se avisa cuando sube.

**Los redacta el abogado.** Y los tres puntos de arriba no son cláusulas de
relleno: son los que sostienen el modelo fiscal.

### 30. ¿Qué va al CPA y qué al abogado?

## → Al CPA (contador)

| #   | Pregunta concreta                                                                                                                                                                 | Urgencia       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| 1   | **Windoce, LLC: tres miembros, sin declarar desde 2023.** ¿Cuál es la exposición y cómo se regulariza? ¿1065 + K-1 por cada año?                                                  | 🔴 **Primero** |
| 2   | **Sales tax / economic nexus.** LLC de Michigan, mercancía tangible, despacho por tercero, hoy cero impuesto cobrado. ¿Dónde hay que registrarse y qué se hace con lo ya vendido? | 🔴             |
| 3   | **La cuenta 850 «Customer funds to be liquidated».** Los términos dicen que somos principal y tomamos título. ¿Puede quedarse esa Current Liability en el plan de cuentas?        | 🔴             |
| 4   | **Cierre de Windoce y apertura de Mercatren.** Conversion date, balances de apertura, y **que el histórico Zelle de Bley NO entra en ninguno de los dos**                         | 🔴             |
| 5   | Las facturas emitidas con nombre de una sociedad y posible EIN de la otra (pregunta 1)                                                                                            | 🟠             |
| 6   | La orden de compra MT-OC de la MT-000002: dice $30.91 y debería decir $31.23                                                                                                      | 🟠             |
| 7   | ¿Corresponde W-8BEN-E de CJ, si le compramos mercancía? (depende de dónde pasa la propiedad)                                                                                      | 🟡             |
| 8   | ¿Mercury tiene que estar conectado a Xero para que el costo de mercancía se vea?                                                                                                  | 🟡             |

## → Al abogado

| #   | Pregunta concreta                                                                                                                                         | Urgencia |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1   | **Los acuerdos de compraventa con los comercios.** Quién asume devolución y contracargo, y **que la entrega ocurre en el país del comercio**              | 🔴       |
| 2   | **Windoce tiene tres miembros y Mercatren uno.** ¿Cómo se documenta que el negocio se mudó? ¿Hace falta consentimiento de los otros dos?                  | 🔴       |
| 3   | ¿Los términos publicados sostienen la figura de revendedor tal como está el sistema hoy? Ya los revisó una vez; esto es la revalidación con Mercatren LLC | 🟠       |
| 4   | Las tiendas por rubro de EE. UU. (Sole & Thread, Ridgeback): ¿basta «Vendido y facturado por Mercatren LLC» en la ficha?                                  | 🟠       |
| 5   | Importer of record en lo que salga de China (después de responder la pregunta 16)                                                                         | 🟡       |

## → A un tercero, por escrito

| A quién             | Qué preguntar                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Mercury**         | ¿Ejecutan wires a Venezuela y bajo qué condiciones? 🔴 **De esto depende que un comercio venezolano pueda cobrar** |
| **CJ Dropshipping** | ¿Desde qué almacén sale cada pedido? ¿Qué papel va dentro de la caja? ¿Quién figura como importer of record?       |
| **Stripe**          | ¿A qué cuenta bancaria liquida hoy? (30 segundos en el panel)                                                      |

---

# LO QUE NECESITO PARA CERRAR LO QUE FALTA

Cuatro cosas, y ninguna la puedo conseguir yo:

1. **El token de lectura de la base de producción.** Con él te doy en diez
   minutos: la lista exacta de facturas con su fecha y a nombre de qué sociedad
   salió cada una, de dónde sale el $7.71, y el reparto real Zelle/tarjeta.
2. **Si `EMISOR_IDENTIFICACION` y `EMISOR_DIRECCION` se cambiaron el 12 de
   agosto**, y a qué valores. Define si hay facturas inconsistentes.
3. **El EIN de Windoce, LLC** y a qué banco liquidaba.
4. **A qué cuenta liquida Stripe hoy** (Chase o Mercury).

---

# LO QUE NO ES CIERTO DE LO QUE ME DIJISTE, RESUMIDO

Para que quede en una sola vista:

| Lo que dijiste                                           | Lo que es                                                                                                       |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| «La facturación de $337 mil se realizó con Windoce, LLC» | ❌ Es el histórico de la tienda anterior de **Bley**. Ni Windoce ni Mercatren lo cobraron ni lo facturaron      |
| «Mercatren es una empresa virgen sin facturación»        | ✅ **Correcto**, y es justo por lo de arriba                                                                    |
| «Hay que hacer un cierre de Windoce»                     | ✅ **Correcto**, y es más urgente de lo que yo tenía anotado (pregunta 27)                                      |
| «Apertura de Mercatren desde cero con todos los bancos»  | ✅ **Correcto.** Balance de apertura en cero, sin heredar saldos                                                |
| Pregunta 9: la cuenta 850                                | ⚠️ Contradice los términos publicados. Hay que quitarla o renombrarla                                           |
| Pregunta 21: «¿total del comprador o margen?»            | ⚠️ Ninguna: es el **costo de mercancía**                                                                        |
| «Payoneer para pagarle a CJ»                             | ✅ Coherente: CJ recarga saldo por Payoneer o wire. **Ese saldo es costo de mercancía, no un gasto financiero** |
