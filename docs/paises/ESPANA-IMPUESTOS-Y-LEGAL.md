# España: impuestos y legal de Mercatren LLC antes de cobrar

> **Para:** el contador (y la gestoría que haga de representante en España) y el abogado de Mercatren LLC.
> **Escrito por:** el puesto de Investigador, 5 nov 2026. Fuentes leídas en esa fecha.
> **Estado del país:** España vive dentro de mercatren.com (se elige con la bandera), con precios en euros. **El cobro está cerrado** (`ESPANA_SIN_COBRO` en `src/lib/ventas/pausa.ts`). Nada se enciende sin el sí de Richard.
> **No es asesoría legal ni fiscal.** Lo marcado «(a confirmar con el contador)» o «(a confirmar con el abogado)» es interpretación nuestra.

**Etiquetas de cada dato:** [DOC] leído en la norma oficial (BOE, Diario Oficial de la UE, Agencia Tributaria, Comisión) · [DOC-2ª] fuente secundaria seria · [INF] deducción nuestra · [NV] no verificado en una fuente leída.

**Nota de método:** EUR-Lex muestra una verificación anti-robots. No se saltó. Los textos de la UE se leyeron en el servicio oficial de la Oficina de Publicaciones (publications.europa.eu), que entrega el mismo Diario Oficial. El BOE se leyó en su texto consolidado, con la fecha de actualización de cada norma.

---

## 0. El modelo, en una figura

```
 Comercio español (CIF / DNI / NIE)              Comprador consumidor en España
        │ 1) le vende la mercancía a                       ▲
        │    Mercatren LLC: venta en España, IVA 21 %      │ 3) el comercio lo envía con su
        ▼                                                  │    transportista, dentro de España
 ┌──────────────────────────────┐ 2) Mercatren LLC le vende │
 │ Mercatren LLC (Michigan)     │── al consumidor ─────────┘
 │ sin sede ni establecimiento  │   en euros, IVA 21 %
 │ en la UE                     │   cobra con tarjeta (Stripe, cuenta de EE. UU.)
 └──────────────────────────────┘── le paga al comercio en euros, a un IBAN, desde Mercury
```

**Dos entregas, y las dos ocurren en España** [DOC + INF]. La ley del IVA, art. 68.Dos.1º A), dice que una entrega con transporte se hace donde **empieza** el transporte, y aquí empieza en España. No hay importación ni paso entre países.

---

## 1. Resumen en una tabla

| Tema                                                                    | Qué es                                                                    |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| IVA 21 % en la venta de Mercatren LLC al consumidor                     | **Obligación** de Mercatren LLC como sujeto pasivo                        |
| Alta en el censo, NIF español y **representante fiscal**                | **Obligación**: EE. UU. no está exceptuado, solo Noruega                  |
| Modelo 303 trimestral y 390 anual                                       | **Obligación** desde el alta, aun sin ventas                              |
| IVA que cobra el comercio a Mercatren LLC                               | Se **deduce** en el 303 si hay alta y factura completa                    |
| Ventanilla única (OSS / IOSS)                                           | **No aplica hoy** a este modelo. Desde el 1 jul 2028 puede cambiar (ViDA) |
| «Proveedor presunto» de plataformas (art. 8 bis)                        | **No aplica**: los vendedores son españoles y Mercatren compra en firme   |
| Verifactu                                                               | **No aplica** sin establecimiento permanente                              |
| DAC7 (modelo 238)                                                       | **Riesgo a consultar**                                                    |
| Impuesto sobre la Renta de no Residentes                                | **No aplica** sin establecimiento permanente (convenio, art. 7)           |
| Desistimiento 14 días, garantía 3 años, ley y tribunales del consumidor | **Obligación**: Mercatren LLC es el vendedor y responde                   |
| Plataforma europea de litigios en línea                                 | **Ya no existe** (derogada desde el 20 jul 2025)                          |
| Representante en la UE para datos personales (RGPD, art. 27)            | **Obligación**                                                            |

---

## 2. Impuestos

### 2.1 IVA: quién paga, a qué tipo y dónde

- **Sujeto pasivo, art. 84.Uno.1º** de la Ley 37/1992 (consolidada al 07/10/2026) [DOC]: lo es el empresario que hace la entrega.
  - La **inversión del sujeto pasivo** (art. 84.Uno.2º a) solo se aplica cuando el **cliente** es empresario. Aquí el cliente es un consumidor.
  - Por eso **Mercatren LLC es quien repercute el 21 % al consumidor y lo ingresa** [INF].
