import "server-only";

import { and, desc, eq, inArray, lt } from "drizzle-orm";
import { nanoid } from "nanoid";

import { barrerNoVerificados } from "@/lib/cj/verificados";
import { correoAvisoAlEquipo } from "@/lib/correo/correos";
import { getDb } from "@/lib/db";
import {
  avisosVigilante,
  importacionesCj,
  latidosVigilante,
  tandasImportacionCj,
} from "@/lib/db/schema";
import { SITIO } from "@/lib/sitio";

import { recogerHechos } from "./hechos";
import {
  esFalloPasajero,
  evaluar,
  hayQueAvisar,
  textoDelCorreo,
  type Accion,
  type Alerta,
  type Hechos,
} from "./reglas";

/**
 * UNA CORRIDA DEL VIGILANTE: actuar, medir, alertar, avisar, dejar el latido.
 *
 * El orden importa: primero ACTÚA (lo que puede arreglar solo lo arregla
 * antes de medir, para que la alerta hable de lo que queda de verdad),
 * después MIDE y EVALÚA, y al final AVISA por correo lo que necesita una
 * persona — sin repetir el mismo correo cada 20 minutos.
 */
export type Latido = {
  id: string;
  corridoEnMs: number;
  duracionMs: number;
  origen: string;
  alertas: Alerta[];
  acciones: Accion[];
  hechos: Hechos;
  correoEnviado: boolean;
};

/** Los latidos viejos se limpian: treinta días bastan para mirar atrás. */
const GUARDAR_DIAS = 30;

async function actuar(): Promise<Accion[]> {
  const db = getDb();
  const acciones: Accion[] = [];

  /* 1. Nada de CJ a la venta sin pasar el último filtro; y lo que ya lo
     pasó, a la venta. */
  try {
    const b = await barrerNoVerificados();
    acciones.push({
      clave: "retirar-no-verificados",
      titulo: "Retirados de la venta por no tener flete real",
      cantidad: b.retirados,
    });
    acciones.push({
      clave: "publicar-verificados",
      titulo: "Publicados por pasar el último filtro",
      cantidad: b.publicados,
    });
  } catch (fallo) {
    console.error("[vigilante] el barrido falló:", fallo);
  }

  /* 1b. Unas fotos de servidores ajenos a nuestro bucket, dentro de la
     cuota de la hora: el reloj ya lo hace cada minuto, esto es por si el
     reloj no late. */
  try {
    const { traerFotosDesdeElReloj } =
      await import("@/lib/catalogo/fotos-automaticas");
    const f = await traerFotosDesdeElReloj({ maximo: 4 });
    acciones.push({
      clave: "traer-fotos",
      titulo: "Fotos copiadas a Mercatren desde el servidor del comercio",
      cantidad: f.copiadas,
    });
    if (f.rotas > 0) {
      acciones.push({
        clave: "fotos-dadas-por-perdidas",
        titulo: "Fotos dadas por perdidas (el origen ya no las tiene)",
        cantidad: f.rotas,
      });
    }
  } catch (fallo) {
    console.error("[vigilante] las fotos fallaron:", fallo);
  }

  /* 2. Las tandas de importación que fallaron por algo pasajero vuelven a
     la cola. Las de un fallo de verdad se quedan para que alguien las mire. */
  try {
    const vivas = await db
      .select({ id: importacionesCj.id })
      .from(importacionesCj)
      .where(eq(importacionesCj.estado, "en_curso"));
    let reintentadas = 0;
    for (const v of vivas) {
      const fallidas = await db
        .select({
          id: tandasImportacionCj.id,
          error: tandasImportacionCj.ultimoError,
        })
        .from(tandasImportacionCj)
        .where(
          and(
            eq(tandasImportacionCj.importacionId, v.id),
            eq(tandasImportacionCj.estado, "con_error"),
          ),
        )
        .limit(100);
      const pasajeras = fallidas.filter((t) => esFalloPasajero(t.error));
      if (pasajeras.length > 0) {
        await db
          .update(tandasImportacionCj)
          .set({ estado: "pendiente", tomadaEn: null })
          .where(
            inArray(
              tandasImportacionCj.id,
              pasajeras.map((t) => t.id),
            ),
          );
        reintentadas += pasajeras.length;
      }
    }
    acciones.push({
      clave: "reintentar-tandas",
      titulo:
        "Tandas de importación devueltas a la cola tras un fallo pasajero",
      cantidad: reintentadas,
    });
  } catch (fallo) {
    console.error("[vigilante] no se pudieron reintentar tandas:", fallo);
  }

  return acciones;
}

