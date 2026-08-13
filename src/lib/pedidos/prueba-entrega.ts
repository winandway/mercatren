"use server";

import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

import { obtenerAlcance, obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import {
  itemsPedido,
  pedidos,
  pruebasEntrega,
  TIPOS_PRUEBA,
} from "@/lib/db/schema";
import { mensajes } from "@/lib/mensajes";
import { subirImagen } from "@/lib/subidas";
import {
  idDeRegistro,
  motivoEscrito,
  numeroDePedido,
  revisar,
} from "@/lib/validacion/acciones";

/**
 * LA PRUEBA DE ENTREGA.
 *
 * ══ PARA QUE SIRVE, EN UNA LINEA ══
 *
 * Un cobro con tarjeta se revierte hasta 120 dias despues. Cuando llega el
 * contracargo, el banco pregunta una sola cosa: **demuestrame que el comprador
 * recibio la mercancia**. Sin eso, la disputa se pierde y el dinero ya salio de
 * la cuenta.
 *
 * Hasta hoy solo se guardaba quien marco «entregado» y cuando. Eso dice que
 * alguien pulso un boton, no que la mercancia llegara.
 *
 * ══ QUIEN PUEDE APORTARLA ══
 *
 * El comercio que vendio y el equipo de Mercatren. **El comprador no**: seria
 * pedirle a la parte que reclama que aporte la prueba en su contra.
 */

type Resultado = { ok: boolean; mensaje: string };

/**
 * El pedido, si quien pregunta puede tocarlo.
 *
 * Un vendedor solo los suyos —comprobado por sus renglones, no por confianza—;
 * el equipo, cualquiera.
 */
async function pedidoQuePuedeTocar(numero: string) {
  const alcance = await obtenerAlcance().catch(() => null);
  if (!alcance) return null;

  const db = getDb();
  const [pedido] = await db
    .select({ id: pedidos.id, estado: pedidos.estado })
    .from(pedidos)
    .where(eq(pedidos.numero, numero))
    .limit(1);

  if (!pedido) return null;

  if (alcance.tipo === "tienda") {
    const [suyo] = await db
      .select({ id: itemsPedido.id })
      .from(itemsPedido)
      .where(
        and(
          eq(itemsPedido.pedidoId, pedido.id),
          eq(itemsPedido.tiendaId, alcance.tiendaId),
        ),
      )
      .limit(1);
    if (!suyo) return null;
  }

  return pedido;
}

/** Guarda una prueba: una guia, una foto, una firma o una nota. */
export async function guardarPruebaDeEntrega(
  formulario: FormData,
): Promise<Resultado> {
  const t = await mensajes();

  const revisadoNumero = revisar(numeroDePedido, formulario.get("numero"));
  if (!revisadoNumero.ok) {
    return { ok: false, mensaje: t(revisadoNumero.aviso) };
  }

  const pedido = await pedidoQuePuedeTocar(revisadoNumero.datos);
  if (!pedido) return { ok: false, mensaje: t("pedidoNoExiste") };

  const tipo = String(formulario.get("tipo") ?? "");
  if (!TIPOS_PRUEBA.includes(tipo as (typeof TIPOS_PRUEBA)[number])) {
    return { ok: false, mensaje: t("revisaLosDatos") };
  }

  const referencia = String(formulario.get("referencia") ?? "").trim() || null;
  const notaCruda = String(formulario.get("nota") ?? "").trim();

  /* La nota es opcional, pero si se escribe tiene que explicar algo: «ok» no
     defiende nada delante de un banco. */
  let nota: string | null = null;
  if (notaCruda) {
    const revisada = revisar(motivoEscrito, notaCruda);
    if (!revisada.ok) return { ok: false, mensaje: t(revisada.aviso) };
    nota = revisada.datos;
  }

  /* Una prueba vacia no es una prueba. */
  const archivo = formulario.get("archivo");
  const hayArchivo = archivo instanceof File && archivo.size > 0;
  if (!referencia && !nota && !hayArchivo) {
    return { ok: false, mensaje: t("pruebaVacia") };
  }

  let clave: string | null = null;
  if (hayArchivo) {
    /**
     * VA A NUESTRO BUCKET Y SE SIRVE POR `/media`, que ya comprueba quien
     * pregunta. Una foto de entrega lleva una direccion y a veces una persona:
     * no puede quedar en una direccion publica que cualquiera adivine.
     */
    const subida = await subirImagen(archivo, `entregas/${pedido.id}`);
    if (!subida.ok) return subida;
    clave = subida.clave;
  }

  const usuario = await obtenerUsuario();

  await getDb()
    .insert(pruebasEntrega)
    .values({
      id: nanoid(),
      pedidoId: pedido.id,
      tipo,
      referencia,
      clave,
      nota,
      /* Quien la aporto, y su nombre de hoy: si esa cuenta se borra, el registro
       tiene que seguir diciendo quien fue. */
      subidoPorId: usuario?.id ?? null,
      subidoPorNombre: usuario?.name ?? null,
      creadoEn: new Date(),
    });

  revalidatePath("/[locale]/panel", "layout");
  return { ok: true, mensaje: t("pruebaGuardada") };
}

/** Las pruebas de un pedido, la mas reciente primero. */
export async function listarPruebasDeEntrega(numero: string) {
  const revisado = revisar(numeroDePedido, numero);
  if (!revisado.ok) return [];

  const pedido = await pedidoQuePuedeTocar(revisado.datos);
  if (!pedido) return [];

  return getDb()
    .select({
      id: pruebasEntrega.id,
      tipo: pruebasEntrega.tipo,
      referencia: pruebasEntrega.referencia,
      clave: pruebasEntrega.clave,
      nota: pruebasEntrega.nota,
      subidoPorNombre: pruebasEntrega.subidoPorNombre,
      creadoEn: pruebasEntrega.creadoEn,
    })
    .from(pruebasEntrega)
    .where(eq(pruebasEntrega.pedidoId, pedido.id))
    .orderBy(desc(pruebasEntrega.creadoEn));
}

/**
 * Quitar una prueba.
 *
 * **Solo el equipo interno**, y a proposito: un comercio que pudiera borrar la
 * prueba que el mismo subio dejaria el expediente a su gusto justo cuando llega
 * la disputa.
 */
export async function borrarPruebaDeEntrega(id: string): Promise<Resultado> {
  const t = await mensajes();

  const alcance = await obtenerAlcance().catch(() => null);
  if (!alcance || alcance.tipo === "tienda") {
    return { ok: false, mensaje: t("soloEquipo") };
  }

  const revisado = revisar(idDeRegistro, id);
  if (!revisado.ok) return { ok: false, mensaje: t(revisado.aviso) };

  await getDb()
    .delete(pruebasEntrega)
    .where(eq(pruebasEntrega.id, revisado.datos));

  revalidatePath("/[locale]/panel", "layout");
  return { ok: true, mensaje: t("listo") };
}
