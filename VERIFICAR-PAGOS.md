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
