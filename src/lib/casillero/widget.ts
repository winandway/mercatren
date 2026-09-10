import "server-only";

import { and, eq, gte, sql } from "drizzle-orm";

import { TOPE_POR_VENTANA, VENTANA_MS } from "@/lib/casillero/widget-puro";

import { getDb } from "@/lib/db";
import { intentosCasillero, origenesCasillero } from "@/lib/db/schema";

/**
 * ══ LA PUERTA MÁS EXPUESTA DEL SISTEMA ══
 *
 * El widget crea casilleros **sin sesión**, desde otro dominio. Es la única
 * entrada del sistema que escribe en la base sin que nadie se haya
 * identificado, así que lleva cuatro cerrojos y ninguno sobra:
 *
 * 1. **Clave pública por origen**, que se apaga desde el panel sin tocar
 *    código el día que alguien la publique en un foro.
 * 2. **El dominio se valida contra el `Origin`**: una clave robada solo
 *    sirve desde el sitio para el que se emitió.
 * 3. **Límite por IP y por clave**, en tabla porque la plataforma no tiene
 *    almacén de llaves.
 * 4. **Trampa invisible y tiempo mínimo**: descarta los robots baratos, que
 *    son la mayoría.
 */

export {
  TOPE_POR_VENTANA,
  VENTANA_MS,
  SEGUNDOS_MINIMOS,
  dominioAutorizado,
  nuevaClavePublica,
} from "@/lib/casillero/widget-puro";

export type OrigenValido = {
  id: string;
  nombre: string;
  dominio: string;
};

export async function origenPorClave(
  clave: string,
): Promise<OrigenValido | null> {
  if (!/^pk_[A-Za-z0-9]{8,64}$/.test(clave)) return null;
  const [fila] = await getDb()
    .select({
      id: origenesCasillero.id,
      nombre: origenesCasillero.nombre,
      dominio: origenesCasillero.dominio,
    })
    .from(origenesCasillero)
    .where(
      and(
        eq(origenesCasillero.clavePublica, clave),
        eq(origenesCasillero.activo, true),
      ),
    )
    .limit(1)
    .catch(() => []);
  return fila ?? null;
}

/**
 * ¿Este visitante ya se pasó? Devuelve true si hay que cortarle.
 *
 * La ventana se guarda en la fila: sin `ventana_desde`, un contador que
 * solo sube deja bloqueada para siempre a una oficina entera detrás de la
 * misma salida a internet.
 */
export async function seLePaso(clave: string): Promise<boolean> {
  const db = getDb();
  const ahora = new Date();
  const desde = new Date(ahora.getTime() - VENTANA_MS);
  try {
    const [fila] = await db
      .select({
        conteo: intentosCasillero.conteo,
        ventanaDesde: intentosCasillero.ventanaDesde,
      })
      .from(intentosCasillero)
      .where(eq(intentosCasillero.clave, clave))
      .limit(1);

    if (!fila || fila.ventanaDesde < desde) {
      await db
        .insert(intentosCasillero)
        .values({ clave, conteo: 1, ventanaDesde: ahora })
        .onConflictDoUpdate({
          target: intentosCasillero.clave,
          set: { conteo: 1, ventanaDesde: ahora },
        });
      return false;
    }
    if (fila.conteo >= TOPE_POR_VENTANA) return true;
    await db
      .update(intentosCasillero)
      .set({ conteo: sql`${intentosCasillero.conteo} + 1` })
      .where(
        and(
          eq(intentosCasillero.clave, clave),
          gte(intentosCasillero.ventanaDesde, desde),
        ),
      );
    return false;
  } catch (fallo) {
    /* ══ SI EL CONTADOR FALLA, SE CIERRA (corregido 9 sep 2026) ══
     *
     * La primera versión dejaba pasar «para no cerrarle la puerta a todo el
     * mundo por un error nuestro». El razonamiento vale para una pantalla
     * de entrada, donde detrás siguen la contraseña y el rol — y no vale
     * aquí: **este es el único cerrojo que un robot no puede saltarse**.
     * Los otros tres (la clave, el dominio y la trampa) son justo los que
     * ya burló quien llegue hasta acá.
     *
     * Y cerrar cuesta poco: quien de verdad quiere su casillero lo crea en
     * mercatren.com, que no depende de esta tabla. */
    console.error("[widget] el límite de intentos falló, se corta:", fallo);
    return true;
  }
}

/** La IP nunca se guarda en claro: solo su huella. */
export async function huellaDeIp(ip: string | null): Promise<string | null> {
  if (!ip) return null;
  const datos = new TextEncoder().encode(`casillero:${ip}`);
  const hash = await crypto.subtle.digest("SHA-256", datos);
  return [...new Uint8Array(hash)]
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