- **La venta del comercio a Mercatren LLC.** El proveedor está establecido en España, así que no hay inversión: **el comercio le cobra el 21 % a Mercatren LLC** [INF].
- **Tipo general: 21 %** (art. 90.Uno) [DOC]. Algunos productos van a tipo reducido según el art. 91. El tipo de cada producto lo sabe el comercio (a confirmar con el contador por rubro).
- **El efecto neto: Mercatren LLC ingresa el 21 % de su margen**, no del precio entero [INF]. Eso solo pasa si está dada de alta y tiene factura completa de cada comercio. **Sin alta, pagaría el IVA dos veces** (el del comercio y el suyo).

**Ejemplo con la fórmula de precio de hoy** (tarjeta: `V = (base + 0,30) / 0,941`) [INF, cálculo nuestro, a confirmar con el contador]:

| Concepto                                                     | Euros                                   |
| ------------------------------------------------------------ | --------------------------------------- |
| Precio que escribe el comercio, con su IVA dentro (100 + 21) | 121,00                                  |
| Precio publicado V                                           | 128,91                                  |
| IVA que Mercatren LLC repercute (V × 21/121)                 | 22,37                                   |
| Menos IVA que le cobró el comercio                           | −21,00                                  |
| **IVA neto que Mercatren LLC ingresa en el 303**             | **1,37**                                |
| Procesador a tarifa de EE. UU. (2,9 % + 0,30)                | 4,04                                    |
| **Le queda a Mercatren LLC**                                 | **2,50** (no los 3,87 del 3 % previsto) |

Con el recargo de la tarjeta europea (~1,5 % internacional y ~1 % de conversión, según `VERIFICAR-PAGOS.md`), **el resultado es negativo**. **El margen de España hay que calcularlo con el IVA del margen dentro** antes de encender. Es decisión de Richard.

### 2.2 Alta, NIF y representante fiscal

- **Representante obligatorio.** Ley del IVA, art. 164.Uno.7º [DOC]: hay que «nombrar un representante… cuando se trate de sujetos pasivos no establecidos en la Comunidad», salvo Canarias, Ceuta, Melilla o un Estado con «instrumentos de asistencia mutua análogos».
  - La Agencia Tributaria aclara que **hoy ese Estado es solo Noruega** (página actualizada el 10 oct 2025) [DOC].
  - **Mercatren LLC necesita un representante con domicilio fiscal en España.**
  - La excepción para quien usa los regímenes especiales (OSS) no sirve aquí: ver 2.3 [DOC].
- **Base general:** la Ley General Tributaria, art. 47, pide representante a los no residentes «cuando lo establezca expresamente la normativa tributaria» [DOC].
- **NIF y alta censal: modelo 036**, presentado en la delegación del domicilio fiscal del representante. Si el administrador no tiene NIF español, primero va el **modelo 030** [DOC, Agencia Tributaria].
- **Declaraciones** [DOC, Reglamento del IVA, art. 71, consolidado al 28/02/2026]:
  - el **303** es **trimestral**, salvo que el volumen de operaciones pase de 6.010.121,04 € (entonces es mensual);
  - se presenta **aunque no haya cuotas**;
  - el resumen anual es el **390**, con las salvedades del art. 71 (a confirmar con el contador si aplica la exoneración).

### 2.3 Ventanilla única (OSS / IOSS), plataformas y lo que viene

- **Régimen exterior de la Unión** (arts. 163 octiesdecies y siguientes) [DOC]: solo cubre **servicios** de empresas de fuera de la UE. No cubre bienes.
- **Régimen de la Unión** (art. 163 unvicies) [DOC]: cubre a empresarios establecidos en la UE, las ventas a distancia **entre países** de la UE y las entregas del art. 8 bis.b). **Una venta dentro de España, de un no establecido, sin interfaz que la «facilite», no entra.** Hace falta el alta propia en España [INF].
- **IOSS:** es para importaciones de hasta 150 €. No aplica: la mercancía ya está en España.
- **«Proveedor presunto»** (art. 8 bis) [DOC]: se aplica cuando una interfaz facilita entregas dentro de la UE hechas por un vendedor **no establecido en la UE**.
  - Aquí los vendedores son españoles, y Mercatren LLC no facilita la venta de otro: **compra y revende**. No aplica [INF].
  - Si un día se abren vendedores de fuera de la UE con mercancía en España, sí aplicaría.
