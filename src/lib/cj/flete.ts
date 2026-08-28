import "server-only";

import { envioAUsar, type EnvioDelProducto } from "@/lib/destino/envio-us";

import { llamarCj } from "./cliente";
import { elegirVariante, variantesDeCj } from "./variantes";

/**
 * CUÁNTO COBRA CJ POR MANDAR ESTE PRODUCTO DENTRO DE ESTADOS UNIDOS.
 *
 * Se pregunta UNA vez, al agregar el producto al catálogo, y se guarda. No se
 * pregunta al pintar la pantalla: el buscador de CJ enseña decenas de
 * productos por página y serían decenas de llamadas por minuto para una
 * pantalla que solo sirve para mirar.
 *
 * ══ POR QUÉ DOS LLAMADAS Y NO UNA ══
 *
 * CJ cotiza el flete contra una VARIANTE (`vid`), no contra el producto. Así
 * que primero hay que preguntar las variantes y después cotizar. Es la misma
 * pareja de llamadas que ya se hace al comprar, y por el mismo motivo:
 * `productSku` y `variantSku` son dos cosas distintas, y confundirlas ya mató
 * una compra pagada (MT-000004, 18 ago 2026).
 *
 * ══ SI ALGO FALLA, SE DEVUELVE UN ESTIMADO, NUNCA CERO ══
 *
 * La decisión de qué hacer con una cotización que no llegó vive en
 * `envio-us.ts`, que es puro y está probado. Aquí solo se pregunta.
 */

import { plazaDelMercado, type Plaza } from "@/lib/cj/plazas";
import { mercadoPorCodigo } from "@/lib/mercado/mercados";

/**
 * ══ EL FLETE SE COTIZA AL PAÍS DE LA PLAZA (27 ago 2026) ══
 *
 * Iba «US» escrito a mano en el destino de la cotización. Para mercatren.cl
 * eso metía en el precio un flete doméstico de EE. UU. cuando el paquete
 * viaja a Chile — varias veces más caro. El destino sale de la plaza, y el
 * RESPALDO también: $3.50 para un envío internacional regalaría el margen en
 * cada venta, por eso cada plaza trae el suyo (nunca cero).
 */
export async function fleteDeProducto(
  pid: string,
  plaza: Plaza = plazaDelMercado(mercadoPorCodigo("US")),
): Promise<EnvioDelProducto> {
  const variantes = await pedirVariantes(pid, plaza.almacen);
  if (!variantes) return respaldoDe(plaza);

  /* La MÁS BARATA, que es exactamente la que se le cobra al comprador: al
     importar, un precio en rango se publica por el mínimo. Cotizar otra sería
     meter en el precio un envío que no corresponde al producto vendido. */
  const elegida = elegirVariante(variantes);
  if (!elegida?.vid) return respaldoDe(plaza);

  const cotizacion = await cotizar(elegida.vid, plaza);
  /* En EE. UU. el respaldo histórico vive en `envio-us.ts`; en las demás
     plazas, el de la plaza. La regla es la misma: cotizado si llegó, estimado
     conservador si no, cero jamás. */
  if (plaza.mercado === "US") return envioAUsar(cotizacion);
  return cotizacion.costoCentavos && cotizacion.costoCentavos > 0
    ? {
        costoCentavos: cotizacion.costoCentavos,
        origen: "cotizado",
        transporte: cotizacion.transporte ?? null,
      }
    : {
        costoCentavos: plaza.envioEstimadoUsdCentavos,
        origen: "estimado",
        transporte: null,
      };
}

function respaldoDe(plaza: Plaza): EnvioDelProducto {
  if (plaza.mercado === "US") return envioAUsar({});
  return {
    costoCentavos: plaza.envioEstimadoUsdCentavos,
    origen: "estimado",
    transporte: null,
  };
}

async function pedirVariantes(pid: string, almacen: "US" | "CN" = "US") {
  /* Las existencias se miran en el almacén del que va a salir la caja: la
     variante puede estar surtida en China y agotada en EE. UU., o al revés. */
  const parametros = new URLSearchParams({ pid }).toString();
  const respuesta = await llamarCj<unknown>(
    `/product/variant/query?${parametros}&countryCode=${almacen}`,
  ).catch(() => ({ ok: false as const, motivo: "no contestó" }));

  if (!respuesta.ok) {
    console.error("[cj] no se pudieron pedir las variantes:", respuesta.motivo);
    return null;
  }
  const variantes = variantesDeCj(respuesta.datos);
  return variantes.length > 0 ? variantes : null;
}

async function cotizar(vid: string, plaza: Plaza) {
  const respuesta = await llamarCj<unknown>("/logistic/freightCalculate", {
    metodo: "POST",
    cuerpo: {
      /* DESDE el almacén de la plaza HASTA su país: Chile y Colombia se
         surten de China (decisión del dueño, 27 ago 2026); EE. UU. de su
         almacén local. */
      startCountryCode: plaza.almacen,
      endCountryCode: plaza.paisEntrega,
      products: [{ quantity: 1, vid }],
      zip: plaza.cotizacion.zip,
      province: plaza.cotizacion.provincia,
    },
  }).catch(() => ({ ok: false as const, motivo: "no contestó" }));

  if (!respuesta.ok) {
    console.error("[cj] no se pudo cotizar el flete:", respuesta.motivo);
    return {};
  }

  const opciones = (
    Array.isArray(respuesta.datos) ? respuesta.datos : []
  ) as Array<{ logisticName?: string; logisticPrice?: number | string }>;

  let mejor: { nombre: string; centavos: number } | null = null;
  for (const o of opciones) {
    const nombre = o.logisticName?.trim();
    const precio = Number(o.logisticPrice);
    if (!nombre || !Number.isFinite(precio) || precio <= 0) continue;
    const centavos = Math.round(precio * 100);
    if (!mejor || centavos < mejor.centavos) mejor = { nombre, centavos };
  }

  if (!mejor) return {};
  return { costoCentavos: mejor.centavos, transporte: mejor.nombre };
}
