# Venezuela: impuestos y legal de Mercatren LLC

> **Para:** el contador venezolano, el contador de EE. UU. y el abogado de Mercatren LLC.
> **Escrito por:** el puesto de Investigador, 5 nov 2026. Fuentes leídas en esa fecha.
> **Estado del país:** la venta **ya está abierta en la web** (mercatren.com.ve) y **apagada en la app**.
> Esta página sirve para dos cosas: confirmar que lo que ya se vende está en regla, y decidir si se enciende en la app.
> **No es asesoría legal ni fiscal.** Todo lo marcado «(a confirmar con el contador)» o «(a confirmar con el abogado)» es interpretación nuestra.

**Etiquetas de cada dato:** [DOC] leído en la norma o en la fuente oficial · [DOC-2ª] leído en una fuente secundaria seria (despacho, consultora) porque la oficial no cargó · [INF] deducción nuestra · [NV] no verificado en una fuente leída.

**Aviso sobre las fuentes:** el portal del SENIAT responde **403 (acceso denegado)** desde EE. UU. (comprobado hoy: redirige a seniatenlinea.seniat.gob.ve y devuelve 403). Por eso la parte tributaria se apoya en fuentes secundarias serias (Moore Venezuela, Forvis Mazars) y en una copia del texto de la Ley del IVA. Sí cargaron el BCV y la SUNDDE.

**Contexto 2026:** la Gaceta Oficial N° 6.967 Extraordinario (16 ene 2026), publicada por la SUNDDE, la firma una «Presidenta (E)» y crea el Ministerio del Poder Popular de Industrias y Comercio Nacional, al que hoy está adscrita la SUNDDE [DOC]. En octubre de 2026 el SENIAT anunció una «reforma tributaria integral» (COT, ISLR, IVA) **sin texto publicado** [DOC-2ª]. El marco puede cambiar: esta página hay que revisarla antes de cada paso grande.

---

## 0. El modelo, en una figura

```
 Comprador (muchas veces en EE. UU.)                Comercio en Venezuela
        │  paga en USD:                                    ▲      │
        │  · tarjeta (Stripe, cuenta de EE. UU.)           │      │ 2) le vende la mercancía a
        │  · Zelle (a Mercury o Chase, EE. UU.)            │      │    Mercatren LLC y le factura
        ▼                                                  │      │
 ┌──────────────────────────────┐  orden de compra a       │      │
 │ Mercatren LLC (Michigan)     │──nombre propio───────────┘      │
 │ sin oficina ni empleados     │◀── factura del comercio ────────┘
 │ en Venezuela                 │
 └──────────────────────────────┘── 3) le paga al comercio: ACH o wire desde Mercury (EE. UU.)
        │
        │ 1) le vende al comprador al precio publicado (margen dentro)
        ▼
 La persona designada RETIRA la mercancía en el comercio, en su ciudad de Venezuela.
```

Son **dos ventas**, y las dos son de **bienes que están en Venezuela y se entregan en Venezuela**:
venta A = comercio → Mercatren LLC; venta B = Mercatren LLC → comprador. El dinero de la venta B se cobra en EE. UU.

---

## 1. Resumen en una tabla

| Tema                                                         | Qué es                                                                                              | Para quién             |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ---------------------- |
| IVA 16 % en la venta A (comercio → Mercatren LLC)            | **Obligación del comercio**: factura con IVA aparte. Para Mercatren LLC es un costo que no recupera | Comercio               |
| IVA en la venta B (Mercatren LLC → comprador)                | **Riesgo principal, sin resolver**: los bienes están en Venezuela                                   | Contador VE            |
| Alícuota adicional del IVA por pagos en divisas (5 % a 25 %) | Existe en la ley desde 2020; **no encontramos el decreto que la fije**                              | Contador VE            |
| IGTF 3 % cuando el comprador le paga a Mercatren LLC         | **No aplica** (a confirmar con el contador)                                                         | —                      |
| IGTF 3 % cuando Mercatren LLC le paga al comercio            | **Solo si el comercio es sujeto pasivo especial** y cobra fuera de la banca venezolana              | Comercio + contador VE |
| Retenciones de IVA o ISLR por parte de Mercatren LLC         | **No aplica**: no es agente de retención designado                                                  | —                      |
| ISLR y establecimiento permanente                            | Riesgo bajo; el IRS lista un convenio con Venezuela (vigencia a confirmar)                          | Contador EE. UU. + VE  |
| Ley Orgánica de Precios Justos y SUNDDE                      | **Aplica a extranjeros que vendan en Venezuela por medios electrónicos** (art. 2)                   | Abogado VE             |
| Precios en bolívares                                         | No hallamos norma leída que lo exija en línea; recomendado mostrarlo                                | Nosotros (código)      |
| Datos personales                                             | Sin ley general; rige el habeas data constitucional                                                 | Nosotros (textos)      |

