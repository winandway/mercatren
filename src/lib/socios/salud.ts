import "server-only";

import { desc, eq } from "drizzle-orm";

import {
  saludDeSincronizacion,
  type SaludSincronizacion,
} from "@/lib/catalogo/salud-sincronizacion";
import { getDb } from "@/lib/db";
import { fuentesCatalogo, sociosTienda, tiendas } from "@/lib/db/schema";

/**
 * ¿SIGUEN LLEGANDO LOS CATÁLOGOS DE LOS COMERCIOS?
 *
 * ══ EL AGUJERO QUE TAPA ══
 *
 * Un comercio puede mantener su catálogo al día por dos caminos distintos:
 *
 *  1. **Él nos empuja** los cambios desde su propio sistema
 *     (`POST /datos/socios/productos`, tabla `socios_tienda`).
 *  2. **Nosotros leemos** el archivo que publica
 *     (`fuentes_catalogo.url`, ahora cada 15 minutos).
 *
 * Los dos estaban construidos y **ninguno tenía pantalla**. Si el sistema de
 * un comercio dejaba de empujar, aquí no se veía absolutamente nada: los
 * productos seguían publicados con el precio y las existencias del último día
 * que funcionó. Comprobado el 15 ago 2026 con la ferretería piloto — lijas
 * nuevas en su depósito que aquí no existían, y ventas suyas que no bajaban el
 * stock.
 *
 * Un catálogo que envejece en silencio es peor que uno vacío: el vacío hace
 * preguntar, el viejo hace vender lo que ya no hay.
 *
 * ══ SE MIRAN LOS DOS CAMINOS JUNTOS ══
 *
 * Un comercio que empuja no necesita publicar archivo, y al revés. Mirar solo
 * uno daría una alarma falsa en la mitad de los casos, y una alarma falsa
 * enseña a ignorar la alarma.
 */

export type SaludDeComercio = {
  tiendaId: string;
  tienda: string;
  /** `empuja` = su sistema nos manda los cambios. `leemos` = leemos su archivo. */
  via: "empuja" | "leemos" | "ninguna";
  plataforma: string | null;
  ultima: Date | null;
  ultimoResultado: string | null;
  salud: SaludSincronizacion;
};

/**
 * LA TOLERANCIA DE AQUÍ ES OTRA, Y MÁS LARGA.
 *
 * El robotito nuestro corre cada cuarto de hora, así que ahí media hora ya es
 * raro. Pero el sistema de un comercio empuja **cuando cambia algo**: una
 * ferretería que no tocó nada desde ayer no está rota, simplemente no vendió
 * de madrugada. Un día entero de silencio sí es raro en un negocio que abre
 * todos los días.
 */
export const TOLERANCIA_SOCIO_MINUTOS = 60 * 24;

export async function saludDeLosComercios(
  ahora: Date = new Date(),
): Promise<SaludDeComercio[]> {
  const db = getDb();

  const [socios, fuentes] = await Promise.all([
    db
      .select({
        tiendaId: sociosTienda.tiendaId,
        tienda: tiendas.nombre,
        plataforma: sociosTienda.plataforma,
        actualizadoEn: sociosTienda.actualizadoEn,
        ultimoResultado: sociosTienda.ultimoResultado,
      })
      .from(sociosTienda)
      .innerJoin(tiendas, eq(tiendas.id, sociosTienda.tiendaId))
      .orderBy(desc(sociosTienda.actualizadoEn))
      .catch(() => []),
    db
      .select({
        tiendaId: fuentesCatalogo.tiendaId,
        tienda: tiendas.nombre,
        url: fuentesCatalogo.url,
        ultima: fuentesCatalogo.ultimaSincronizacion,
        ultimoResultado: fuentesCatalogo.ultimoResultado,
      })
      .from(fuentesCatalogo)
      .innerJoin(tiendas, eq(tiendas.id, fuentesCatalogo.tiendaId))
      .catch(() => []),
  ]);

  const filas: SaludDeComercio[] = [];
  const yaVistas = new Set<string>();

  /* Primero los que empujan: si un comercio usa los dos caminos, el que manda
     es el suyo — es el que trae los cambios en cuanto ocurren. */
  for (const s of socios) {
    yaVistas.add(s.tiendaId);
    filas.push({
      tiendaId: s.tiendaId,
      tienda: s.tienda,
      via: "empuja",
      plataforma: s.plataforma,
      ultima: s.actualizadoEn ?? null,
      ultimoResultado: s.ultimoResultado,
      salud: saludDeSincronizacion(s.actualizadoEn, ahora, {
        toleranciaMinutos: TOLERANCIA_SOCIO_MINUTOS,
      }),
    });
  }

  for (const f of fuentes) {
    if (yaVistas.has(f.tiendaId)) continue;
    const tieneDireccion = Boolean(f.url?.trim());
    filas.push({
      tiendaId: f.tiendaId,
      tienda: f.tienda,
      via: tieneDireccion ? "leemos" : "ninguna",
      plataforma: null,
      ultima: f.ultima ?? null,
      ultimoResultado: f.ultimoResultado,
      salud: saludDeSincronizacion(f.ultima, ahora, { tieneDireccion }),
    });
  }

  /* Lo atrasado primero: si hay veinte comercios, el que está roto no puede
     quedar en el puesto diecisiete, que es donde nadie mira. */
  const peso = { atrasada: 0, nunca: 1, sin_direccion: 2, al_dia: 3 } as const;
  return filas.sort((a, b) => peso[a.salud.nivel] - peso[b.salud.nivel]);
}
