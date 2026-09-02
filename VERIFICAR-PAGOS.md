# VERIFICAR-PAGOS.md — el estado REAL del circuito de cobros

> Existe por la regla global del 31 ago 2026, dictada tras dos clientes
> reales sin poder comprar: **prohibido decir «listo» un circuito de pagos
> sin probarlo de punta a punta.** Este archivo dice qué está PROBADO (con
> fecha y con qué compra), qué está construido sin probar, y cómo se prueba.
> **Se actualiza en el mismo trabajo que toque cualquier pieza de cobro.**

## El estado, método por método

| Mercado          | Método                 | Estado                        | Evidencia                                                                                                                                                                                                                                                                          |
| ---------------- | ---------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US (USD)         | Tarjeta                | ✅ PROBADO                    | MT-000011 (31 ago): cobro real de $7.95, $7.42 entrantes en Stripe. Antes MT-000004 (18 ago) de punta a punta hasta CJ.                                                                                                                                                            |
| US (USD)         | Zelle ≥$200            | ✅ PROBADO                    | Circuito de captura + validación en uso real desde ago 2026 (cobros por enlace del piloto).                                                                                                                                                                                        |
| VE               | Zelle (pedidos)        | ✅ PROBADO                    | Histórico vivo del comercio piloto; cola de validación en uso diario.                                                                                                                                                                                                              |
| Enlaces de cobro | Tarjeta / Zelle / ACH  | ✅ PROBADO                    | Facturas reales de $2.860,71 y $7.475 (26 ago). ACH depende de variables del panel — ver canario.                                                                                                                                                                                  |
| CL (CLP)         | Tarjeta                | ⚠️ SIN PROBAR                 | Construido (CLP cero-decimales verificado contra la doc de Stripe). **Falta una compra real en pesos chilenos.** No anunciar Chile hasta hacerla.                                                                                                                                  |
| CO (COP)         | Tarjeta                | ⚠️ SIN PROBAR TRAS EL ARREGLO | MT-000010 (Pedro Zambrano) FALLÓ por los 2 decimales de COP en Stripe; el arreglo (aduana `monedas.ts`) está desplegado con pruebas, pero **no hay una compra real posterior que lo confirme.**                                                                                    |
| US               | Compra automática a CJ | ⚠️ A MEDIAS                   | El pedido se crea y el saldo paga solo (27 ago), pero MT-000011 dio «Order create fail» en el intento automático — la variante la eligió la máquina. Con las tallas guardadas al importar (30 ago) el comprador ya elige; queda pendiente **una venta completa sin intervención**. |

## Cómo se prueba un circuito (el rito completo)

1. Compra del equipo con tarjeta real en el dominio del mercado (`mercatren.cl`
   se prueba EN mercatren.cl — el dominio decide la moneda).
2. Mirar en pantalla, en este orden: la página del pedido dice pagado → la
   **bitácora del pedido** (ficha en el panel) tiene `pago_confirmado` y
   `acreditado` → Stripe muestra el cobro con el monto EXACTO en la moneda
   correcta → si es de proveedor: Panel → Pedidos al proveedor con el pedido
   creado y pagado, y el saldo de CJ descontado.
3. Devolver el cobro de prueba desde el panel (tres puntos → devolver).
4. Anotar aquí la fecha y el número de pedido.

## El canario (`https://mercatren.com/datos/salud`)

| Campo         | Qué vigila                                                                                                 | Valores                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `base`        | La base de datos contesta                                                                                  | `ok` / `error` (503)                                                  |
| `metodos`     | Variables de Zelle/ACH/wire completas                                                                      | `true`/`false` por método                                             |
| `proveedor`   | La llave de CJ está viva (caduca)                                                                          | `ok` / `sin_llave` / `error`                                          |
| `avisoStripe` | El webhook de Stripe apunta a `/datos/stripe`, activo y oyendo los eventos de pago, con el secreto cargado | `ok` / `sin_llave` / `falta` / `sin_evento` / `sin_secreto` / `error` |

Cualquier valor que no sea `ok`/`true` significa que **una parte del dinero
está ciega**: se trata como emergencia, no como pendiente.

## Fallos ya cobrados por clientes (que no se repiten)

- **30 ago** — `const` sombreado en `crearIntentoDePago`: TODA tarjeta fallaba.
  Candado en `tests/unit/stripe-monedas.test.ts`.
- **30 ago** — COP viaja con 2 decimales en Stripe (CLP con cero): la
  MT-000010 llegó como $654,23 COP y murió bajo el mínimo. Aduana
  `montoParaStripe`/`montoDesdeStripe` en los 5 cruces; candado en el mismo test.
- **31 ago** — el resultado de `comprarAlProveedor` se tiraba: venta cobrada y
  cero pedidos en CJ sin motivo visible. Ahora queda en la bitácora, y el
  panel ofrece elegir la talla y reintentar.
- **31 ago** — una variante guardada con precio 0 se publicaba y se cobraba
  en $0.00 (el router de Inversiones Multiservicios, con un cliente
  esperando). Ahora hereda el precio del producto en la ficha Y en
  `crearPedido`; candado en `tests/unit/variante-hereda-precio.test.ts`.
- **31 ago** — auditoría de la calculadora (venta Starlink por Zelle): la
  venta cuadró al centavo con la base guardada ($423 → Zelle $436.09 →
  neto $423.01), pero destapó que en las ventas con tarjeta la comisión
  guardada era solo el 3% y **el fee de Stripe se le regalaba al comercio**
  (margen nuestro ≈ $0.15/venta). Ahora la comisión del renglón es
  `subtotal − base`: el comercio recibe SU precio exacto por cualquier
  método, y el margen + procesador quedan de nuestro lado — como dice el
  modelo. El formulario del producto enseña las tres cifras en vivo.
  Candado: `tests/unit/comision-del-renglon.test.ts`.