---

## 2. Impuestos

### 2.1 IVA

**Lo que dice la ley** (texto de la Ley que establece el IVA, Gaceta Oficial N° 38.435 del 12 may 2006 [DOC-2ª: copia del texto]; la numeración se mantuvo en las reformas posteriores, a confirmar con el contador):

- Grava la venta de bienes muebles (art. 3). **Territorialidad, art. 14:** las ventas de bienes muebles corporales son gravables «cuando los bienes se encuentren situados en el país».
- **Art. 5:** son contribuyentes ordinarios los comerciantes y «toda persona natural o jurídica que como parte de su giro» realice hechos imponibles.
- **Art. 9.1:** es responsable del pago «el adquirente de bienes muebles… cuando el vendedor… no tenga domicilio en el país».
- **Art. 27:** la alícuota general la fija la Ley de Presupuesto entre 8 % y 16,5 %. Hoy es **16 %**: la reforma de enero de 2020 la mantuvo [DOC-2ª, Forvis Mazars]. La de 2026 hay que confirmarla con el contador.
- **Art. 54:** el contribuyente factura y pone el IVA «en partida separada».
- **Reforma de 2020** (Gaceta N° 6.507 Extraordinario, 29 ene 2020, aplicable desde el 1 abr 2020) [DOC-2ª, Forvis Mazars]: crea una **alícuota adicional de 5 % a 25 %** para bienes y servicios **pagados en divisas** o criptoactivos no venezolanos, que fija el Ejecutivo por decreto. La factura debe indicar la moneda de pago y su equivalente en bolívares. **No encontramos el decreto que fije esa alícuota** [NV]. Si existe, toca de lleno a Mercatren, porque todo se paga en dólares.
- **2025:** la Gaceta N° 6.918 Extraordinario (30 jun 2025) suspendió exenciones del IVA y otorgó exoneraciones [DOC-2ª, Acceso a la Justicia, solo el resumen]. Ver si toca algún rubro de los comercios (a confirmar con el contador).

**Cómo se lee para Mercatren** [INF, a confirmar con el contador]:

1. **Venta A (comercio → Mercatren LLC).** Es venta de bienes situados en Venezuela: gravada al 16 %. El comercio es el contribuyente y factura a Mercatren LLC con el IVA aparte. **Ya lo pedimos así** en la guía pública de impuestos para comercios de fuera de EE. UU. (el IVA va dentro del precio que escribe el comercio). Mercatren LLC no está inscrita en Venezuela: **no recupera ese IVA**, es costo de mercancía.
2. **Venta B (Mercatren LLC → comprador).** También son bienes situados en Venezuela (art. 14). Hay tres lecturas posibles:
   - **(a)** Mercatren LLC vende de forma habitual: sería **contribuyente ordinario** (art. 5). Tendría que inscribirse en el RIF, facturar con el sistema del SENIAT y declarar el IVA de su margen.
   - **(b)** Como no tiene domicilio en Venezuela, el responsable es **el comprador** (art. 9.1). Es impracticable: el comprador suele estar en EE. UU. y es una persona sin RIF.
   - **(c)** Se sostiene que la venta B se perfecciona y se cobra en EE. UU. Es **débil**: el art. 14 mira dónde están los bienes, no dónde se cobra.
   - **Esto hay que resolverlo con una opinión escrita del contador venezolano.** La venta B ya existe hoy en la web: el riesgo está vivo.

**Facturación (lo nuevo):**

- La **Providencia SNAT/2026/00093** (Gaceta N° 43.484, 21 oct 2026) sustituye a la vieja SNAT/2011/00071. **Rige a los 180 días, el 19 abr 2027** [DOC-2ª, dos fuentes divulgativas]. Pide factura por medios digitales (portal, app o imprenta digital) o máquina fiscal, y expresar el monto **en divisas y en bolívares con la tasa del BCV**.
- La Providencia SNAT/2024/000102 (Gaceta N° 43.032, 19 dic 2024) regula la imprenta digital [NV: solo resultados de búsqueda].
- Esto obliga **al comercio** cuando le factura a Mercatren LLC. Pregunta para el contador: qué identificación del comprador extranjero pide la factura si Mercatren LLC no tiene RIF.