- **Lo que viene, ViDA** (Directiva (UE) 2025/516, art. 3, nuevo art. 369 ter.e) [DOC]: desde el **1 jul 2028**, la ventanilla única de la Unión cubrirá también las entregas **dentro de un mismo país** a consumidores por empresas no establecidas en ese país.
  - Podría evitar el alta local (a confirmar con el contador si la usa una empresa de fuera de la UE).
  - Ojo: la ventanilla única **no permite deducir** el IVA del comercio en la misma declaración [INF].

### 2.4 Facturas

- **Factura simplificada** (Reglamento de facturación, art. 4, consolidado al 31/03/2026) [DOC]: hasta **400 €** IVA incluido, o hasta **3.000 €** en ventas al por menor a consumidores.
- **Moneda** (art. 12) [DOC]: la factura puede ir en cualquier moneda, pero **la cuota de IVA va en euros**.
- **Del comercio a Mercatren LLC:** **factura completa**, con el NIF español de Mercatren LLC. Sin ella no hay deducción [INF].
- **Verifactu** (Real Decreto 1007/2023, art. 3, consolidado al 03/12/2025) [DOC]: obliga a contribuyentes del Impuesto sobre Sociedades, del IRPF con actividad y del IRNR **«que obtengan rentas mediante establecimiento permanente»**. Sin establecimiento permanente, **Mercatren LLC no está obligada**.
  - Fechas vigentes en el BOE: antes del **1 ene 2027** las sociedades y antes del **1 jul 2027** el resto.
  - Una noticia habla de otra prórroga a 2028 [NV: no está en el BOE consolidado].

### 2.5 DAC7 y modelo 238 (riesgo a consultar)

- **Qué es una plataforma** (Directiva 2021/514, anexo V) [DOC]: software que permite a los vendedores **«ponerse en contacto con otros usuarios»** para una actividad pertinente, como la **venta de bienes**, «de forma directa o indirecta».
  - Un operador **de fuera de la UE** que facilite ventas de vendedores residentes en la UE debe **registrarse en un Estado miembro** e informar.
  - Se excluye al vendedor con **menos de 30 ventas y hasta 2.000 €** en el periodo.
- **En España** lo regula el art. 54 ter del Reglamento de gestión e inspección (FAQ de la Agencia Tributaria, actualizada el 8 sep 2026) [DOC]. El registro de operadores extranjeros es el **modelo 040** (Orden HAC/72/2024) [NV: solo resultados de búsqueda].
- **La duda** [INF, a confirmar con el contador o el abogado]: en Mercatren el comercio le vende **a Mercatren LLC**, no a otro usuario. Se puede sostener que no hay plataforma en el sentido de DAC7. Pero el comercio publica su catálogo y se conecta «de forma indirecta» con el comprador.
- **Pedir opinión antes de que termine el primer año con ventas en España.** Mientras tanto, guardar ya, de cada comercio: NIF, domicilio, IBAN y totales por trimestre. Casi todo eso ya se pide.

### 2.6 Renta de no residentes y establecimiento permanente

- **Convenio España-EE. UU.** (BOE-A-1990-30940, con el Protocolo en vigor desde 2019, consolidado al 23/10/2019) [DOC].
  - **Art. 7:** los beneficios de una empresa de EE. UU. solo tributan en EE. UU., salvo que tenga un establecimiento permanente en España.
  - **Art. 5.4:** almacenar o entregar mercancía propia no constituye establecimiento permanente.
- **Riesgo bajo** [INF]: no hay oficina, empleados ni depósito propio en España, y los comercios despachan lo suyo.
- **Ojo con dos cosas:**
  - un **almacén propio** con proveedor español (BigBuy está en la mira) se mira de nuevo;
  - el convenio trata de forma especial a las rentas obtenidas por **entidades fiscalmente transparentes** (art. 1.6 del texto consolidado) [DOC]. Si Mercatren LLC es una LLC transparente en EE. UU., el contador debe confirmar cómo acredita la residencia (formulario 6166 del IRS) (a confirmar con el contador).
- **Retenciones:** en una venta a consumidores no hay ninguna [INF].

---

## 3. Consumo: lo que la ley obliga a decirle al comprador

**¿Aplica la ley española a una empresa de EE. UU.?** Sí.

- La LSSI, art. 4 (consolidada al 23/01/2025), se aplica a los prestadores de fuera de la UE que **«dirijan sus servicios específicamente al territorio español»** [DOC].
- Precios en euros, provincias españolas y la bandera de España: es dirigirse a España [INF].

