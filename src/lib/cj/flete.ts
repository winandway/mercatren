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

/** El código postal de referencia: el domicilio de Mercatren LLC en Michigan. */
const ZIP_REFERENCIA = "48377";
const ESTADO_REFERENCIA = "MI";

export async function fleteDeProducto(pid: string): Promise<EnvioDelProducto> {
  const variantes = await pedirVariantes(pid);
  if (!variantes) return envioAUsar({});

  /* La MÁS BARATA, que es exactamente la que se le cobra al comprador: al
     importar, un precio en rango se publica por el mínimo. Cotizar otra sería
     meter en el precio un envío que no corresponde al producto vendido. */
  const elegida = elegirVariante(variantes);
  if (!elegida?.vid) return envioAUsar({});

  return envioAUsar(await cotizar(elegida.vid));
}

async function pedirVariantes(pid: string) {
  const parametros = new URLSearchParams({ pid }).toString();
  const respuesta = await llamarCj<unknown>(
    `/product/variant/query?${parametros}&countryCode=US`,
  ).catch(() => ({ ok: false as const, motivo: "no contestó" }));

  if (!respuesta.ok) {
    console.error("[cj] no se pudieron pedir las variantes:", respuesta.motivo);
    return null;
  }
  const variantes = variantesDeCj(respuesta.datos);
  return variantes.length > 0 ? variantes : null;
}

async function cotizar(vid: string) {
  const respuesta = await llamarCj<unknown>("/logistic/freightCalculate", {
    metodo: "POST",
    cuerpo: {
      startCountryCode: "US",
      endCountryCode: "US",
      products: [{ quantity: 1, vid }],
      zip: ZIP_REFERENCIA,
      province: ESTADO_REFERENCIA,
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
