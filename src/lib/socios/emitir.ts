"use server";

import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { obtenerUsuario } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { sociosTienda, tiendas } from "@/lib/db/schema";
import { mensajes } from "@/lib/mensajes";
import { generarToken, hashDeToken } from "@/lib/socios/token";
import { idDeRegistro, revisar } from "@/lib/validacion/acciones";

/**
 * EMITIRLE A UN COMERCIO SU TOKEN DE INTEGRACIÓN.
 *
 * ══ POR QUÉ HACÍA FALTA (14 ago 2026) ══
 *
 * `/datos/socios/cobro` —el botón «Cobrar por Mercatren» de la caja del
 * comercio— exige un token por tienda. Ese token solo se podía obtener por
 * `/datos/socios/vincular`, que está hecho para una plataforma socia que se
 * conecta sola con la `SOCIO_LLAVE` y trae su propio identificador.
 *
 * Para un comercio que YA tiene su tienda aquí y solo quiere cobrar desde su
 * sistema, ese camino no sirve: no hay plataforma que llame, no hay
 * `externoId` que traer, y la llave de socio no se le puede prestar a nadie
 * —quien la tenga puede pedir el token de CUALQUIER tienda—.
 *
 * Sin esto, montar el primer comercio exigía escribir a mano en la base de
 * producción. Es justo la clase de cosa que no debe hacerse a mano.
 *
 * ══ SOLO SOPORTE ══
 *
 * Este token deja crear cobros a nombre del comercio y mandar correos a sus
 * clientes. No es una tarea operativa: la decisión de integrar a un comercio
 * es del equipo, no de un validador ni del propio comercio.
 *
 * ══ SE ENSEÑA UNA SOLA VEZ ══
 *
 * En la base solo queda el SHA-256. Si se pierde, no se recupera: se emite otro
 * y el anterior deja de servir en ese mismo momento. Es a propósito — una copia
 * de la base no puede ser la llave de los cobros de nadie.
 */

type Resultado =
  { ok: true; token: string; mensaje: string } | { ok: false; mensaje: string };

/** Cómo se llama esta integración en la tabla. */
const PLATAFORMA = "propio";

export async function emitirTokenDeComercio(
  formulario: FormData,
): Promise<Resultado> {
  const t = await mensajes();

  const quien = await obtenerUsuario();
  if (quien?.rol !== "soporte") {
    return { ok: false, mensaje: t("soloSoporte") };
  }

  const revisado = revisar(idDeRegistro, formulario.get("tiendaId"));
  if (!revisado.ok) return { ok: false, mensaje: t(revisado.aviso) };

  const db = getDb();

  const [tienda] = await db
    .select({ id: tiendas.id, nombre: tiendas.nombre })
    .from(tiendas)
    .where(eq(tiendas.id, revisado.datos))
    .limit(1);

  if (!tienda) return { ok: false, mensaje: t("cuentaNoExiste") };

  const token = generarToken();
  const hash = await hashDeToken(token);
  const ahora = new Date();

  /**
   * UNO POR COMERCIO: EL NUEVO REEMPLAZA AL ANTERIOR.
   *
   * Dejar vivos los dos convierte «lo rotamos porque se filtró» en «hay dos
   * llaves y una anda suelta». Al emitir de nuevo, el de antes deja de servir
   * en ese mismo momento y hay que cargarlo otra vez en el sistema del
   * comercio — eso se le dice ANTES de pulsar, no después.
   */
  const [previo] = await db
    .select({ id: sociosTienda.id })
    .from(sociosTienda)
    .where(
      and(
        eq(sociosTienda.tiendaId, tienda.id),
        eq(sociosTienda.plataforma, PLATAFORMA),
      ),
    )
    .limit(1);

  if (previo) {
    await db
      .update(sociosTienda)
      .set({ tokenHash: hash, actualizadoEn: ahora })
      .where(eq(sociosTienda.id, previo.id));
  } else {
    await db.insert(sociosTienda).values({
      id: `socio-${nanoid(12)}`,
      tiendaId: tienda.id,
      plataforma: PLATAFORMA,
      /* No viene de ninguna plataforma de fuera: el identificador externo es
         el nuestro. Poner algo inventado aquí haría creer que hay un sistema
         ajeno detrás cuando el que llama es el propio comercio. */
      externoId: tienda.id,
      tokenHash: hash,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });
  }

  return {
    ok: true,
    token,
    mensaje: t(previo ? "tokenRotado" : "tokenEmitido", {
      comercio: tienda.nombre,
    }),
  };
}
