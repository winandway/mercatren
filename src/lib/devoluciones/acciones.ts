"use server";

import { and, desc, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

import { obtenerUsuario, exigirEquipoInterno } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import {
  devoluciones,
  fotosDevolucion,
  hitosPedido,
  pedidos,
} from "@/lib/db/schema";
import {
  esMotivoValido,
  exigeFotos,
  MAXIMO_FOTOS,
  puedeDevolver,
  puedeVerLaDireccion,
  type EstadoDevolucion,
} from "@/lib/devoluciones/reglas";
import { subirImagen } from "@/lib/subidas";

/**
 * ABRIR Y ATENDER UNA DEVOLUCIÓN.
 *
 * ══ LA DIRECCIÓN SALE DE AQUÍ, DEL SERVIDOR, Y SOLO CON TRÁMITE ══
 *
 * No viaja al navegador antes de tiempo, no está en la política, no está en un
 * componente. Si estuviera dibujada y solo escondida con CSS, cualquiera la
 * leería en el código fuente de la página — que es exactamente lo que hay que
 * evitar cuando el motivo de todo esto es que **la dirección va a cambiar**.
 */

type Resultado =
  | { ok: true; mensaje: string; direccion: string | null }
  | { ok: false; mensaje: string };

/**
 * La dirección de hoy, o `null`.
 *
 * **Nunca inventa una.** Una caja mandada a un sitio equivocado no vuelve: es
 * mejor decir que el equipo la manda por correo que dar una dirección a ojo.
 */
async function direccionDeHoy(): Promise<string | null> {
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  return getCloudflareContext().env.DEVOLUCION_DIRECCION?.trim() || null;
}

/**
 * Abre el trámite y devuelve la dirección.
 *
 * Es el único sitio del sistema que entrega esa dirección a un comprador, y lo
 * hace después de comprobar tres cosas: que el pedido es suyo, que está en
 * plazo, y que trae lo que su motivo exige.
 */
export async function pedirDevolucion(
  formulario: FormData,
): Promise<Resultado> {
  const usuario = await obtenerUsuario();
  if (!usuario) {
    return {
      ok: false,
      mensaje: "Entra a tu cuenta para pedir la devolución.",
    };
  }

  const pedidoId = String(formulario.get("pedidoId") ?? "").trim();
  const motivo = String(formulario.get("motivo") ?? "").trim();
  const comentario = String(formulario.get("comentario") ?? "")
    .trim()
    .slice(0, 1000);

  if (!esMotivoValido(motivo)) {
    return { ok: false, mensaje: "Elige por qué lo quieres devolver." };
  }

  const db = getDb();

  const [pedido] = await db
    .select({
      id: pedidos.id,
      numero: pedidos.numero,
      estado: pedidos.estado,
      clienteId: pedidos.clienteId,
    })
    .from(pedidos)
    .where(eq(pedidos.id, pedidoId))
    .limit(1);

  /**
   * DE OTRO NO SE DEVUELVE NADA, Y NI SE CONFIRMA QUE EXISTA.
   *
   * El mismo texto para «no existe» y «no es tuyo»: con dos respuestas
   * distintas, probar números de pedido sería una forma cómoda de averiguar
   * cuáles existen.
   */
  if (!pedido || pedido.clienteId !== usuario.id) {
    return { ok: false, mensaje: "Ese pedido no existe." };
  }

  /**
   * CUÁNDO LLEGÓ, QUE ES DE DONDE SALE EL PLAZO.
   *
   * `pedidos` no guarda esa fecha: el rastro de cada paso vive en
   * `hitos_pedido`, con su autor y su fecha. Se busca el hito «entregado» — si
   * no está, el plazo no ha empezado y la persona puede pedir igual, porque el
   * dato que falta es NUESTRO.
   */
  const [entrega] = await db
    .select({ creadoEn: hitosPedido.creadoEn })
    .from(hitosPedido)
    .where(
      and(
        eq(hitosPedido.pedidoId, pedido.id),
        eq(hitosPedido.hito, "entregado"),
      ),
    )
    .orderBy(desc(hitosPedido.creadoEn))
    .limit(1)
    .catch(() => []);

  const abiertas = await db
    .select({ id: devoluciones.id })
    .from(devoluciones)
    .where(
      and(
        eq(devoluciones.pedidoId, pedido.id),
        inArray(devoluciones.estado, ["solicitada", "en_camino", "recibida"]),
      ),
    )
    .limit(1);

  const veredicto = puedeDevolver({
    estado: pedido.estado,
    entregadoEn: entrega?.creadoEn ?? null,
    yaHayDevolucion: abiertas.length > 0,
    hoy: new Date(),
  });

  if (!veredicto.puede) {
    return { ok: false, mensaje: `no.${veredicto.motivo}` };
  }

  /* Las fotos se leen ANTES de escribir nada: si una falla, no queda un
     trámite abierto a medias con la dirección ya entregada. */
  const archivos = formulario
    .getAll("fotos")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, MAXIMO_FOTOS);

  if (exigeFotos(motivo) && archivos.length === 0) {
    return { ok: false, mensaje: "faltanFotos" };
  }

  const claves: string[] = [];
  for (const archivo of archivos) {
    const subida = await subirImagen(archivo, `devoluciones/${pedido.id}`);
    if (!subida.ok) return { ok: false, mensaje: subida.mensaje };
    claves.push(subida.clave);
  }

  const direccion = await direccionDeHoy();
  const id = `dev-${nanoid(12)}`;
  const ahora = new Date();

  await db.insert(devoluciones).values({
    id,
    pedidoId: pedido.id,
    usuarioId: usuario.id,
    estado: "solicitada",
    motivo,
    comentario: comentario || null,
    /* Se COPIA la que se enseñó hoy: si mañana cambia, quien ya despachó tiene
       que poder demostrar que mandó a donde se le dijo. */
    direccionEntregada: direccion,
    creadoEn: ahora,
    actualizadoEn: ahora,
  });

  if (claves.length > 0) {
    await db
      .insert(fotosDevolucion)
      .values(
        claves.map((clave) => ({
          id: `fdev-${nanoid(12)}`,
          devolucionId: id,
          clave,
          creadoEn: ahora,
        })),
      )
      .catch((fallo) =>
        console.error("[devoluciones] no se anotaron las fotos:", fallo),
      );
  }

  /* Los avisos van al final y en su propio try: el trámite ya está abierto y
     la dirección ya se enseñó en pantalla. Que un correo no salga no puede
     deshacer el derecho de alguien a devolver. */
  try {
    const { correoAvisoAlEquipo } = await import("@/lib/correo/correos");
    const { SITIO } = await import("@/lib/sitio");

    await correoAvisoAlEquipo({
      asunto: `Devolución pedida · ${pedido.numero}`,
      lineas: [
        `${pedido.numero} · motivo: ${motivo}`,
        comentario || "Sin comentario.",
        claves.length > 0
          ? `${claves.length} foto(s) adjunta(s).`
          : "Sin fotos.",
        direccion
          ? "Se le dio la dirección de devolución."
          : "OJO: falta DEVOLUCION_DIRECCION en el panel. Hay que mandársela a mano.",
      ],
      url: `${SITIO.url}/es/panel/devoluciones`,
      boton: "Ver la devolución",
    });
  } catch (fallo) {
    console.error("[devoluciones] el aviso no salio:", fallo);
  }

  revalidatePath("/[locale]/pedido/[numero]", "page");

  return { ok: true, mensaje: "abierta", direccion };
}

