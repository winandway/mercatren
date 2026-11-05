import { z } from "zod";

import { registrarClic } from "@/lib/ganar/promociones";

export const dynamic = "force-dynamic";

/**
 * EL CLIC EN UN PROMOCIONADO (5 nov 2026, Fase 4).
 *
 * Lo manda la tarjeta «Patrocinado» al tocarla: la web con `sendBeacon` y la
 * app con un `fetch` que no espera. Solo POST (un robot que sigue enlaces no
 * cuenta), con la firma del día que vino con el producto. Qué cuenta y qué
 * no lo decide `registrarClic`; aquí se responde siempre igual, sin decir
 * por qué no contó (no se le enseña a nadie a fabricar clics).
 */
const esquema = z.object({
  p: z.string().min(1).max(40),
  f: z.string().length(32),
});

export async function POST(peticion: Request) {
  const texto = await peticion.text().catch(() => "");
  let cuerpo: unknown = null;
  try {
    cuerpo = JSON.parse(texto);
  } catch {
    cuerpo = null;
  }
  const datos = esquema.safeParse(cuerpo);
  if (datos.success) {
    try {
      await registrarClic({
        promocionId: datos.data.p,
        firma: datos.data.f,
        ip:
          peticion.headers.get("cf-connecting-ip") ??
          peticion.headers.get("x-forwarded-for"),
        agente: peticion.headers.get("user-agent"),
      });
    } catch (fallo) {
      /* El comprador ya va a la ficha: el fallo no lo detiene, pero queda a
         la vista en el registro (un clic que no se anotó es dinero). */
      console.error("[promo/clic]", fallo);
    }
  }
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });
}