### 2.2 IGTF (Impuesto a las Grandes Transacciones Financieras)

**Lo que dice la norma** [DOC-2ª: Moore Venezuela, Boletín 156, compilación del IGTF, septiembre de 2025]:

- **Ley:** Gaceta N° 6.687 Extraordinario, 25 feb 2022.
- **Art. 4, numeral 6:** paga el impuesto quien hace pagos **a un sujeto pasivo especial (SPE)** «en moneda distinta a la de curso legal… sin mediación de instituciones financieras».
- **Art. 4, numeral 5:** también paga quien hace pagos en divisas «dentro del sistema bancario nacional».
- **Alícuota:** **3 %** para los numerales 5 y 6 (art. 24). El Decreto N° 4.972 (Gaceta N° 6.821 Extraordinario, 12 jul 2024) bajó a 0 % la de los numerales 1 a 4 (los SPE pagando desde sus cuentas). **Los numerales 5 y 6 siguen en 3 %.**
- **Quién lo cobra:** los SPE son **agentes de percepción** por los pagos en divisas que reciben sin mediación de instituciones financieras (Providencia SNAT/2022/000013, Gaceta N° 42.339, 17 mar 2022).
- **Art. 11 (territorialidad):** se grava cuando alguna causa ocurre o se sitúa en Venezuela.
- En la práctica, Zelle y billeteras similares se tratan como efectivo; lo que se liquida en bolívares por la banca nacional a tasa BCV no lleva el 3 % [DOC-2ª, Gálac].
- **2026:** los gremios piden eliminarlo. No hay norma publicada que lo haga [DOC-2ª, octubre de 2026].

**Cómo se lee para Mercatren** [INF, a confirmar con el contador]:

- **El comprador le paga a Mercatren LLC** (Stripe o Zelle, en EE. UU.): **no aplica**. Mercatren LLC no es SPE, no es agente de percepción y el pago no pasa por la banca venezolana.
- **Mercatren LLC le paga al comercio** (ACH o wire desde Mercury): **solo aplica si el comercio es SPE.** En ese caso, el comercio debe percibirle el 3 % a Mercatren LLC (numeral 6), porque cobra divisas fuera de la banca nacional. Si el comercio no es SPE: no aplica.
- **Lo que hay que hacer:** preguntar a cada comercio si es SPE y, si lo es, que el contador defina quién asume ese 3 %. Si nadie lo prevé, lo absorbe el comercio sin saberlo o se lo cobra a Mercatren después.

### 2.3 Retenciones de IVA e ISLR

- Retienen los compradores que la Administración **designa** (SPE y otros). Mercatren LLC no está designada ni inscrita: **no retiene** [INF].
- Si un comercio SPE algún día **le compra** a Mercatren (no es el caso hoy), habría que revisarlo.

### 2.4 Impuesto sobre la renta y establecimiento permanente

- El IRS incluye a Venezuela en su lista de **convenios de doble imposición de EE. UU.** (página revisada el 3 ene 2026) [DOC]. **No leímos su texto ni comprobamos su vigencia en esta sesión** [NV]: el contador debe confirmar que sigue vigente y qué dice su artículo de beneficios empresariales.
- **Riesgo de establecimiento permanente: bajo** [INF]. Mercatren LLC no tiene oficina, empleados, depósito ni agente propio en Venezuela. Los comercios son independientes y venden lo suyo.
- **Lo que hay que vigilar:** si un día se contrata a alguien en Venezuela para atender comercios, o se alquila un local de retiro, ese juicio cambia.
- **En EE. UU.:** se declara **el bruto** de las ventas venezolanas y su costo de mercancía, igual que el resto (regla de cabecera del proyecto). El contador de EE. UU. confirma si pide el certificado de residencia (formulario 6166) para el convenio (a confirmar con el contador).

---

## 3. Consumo y lo que hay que decirle al comprador

**Ley Orgánica de Precios Justos.** Decreto N° 2.092, Gaceta N° 6.202 Extraordinario, 8 nov 2015, reimpreso en la Gaceta N° 40.787 del 12 nov 2015. La publica la SUNDDE en su sitio [DOC]. Derogó la de 2014 (disposición derogatoria única).

