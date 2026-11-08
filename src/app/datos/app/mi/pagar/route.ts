import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { metodoPermitidoEnLaApp } from "@/lib/app-movil/cobro-en-la-app";
import { contextoDe, respuestaDeError } from "@/lib/app-movil/datos";
import { enlaceParaPagarEnLaWeb } from "@/lib/app-movil/pago-en-la-web";
import { esEquipoInterno, obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { pedidos } from "@/lib/db/schema";
import { mercadoPorCodigo } from "@/lib/mercado/mercados";
import { crearIntentoDePago } from "@/lib/stripe/acciones";

export const dynamic = "force-dynamic";

/**
 * PAGAR UN PEDIDO QUE QUEDÓ POR PAGAR, desde «Mis pedidos» de la app.
 *
 * ══ 8 nov 2026: LA TARJETA DE LA APP, SOLO PARA EL EQUIPO ══
 *
 * La hoja de Stripe de la app no se ha probado con una tarjeta real (prueba
 * 9): solo el equipo la usa, con la MISMA acción de la web
 * (`crearIntentoDePago`: solo el dueño, solo si sigue por pagar, el monto del
 * pedido en la base). Al público se le devuelve `pagoEnLaWeb`: la página de
 * pago de SU pedido en la web de su país (Zelle con su comprobante, o la
 * tarjeta de la web si el pedido se hizo con tarjeta antes de este cambio).
 * La app 2.0.0 (versión 12) no conoce `pagoEnLaWeb` y enseña su aviso de
 * siempre: no cobra nada.
 */
const esquema = z.object({ numero: z.string().regex(/^MT-\d{6}$/) });

function privada(cuerpo: unknown, estado = 200): Response {
  return Response.json(cuerpo, {
    status: estado,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(peticion: Request) {
  const contexto = contextoDe(new URL(peticion.url));
  if (!contexto.ok) return respuestaDeError("pais_o_idioma", 400);
  const cuerpo = esquema.safeParse(await peticion.json().catch(() => null));
  if (!cuerpo.success) return respuestaDeError("datos", 400);
  const usuario = await obtenerUsuario().catch(() => null);
  if (!usuario) return respuestaDeError("sin_sesion", 401);

  /* Solo SU pedido y solo si sigue por pagar. */
  const [pedido] = await getDb()
    .select({
      numero: pedidos.numero,
      estado: pedidos.estado,
      mercado: pedidos.mercado,
      metodoPago: pedidos.metodoPago,
    })
    .from(pedidos)
    .where(
      and(
        eq(pedidos.numero, cuerpo.data.numero),
        eq(pedidos.clienteId, usuario.id),
      ),
    )
    .limit(1);
  if (!pedido || pedido.estado !== "pendiente_pago") {
    return privada({ ok: false }, 400);
  }

  const esEquipo = await esEquipoInterno().catch(() => false);
  const hoja =
    pedido.metodoPago === "stripe" &&
    metodoPermitidoEnLaApp("tarjeta", pedido.mercado, { esEquipo });

  if (!hoja) {
    return privada({
      ok: true,
      pagoEnLaWeb: await enlaceParaPagarEnLaWeb({
        peticion,
        mercado: mercadoPorCodigo(pedido.mercado),
        idioma: contexto.idioma,
        numero: pedido.numero,
      }),
    });
  }

  const intento = await crearIntentoDePago(pedido.numero).catch(() => ({
    ok: false as const,
  }));
  return privada(
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
    intento.ok ? 200 : 400,
  );
}
