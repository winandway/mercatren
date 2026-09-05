import "server-only";

import { llamarCjConRitmo } from "@/lib/cj/ritmo";

/**
 * PROBAR UNA COMPRA A CJ SIN PASAR POR LA TARJETA (5 sep 2026).
 *
 * ══ POR QUÉ EXISTE ══
 *
 * Tres compras de prueba, tres fallos, y cada una costó un cobro real en
 * Stripe para descubrir que el circuito moría DESPUÉS del pago, del lado del
 * proveedor. Palabras del dueño: «yo no puedo estar probando en Stripe cada
 * rato… crea un campo donde meto un link y un botón, y ahí vemos qué está
 * pasando».
 *
 * Tenía razón: el cobro con tarjeta YA está probado (MT-000004 y MT-000011,
 * cobros reales). Lo que falla y hay que poder repetir cien veces es el tramo
 * de CJ — variantes, almacén, transporte, crear y pagar.
 *
 * ══ LO QUE LO HACE ÚTIL: SE ENSEÑA LA RESPUESTA CRUDA ══
 *
 * El fallo de las tres compras estuvo siempre delante y no se veía porque el
 * código **lee dos campos de la respuesta de CJ y tira el resto**: de una
 * cotización de flete solo `logisticName` y `logisticPrice`, de una variante
 * solo el `vid` y el precio. CJ dijo «el transporte elegido está asignado a
 * un almacén con inventario insuficiente» y no teníamos dónde mirar de qué
 * almacén hablaba.
 *
 * Aquí cada paso devuelve **lo que CJ contestó, entero**. Sin eso, esto sería
 * otra pantalla que dice «no se pudo».
 *
 * ══ NO COBRA NADA, Y ESO NO LO CONVIERTE EN UNA MENTIRA ══
 *
 * Este módulo NO reemplaza la prueba del circuito de pagos: no toca Stripe ni
 * crea una venta. Prueba el tramo del proveedor, que es otro problema. Decir
 * «el circuito funciona» porque esto salga verde sería exactamente el error
 * que la regla de la casa prohíbe.
 */

export type { Diagnostico, PasoDiagnostico } from "@/lib/cj/diagnostico-puro";
import type { PasoDiagnostico } from "@/lib/cj/diagnostico-puro";

export { almacenesNombrados, slugDeLaUrl } from "@/lib/cj/diagnostico-puro";
import { almacenesNombrados } from "@/lib/cj/diagnostico-puro";

/** Le pregunta a CJ las variantes de un producto, con TODO lo que conteste. */
export async function pasoVariantes(
  pid: string,
  almacen: string,
): Promise<PasoDiagnostico> {
  const r = await llamarCjConRitmo<unknown>(
    `/product/variant/query?pid=${encodeURIComponent(pid)}&countryCode=${almacen}`,
  );
  if (!r.ok) {
    return {
      numero: 2,
      titulo: `Las variantes en el almacén ${almacen}`,
      estado: "fallo",
      resumen: r.motivo,
    };
  }
  const lista = Array.isArray(r.datos) ? r.datos : [];
  const almacenes = almacenesNombrados(r.datos);
  return {
    numero: 2,
    titulo: `Las variantes en el almacén ${almacen}`,
    estado: lista.length > 0 ? "ok" : "fallo",
    resumen:
      lista.length > 0
        ? `${lista.length} variante(s) con existencia allá.${
            almacenes.length
              ? ` Almacenes nombrados: ${almacenes.join(", ")}`
              : ""
          }`
        : `CJ contestó bien pero NINGUNA variante tiene existencia en ${almacen}. Sin eso el pedido se crea y CJ no deja pagarlo.`,
    crudo: r.datos,
  };
}

/**
 * Cotiza el flete y devuelve TODAS las opciones con TODOS sus campos.
 *
 * Aquí está el fallo que costó tres compras: el código de la compra ordena
 * por precio y se queda con la más barata **sin mirar de qué almacén sale**.
 * CJ después rechaza el pago con «the selected logistics is assigned to a
 * warehouse with insufficient inventory». Enseñar la respuesta entera es lo
 * que permite ver qué campo lo decía.
 */
export async function pasoFlete(
  vid: string,
  cantidad: number,
  ruta: { desde: string; hasta: string; zip?: string; provincia?: string },
): Promise<PasoDiagnostico> {
  const r = await llamarCjConRitmo<unknown>("/logistic/freightCalculate", {
    metodo: "POST",
    cuerpo: {
      startCountryCode: ruta.desde,
      endCountryCode: ruta.hasta,
      products: [{ quantity: cantidad, vid }],
      zip: ruta.zip,
      province: ruta.provincia,
    },
  });
  if (!r.ok) {
    return {
      numero: 3,
      titulo: `El envío de ${ruta.desde} a ${ruta.hasta}`,
      estado: "fallo",
      resumen: r.motivo,
    };
  }
  const opciones = Array.isArray(r.datos) ? r.datos : [];
  const almacenes = almacenesNombrados(r.datos);
  return {
    numero: 3,
    titulo: `El envío de ${ruta.desde} a ${ruta.hasta}`,
    estado: opciones.length > 0 ? "ok" : "fallo",
    resumen:
      opciones.length > 0
        ? `${opciones.length} transporte(s) disponibles.${
            almacenes.length
              ? ` De estos almacenes: ${almacenes.join(", ")}`
              : " CJ no nombró ningún almacén en la respuesta."
          }`
        : "CJ no devolvió ningún transporte para esta ruta.",
    crudo: r.datos,
  };
}
