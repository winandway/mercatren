"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq, sum } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

import { obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { itemsPedido, pagosZelle, pedidos } from "@/lib/db/schema";
import { RUTA_MEDIA } from "@/lib/rutas";

/**
 * El cliente sube la captura de su pago.
 *
 * A partir de aqui el pago entra a la MISMA cola de validacion que ya usa el
 * equipo: alguien lo comprueba contra el banco y, al aprobarlo, se le acredita
 * al comercio. No hay acreditacion automatica.
 */

const TIPOS_ACEPTADOS = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const TAMANO_MAXIMO = 8 * 1024 * 1024; // 8 MB

export type ResultadoComprobante =
  { ok: true; mensaje: string } | { ok: false; mensaje: string };

export async function subirComprobante(
  formulario: FormData,
): Promise<ResultadoComprobante> {
  const usuario = await obtenerUsuario();
  if (!usuario) {
    return { ok: false, mensaje: "Entra con tu cuenta para subir el pago." };
  }

  const numero = String(formulario.get("numero") ?? "");
  const codigo = String(formulario.get("codigo") ?? "").trim();
  const archivo = formulario.get("captura");

  if (!(archivo instanceof File) || archivo.size === 0) {
    return { ok: false, mensaje: "Elige la captura de tu pago." };
  }
  if (!TIPOS_ACEPTADOS.includes(archivo.type)) {
    return {
      ok: false,
      mensaje: "La captura tiene que ser una imagen (JPG, PNG o WEBP).",
    };
  }
  if (archivo.size > TAMANO_MAXIMO) {
    return { ok: false, mensaje: "La imagen pesa demasiado. Máximo 8 MB." };
  }

  const db = getDb();

  // El pedido tiene que ser suyo y estar esperando el pago.
  const [pedido] = await db
    .select()
    .from(pedidos)
    .where(eq(pedidos.numero, numero))
    .limit(1);

  if (!pedido || pedido.clienteId !== usuario.id) {
    return { ok: false, mensaje: "No encontramos ese pedido." };
  }
  if (pedido.estado !== "pendiente_pago") {
    return { ok: false, mensaje: "Ese pedido ya no está esperando el pago." };
  }

  // Si ya subio una captura y sigue pendiente, no se acumulan dos.
  const [yaSubido] = await db
    .select({ id: pagosZelle.id, estado: pagosZelle.estado })
    .from(pagosZelle)
    .where(eq(pagosZelle.pedidoId, pedido.id))
    .limit(1);

  if (yaSubido && yaSubido.estado === "pendiente") {
    return {
      ok: false,
      mensaje: "Ya subiste una captura de este pedido. La estamos revisando.",
    };
  }

  // A que comercio se le acredita. Si el pedido mezcla varios, se deja sin
  // asignar y lo resuelve el equipo: repartir un solo pago entre comercios es
  // una decision de negocio, no algo que deba adivinar el sistema.
  const tiendasDelPedido = await db
    .selectDistinct({ tiendaId: itemsPedido.tiendaId })
    .from(itemsPedido)
    .where(eq(itemsPedido.pedidoId, pedido.id));

  const tiendaId =
    tiendasDelPedido.length === 1 ? tiendasDelPedido[0].tiendaId : null;

  const [comisiones] = await db
    .select({ total: sum(itemsPedido.comisionCentavos) })
    .from(itemsPedido)
    .where(eq(itemsPedido.pedidoId, pedido.id));

  const comisionCentavos = Number(comisiones?.total ?? 0);

  // La captura se guarda en el bucket del sitio, con un nombre imposible de
  // adivinar, y solo la puede ver su dueno o el equipo (ver /media).
  const extension =
    archivo.name.split(".").pop()?.toLowerCase().slice(0, 5) || "jpg";
  const claveArchivo = `comprobantes/${pedido.id}/${nanoid()}.${extension}`;

  const { env } = getCloudflareContext();
  await env.BUCKET.put(claveArchivo, await archivo.arrayBuffer(), {
    httpMetadata: { contentType: archivo.type },
  });

  const ahora = new Date();

  await db.insert(pagosZelle).values({
    id: nanoid(),
    origen: "live",
    tipo: "entrada",
    estado: "pendiente",
    montoCentavos: pedido.totalCentavos,
    comisionCentavos,
    netoCentavos: pedido.totalCentavos - comisionCentavos,
    moneda: pedido.moneda,
    reciboUrl: `${RUTA_MEDIA}/${claveArchivo}`,
    subidoEn: ahora,
    codigoConfirmacion: codigo || null,
    pagadorNombre: usuario.name,
    pagadorCorreo: usuario.email,
    pagadorTipo: "persona",
    cuentaReceptora: env.ZELLE_CORREO_RECEPTOR ?? null,
    plataforma: "zelle",
    pedidoId: pedido.id,
    tiendaId,
    creadoEn: ahora,
  });

  revalidatePath("/[locale]/pedido/[numero]", "page");
  revalidatePath("/[locale]/panel", "layout");

  // Aviso al cliente: su comprobante entro a revision. Y al equipo: hay un
  // pago esperando validación — no puede depender de que alguien entre a
  // mirar. Ninguno de los dos es requisito.
  try {
    const { correoComprobanteRecibido, correoAvisoAlEquipo } =
      await import("@/lib/correo/correos");
    await correoComprobanteRecibido(
      { email: usuario.email, name: usuario.name, idioma: usuario.idioma },
      { numero: pedido.numero, totalCentavos: pedido.totalCentavos },
    );
    await correoAvisoAlEquipo({
      asunto: `Comprobante por validar · ${pedido.numero}`,
      lineas: [
        `Entró un comprobante del pedido ${pedido.numero} y espera validación contra el banco.`,
      ],
      url: "https://mercatren.com/es/panel/validacion",
      boton: "Ir a la cola de validación",
    });
  } catch (e) {
    console.error("[comprobante] guardado; algun aviso no salio:", e);
  }

  return {
    ok: true,
    mensaje:
      "Recibimos tu comprobante. Lo revisamos contra el banco y te avisamos.",
  };
}