| Obligación                                                  | Norma [DOC]                                                                                                                                                                                                                                                                                              | En la práctica                                                                                         |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Identidad del vendedor                                      | LSSI art. 10.1: nombre, **domicilio**, correo, datos del registro donde está inscrito, **NIF**, precios con o sin impuestos y gastos de envío. TRLGDCU art. 97.1.b-d: además **teléfono** y dirección completa                                                                                           | Ver 6. Choca con la regla interna de no publicar la dirección de devoluciones: **decisión de Richard** |
| Precio final con IVA                                        | TRLGDCU art. 97.1.e y LSSI art. 10.1.f                                                                                                                                                                                                                                                                   | «IVA incluido» y el envío, antes de pagar                                                              |
| Pasos para comprar, archivo, corrección de errores, idiomas | LSSI art. 27                                                                                                                                                                                                                                                                                             | Una página corta, enlazada desde el carrito                                                            |
| Confirmación del pedido                                     | LSSI art. 28: acuse por correo en 24 h o confirmación archivable al terminar                                                                                                                                                                                                                             | Ya hay correo de pedido (revisar el texto)                                                             |
| Botón de pagar                                              | TRLGDCU art. 98.2: etiqueta «pedido con obligación de pago» o una fórmula **inequívoca** equivalente; si no, el consumidor no queda obligado                                                                                                                                                             | Revisar el texto del botón de España                                                                   |
| Desistimiento de 14 días naturales                          | TRLGDCU arts. 102 y 104: desde que el consumidor (o quien indique, no el transportista) recibe el bien                                                                                                                                                                                                   | Lo asume **Mercatren LLC**, que es el vendedor                                                         |
| Si no se informa                                            | Art. 105: el plazo se alarga **12 meses**                                                                                                                                                                                                                                                                | Razón de más para tenerlo escrito                                                                      |
| Cómo se desiste y el reembolso                              | Art. 106: modelo de formulario (anexo I, letra B). Art. 107: devolver **todo, incluido el envío estándar**, en **14 días**, por el mismo medio; se puede esperar a recibir el bien. Art. 108: el consumidor devuelve en 14 días y paga el coste directo **solo si se le avisó**                          | El comercio debe aceptar estas devoluciones (ver 5)                                                    |
| Excepciones                                                 | Art. 103: personalizados, perecederos, precintados de higiene abiertos y otros                                                                                                                                                                                                                           | Marcar en la ficha                                                                                     |
| Garantía legal                                              | Art. 120: **3 años** desde la entrega en bienes nuevos; 2 en contenido digital; segunda mano, se puede pactar no menos de **1 año**. Art. 121: se presume que el defecto existía si aparece en **2 años**                                                                                                | Responde Mercatren LLC ante el comprador                                                               |
| Ley aplicable y tribunales                                  | Roma I, art. 6: la ley de la residencia del consumidor no se puede quitar por contrato. Bruselas I bis, art. 18: el consumidor puede demandar en su domicilio. TRLGDCU art. 90.2 y 90.3: es **abusiva** la cláusula de tribunal distinto del domicilio del consumidor o de sumisión a derecho extranjero | Los términos de hoy («se rigen por las leyes de EE. UU.») **no valen** para el consumidor español      |
| Seguridad de los productos                                  | Reglamento (UE) 2023/988, art. 19 (aplica desde el 13 dic 2024): en la oferta en línea, el fabricante (nombre y dirección postal y electrónica), la persona responsable en la UE si el fabricante es de fuera, una imagen y el modelo, y las advertencias de seguridad                                   | Campos nuevos en la ficha de España                                                                    |

**Lo que cambió o se aclaró en 2025-2026:**

- **La plataforma europea de litigios en línea ya no existe.** El Reglamento (UE) 2024/3228 derogó el 524/2013 **con efecto desde el 20 jul 2025**. No se admiten reclamaciones desde el 20 mar 2025 [DOC]. **No hay que enlazarla.** Si algún texto la enlaza, se quita.
- **La «función de desistimiento» (botón para desistir).**
  - La Directiva (UE) 2023/2673 añade el art. 11 bis a la Directiva 2011/83. En contratos hechos por una interfaz en línea, hay una función rotulada **«desistir del contrato aquí»**, siempre visible durante el plazo, con un paso de **«confirmar desistimiento»** y acuse en soporte duradero con fecha y hora.
  - Los Estados debían aplicarla **desde el 19 jun 2026** [DOC].
  - **España no la ha incorporado todavía**: el TRLGDCU consolidado al 04/11/2026 no la trae [DOC], y la OCU lo denunció el 19 jun 2026 [DOC-2ª].
  - **Recomendación: construirla ya** en «Mis pedidos». Cuando España la incorpore será exigible, y cumple igual el art. 106.3.
