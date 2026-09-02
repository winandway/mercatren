import type { Plaza } from "@/lib/cj/plazas";

import { desglosarChile } from "./precio-chile";
import { desglosarColombia } from "./precio-colombia";
import { desglosarUs } from "./precio-us";

/**
 * EL PRECIO PUBLICADO DE UN PRODUCTO DE CJ EN SU PLAZA, EN UN SOLO SITIO.
 *
 * Estados Unidos publica en dólares con su fórmula; Chile convierte a pesos
 * con la tasa del día, mete el IVA y NO publica lo que pasa del régimen de
 * USD 500; Colombia convierte sin IVA y sin tope. Esa decisión vivía copiada
 * en el importador y en el recálculo, y la importación masiva la necesitaba
 * una tercera vez. Tres copias de una fórmula de dinero se separan al primer
 * arreglo — aquí queda una, pura y con pruebas.
 *
 * Devuelve el MOTIVO cuando no hay precio: sin tasa, sobre el tope o sin
 * poder calcular. Un `null` mudo obligaría a adivinar cuál de los tres fue.
 */
export type PrecioDePlaza =
  | {
      ok: true;
      /** En la unidad menor de la moneda de la plaza (centavos o pesos). */
      publicadoCentavos: number;
      /** Lo que queda para Mercatren, solo en EE. UU. (decide la mayorista). */
      margenUsdCentavos: number | null;
    }
  | { ok: false; motivo: "sin-tasa" | "supera-tope" | "sin-precio" };

export function precioPublicadoDe(
  plaza: Plaza,
  costoUsdCentavos: number,
  envioUsdCentavos: number,
  tasaCentesimas: number | null,
): PrecioDePlaza {
  if (!(costoUsdCentavos > 0)) return { ok: false, motivo: "sin-precio" };

  if (plaza.mercado === "US") {
    const d = desglosarUs(costoUsdCentavos, envioUsdCentavos);
    return {
      ok: true,
      publicadoCentavos: d.publicadoCentavos,
      margenUsdCentavos: d.margenCentavos,
    };
  }

  if (tasaCentesimas === null) return { ok: false, motivo: "sin-tasa" };

  if (plaza.mercado === "CL") {
    const d = desglosarChile(
      costoUsdCentavos,
      envioUsdCentavos,
      tasaCentesimas,
    );
    if (!d) return { ok: false, motivo: "sin-precio" };
    if (d.superaTope) return { ok: false, motivo: "supera-tope" };
    return {
      ok: true,
      publicadoCentavos: d.publicadoClp,
      margenUsdCentavos: null,
    };
  }

  const d = desglosarColombia(
    costoUsdCentavos,
    envioUsdCentavos,
    tasaCentesimas,
  );
  if (!d) return { ok: false, motivo: "sin-precio" };
  return {
    ok: true,
    publicadoCentavos: d.publicadoCop,
    margenUsdCentavos: null,
  };
}