export type DevolucionDelPedido = {
  id: string;
  estado: EstadoDevolucion;
  motivo: string;
  direccionEntregada: string | null;
  motivoRechazo: string | null;
  creadoEn: Date | null;
};

/**
 * La devolución de un pedido, para pintarla en su página.
 *
 * **La dirección solo sale si el estado permite verla** — la comprobación es de
 * este lado, no del componente: una regla que vive en la pantalla se pierde en
 * cuanto alguien copia esa pantalla.
 */
export async function devolucionDelPedido(
  pedidoId: string,
): Promise<DevolucionDelPedido | null> {
  const usuario = await obtenerUsuario();
  if (!usuario) return null;

  const db = getDb();

  const [fila] = await db
    .select({
      id: devoluciones.id,
      estado: devoluciones.estado,
      motivo: devoluciones.motivo,
      direccionEntregada: devoluciones.direccionEntregada,
      motivoRechazo: devoluciones.motivoRechazo,
      creadoEn: devoluciones.creadoEn,
      dueno: pedidos.clienteId,
    })
    .from(devoluciones)
    .innerJoin(pedidos, eq(pedidos.id, devoluciones.pedidoId))
    .where(eq(devoluciones.pedidoId, pedidoId))
    .orderBy(desc(devoluciones.creadoEn))
    .limit(1)
    .catch(() => []);

  if (!fila) return null;

  const equipo = await exigirEquipoInterno()
    .then(() => true)
    .catch(() => false);

  if (fila.dueno !== usuario.id && !equipo) return null;

  return {
    id: fila.id,
    estado: fila.estado,
    motivo: fila.motivo,
    /* Si el estado no la admite, aquí no viaja: nunca llega al navegador. */
    direccionEntregada: puedeVerLaDireccion(fila.estado)
      ? fila.direccionEntregada
      : null,
    motivoRechazo: fila.motivoRechazo,
    creadoEn: fila.creadoEn,
  };
}
