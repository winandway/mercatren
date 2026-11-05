import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import { contextoDe, respuestaDeError } from "@/lib/app-movil/datos";
import {
  formularioDeEdicion,
  textoDeMonto,
} from "@/lib/app-movil/editar-producto";
import { obtenerUsuario } from "@/lib/autorizacion";
import { direccionImagen } from "@/lib/catalogo/consultas";
import { getDb } from "@/lib/db";
import {
  depositos,
  imagenesProducto,
  productos,
  tiendas,
} from "@/lib/db/schema";
import { baseDesdePublicado } from "@/lib/dinero";
import {
  cambiarEstadoProducto,
  guardarProducto,
} from "@/lib/productos/acciones";
import { TIPOS_IMAGEN } from "@/lib/subidas";

export const dynamic = "force-dynamic";

/**
 * UN PRODUCTO DE MI TIENDA, DESDE LA APP (5 nov 2026).
 *
 * GET: lo que el formulario de editar necesita (textos, el precio DEL
 * COMERCIO, unidades, estado y fotos).
 * POST: guarda la edición con la MISMA acción de la web. Lo que la app no
 * enseña se conserva (ver `lib/app-movil/editar-producto.ts`); las fotos
 * nuevas se suman a las que ya tiene, hasta ocho.
 * PATCH: pausar la venta o volver a publicar (`cambiarEstadoProducto`).
 *
 * Privado y sin caché. El producto tiene que ser de la tienda de quien
 * pregunta: si no, se responde como si no existiera.
 */
const FOTOS_POR_PRODUCTO = 8;

function privada(cuerpo: unknown, estado = 200): Response {
  return Response.json(cuerpo, {
    status: estado,
    headers: { "Cache-Control": "private, no-store" },
  });
}

type Contexto = { params: Promise<{ id: string }> };

/** El producto, solo si es de la tienda de quien tiene la sesión. */
async function productoMio(usuarioId: string, id: string) {
  const [fila] = await getDb()
    .select({
      id: productos.id,
      slug: productos.slug,
      tiendaId: productos.tiendaId,
      tituloEs: productos.tituloEs,
      tituloEn: productos.tituloEn,
      descripcionEs: productos.descripcionEs,
      descripcionEn: productos.descripcionEn,
      precioCentavos: productos.precioCentavos,
      precioBaseCentavos: productos.precioBaseCentavos,
      precioAntesCentavos: productos.precioAntesCentavos,
      moneda: productos.moneda,
      existencias: productos.existencias,
      controlaExistencias: productos.controlaExistencias,
      estado: productos.estado,
      sku: productos.sku,
      categoriaId: productos.categoriaId,
      marca: productos.marca,
      unidad: productos.unidad,
      destacado: productos.destacado,
      depositoId: productos.depositoId,
    })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(and(eq(productos.id, id), eq(tiendas.propietarioId, usuarioId)))
    .limit(1);
  return fila ?? null;
}

async function fotosDe(productoId: string) {
  return getDb()
    .select({
      id: imagenesProducto.id,
      url: imagenesProducto.url,
      clave: imagenesProducto.clave,
    })
    .from(imagenesProducto)
    .where(eq(imagenesProducto.productoId, productoId))
    .orderBy(asc(imagenesProducto.orden));
}

async function entrada(peticion: Request, { params }: Contexto) {
  const contexto = contextoDe(new URL(peticion.url));
  if (!contexto.ok) return { fallo: respuestaDeError("pais_o_idioma", 400) };
  const usuario = await obtenerUsuario().catch(() => null);
  if (!usuario) return { fallo: respuestaDeError("sin_sesion", 401) };
  const { id } = await params;
  const producto = await productoMio(usuario.id, id);
  if (!producto) return { fallo: respuestaDeError("no_existe", 404) };
  return { idioma: contexto.idioma, producto };
}

export async function GET(peticion: Request, ctx: Contexto) {
  const r = await entrada(peticion, ctx);
  if ("fallo" in r) return r.fallo;
  const p = r.producto;
  const moneda = p.moneda ?? "USD";
  const base = p.precioBaseCentavos ?? baseDesdePublicado(p.precioCentavos);
  return privada({
    ok: true,
    producto: {
      id: p.id,
      slug: p.slug,
      tituloEs: p.tituloEs ?? "",
      tituloEn: p.tituloEn ?? "",
      descripcionEs: p.descripcionEs ?? "",
      descripcionEn: p.descripcionEn ?? "",
      precio: base > 0 ? textoDeMonto(base, moneda) : "",
      existencias: p.controlaExistencias
        ? String(Math.max(0, Math.floor(Number(p.existencias) || 0)))
        : "",
      moneda,
      estado: p.estado,
      fotos: (await fotosDe(p.id)).map((f) => ({
        id: f.id,
        url: direccionImagen(f),
      })),
    },
  });
}

export async function POST(peticion: Request, ctx: Contexto) {
  const r = await entrada(peticion, ctx);
  if ("fallo" in r) return r.fallo;
  const p = r.producto;
  /* «En revisión» lo pone el equipo; el comercio no lo publica editándolo. */
  if (p.estado === "en_revision") return respuestaDeError("no_editable", 400);
  const estado = p.estado;

  const recibido = await peticion.formData().catch(() => null);
  if (!recibido) return respuestaDeError("datos", 400);

  let zonaDeposito: string | null = null;
  if (p.depositoId) {
    const [dep] = await getDb()
      .select({ zona: depositos.zona })
      .from(depositos)
      .where(eq(depositos.id, p.depositoId))
      .limit(1);
    zonaDeposito = dep?.zona ?? null;
  }

  const textos: Record<string, string> = {};
  for (const [campo, valor] of recibido.entries()) {
    if (typeof valor === "string") textos[campo] = valor;
  }
  const campos = formularioDeEdicion(
    p.id,
    {
      sku: p.sku,
      categoriaId: p.categoriaId,
      marca: p.marca,
      unidad: p.unidad,
      precioAntesCentavos: p.precioAntesCentavos,
      moneda: p.moneda ?? "USD",
      destacado: Boolean(p.destacado),
      estado,
      zonaDeposito,
    },
    textos,
  );

  const limpio = new FormData();
  for (const [campo, valor] of Object.entries(campos)) limpio.set(campo, valor);

  /* Las fotos nuevas se suman a las que ya hay, sin pasar de ocho. */
  const yaTiene = (await fotosDe(p.id)).length;
  const nuevas = recibido
    .getAll("fotos")
    .filter(
      (f): f is File =>
        f instanceof File &&
        f.size > 0 &&
        (TIPOS_IMAGEN as readonly string[]).includes(f.type),
    )
    .slice(0, Math.max(0, FOTOS_POR_PRODUCTO - yaTiene));
  if (yaTiene + nuevas.length === 0) return respuestaDeError("sin_fotos", 400);
  for (const foto of nuevas) limpio.append("fotos", foto);

  const hecho = await guardarProducto(limpio, { idioma: r.idioma });
  return privada(hecho, hecho.ok ? 200 : 400);
}

const esquemaEstado = z.object({ estado: z.enum(["publicado", "borrador"]) });

export async function PATCH(peticion: Request, ctx: Contexto) {
  const r = await entrada(peticion, ctx);
  if ("fallo" in r) return r.fallo;
  const datos = esquemaEstado.safeParse(
    await peticion.json().catch(() => null),
  );
  if (!datos.success) return respuestaDeError("datos", 400);
  const hecho = await cambiarEstadoProducto(r.producto.id, datos.data.estado, {
    idioma: r.idioma,
  });
  return privada(hecho, hecho.ok ? 200 : 400);
}
