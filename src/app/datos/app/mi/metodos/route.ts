import { contextoDe, respuestaDeError } from "@/lib/app-movil/datos";
import { metodosDeLaApp } from "@/lib/app-movil/cobro-en-la-app";
import { esEquipoInterno } from "@/lib/autorizacion";
import { ZELLE_MINIMO_CENTAVOS } from "@/lib/dinero";

export const dynamic = "force-dynamic";

/**
 * CON QUÉ SE PUEDE PAGAR EN LA APP, en este país y para quien pregunta
 * (8 nov 2026). Lo decide `metodosDeLaApp`: la tarjeta dentro de la app solo
 * para el equipo hasta la prueba 9; Zelle (en la web) donde Zelle existe.
 * Privado: depende de la sesión, nada de guardarlo en el borde.
 */
export async function GET(peticion: Request) {
  const contexto = contextoDe(new URL(peticion.url));
  if (!contexto.ok) return respuestaDeError("pais_o_idioma", 400);
  const esEquipo = await esEquipoInterno().catch(() => false);
  return Response.json(
    {
      ok: true,
      metodos: metodosDeLaApp(contexto.mercado.codigo, { esEquipo }),
      zelleMinimoCentavos: ZELLE_MINIMO_CENTAVOS,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