- **Ley 10/2025 de atención a la clientela** (BOE 27 dic 2025) [DOC]: solo para servicios básicos (agua, luz, transporte…) o empresas con **250 trabajadores, 50 M€ de facturación o 43 M€ de balance**. **No aplica** a Mercatren hoy.
- **Hojas de reclamaciones:** son autonómicas. Madrid y Murcia incluyen la venta a distancia; la Comunidad Valenciana no las exige a tiendas en línea sin sede allí [DOC-2ª]. Sin establecimiento en ninguna comunidad, no está claro que apliquen (a confirmar con el abogado). Mientras tanto: formulario de reclamación en línea y plazo de respuesta escrito.

---

## 4. Datos personales

- **El RGPD aplica.** Art. 3.2.a: se aplica a quien no está en la UE pero ofrece bienes a personas en la UE [DOC].
- **Representante en la UE, art. 27** [DOC]: hay que designarlo por escrito, en un país donde estén los interesados (España).
  - La excepción es solo para tratamiento **«ocasional»**. Vender de forma continua no lo es [INF].
  - **Es obligatorio.** Se contrata como servicio (lo ofrecen despachos y empresas especializadas).
- **Información al recoger los datos**, art. 13 [DOC]:
  - responsable y su representante;
  - fines y **base jurídica**;
  - destinatarios;
  - **transferencias a terceros países y su garantía**;
  - plazo de conservación;
  - derechos de acceso, rectificación, **supresión, limitación, oposición y portabilidad**;
  - **derecho a reclamar ante una autoridad de control**.
  - La LOPDGDD, art. 11 (consolidada al 27/12/2025), permite darla en dos capas [DOC].
- **Menores:** solo desde los **14 años** pueden consentir por sí mismos (LOPDGDD, art. 7) [DOC].
- **Registro de actividades**, art. 30.5 [DOC]: la exención de menos de 250 personas no vale si el tratamiento **«no sea ocasional»**. Hay que llevarlo.
- **Transferencias a EE. UU.** Decisión de adecuación del Marco de Privacidad de Datos UE-EE. UU. (Decisión 2023/1795, del 10 jul 2023) [DOC, Comisión Europea]: cubre a las empresas **adheridas al Marco**. Para las demás valen las **cláusulas contractuales tipo** [DOC].
  - El Tribunal General desestimó el recurso Latombe (T-553/23) el **3 sep 2025**. Hay **recurso de casación pendiente (C-703/25 P)** [DOC-2ª].
  - Si Mercatren LLC se adhiere al Marco o firma cláusulas tipo con cada proveedor es decisión a tomar (a confirmar con el abogado). Ver en la lista oficial del Marco qué proveedores están adheridos.
- **Autoridad:** la AEPD (Agencia Española de Protección de Datos) atiende las reclamaciones de residentes en España.
- **Cookies**, LSSI art. 22.2 [DOC]: no piden consentimiento las estrictamente necesarias para un servicio «expresamente solicitado».
  - La guía de cookies de la AEPD (julio de 2023) trata como técnicas, sin consentimiento, las de personalización que **elige el usuario** (idioma, moneda) [DOC-2ª: la nota de la AEPD dio error 500; dato tomado de su resumen y de despachos].
  - **Las nuestras** (sesión, idioma y país `mercatren_pais`) entran ahí. Si se agrega analítica o publicidad, hace falta un banner con «rechazar» igual de visible.

---

## 5. Antes de encender la venta en España

