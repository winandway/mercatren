/**
 * «LO DE HOY», «ESTE MES», «HACE TRES MESES».
 *
 * ══ POR QUÉ ESTO FALTABA Y SE NOTABA ══
 *
 * La lista de ventas no tenía forma de acotar por fecha: se abría y salían
 * todas juntas, las de hoy revueltas con las de abril. Lo primero que pregunta
 * quien administra un negocio es «¿qué vendí hoy?», y esa pregunta no se podía
 * hacer.
 *
 * ══ POR QUÉ ES PURO ══
 *
 * Calcular desde cuándo cuenta «este mes» tiene bordes: el día 1 a las 00:00,
 * el cambio de año, un rango que llega hasta mañana. Se prueba aquí, no dentro
 * de una consulta.
 */

export type Rango = "hoy" | "7d" | "30d" | "mes" | "todo";

export const RANGOS: Rango[] = ["hoy", "7d", "30d", "mes", "todo"];

/** El rango por defecto: lo reciente, que es lo que se mira a diario. */
export const RANGO_POR_DEFECTO: Rango = "30d";

export function esRango(valor: string | undefined): valor is Rango {
  return Boolean(valor && (RANGOS as string[]).includes(valor));
}

/**
 * Desde cuándo cuenta un rango. `null` significa «sin límite».
 *
 * Se recibe `ahora` de fuera para poder probarlo: una función que lee el reloj
 * por dentro solo se puede comprobar con trampas, y justo los bordes —el
 * primero de mes, el cambio de año— son los que se rompen.
 */
export function desdeCuando(rango: Rango, ahora: Date): Date | null {
  const dia = 86_400_000;

  switch (rango) {
    case "hoy": {
      /* Desde la medianoche de hoy, no «hace 24 horas». Quien pregunta por lo
         de hoy quiere el día natural, no una ventana móvil. */
      const d = new Date(ahora);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "7d":
      return new Date(ahora.getTime() - 7 * dia);
    case "30d":
      return new Date(ahora.getTime() - 30 * dia);
    case "mes": {
      // El día 1 a las 00:00, sin importar en qué día del mes se pregunte.
      return new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0, 0);
    }
    case "todo":
      return null;
  }
}

/** Si una fecha cae dentro del rango. Lo que no tiene fecha no se descarta. */
export function dentroDelRango(
  fecha: Date | number | null,
  rango: Rango,
  ahora: Date,
): boolean {
  const desde = desdeCuando(rango, ahora);
  if (!desde) return true;

  /* Sin fecha se deja pasar: esconder un registro por no saber cuándo fue es
     peor que enseñarlo de más. El histórico importado tiene huecos. */
  if (fecha === null) return true;

  const t = fecha instanceof Date ? fecha.getTime() : fecha;
  return t >= desde.getTime();
}