- **1 sep** — la compra a CJ se quedaba en «No se pudo crear» con CJ
  contestando «Order exist, please do not duplicate create»: el pedido
  existía allá y aquí solo se sabía volver a crearlo. Ahora se pregunta por
  nuestro número ANTES de crear y se ADOPTA lo que CJ ya tiene; «ya existe»
  es la señal de adoptar, no un error; y **`payBalanceV2` recibe el
  `shipmentOrderId`** (se le mandaba el `orderId` dentro de ese campo — por
  eso el saldo nunca bajó). Lo que CJ ya marca pagado no se paga otra vez.
  Candados: `tests/unit/cj-reconciliar.test.ts`, `cj-pago-saldo.test.ts`.
- **1 sep (tarde)** — la MT-000011 adoptada quedó en CJ en «Preparación de
  pedidos» (CREATED): **hay que CONFIRMAR el pedido (`confirmOrder`) para
  que pase a UNPAID antes de cobrarlo del saldo**. Ni el pedido recién
  creado ni el adoptado se confirmaban, y por eso `payBalanceV2` rebotaba
  siempre. Ahora `confirmarYPagarEnCj` confirma → relee → paga, en el
  circuito automático y en el botón «Pagar con el saldo de CJ» del panel.
- **1 sep (noche)** — CJ se negó a confirmar la MT-000011 por INVENTARIO:
  la talla tiene existencia en EE. UU. pero no en el almacén (Elk Grove
  Village, IL) al que está atado el transporte más barato. Ahora, ante ese
  fallo, se le pregunta a CJ qué transportes tienen stock para ESE pedido
  (`getOrderLogisticsInfo` → `hasStock`), se cambia al más barato con stock
  (`updateLogistics`) y se reintenta la confirmación una vez. Y «Descartar»
  borra el pedido en CJ (`deleteOrder`) antes de marcarlo aquí: si no, volver
  a pedir adoptaba el mismo pedido atascado. Candado: `cj-inventario.test.ts`.
- **2 sep — EL RIESGO DE VENDER POR DEBAJO DEL COSTO.** La MT-000011 se
  publicó a $7.95 con envío cotizado de $1.70 (GOFO+, repartidor regional
  sin capacidad); CJ la cobró con USPS a $6.70 → costo $11.73. Y la talla
  ya no tenía stock en ningún almacén de EE. UU. aunque aquí decía «15».
  Cuatro candados: (1) el precio se cotiza con transportes NACIONALES
  (`riesgo.ts` · `elegirCotizacion`); (2) el checkout le pregunta a CJ si
  hay stock ANTES de cobrar (`existencias.ts` · `hayExistenciaEnCj`); (3)
  la compra al proveedor NO se paga sola si pierde dinero — queda por pagar
  con la cifra en rojo (`pierdeDinero`, margen mínimo $2); (4) el reloj
  refresca el stock de CJ por tandas de 25 cada 15 min. Los productos ya
  publicados con envío regional se recalculan desde Panel → Configuración →
  Precios de Estados Unidos. Candado: `tests/unit/cj-riesgo.test.ts`.
- **2 sep (tarde)** — los cuatro candados valen para las TRES plazas: el
  recálculo de precios obedece al selector del panel (Estados Unidos con su
  fórmula; Chile y Colombia desde China con la suya y la tasa del día), el
  stock se pregunta en el almacén de cada plaza (EE. UU. o China) y el
  candado de margen convierte los pesos a dólares antes de juzgar. **Rito
  para CL/CO:** selector del panel en ese país → Configuración → «Precios y
  envíos de …» → Recalcular → compra de prueba EN ESE DOMINIO con tarjeta →
  Pedidos al proveedor «Pagado» y saldo de CJ descontado.
- **2 sep (noche) — ZELLE CERRADO POR DEFECTO.** Decisión del dueño tras la
  captura falsa, el correo mal escrito y el pago que «dura siete días en el
  aire»: solo tarjeta para todos, en los enlaces de cobro y en los pedidos.
  Interruptor general en Configuración → «Zelle en los enlaces de cobro»
  (llave `zelle_politica`, `cerrado` si no existe) y el interruptor de cada
  tienda como excepción para una persona de confianza. Candado en los tres
  sitios: enlace (`consultas.ts`), pantalla del checkout y `crearPedido`.
  Prueba: `zelle-cerrado-por-defecto.test.ts`.
- **2 sep (noche) — CERRAR EL SALDO PAGADO POR FUERA.** Panel → Comercios →
  «Cerrar saldo (pagado por fuera)»: paga los retiros pedidos y registra lo
  que quede como retiro `externo` con la referencia del pago real. No borra
  nada. Solo soporte de verdad. Es el patrón del cierre de Bley del 10 ago.
- **2 sep (noche) — TRAER EL ALMACÉN COMPLETO DE CJ.** No toca el cobro,
  pero sí lo que se cobra: cien mil fichas publicadas con envío ESTIMADO
  (percentil 70 de las cotizaciones reales por departamento, nunca cero) y
  afinadas por detrás con el flete real. Los candados del 2 sep siguen
  delante de cada venta: stock preguntado a CJ antes de cobrar y compra al
  proveedor que no se paga sola si pierde. Un estimado nunca pisa una
  cotización real. Pruebas: `cj-masivo.test.ts`, `cj-importacion-masiva.test.ts`,
  `precio-plaza.test.ts`. **Sin probar contra CJ desde esta máquina** (no hay
  llave local): la primera corrida real la mira el dueño en el panel.