| #   | Qué                                                                                                                           | Quién                                     | ¿Bloquea?                                    |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------- |
| 1   | Decidir registrar Mercatren LLC en el IVA español (cuenta nueva, costo del representante) 👤                                  | **Richard**                               | **Sí**                                       |
| 2   | Contratar el representante fiscal con domicilio en España (gestoría) 👤                                                       | **Richard** + contador                    | **Sí**                                       |
| 3   | Modelo 030 (si hace falta) y modelo 036: obtener el NIF de Mercatren LLC                                                      | Contador / representante                  | **Sí**                                       |
| 4   | Recalcular el margen de España con el IVA del margen y el costo de la tarjeta europea 👤                                      | Nosotros (cálculo) + **Richard** (decide) | **Sí**                                       |
| 5   | La orden de compra pide al comercio **factura completa** a nombre de Mercatren LLC con su NIF español                         | Nosotros (código) + comercio              | **Sí**                                       |
| 6   | Factura (o simplificada) de Mercatren LLC al comprador, con IVA 21 % en euros y la numeración española                        | Nosotros (código) + contador              | **Sí**                                       |
| 7   | Calendario del 303 trimestral y del 390 desde el alta                                                                         | Contador / representante                  | **Sí**                                       |
| 8   | Contratar el representante en la UE del RGPD (art. 27) 👤                                                                     | **Richard**                               | **Sí**                                       |
| 9   | Términos y privacidad de España (sección 6)                                                                                   | Nosotros (código) + revisión del abogado  | **Sí**                                       |
| 10  | Decidir qué domicilio y teléfono se publican (LSSI art. 10 y TRLGDCU art. 97 lo exigen) 👤                                    | **Richard** + abogado                     | **Sí**                                       |
| 11  | Condiciones para comercios españoles: aceptar desistimientos de 14 días y la garantía de 3 años, y reembolsar a Mercatren LLC | Nosotros (textos) + abogado               | **Sí**                                       |
| 12  | Ficha de España con datos del fabricante y advertencias (Reglamento 2023/988, art. 19)                                        | Nosotros (campos) + comercio              | **Sí**                                       |
| 13  | Botón «desistir del contrato aquí» en «Mis pedidos», con confirmación y acuse                                                 | Nosotros (código)                         | No hoy; sí cuando España la incorpore        |
| 14  | Texto del botón de pagar: «pedido con obligación de pago» o una fórmula equivalente inequívoca                                | Nosotros (código)                         | **Sí**                                       |
| 15  | Opinión sobre DAC7 (modelo 238)                                                                                               | Contador o abogado                        | No; antes de cerrar el primer año con ventas |
| 16  | Compra real en euros de punta a punta: cobro, saldo del comercio y retiro (`VERIFICAR-PAGOS.md`)                              | Nosotros + Richard (la compra final)      | **Sí** (regla de pagos)                      |
| 17  | Convenio, residencia de la LLC y bruto declarado en EE. UU.                                                                   | Contador EE. UU.                          | No                                           |

---

## 6. Lo que el sitio y la app ya hacen, y lo que hay que agregar

### Lo que ya hacen

- **Precios:** España dentro de mercatren.com, con precios en euros. El comercio escribe el precio **con su IVA dentro**.
- **Comercios:** se dan de alta con NIF (CIF, DNI o NIE); las direcciones llevan las 52 provincias y el código postal.
- **Cobro:** solo tarjeta. Saldo y retiro en euros a un IBAN de la zona euro. El cobro sigue cerrado.
- **Página «Vende en Mercatren España»:** dice que el comprador le paga a Mercatren LLC, que le compra al comercio y le revende.
- **Privacidad:** cookies mínimas (sesión, idioma, país), sin publicidad; la cuenta se borra desde la app o la web; se contesta a los 30 días.

### Lo que hoy está mal para España (los términos son los de EE. UU.)

- Dicen «en mercatren.com vendemos y entregamos únicamente dentro de Estados Unidos».
- Dicen «solo se aceptan pagos desde bancos de Estados Unidos».
- La ley aplicable es solo la de EE. UU.
- La política de devoluciones **no muestra ninguna sección para ES**: hoy solo hay secciones para US, VE, CL y CO.

### Lo que hay que agregar en los **términos** para España (solo cuando el país es ES)

1. **Quién vende** (LSSI art. 10.1.a, b y e; TRLGDCU art. 97.1.b-d):
   > «Vende Mercatren LLC, sociedad de responsabilidad limitada constituida en el estado de Michigan (Estados Unidos), inscrita en su registro de sociedades con el número 900260648, con domicilio en [domicilio que decida Richard], teléfono [número] y correo [correo de contacto]. NIF en España: [el que asigne la Agencia Tributaria]. Representante fiscal en España: [nombre y domicilio].»
2. **Cómo es la venta:**
   > «Mercatren LLC compra el producto al comercio español que lo publica y te lo vende a ti. El comercio lo envía a tu dirección en España.»
3. **Precio** (LSSI art. 10.1.f; TRLGDCU art. 97.1.e):
   > «Los precios están en euros e incluyen el IVA. Los gastos de envío, si los hay, se muestran antes de confirmar el pedido.»
