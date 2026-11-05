import { desc, eq, inArray } from "drizzle-orm";

import { contextoDe, respuestaDeError } from "@/lib/app-movil/datos";
import { obtenerUsuario } from "@/lib/autorizacion";
import { direccionImagen } from "@/lib/catalogo/consultas";
import { getDb } from "@/lib/db";
import { imagenesProducto, productos, tiendas } from "@/lib/db/schema";
import { guardarProducto } from "@/lib/productos/acciones";
import { TIPOS_IMAGEN } from "@/lib/subidas";

export const dynamic = "force-dynamic";

/**
 * «MIS PRODUCTOS» DESDE LA APP NATIVA (5 nov 2026, Parte 4 del plan).
 *
 * GET: los productos de la tienda de quien pregunta (los últimos 50).
 * POST: crea un producto con la MISMA acción de la web (`guardarProducto`):
 * el precio que escribe el comercio es SU precio y el publicado lleva el
 * ajuste sumado solo; las fotos se suben y se nombran como en la web.
 *
 * Privado y sin caché. La tienda sale SIEMPRE de la sesión: del formulario
 * solo pasan los campos de esta lista, ni `id` ni `tiendaId`.
 */
const CAMPOS = [
  "tituloEs",
  "tituloEn",
  "descripcionEs",
  "descripcionEn",
  "precio",
  "existencias",
] as const;
/* Una ruta solo puede exportar GET, POST y su configuración: nada más. */
const FOTOS_POR_PRODUCTO = 8;

function privada(cuerpo: unknown, estado = 200): Response {
  return Response.json(cuerpo, {
    status: estado,
    headers: { "Cache-Control": "private, no-store" },
  });
}

async function miTienda(usuarioId: string) {
  const [suya] = await getDb()
    .select({ id: tiendas.id })
    .from(tiendas)
    .where(eq(tiendas.propietarioId, usuarioId))
    .limit(1);
  return suya ?? null;
}

export async function GET(peticion: Request) {
  const contexto = contextoDe(new URL(peticion.url));
  if (!contexto.ok) return respuestaDeError("pais_o_idioma", 400);
  const usuario = await obtenerUsuario().catch(() => null);
  if (!usuario) return respuestaDeError("sin_sesion", 401);
  const tienda = await miTienda(usuario.id);
  if (!tienda) return respuestaDeError("sin_tienda", 403);

  const db = getDb();
  const lista = await db
    .select({
      id: productos.id,
      slug: productos.slug,
      tituloEs: productos.tituloEs,
      tituloEn: productos.tituloEn,
      precioCentavos: productos.precioCentavos,
      precioBaseCentavos: productos.precioBaseCentavos,
      moneda: productos.moneda,
      estado: productos.estado,
    })
    .from(productos)
    .where(eq(productos.tiendaId, tienda.id))
    .orderBy(desc(productos.creadoEn))
    .limit(50);

  /* La primera foto de cada uno, en UNA consulta (≤ 50 ids). */
  const fotos = lista.length
    ? await db
        .select({
          productoId: imagenesProducto.productoId,
          clave: imagenesProducto.clave,
          orden: imagenesProducto.orden,
        })
        .from(imagenesProducto)
        .where(
          inArray(
            imagenesProducto.productoId,
            lista.map((p) => p.id),
          ),
        )
    : [];
  const primera = new Map<string, { clave: string | null; orden: number }>();
  for (const f of fotos) {
    const antes = primera.get(f.productoId);
    if (!antes || f.orden < antes.orden) primera.set(f.productoId, f);
  }

  return privada({
    ok: true,
    productos: lista.map((p) => ({
      id: p.id,
      slug: p.slug,
      titulo:
        contexto.idioma === "en" && p.tituloEn?.trim()
          ? p.tituloEn
          : p.tituloEs,
      precio: { centavos: p.precioCentavos, moneda: p.moneda },
      estado: p.estado,
      foto: direccionImagen({
        url: null,
        clave: primera.get(p.id)?.clave ?? null,
      }),
    })),
  });
}

export async function POST(peticion: Request) {
  const contexto = contextoDe(new URL(peticion.url));
  if (!contexto.ok) return respuestaDeError("pais_o_idioma", 400);
  const usuario = await obtenerUsuario().catch(() => null);
  if (!usuario) return respuestaDeError("sin_sesion", 401);
  if (!(await miTienda(usuario.id))) return respuestaDeError("sin_tienda", 403);

  const recibido = await peticion.formData().catch(() => null);
  if (!recibido) return respuestaDeError("datos", 400);

  /* Solo lo de la lista; el resto (id, tiendaId, estado) no lo decide la app. */
  const limpio = new FormData();
  for (const campo of CAMPOS) {
    const valor = recibido.get(campo);
    if (typeof valor === "string") limpio.set(campo, valor.slice(0, 2000));
  }
  limpio.set("estado", "publicado");
  if (String(recibido.get("existencias") ?? "").trim()) {
    limpio.set("controlaExistencias", "on");
  }
  const fotos = recibido
    .getAll("fotos")
    .filter(
      (f): f is File =>
        f instanceof File &&
        f.size > 0 &&
        (TIPOS_IMAGEN as readonly string[]).includes(f.type),
    )
    .slice(0, FOTOS_POR_PRODUCTO);
  if (fotos.length === 0) return respuestaDeError("sin_fotos", 400);
  for (const foto of fotos) limpio.append("fotos", foto);

  const r = await guardarProducto(limpio, { idioma: contexto.idioma });
  return privada(r, r.ok ? 200 : 400);
}