| Artículo | Qué dice                                                                                                                                                           | Qué significa para Mercatren [INF]                                                        |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| 2        | Aplica a personas «nacionales o extranjeras» con actividad económica en Venezuela, «incluidas las que se realizan a través de medios electrónicos»                 | Mercatren LLC puede quedar dentro (a confirmar con el abogado)                            |
| 7        | Derechos: información «adecuada, veraz, clara, oportuna y completa» sobre productos y precios; protección en contratos de adhesión; acceso a tutela administrativa | La ficha y los términos deben ser claros; nuestros términos son de adhesión               |
| 8        | Los bienes durables con sistemas mecánicos, eléctricos o electrónicos «deberán ser obligatoriamente garantizados por el proveedor»                                 | La ficha debe decir qué garantía tiene y quién la da                                      |
| 19       | Inscripción obligatoria en el RUPDAE: «requisito indispensable» para actividades económicas en el país                                                             | ¿Debe inscribirse Mercatren LLC? (a confirmar con el abogado). Los comercios sí           |
| 28       | La SUNDDE fija por providencia el **marcaje de precios**                                                                                                           | Revisar si hay providencia vigente para ventas en línea                                   |
| 31       | «Ningún margen de ganancia superará el treinta por ciento (30 %) de la estructura de costos»                                                                       | Nuestro margen (3 % a 6 %) está muy por debajo. El margen de cada comercio es asunto suyo |

**Precios en bolívares.**

- No encontramos, en lo que pudimos leer, una norma que obligue a una tienda en línea a **publicar** el precio en bolívares [NV].
- La SUNDDE fiscaliza que los comercios usen la **tasa oficial del BCV** [DOC-2ª, prensa].
- El Convenio Cambiario N° 1 (Gaceta N° 6.405 Extraordinario, 7 sep 2018), art. 8, permite pactar en divisa como moneda de cuenta y pagar en bolívares a la tasa del BCV [NV: solo resultados de búsqueda].
- Las facturas deben llevar el equivalente en bolívares (reforma del IVA de 2020 y la nueva providencia de facturación).
- **Recomendación** (a confirmar con el abogado): mostrar en mercatren.com.ve, debajo del precio en dólares, un «equivalente referencial en bolívares a la tasa oficial del BCV del día». Es barato y quita un flanco.

**Derecho a desistir.** No encontramos en la Ley de Precios Justos un derecho legal de arrepentimiento para compras a distancia [INF]. Nuestra política ya es más generosa que eso: se cancela gratis antes de retirar, se revisa al retirar y hay 7 días para reclamar.

**Lo que hoy está mal en los términos.** mercatren.com.ve sirve **los mismos términos** que mercatren.com, y esos dicen:

- «en mercatren.com vendemos y entregamos únicamente dentro de Estados Unidos»;
- «solo se aceptan pagos desde bancos de Estados Unidos»;
- la ley aplicable es solo la de EE. UU.

Para quien retira en Venezuela, eso contradice lo que de verdad pasa. Ver la sección 6.

---

## 4. Datos personales

- **No hay ley general** de protección de datos ni autoridad de control en Venezuela [DOC-2ª, Baker McKenzie / Global Compliance News]. No encontramos ninguna aprobada en 2025 o 2026 [NV].
- **Base:** la Constitución, art. 28 (habeas data) y art. 60 (vida privada) [DOC-2ª].
- **Sentencia N° 1318 de la Sala Constitucional del TSJ** (4 ago 2011) [DOC-2ª]. Fija principios:
  - consentimiento «previo, libre, informado, inequívoco y revocable»;
  - finalidad y temporalidad;
  - rectificación y supresión;
  - seguridad;
  - **prohibición de transferir datos a Estados sin protección adecuada**.
- **Para Mercatren** [INF, a confirmar con el abogado]: los datos de quien compra o vende en mercatren.com.ve se guardan en EE. UU. Conviene que la aceptación al registrarse (que ya existe) diga **expresamente** que los datos se tratan en EE. UU. y para qué. Con eso hay consentimiento informado de la transferencia.

---

## 5. Antes de encender la venta en la app (y para sostener la de la web)