4. **Cómo se compra** (LSSI art. 27; TRLGDCU art. 98.2):
   > «Eliges el producto, revisas tus datos y el total, y confirmas con el botón "Pedido con obligación de pago". Puedes corregir tus datos antes de confirmar. Guardamos el contrato y lo ves en "Mis pedidos". Puedes contratar en español o en inglés. Te confirmamos el pedido por correo.»
5. **Desistimiento** (TRLGDCU arts. 102 a 108 y anexo I):
   > «Tienes 14 días naturales para desistir sin dar motivos, contados desde que tú o la persona que indiques (no el transportista) recibe el producto. Avísanos con el botón "Desistir del contrato aquí" de "Mis pedidos", con el formulario de abajo o escribiendo a [correo]. Te devolvemos todo lo pagado, incluido el envío estándar, en un máximo de 14 días desde tu aviso y por el mismo medio de pago; podemos esperar a recibir el producto o la prueba de que lo enviaste. Tienes 14 días para devolverlo; el coste directo de la devolución corre a [tu cargo / nuestro cargo]. No se puede desistir de productos personalizados, perecederos ni precintados por higiene que se hayan abierto.»
   - Añadir debajo el **modelo de formulario** del anexo I, letra B, con el nombre, el domicilio y el correo de Mercatren LLC.
6. **Garantía** (TRLGDCU arts. 120 y 121):
   > «Respondemos de cualquier falta de conformidad que exista al entregarte el producto y se manifieste en los 3 años siguientes. Si aparece en los 2 primeros años, se presume que ya existía.»
   - Si se venden productos de segunda mano, indicar el plazo pactado, nunca menor de 1 año.
7. **Ley y tribunales** (Roma I, art. 6; Bruselas I bis, art. 18; TRLGDCU art. 90):
   > «Si eres consumidor con residencia en España, tienes la protección de la ley española que no se puede excluir por contrato, y puedes reclamar ante los tribunales de tu domicilio.»
8. **Reclamaciones** (TRLGDCU art. 97.1.h y u):
   > «Puedes reclamar en [correo o formulario]; contestamos en un máximo de [N] días.»
   - Decir si Mercatren está adherida o no a algún sistema de resolución alternativa de litigios.
   - **No** enlazar la antigua plataforma europea de litigios en línea.

### Lo que hay que agregar en la **privacidad** para España

1. **Responsable y representante** (RGPD arts. 13.1.a y 27):
   > «Responsable: Mercatren LLC (Michigan, Estados Unidos), [correo]. Representante en la Unión Europea: [nombre, dirección en España, correo].»
2. **Fines y bases** (art. 13.1.c y d):
   > «Usamos tus datos para cumplir el contrato de compra (art. 6.1.b), cumplir obligaciones legales, como las fiscales en España (art. 6.1.c), y prevenir el fraude en los pagos, por interés legítimo (art. 6.1.f).»
3. **Destinatarios** (art. 13.1.e):
   > «El comercio que envía tu pedido (nombre, dirección, teléfono y qué compraste); el procesador de pagos; los proveedores de alojamiento y correo; y la Agencia Tributaria cuando la ley lo exige.»
4. **Transferencias** (art. 13.1.f):
   > «Tus datos se tratan en los Estados Unidos. Los proveedores que los reciben allí están adheridos al Marco de Privacidad de Datos UE-EE. UU., reconocido por la Comisión Europea el 10 de julio de 2023, o firman las cláusulas contractuales tipo de la Comisión. Puedes pedirnos una copia de esas garantías.»
   - Comprobar cada proveedor antes de publicar.
5. **Derechos y reclamación** (art. 13.2.b y d):
   > «Puedes pedir acceso, rectificación, supresión, limitación, oposición y portabilidad. Si no te atendemos bien, puedes reclamar ante la Agencia Española de Protección de Datos.»
6. **Cookies** (LSSI art. 22.2):
   > «Usamos tres cookies técnicas: la de tu sesión, la de tu idioma y la del país que eliges con la bandera. No necesitan tu consentimiento porque las pides tú para usar el servicio. No usamos cookies de publicidad ni de analítica.»
7. **Menores** (LOPDGDD art. 7):
   > «Para crear una cuenta hay que tener al menos 14 años; para comprar, la edad que exija la ley para contratar.»

---

## 7. Fuentes (consultadas el 5 nov 2026)

