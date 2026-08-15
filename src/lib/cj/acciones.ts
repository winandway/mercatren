"use server";

import { exigirEquipoInterno } from "@/lib/autorizacion";
import { mensajes } from "@/lib/mensajes";
import { cjConfigurado, llamarCj, tokenDeCj } from "@/lib/cj/cliente";

/**
 * COMPROBAR QUE LA LLAVE DE CJ SIRVE.
 *
 * ══ POR QUÉ HACE FALTA UN BOTÓN ══
 *
 * La llave se pega en el panel de la plataforma, donde guardar **siempre**
 * funciona: la casilla acepta cualquier texto. Lo que falla es la primera
 * llamada de verdad — y sin este botón, esa primera llamada sería la
 * sincronización del catálogo, de madrugada, sin nadie mirando.
 *
 * ══ QUÉ COMPRUEBA, EN ESTE ORDEN ══
 *
 * 1. Que la variable exista.
 * 2. Que CJ acepte la llave y devuelva un token.
 * 3. Que con ese token se pueda **leer el catálogo de verdad**.
 *
 * El tercer paso importa: una llave puede autenticar y no tener permiso para
 * lo que necesitamos. Probar solo el paso 2 diría «todo bien» y el catálogo
 * seguiría vacío.
 */

export type ResultadoCj = {
  ok: boolean;
  mensaje: string;
  /** Lo que contestó CJ, para poder pegarlo si hay que preguntarles. */
  detalle?: string;
  /** Cuántos productos vio, como prueba de que la lectura funciona. */
  productos?: number;
};

/** Un par de productos, solo para demostrar que la lectura responde. */
type ListaCj = { list?: unknown[]; total?: number };

export async function probarCj(): Promise<ResultadoCj> {
  await exigirEquipoInterno();
  const t = await mensajes();

  if (!cjConfigurado()) {
    return {
      ok: false,
      mensaje: t("cj.sinLlave"),
    };
  }

  const token = await tokenDeCj();
  if (!token.ok) {
    return {
      ok: false,
      mensaje: t("cj.llaveRechazada"),
      detalle: token.motivo,
    };
  }

  /* La lectura de verdad. Se piden pocos a propósito: esto es una sonda, no
     una sincronización, y CJ limita las llamadas por minuto. */
  const lista = await llamarCj<ListaCj>("/product/list?pageNum=1&pageSize=5");

  if (!lista.ok) {
    return {
      ok: false,
      mensaje: t("cj.sinCatalogo"),
      detalle: lista.motivo,
    };
  }

  const cuantos = Array.isArray(lista.datos?.list)
    ? lista.datos.list.length
    : 0;

  return {
    ok: true,
    mensaje: t("cj.conectado"),
    productos: cuantos,
  };
}
