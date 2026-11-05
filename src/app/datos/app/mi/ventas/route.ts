import { eq } from "drizzle-orm";

import { contextoDe, respuestaDeError } from "@/lib/app-movil/datos";
import { obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { tiendas } from "@/lib/db/schema";
import { listarPedidosDelPanel } from "@/lib/pedidos/consultas";

export const dynamic = "force-dynamic";

/**
 * «MIS VENTAS» EN LA APP (5 nov 2026): la MISMA lista de «Órdenes» del panel
 * (`listarPedidosDelPanel`), acotada a la tienda de quien pregunta. Los
 * importes son los de SUS renglones, no el total del pedido (un pedido puede
 * mezclar tiendas). Privado y sin caché; solo lo que la pantalla enseña.
 */
export async function GET(peticion: Request) {
  const url = new URL(peticion.url);
  const contexto = contextoDe(url);
  if (!contexto.ok) return respuestaDeError("pais_o_idioma", 400);
  const usuario = await obtenerUsuario().catch(() => null);
  if (!usuario) return respuestaDeError("sin_sesion", 401);

  const [tienda] = await getDb()
    .select({ slug: tiendas.slug })
    .from(tiendas)
    .where(eq(tiendas.propietarioId, usuario.id))
    .limit(1);
  if (!tienda) return respuestaDeError("sin_tienda", 403);

  const pagina = Math.min(
    200,
    Math.max(1, Number(url.searchParams.get("pagina")) || 1),
  );
  const r = await listarPedidosDelPanel({ comercio: tienda.slug, pagina });
  /* Sin `soloDeEsteComercio` no se enseña nada: serían importes ajenos. */
  if (!r.soloDeEsteComercio) return respuestaDeError("sin_tienda", 403);

  return Response.json(
    {
      ok: true,
      ventas: r.pedidos.map((p) => ({
        numero: p.numero,
        estado: p.estado,
        creadoEn:
          p.creadoEn instanceof Date
            ? p.creadoEn.getTime()
            : Number(p.creadoEn) * 1000,
        cliente: p.clienteNombre,
        monto: { centavos: p.montoCentavos, moneda: p.moneda ?? "USD" },
        articulos: p.articulos,
      })),
      pagina: r.pagina,
      paginas: r.paginas,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
