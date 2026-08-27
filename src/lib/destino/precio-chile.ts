import {
  impuestoDelMercado,
  precioConImpuesto,
  desglosarDesdeBruto,
} from "@/lib/impuestos/chile";
import { mercadoPorCodigo } from "@/lib/mercado/mercados";

/**
 * EL PRECIO DE UN PRODUCTO DE CJ VENDIDO EN CHILE.
 *
 * ══ LA CADENA COMPLETA, EN ORDEN ══
 *
 * 1. Costo de CJ + flete CJ→Chile, en DÓLARES (así cobra CJ).
 * 2. Margen de Mercatren encima (30 %, igual que EE. UU.: aquí también compra,
 *    despacha y asume la devolución Mercatren, no un comercio).
 * 3. El procesador (2,9 % + $0.30) dentro del precio, como en EE. UU.
 * 4. ── el TOPE se mide AQUÍ, en dólares y ANTES del IVA ──
 * 5. Conversión a PESOS CHILENOS con la tasa del día.
 * 6. El 19 % de IVA ENCIMA, y el precio se publica CON el IVA dentro — como
 *    cualquier tienda chilena. Un precio al que le crece un 19 % en el último
 *    paso del checkout es la forma más cara de perder la venta.
 *
 * ══ POR QUÉ EL TOPE SE MIDE ANTES DEL IVA ══
 *
 * La Resolución Ex. SII N°93 define «bajo valor» por el precio del artículo
 * **incluyendo sus cargos** (envío, seguro, embalaje) — el IVA no es un cargo
 * del artículo: es el impuesto que este régimen manda a cobrar. Medirlo con el
 * IVA dentro descartaría productos de ~$430 que sí caben en el régimen.
 *
 * Un artículo que pasa de USD 500 **no se publica en Chile**: pagaría IVA más
 * arancel en la aduana, de sorpresa, y lo asume quien recibe. Un comprador al
 * que la aduana le cobra de nuevo no vuelve.
 *
 * ══ LA TASA ENTRA COMO PARÁMETRO, COMO EN LA CALCULADORA DEL IVA ══
 *
 * Pesos por dólar, en CENTÉSIMAS (96742 = $967.42 CLP por USD): entera, como
 * todo número de dinero del proyecto. Vive en `configuracion.dolar_clp_centesimas`
 * y la edita el equipo; este módulo es puro y se prueba sin base.
 */

/** El margen de Chile. El MISMO 30 % de EE. UU., y es deliberado: quien compra,
 * despacha y responde por la devolución es Mercatren en los dos. Cambiarlo es
 * decisión del dueño, con el número por escrito. */
export const COMISION_CL_PB = 3_000;

/** Bajo esto la tasa es un error de tecleo, no un tipo de cambio: el dólar no
 * ha valido menos de 100 pesos este siglo. Multiplicar por una tasa mal
 * escrita publica el catálogo entero a precio de regalo, en silencio. */
const TASA_MINIMA_CENTESIMAS = 10_000;

export type DesgloseChile = {
  /** Lo que se publica: PESOS enteros, IVA incluido. */
  publicadoClp: number;
  /** El IVA que va dentro del publicado (lo que se declara en el F129). */
  ivaClp: number;
  /** El precio sin IVA, en pesos. */
  netoClp: number;
  /** La base en dólares (costo + flete + margen + procesador), para el tope. */
  baseUsdCentavos: number;
  /** true = NO se puede publicar en Chile: pasa del régimen de USD 500. */
  superaTope: boolean;
};

export function desglosarChile(
  costoProductoUsdCentavos: number,
  costoEnvioUsdCentavos: number,
  tasaClpCentesimas: number,
): DesgloseChile | null {
  const regla = impuestoDelMercado(mercadoPorCodigo("CL"));
  if (!regla) return null;

  /* Una tasa rota no degrada a un precio de regalo: se niega a calcular. */
  if (
    !Number.isFinite(tasaClpCentesimas) ||
    tasaClpCentesimas < TASA_MINIMA_CENTESIMAS
  ) {
    return null;
  }

  const costo =
    Math.max(0, costoProductoUsdCentavos) + Math.max(0, costoEnvioUsdCentavos);
  if (costo === 0) return null;

  /* La misma fórmula de EE. UU.: margen y procesador dentro, con techo. */
  const PROCESADOR_PB = 290;
  const FIJO_CENTAVOS = 30;
  const baseUsd = Math.ceil(
    ((costo + FIJO_CENTAVOS) * 10_000) /
      (10_000 - COMISION_CL_PB - PROCESADOR_PB),
  );

  const superaTope = baseUsd > regla.topeUsdCentavos;

  /* Dólares (centavos) → pesos enteros, con techo: un peso de menos sale del
     margen en cada venta y no se ve en ninguna pantalla.

     La cuenta, escrita para poder comprobarla: (centavos/100) da dólares,
     (centésimas/100) da pesos por dólar — los dos /100 juntos son /10.000.
     $100 a 967,42 son 96.742 pesos: 10.000 × 96.742 / 10.000 = 96.742. ✓ */
  const netoClp = Math.ceil((baseUsd * tasaClpCentesimas) / 10_000);
  const publicadoClp = precioConImpuesto(netoClp, regla);
  const { impuesto } = desglosarDesdeBruto(publicadoClp, regla);

  return {
    publicadoClp,
    ivaClp: impuesto,
    netoClp: publicadoClp - impuesto,
    baseUsdCentavos: baseUsd,
    superaTope,
  };
}
