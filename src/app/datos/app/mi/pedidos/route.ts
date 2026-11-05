import { contextoDe, respuestaDeError } from "@/lib/app-movil/datos";
import { obtenerUsuario } from "@/lib/autorizacion";
import { listarPedidosPropios } from "@/lib/pedidos/acciones";
import { situacionDesistimiento } from "@/lib/pedidos/desistimiento-consultas";

export const dynamic = "force-dynamic";

/**
 * «MIS PEDIDOS» EN LA APP: la MISMA lista de la web (`listarPedidosPropios`),
 * solo con lo que la pantalla enseña. Privado y sin caché.
 */
export async function GET(peticion: Request) {
  const contexto = contextoDe(new URL(peticion.url));
  if (!contexto.ok) return respuestaDeError("pais_o_idioma", 400);
  if (!(await obtenerUsuario().catch(() => null))) {
    return respuestaDeError("sin_sesion", 401);
  }
  const filas = (await listarPedidosPropios()).slice(0, 50);
  /* «Desistir del contrato aquí», solo en pedidos de España: los demás no
     leen nada de más (`situacionDesistimiento` devuelve null sin tocar la
     base). */
  const desistir = await Promise.all(
    filas.map((p) => situacionDesistimiento(p)),
  );
  return Response.json(
    {
      ok: true,
      pedidos: filas.map((p, i) => ({
        numero: p.numero,
        estado: p.estado,
        total: { centavos: p.totalCentavos, moneda: p.moneda ?? "USD" },
        articulos: Number(p.articulos ?? 0),
        creadoEn: p.creadoEn,
        guia: p.guia,
        desistir: desistir[i]
          ? {
              puede: desistir[i].puede,
              vence: desistir[i].vence?.toISOString() ?? null,
              desistidoEn: desistir[i].desistidoEn?.toISOString() ?? null,
            }
          : null,
      })),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
