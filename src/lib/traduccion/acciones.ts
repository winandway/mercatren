"use server";

import { and, eq, isNotNull } from "drizzle-orm";

import { esSoporteDeVerdad } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { productos, tiendas } from "@/lib/db/schema";

import { traducirTanda, traductorConfigurado } from "./modelo";
import { faltaTraducir, POR_TANDA, type PeticionDeTraduccion } from "./reglas";

/**
 * TRADUCIR EL CATÁLOGO DE ESTADOS UNIDOS, POR TANDAS.
 *
 * ══ POR QUÉ UN BOTÓN Y NO UN SCRIPT ══
 *
 * Porque el catálogo vive en la base de producción, y esa no se toca desde una
 * computadora con un script suelto. Igual que «Repartir por rubro» y «Traer
 * las fotos»: quien lo dispara es una persona del equipo, desde el panel, y
 * ve lo que va pasando.
 *
 * ══ SE PUEDE PARAR Y RETOMAR, Y ESO NO ES UN LUJO ══
 *
 * Cada llamada traduce una tanda y devuelve cuántos quedan. La pantalla la
 * vuelve a llamar hasta que no queda ninguno. Si se cierra el navegador a
 * mitad, lo traducido se queda traducido y al volver sigue por donde iba,
 * porque **lo que decide qué falta es el propio dato**, no un contador
 * guardado en algún sitio: un producto está sin traducir cuando su título en
 * español todavía es idéntico al inglés.
 *
 * Eso lo hace idempotente de verdad. Se puede pulsar mil veces.
 */

export type ResultadoTraduccion = {
  ok: boolean;
  traducidos: number;
  restantes: number;
  motivo?: string;
};

const NO_AUTORIZADO: ResultadoTraduccion = {
  ok: false,
  traducidos: 0,
  restantes: 0,
  motivo: "no-autorizado",
};

export async function traducirCatalogoUs(): Promise<ResultadoTraduccion> {
  /* SOLO EL ROL `soporte`, Y COMPROBADO EN EL SERVIDOR.
     Esto reescribe el título de productos publicados —lo que ve el comprador
     y lo que lee Google— así que no basta con «ser del equipo»: se usa el
     mismo candado que los retiros a Mercury. Quien esté mirando el panel de un
     comercio con el disfraz de «ver su panel» tampoco pasa. */
  if (!(await esSoporteDeVerdad())) return NO_AUTORIZADO;

  if (!traductorConfigurado()) {
    return {
      ok: false,
      traducidos: 0,
      restantes: 0,
      motivo:
        "Falta la variable TRADUCCION_LLAVE en el panel del sitio. Sin ella no se traduce nada y el catálogo se queda como está.",
    };
  }

  const db = getDb();

  /* SOLO LAS COLUMNAS QUE HACEN FALTA, NUNCA LA TABLA ENTERA.
     Pedir `productos` completo lista todas las columnas del esquema, incluidas
     las que aún no existen en la base de producción — y eso ya tumbó una
     pantalla entera el 5 ago 2026. */
  const candidatos = await db
    .select({
      id: productos.id,
      tituloEs: productos.tituloEs,
      tituloEn: productos.tituloEn,
    })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(
      and(eq(tiendas.paisOrigen, "US"), isNotNull(productos.tituloEn)),
    );

  const pendientes = candidatos.filter(faltaTraducir);
  if (pendientes.length === 0) {
    return { ok: true, traducidos: 0, restantes: 0 };
  }

  const tanda: PeticionDeTraduccion[] = pendientes
    .slice(0, POR_TANDA)
    .map((p) => ({ id: p.id, tituloEn: (p.tituloEn ?? "").trim() }));

  const resultado = await traducirTanda(tanda);
  if (!resultado.ok) {
    return {
      ok: false,
      traducidos: 0,
      restantes: pendientes.length,
      motivo: resultado.motivo,
    };
  }

  let guardados = 0;
  for (const t of resultado.traducciones) {
    try {
      await db
        .update(productos)
        .set({ tituloEs: t.tituloEs, actualizadoEn: new Date() })
        .where(eq(productos.id, t.id));
      guardados += 1;
    } catch (fallo) {
      /* Que uno falle no detiene a los demás: son productos independientes y
         una tanda a medias es mejor que ninguna. El que falle se vuelve a
         intentar solo en la siguiente pasada, porque sigue sin traducir. */
      console.error("[traduccion] no se pudo guardar", t.id, fallo);
    }
  }

  return {
    ok: true,
    traducidos: guardados,
    restantes: Math.max(0, pendientes.length - guardados),
  };
}

/** Cuántos productos de EE. UU. siguen sin traducir. Para pintar la pantalla. */
export async function contarSinTraducir(): Promise<number> {
  if (!(await esSoporteDeVerdad())) return 0;

  const db = getDb();
  const filas = await db
    .select({
      id: productos.id,
      tituloEs: productos.tituloEs,
      tituloEn: productos.tituloEn,
    })
    .from(productos)
    .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
    .where(and(eq(tiendas.paisOrigen, "US"), isNotNull(productos.tituloEn)));

  return filas.filter(faltaTraducir).length;
}

/** Para el panel: ¿se puede traducir, o falta la llave? */
export async function estadoDelTraductor(): Promise<{
  configurado: boolean;
  sinTraducir: number;
}> {
  if (!(await esSoporteDeVerdad())) {
    return { configurado: false, sinTraducir: 0 };
  }
  return {
    configurado: traductorConfigurado(),
    sinTraducir: await contarSinTraducir(),
  };
}
