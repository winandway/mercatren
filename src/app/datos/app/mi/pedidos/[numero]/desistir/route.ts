import { contextoDe, respuestaDeError } from "@/lib/app-movil/datos";
import { desistirDelPedido } from "@/lib/pedidos/acciones-desistimiento";

export const dynamic = "force-dynamic";

/**
 * «CONFIRMAR DESISTIMIENTO» DESDE LA APP (5 nov 2026, España): la MISMA
 * acción de la web. El dueño, el plazo y el mercado los decide el servidor.
 * Privado y sin caché.
 */
export async function POST(
  peticion: Request,
  { params }: { params: Promise<{ numero: string }> },
) {
  const contexto = contextoDe(new URL(peticion.url));
  if (!contexto.ok) return respuestaDeError("pais_o_idioma", 400);
  const { numero } = await params;
  const r = await desistirDelPedido(numero, { idioma: contexto.idioma });
  return Response.json(r, {
    status: r.ok ? 200 : 400,
    headers: { "Cache-Control": "private, no-store" },
  });
}