| #   | Qué                                                                                                                   | Quién                                                 | ¿Bloquea?                                        |
| --- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------ |
| 1   | Opinión escrita sobre el IVA de la venta B: ¿Mercatren LLC debe inscribirse en el RIF?                                | Contador VE                                           | **Sí**, para la app. En la web es un riesgo vivo |
| 2   | Confirmar si la alícuota adicional del IVA por pagos en divisas (5 % a 25 %) está fijada hoy                          | Contador VE                                           | **Sí**: cambia el precio                         |
| 3   | Si la respuesta 1 es «inscribirse»: seguir con la reventa en Venezuela o cambiar la estructura 👤                     | **Richard** (decisión de negocio y legal)             | **Sí**                                           |
| 4   | Saber qué comercios son sujetos pasivos especiales (IGTF 3 %) y quién lo asume                                        | Nosotros (casilla en el alta de tienda) + contador VE | No, pero antes de pagarle a un SPE               |
| 5   | Que cada comercio facture a Mercatren LLC con IVA aparte y en el formato del SENIAT (y el nuevo desde el 19 abr 2027) | Comercio + contador VE                                | No                                               |
| 6   | ¿Debe Mercatren LLC inscribirse en el RUPDAE? ¿La Ley de Precios Justos le aplica?                                    | Abogado VE                                            | No (a confirmar)                                 |
| 7   | Términos y privacidad propios de mercatren.com.ve (sección 6)                                                         | Nosotros (código) + revisión del abogado              | **Sí**, para la app: hoy se contradicen          |
| 8   | Equivalente referencial en bolívares a la tasa del BCV junto al precio                                                | Nosotros (código)                                     | No (recomendado)                                 |
| 9   | La ficha dice qué garantía tiene cada producto durable y quién la da                                                  | Nosotros (campo) + comercio                           | No (recomendado, art. 8)                         |
| 10  | Compra real de punta a punta en la app (tarjeta y Zelle), según `VERIFICAR-PAGOS.md`                                  | Nosotros + Richard (la compra final)                  | **Sí** (regla de pagos)                          |
| 11  | Convenio EE. UU.-Venezuela y declaración del bruto en EE. UU.                                                         | Contador EE. UU.                                      | No                                               |

---

## 6. Lo que el sitio y la app ya hacen, y lo que hay que agregar

### Lo que ya hacen

- Precio en dólares y precio final. El comercio escribe su precio **con su IVA dentro** y recibe exactamente eso (guía pública de impuestos para comercios de fuera de EE. UU.).
- El comercio factura a Mercatren LLC: el panel le da la «orden de compra» de cada venta y el Excel. Firma el W-8BEN-E.
- Cobro con tarjeta y Zelle (Zelle probado en Venezuela). Retiro en el comercio de la ciudad.
- Política de devoluciones de Venezuela: cancelar antes de retirar con devolución total; revisar al retirar; 7 días para reclamar.
- Privacidad general: datos mínimos, 5 años de registros, borrar la cuenta uno mismo, solo cookies indispensables.
- La venta en la app está apagada.

### Lo que hay que agregar en los **términos** para Venezuela (solo en mercatren.com.ve)

1. **Quién vende y dónde se entrega** (corrige la contradicción de hoy; Ley de Precios Justos, art. 7.4):
   > «En mercatren.com.ve vende Mercatren LLC, sociedad registrada en Michigan, Estados Unidos. Los productos los publica un comercio de Venezuela: Mercatren LLC le compra la mercancía a ese comercio y te la vende a ti. La mercancía se retira en el comercio indicado en cada producto, en Venezuela, salvo que el comercio ofrezca despacho y lo diga en la ficha.»
2. **Precio** (arts. 7.4 y 28; Convenio Cambiario N° 1, art. 8, a confirmar):
   > «El precio se publica en dólares de los Estados Unidos y es el precio final: no se cobra ningún impuesto ni recargo aparte al pagar ni al retirar. Te mostramos además su equivalente referencial en bolívares a la tasa oficial del Banco Central de Venezuela del día.»
   - **No escribir «IVA incluido» al comprador** hasta que el contador resuelva la sección 2.1.
3. **Garantía** (art. 8):
   > «Los equipos y artefactos con piezas mecánicas, eléctricas o electrónicas tienen la garantía que se indica en su ficha, con quién la da y dónde se hace valer.»