| Fuente                                                             | Enlace                                                                                                                                                                                                                      |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ley 37/1992 del IVA, consolidada (07/10/2026)                      | https://www.boe.es/buscar/act.php?id=BOE-A-1992-28740                                                                                                                                                                       |
| Reglamento del IVA, consolidado (28/02/2026)                       | https://www.boe.es/buscar/act.php?id=BOE-A-1992-28925                                                                                                                                                                       |
| Reglamento de facturación, RD 1619/2012 (31/03/2026)               | https://www.boe.es/buscar/act.php?id=BOE-A-2012-14696                                                                                                                                                                       |
| RD 1007/2023, Verifactu (03/12/2025)                               | https://www.boe.es/buscar/act.php?id=BOE-A-2023-24840                                                                                                                                                                       |
| Ley General Tributaria, art. 47                                    | https://www.boe.es/buscar/act.php?id=BOE-A-2003-23186                                                                                                                                                                       |
| Agencia Tributaria: identificación de no establecidos (10/10/2025) | https://sede.agenciatributaria.gob.es/Sede/no-residentes/iva-empresarios-profesionales-no-establecidos/identificacion-empresarios-no-establecidos.html                                                                      |
| Agencia Tributaria: obligaciones del sujeto pasivo (29/09/2026)    | https://www3.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/manual-iva-2022/capitulo-10-obligac-formales-suj-registro/obligaciones-sujeto-pasivo.html                                      |
| Agencia Tributaria: obligados al modelo 238 (08/09/2026)           | https://sede.agenciatributaria.gob.es/Sede/todas-gestiones/impuestos-tasas/declaraciones-informativas/modelo-238-decl_____informacion-parte-operadores-plataformas/preguntas-frecuentes/obligados-presentar-modelo-238.html |
| Directiva 2021/514 (DAC7)                                          | https://eur-lex.europa.eu/eli/dir/2021/514/oj                                                                                                                                                                               |
| Directiva 2025/516 (ViDA)                                          | https://eur-lex.europa.eu/eli/dir/2025/516/oj                                                                                                                                                                               |
| Convenio España-EE. UU. (23/10/2019)                               | https://www.boe.es/buscar/act.php?id=BOE-A-1990-30940                                                                                                                                                                       |
| TRLGDCU, RDL 1/2007 (04/11/2026)                                   | https://www.boe.es/buscar/act.php?id=BOE-A-2007-20555                                                                                                                                                                       |
| LSSI, Ley 34/2002 (23/01/2025)                                     | https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758                                                                                                                                                                       |
| Ley 10/2025, atención a la clientela                               | https://www.boe.es/buscar/act.php?id=BOE-A-2025-26698                                                                                                                                                                       |
| Directiva 2023/2673 (función de desistimiento)                     | https://eur-lex.europa.eu/eli/dir/2023/2673/oj                                                                                                                                                                              |
| Reglamento 2024/3228 (fin de la plataforma de litigios en línea)   | https://eur-lex.europa.eu/eli/reg/2024/3228/oj                                                                                                                                                                              |
| Reglamento Roma I, 593/2008                                        | https://eur-lex.europa.eu/eli/reg/2008/593/oj                                                                                                                                                                               |
| Reglamento Bruselas I bis, 1215/2012                               | https://eur-lex.europa.eu/eli/reg/2012/1215/oj                                                                                                                                                                              |
| Reglamento 2023/988, seguridad de los productos                    | https://eur-lex.europa.eu/eli/reg/2023/988/oj                                                                                                                                                                               |
| RGPD, Reglamento 2016/679                                          | https://eur-lex.europa.eu/eli/reg/2016/679/oj                                                                                                                                                                               |
| LOPDGDD, LO 3/2018 (27/12/2025)                                    | https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673                                                                                                                                                                       |
| Comisión Europea: transferencias UE-EE. UU.                        | https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/eu-us-data-transfers_en                                                                                                  |
| OCU, función de desistimiento (19/06/2026), secundaria             | https://www.ocu.org/organizacion/prensa/notas-de-prensa/2026/normabotondesistimiento190626                                                                                                                                  |

Vistos solo como resultados de búsqueda [NV]:

- recurso Latombe C-703/25 P (Lewis Silkin, Diario Oficial C/2025/6610);
- guía de cookies de la AEPD de 2023 (su nota de prensa dio error 500);
- hojas de reclamaciones en Madrid, Murcia y Valencia;
- Orden HAC/72/2024 (modelos 040 y 238);
- la supuesta prórroga de Verifactu a 2028.
