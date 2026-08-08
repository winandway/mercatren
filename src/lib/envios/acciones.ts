"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { obtenerAlcance } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { enviosTienda } from "@/lib/db/schema";
import { MODOS_ENVIO, porcentajeAPuntosBase } from "@/lib/envios/politica";
import { avisoDeCampo } from "@/lib/mensajes";
import { CAMPOS, opcional } from "@/lib/validacion/campos";

/**
 * EL COMERCIO GUARDA CÓMO DESPACHA.
 *
 * ══ QUÉ TIENDA SE TOCA ══
 *
 * La del ALCANCE de la sesión, nunca una que venga del formulario. Un vendedor
 * solo puede configurar la suya; el equipo puede abrir la de otro con
 * `?comercio=slug`, igual que en el resto del panel.
 *
 * ══ EL PORCENTAJE SE ACOTA AQUÍ TAMBIÉN ══
 *
 * El formulario ya lo limita, pero el formulario se lo salta cualquiera. El
 * tope de verdad está en `porcentajeAPuntosBase`, que corre en el servidor
 * antes de tocar la base.
 */

const ESQUEMA = z.object({
  modo: z.enum(MODOS_ENVIO),
  porcentaje: z.string().optional(),
  coberturaEs: opcional(CAMPOS.textoCorto),
  coberturaEn: opcional(CAMPOS.textoCorto),
  plazoEs: opcional(CAMPOS.textoCorto),
  plazoEn: opcional(CAMPOS.textoCorto),
});

export type ResultadoEnvio = { ok: true } | { ok: false; mensaje: string };

export async function guardarPoliticaDeEnvio(
  _previo: unknown,
  datos: FormData,
): Promise<ResultadoEnvio> {
  const alcance = await obtenerAlcance().catch(() => null);
  if (!alcance) return { ok: false, mensaje: "Entra para hacer esto." };

  const tiendaId =
    alcance.tipo === "tienda"
      ? alcance.tiendaId
      : String(datos.get("tiendaId") ?? "");

  if (!tiendaId) {
    return { ok: false, mensaje: "No sabemos de qué comercio es esto." };
  }

  const analisis = ESQUEMA.safeParse({
    modo: String(datos.get("modo") ?? "sin_definir"),
    porcentaje: String(datos.get("porcentaje") ?? ""),
    coberturaEs: String(datos.get("coberturaEs") ?? ""),
    coberturaEn: String(datos.get("coberturaEn") ?? ""),
    plazoEs: String(datos.get("plazoEs") ?? ""),
    plazoEn: String(datos.get("plazoEn") ?? ""),
  });

  if (!analisis.success) {
    const primero = analisis.error.issues[0];
    return { ok: false, mensaje: await avisoDeCampo(primero?.message) };
  }

  const d = analisis.data;

  /* El porcentaje solo tiene sentido en un modo. Guardarlo en los otros
     dejaría un número escondido que reaparece si algún día cambia de modo. */
  const puntosBase =
    d.modo === "porcentaje" ? porcentajeAPuntosBase(d.porcentaje ?? "") : 0;

  if (d.modo === "porcentaje" && puntosBase === 0) {
    return {
      ok: false,
      mensaje:
        "Escribe cuánto cobras por enviar, o elige que el envío ya está incluido en tu precio.",
    };
  }

  const valores = {
    modo: d.modo,
    porcentajePuntosBase: puntosBase,
    coberturaEs: d.coberturaEs || null,
    coberturaEn: d.coberturaEn || null,
    plazoEs: d.plazoEs || null,
    plazoEn: d.plazoEn || null,
    actualizadoEn: new Date(),
  };

  await getDb()
    .insert(enviosTienda)
    .values({ tiendaId, ...valores })
    .onConflictDoUpdate({ target: enviosTienda.tiendaId, set: valores });

  revalidatePath("/[locale]/panel/mi-tienda", "page");
  revalidatePath("/[locale]/tienda/[slug]", "page");

  return { ok: true };
}

/**
 * QUÉ OPCIONES DE ENTREGA TIENE ESTE CARRITO, y cuánto costaría el envío.
 *
 * La llama el checkout para saber si dibuja la elección. Se calcula EN EL
 * SERVIDOR con los precios y las políticas de la base, igual que el pedido:
 * el número que se enseña tiene que ser el mismo que se va a cobrar.
 *
 * Es solo de lectura y no exige sesión: no revela nada que no esté ya en la
 * ficha pública de cada comercio.
 */
export async function opcionesDeEntrega(
  lineas: { productoId: string; cantidad: number }[],
): Promise<{ despachan: boolean; costoCentavos: number }> {
  const vacio = { despachan: false, costoCentavos: 0 };
  if (lineas.length === 0) return vacio;

  const { inArray } = await import("drizzle-orm");
  const { productos } = await import("@/lib/db/schema");
  const { politicasDeEnvio } = await import("@/lib/envios/consultas");
  const { costoEnvioCentavos, despacha } =
    await import("@/lib/envios/politica");

  const ids = [...new Set(lineas.map((l) => l.productoId))].slice(0, 100);
  if (ids.length === 0) return vacio;

  const encontrados = await getDb()
    .select({
      id: productos.id,
      tiendaId: productos.tiendaId,
      precioCentavos: productos.precioCentavos,
    })
    .from(productos)
    .where(inArray(productos.id, ids));

  const subtotalPorTienda = new Map<string, number>();
  for (const linea of lineas) {
    const p = encontrados.find((x) => x.id === linea.productoId);
    if (!p) continue;
    const cantidad = Math.max(1, Math.floor(linea.cantidad));
    subtotalPorTienda.set(
      p.tiendaId,
      (subtotalPorTienda.get(p.tiendaId) ?? 0) + p.precioCentavos * cantidad,
    );
  }

  if (subtotalPorTienda.size === 0) return vacio;

  const politicas = await politicasDeEnvio([...subtotalPorTienda.keys()]);

  let costoCentavos = 0;
  let despachan = false;

  for (const [tiendaId, sub] of subtotalPorTienda) {
    const politica = politicas.get(tiendaId);
    if (!politica) continue;
    if (despacha(politica)) despachan = true;
    costoCentavos += costoEnvioCentavos(politica, sub);
  }

  return { despachan, costoCentavos };
}
