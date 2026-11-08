import { z } from "zod";

import { metodoPermitidoEnLaApp } from "@/lib/app-movil/cobro-en-la-app";
import { contextoDe, respuestaDeError } from "@/lib/app-movil/datos";
import { enlaceParaPagarEnLaWeb } from "@/lib/app-movil/pago-en-la-web";
import { esEquipoInterno, obtenerUsuario } from "@/lib/autorizacion";
import { enLaApp } from "@/lib/mercado/interruptores";
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
 *
 * ══ LA TARJETA DE LA APP, APAGADA PARA EL PÚBLICO (8 nov 2026) ══
 *
 * Nada cobra sin probar: la hoja de Stripe de la app solo la usa el equipo
 * hasta la prueba 9 (`lib/app-movil/cobro-en-la-app.ts`). El público paga con
 * Zelle en la web: se crea el pedido con Zelle (la MISMA acción, con su
 * mínimo y su política por tienda) y se devuelve `pagoEnLaWeb`, el enlace a
 * la página de pago de ese pedido en la web de su país. La app 2.0.0
 * (versión 12) no manda `metodoPago`: para ella es tarjeta, y al público se
 * le contesta con un mensaje claro, sin crear ningún pedido.
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
  /* Lo que eligió la persona. Sin él (la app 2.0.0), tarjeta. */
  metodoPago: z.enum(["tarjeta", "zelle"]).optional(),
});

const TARJETA_APAGADA = {
  es: "El pago con tarjeta dentro de la app todavía no está disponible. Actualiza la app para pagar con Zelle en la web.",
  en: "Card payments inside the app aren't available yet. Update the app to pay with Zelle on the web.",
} as const;

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
  /* EL INTERRUPTOR DEL PAÍS SE MIRA AQUÍ, NO SOLO EN LA PANTALLA (5 nov
     2026). La app solo ofrece los países encendidos, pero esta puerta la
     puede llamar cualquiera: un país apagado no compra por la app. El equipo
     sí, igual que en la pausa: es la única forma de probar la compra real
     de un país antes de encenderlo. */
  if (
    !enLaApp(contexto.mercado.codigo) &&
    !(await esEquipoInterno().catch(() => false))
  ) {
    return respuestaDeError("pais_apagado", 403);
  }
  const cuerpo = esquema.safeParse(await peticion.json().catch(() => null));
  if (!cuerpo.success) return respuestaDeError("datos", 400);

  /* EL MÉTODO SE VUELVE A MIRAR AQUÍ: la pantalla solo ofrece los
     permitidos, pero esta puerta la puede llamar cualquiera. */
  const metodo = cuerpo.data.metodoPago ?? "tarjeta";
  const esEquipo = await esEquipoInterno().catch(() => false);
  if (!metodoPermitidoEnLaApp(metodo, contexto.mercado.codigo, { esEquipo })) {
    return privada(
      {
        ok: false,
        error: "metodo_no_disponible",
        mensaje: TARJETA_APAGADA[contexto.idioma],
      },
      400,
    );
  }

  const pedido = await crearPedido(
    {
      entrega: cuerpo.data.entrega,
      lineas: cuerpo.data.lineas,
      metodoPago: metodo === "zelle" ? "zelle" : "stripe",
      /* Venezuela se retira en una ciudad; los demás países, a la dirección
         (la misma regla de la web: `retiroEnCiudad` del mercado). */
      formaEntrega: contexto.mercado.retiroEnCiudad ? "retiro" : "envio",
    },
    /* El país lo dice la app: entra siempre por mercatren.com y sin la
       galleta del país, así que el dominio no sabe dónde compra. */
    { idioma: contexto.idioma, pais: contexto.mercado.codigo },
  );
  if (!pedido.ok) return privada({ ok: false, mensaje: pedido.mensaje }, 400);

  /* Zelle se paga en la página del pedido en la web: la misma ficha de pago
     y la misma subida del comprobante, ya probadas. */
  if (metodo === "zelle") {
    return privada({
      ok: true,
      numero: pedido.numero,
      pagoEnLaWeb: await enlaceParaPagarEnLaWeb({
        peticion,
        mercado: contexto.mercado,
        idioma: contexto.idioma,
        numero: pedido.numero,
      }),
    });
  }

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