4. **Formas de pago:** cambiar «solo se aceptan pagos desde bancos de Estados Unidos» por: «se paga con tarjeta o por Zelle desde una cuenta a tu nombre; el pago se recibe en Estados Unidos, en dólares».
5. **Ley aplicable** (art. 2 y art. 7; a confirmar con el abogado):
   > «Tu compra se rige por estos términos y por las leyes de los Estados Unidos y del estado de Michigan, sin perjuicio de los derechos que la ley venezolana reconoce a las personas que adquieren bienes en Venezuela y que no se pueden renunciar.»
6. **Reclamos** (art. 7.8):
   > «Escríbenos primero a [correo de contacto]. Si no quedas conforme, conservas los mecanismos de reclamo que la ley venezolana te da.»

### Lo que hay que agregar en la **privacidad** para Venezuela

1. **Transferencia y consentimiento** (Constitución, art. 28; TSJ, sentencia 1318/2011):
   > «Si compras o vendes en mercatren.com.ve, tus datos los trata Mercatren LLC en los Estados Unidos, solo para prestar el servicio, cobrar, entregar y cumplir la ley. Al crear tu cuenta aceptas ese tratamiento y puedes retirar tu consentimiento cerrando tu cuenta.»
2. **Qué recibe el comercio:**
   > «Para el retiro, el comercio recibe el nombre de quien retira, el teléfono y qué se compró. No recibe tu comprobante de pago ni tus datos bancarios.»
3. **Derechos:**
   > «Puedes pedirnos acceso, rectificación o supresión de tus datos, y conocer el uso que les damos, en [correo de contacto].»

---

## 7. Fuentes (consultadas el 5 nov 2026)

| Fuente                                                                    | Tipo                        | Enlace                                                                                           |
| ------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------ |
| Ley que establece el IVA, Gaceta N° 38.435 (12 may 2006), copia del texto | Secundaria (copia)          | https://alertas-v3.directoriolegislativo.org/wp-content/uploads/2020/01/VEN.-ley_iva.pdf         |
| Forvis Mazars, InfoMazars N° 02-2020 (reforma del IVA, Gaceta N° 6.507)   | Secundaria                  | https://www.forvismazars.com/ve/en/insights/forvis-mazars-insights/infomazars-n-02-2020          |
| Moore Venezuela, Boletín 156: compilación normativa del IGTF (sept 2025)  | Secundaria                  | https://www.moore-venezuela.com/wp-content/uploads/sites/15/2025/12/156-IGTF.pdf                 |
| Gálac, IGTF y pagos en divisas (2026)                                     | Secundaria                  | https://galac.com/galac-blog/igtf-pagos-divisas-cripto/                                          |
| Reforma tributaria 2026 y Providencia SNAT/2026/00093                     | Secundaria                  | https://soytecnologia.com/reforma-tributaria-venezuela/                                          |
| Normas generales de facturación 2026 (23 oct 2026)                        | Secundaria                  | https://jesusrangelblog.substack.com/p/normas-generales-de-facturacion-en                        |
| Acceso a la Justicia, Gaceta N° 6.918 (9 jul 2025)                        | Secundaria (solo resumen)   | https://accesoalajusticia.org/2025/07/09/                                                        |
| SUNDDE, quiénes somos y marco legal                                       | Oficial                     | https://www.sundde.gob.ve/?page_id=163                                                           |
| Ley Orgánica de Precios Justos (texto publicado por la SUNDDE)            | Oficial                     | https://www.sundde.gob.ve/wp-content/uploads/2025/08/Ley-Organica-de-Precios-Justos.docx         |
| Gaceta Oficial N° 6.967 Extraordinario (16 ene 2026)                      | Oficial                     | https://www.sundde.gob.ve/wp-content/uploads/2026/03/Gaceta-Oficial-Extraordinaria-6967.pdf      |
| Baker McKenzie, protección de datos en Venezuela                          | Secundaria                  | https://www.globalcompliancenews.com/data-privacy/data-protection-enforcement-in-venezuela/      |
| IRS, convenios de EE. UU. de la A a la Z (revisada el 3 ene 2026)         | Oficial (EE. UU.)           | https://www.irs.gov/businesses/international-businesses/united-states-income-tax-treaties-a-to-z |
| Portal del SENIAT                                                         | Oficial: **no cargó (403)** | https://www.seniat.gob.ve                                                                        |

Vistos solo como resultados de búsqueda [NV]: Providencia SNAT/2024/000102 (Edicom, Finanzas Digital) y Convenio Cambiario N° 1, art. 8 (Finanzas Digital, Travieso Evans).
