import { eq } from "drizzle-orm";
import { z } from "zod";

import { contextoDe, respuestaDeError } from "@/lib/app-movil/datos";
import { obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { tiendas } from "@/lib/db/schema";
import { avanzarPedido } from "@/lib/pedidos/acciones";
import { obtenerPedidoDelPanel } from "@/lib/pedidos/consultas";
import { lineasDeLaEntrega } from "@/lib/pedidos/direccion-de-entrega";
import { puedeMarcarEntrega } from "@/lib/pedidos/quien-entrega";

export const dynamic = "force-dynamic";

/**
 * UNA VENTA DE MI TIENDA, DESDE LA APP (5 nov 2026).
 *
 * GET: lo que el comercio necesita para despacharla: qué lleva (solo SUS
 * renglones), a quién y a dónde, y qué botones le tocan.
 * POST: «Enviado» o «Entregado», con la MISMA acción de la web
 * (`avanzarPedido`): solo avanza, nunca retrocede, y el comprador recibe su
 * correo.
 *
 * Una venta que no tiene renglones de la tienda de quien pregunta responde
 * como si no existiera, igual que en el panel.
 */
type Contexto = { params: Promise<{ numero: string }> };

/** Los botones de cada estado: la misma tabla de `avanzarPedido`. */
const PUEDE_ENVIAR = new Set(["pagado", "preparando"]);
const PUEDE_ENTREGAR = new Set(["pagado", "preparando", "enviado"]);

async function ventaMia(peticion: Request, { params }: Contexto) {
  const contexto = contextoDe(new URL(peticion.url));
  if (!contexto.ok) return { fallo: respuestaDeError("pais_o_idioma", 400) };
  const usuario = await obtenerUsuario().catch(() => null);
  if (!usuario) return { fallo: respuestaDeError("sin_sesion", 401) };
  const [tienda] = await getDb()
    .select({ id: tiendas.id })
    .from(tiendas)
    .where(eq(tiendas.propietarioId, usuario.id))
    .limit(1);
  if (!tienda) return { fallo: respuestaDeError("sin_tienda", 403) };

  const { numero } = await params;
  const pedido = await obtenerPedidoDelPanel(numero).catch(() => null);
  /* Solo SUS renglones, aunque quien mire tenga además alcance de equipo. */
  const renglones = (pedido?.renglones ?? []).filter(
    (r) => r.tiendaId === tienda.id,
  );
  if (!pedido || renglones.length === 0)
    return { fallo: respuestaDeError("no_existe", 404) };
  return { idioma: contexto.idioma, usuario, pedido, renglones };
}

export async function GET(peticion: Request, ctx: Contexto) {
  const r = await ventaMia(peticion, ctx);
  if ("fallo" in r) return r.fallo;
  const { pedido, renglones } = r;
  const entrega = puedeMarcarEntrega(r.usuario.rol);
  return Response.json(
    {
      ok: true,
      venta: {
        numero: pedido.numero,
        estado: pedido.estado,
        creadoEn: pedido.creadoEn,
        cliente: pedido.cliente.nombre,
        monto: {
          centavos: renglones.reduce((t, x) => t + x.subtotalCentavos, 0),
          moneda: pedido.moneda ?? "USD",
        },
        renglones: renglones.map((x) => ({
          titulo: x.titulo,
          cantidad: x.cantidad,
          subtotalCentavos: x.subtotalCentavos,
        })),
        entrega: {
          /* Las líneas salen de la misma pieza del panel: la app no adivina. */
          lineas: lineasDeLaEntrega(pedido.entrega.direccion),
          telefono: pedido.entrega.telefono,
          notas: pedido.entrega.notas,
        },
        puedeEnviar: PUEDE_ENVIAR.has(pedido.estado),
        puedeEntregar: entrega && PUEDE_ENTREGAR.has(pedido.estado),
      },
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

const esquema = z.object({ estado: z.enum(["enviado", "entregado"]) });

export async function POST(peticion: Request, ctx: Contexto) {
  const r = await ventaMia(peticion, ctx);
  if ("fallo" in r) return r.fallo;
  const datos = esquema.safeParse(await peticion.json().catch(() => null));
  if (!datos.success) return respuestaDeError("datos", 400);
  const hecho = await avanzarPedido(r.pedido.numero, datos.data.estado, {
    idioma: r.idioma,
  });
  return Response.json(hecho, {
    status: hecho.ok ? 200 : 400,
    headers: { "Cache-Control": "private, no-store" },
  });
}
