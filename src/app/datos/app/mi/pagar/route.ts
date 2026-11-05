import { z } from "zod";

import { contextoDe, respuestaDeError } from "@/lib/app-movil/datos";
import { crearIntentoDePago } from "@/lib/stripe/acciones";

export const dynamic = "force-dynamic";

/**
 * PAGAR UN PEDIDO QUE QUEDÓ POR PAGAR, desde «Mis pedidos» de la app. La MISMA
 * acción de la web (`crearIntentoDePago`): solo el dueño, solo si sigue por
 * pagar, y el monto sale del pedido en la base. Reutiliza el intento vivo en
 * vez de crear otro.
 */
const esquema = z.object({ numero: z.string().regex(/^MT-\d{6}$/) });

export async function POST(peticion: Request) {
  const contexto = contextoDe(new URL(peticion.url));
  if (!contexto.ok) return respuestaDeError("pais_o_idioma", 400);
  const cuerpo = esquema.safeParse(await peticion.json().catch(() => null));
  if (!cuerpo.success) return respuestaDeError("datos", 400);
  const intento = await crearIntentoDePago(cuerpo.data.numero).catch(() => ({
    ok: false as const,
  }));
  return Response.json(
    intento.ok
      ? {
          ok: true,
          pago: {
            clientSecret: intento.clientSecret,
            clavePublica: intento.clavePublica,
          },
        }
      : {
          ok: false,
          sinConfigurar:
            "sinConfigurar" in intento ? Boolean(intento.sinConfigurar) : false,
        },
    {
      status: intento.ok ? 200 : 400,
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}