async function avisar(
  alertas: Alerta[],
  acciones: Accion[],
  ahora: Date,
): Promise<boolean> {
  if (alertas.length === 0) return false;
  const db = getDb();
  const previos = await db
    .select({
      clave: avisosVigilante.clave,
      avisadoEn: avisosVigilante.avisadoEn,
    })
    .from(avisosVigilante)
    .where(
      inArray(
        avisosVigilante.clave,
        alertas.map((a) => a.clave),
      ),
    )
    .catch(() => []);
  const cuando = new Map(previos.map((p) => [p.clave, p.avisadoEn.getTime()]));
  const pendientes = alertas.filter((a) =>
    hayQueAvisar(a.nivel, cuando.get(a.clave) ?? null, ahora.getTime()),
  );
  if (pendientes.length === 0) return false;

  const { asunto, lineas } = textoDelCorreo(pendientes, acciones);
  try {
    await correoAvisoAlEquipo({
      asunto,
      lineas,
      url: `${SITIO.url}/es/panel/vigilante`,
      boton: "Abrir el vigilante",
    });
  } catch (fallo) {
    /* Si el correo no sale, la alerta sigue en el panel y se reintenta en
       la próxima vuelta: no se marca como avisada. */
    console.error("[vigilante] el correo no salió:", fallo);
    return false;
  }
  for (const a of pendientes) {
    await db
      .insert(avisosVigilante)
      .values({
        clave: a.clave,
        nivel: a.nivel,
        titulo: a.titulo,
        avisadoEn: ahora,
      })
      .onConflictDoUpdate({
        target: avisosVigilante.clave,
        set: { nivel: a.nivel, titulo: a.titulo, avisadoEn: ahora },
      })
      .catch(() => undefined);
  }
  return true;
}

export async function correrVigilante(
  origen: "reloj" | "panel",
): Promise<Latido> {
  const arranque = Date.now();
  const acciones = await actuar();
  const hechos = await recogerHechos();
  const alertas = evaluar(hechos);
  const ahora = new Date();
  const correoEnviado = await avisar(alertas, acciones, ahora);

  const db = getDb();
  const id = `lat-${nanoid(10)}`;
  const latido: Latido = {
    id,
    corridoEnMs: ahora.getTime(),
    duracionMs: Date.now() - arranque,
    origen,
    alertas,
    acciones,
    hechos,
    correoEnviado,
  };
  try {
    await db.insert(latidosVigilante).values({
      id,
      corridoEn: ahora,
      duracionMs: latido.duracionMs,
      origen,
      alertas: JSON.stringify(alertas),
      acciones: JSON.stringify(acciones),
      hechos: JSON.stringify(hechos),
    });
    await db
      .delete(latidosVigilante)
      .where(
        lt(
          latidosVigilante.corridoEn,
          new Date(ahora.getTime() - GUARDAR_DIAS * 24 * 60 * 60 * 1000),
        ),
      );
  } catch (fallo) {
    console.error("[vigilante] no se pudo guardar el latido:", fallo);
  }
  return latido;
}

/** Los últimos latidos, del más nuevo al más viejo, para el panel. */
export async function ultimosLatidos(cuantos = 12): Promise<Latido[]> {
  const filas = await getDb()
    .select()
    .from(latidosVigilante)
    .orderBy(desc(latidosVigilante.corridoEn))
    .limit(cuantos)
    .catch(() => []);
  return filas.map((f) => ({
    id: f.id,
    corridoEnMs: f.corridoEn.getTime(),
    duracionMs: f.duracionMs,
    origen: f.origen,
    alertas: JSON.parse(f.alertas || "[]") as Alerta[],
    acciones: JSON.parse(f.acciones || "[]") as Accion[],
    hechos: JSON.parse(f.hechos || "{}") as Hechos,
    correoEnviado: false,
  }));
}
