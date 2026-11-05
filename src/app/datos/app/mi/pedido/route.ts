import { z } from "zod";

import { contextoDe, respuestaDeError } from "@/lib/app-movil/datos";
import { obtenerUsuario } from "@/lib/autorizacion";
import { esquemaEntrega } from "@/lib/pedidos/esquemas";
import { crearPedido } from "@/lib/pedidos/acciones";
import { crearIntentoDePago } from "@/lib/stripe/acciones";

export const dynamic = "force-dynamic";

/**
 * COMPRAR DESDE LA APP NATIVA (5 nov 2026, Parte 3b del plan).
 *
 * Crea el pedido con la MISMA acción de la web (`crearPedido`: el precio, la
 * existencia, el destino y la pausa se vuelven a leer de la base; de la app
 * solo llegan QUÉ producto y CUÁNTOS) y le prepara el intento de pago con
 * tarjeta con la MISMA acción de la web (`crearIntentoDePago`: el monto sale
 * del pedido en la base). La app paga con la hoja de Stripe con ese intento;
 * lo acredita el aviso de Stripe al servidor, nunca la app.
 *
 * Privado y sin caché. El dueño del pedido sale SIEMPRE de la sesión.
 */
const esquema = z.object({
  entrega: esquemaEntrega,
  lineas: z
    .array(
      z.object({
        productoId: z.string().min(1).max(120),
        cantidad: z.number().int().min(1).max(999),
      }),
    )
    .min(1)
    .max(50),
});

function privada(cuerpo: unknown, estado = 200): Response {
  return Response.json(cuerpo, {
    status: estado,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(peticion: Request) {
  const contexto = contextoDe(new URL(peticion.url));
  if (!contexto.ok) return respuestaDeError("pais_o_idioma", 400);
  if (!(await obtenerUsuario().catch(() => null))) {
    return respuestaDeError("sin_sesion", 401);
  }
  const cuerpo = esquema.safeParse(await peticion.json().catch(() => null));
  if (!cuerpo.success) return respuestaDeError("datos", 400);

  const pedido = await crearPedido(
    {
      entrega: cuerpo.data.entrega,
      lineas: cuerpo.data.lineas,
      /* En la app se paga con tarjeta; Zelle sigue siendo de la web. */
      metodoPago: "stripe",
      /* La app despacha a una dirección (Estados Unidos y los países que se
         enciendan); el retiro en mostrador es de Venezuela, en la web. */
      formaEntrega: "envio",
    },
    { idioma: contexto.idioma },
  );
  if (!pedido.ok) return privada({ ok: false, mensaje: pedido.mensaje }, 400);

  const intento = await crearIntentoDePago(pedido.numero).catch(() => ({
    ok: false as const,
  }));
  return privada({
    ok: true,
    numero: pedido.numero,
    pago: intento.ok
      ? {
          clientSecret: intento.clientSecret,
          clavePublica: intento.clavePublica,
        }
      : {
          sinConfigurar:
            "sinConfigurar" in intento ? Boolean(intento.sinConfigurar) : false,
        },
  });
}
