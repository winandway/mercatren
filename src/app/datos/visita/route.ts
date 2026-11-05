import { esRobot, rutaLimpia } from "@/lib/trafico/bots";

/**
 * EL PULSO DEL TRÁFICO (30 ago 2026).
 *
 * El navegador manda aquí cada página vista, y al salir, cuántos segundos
 * estuvo. Sin cookies: el visitante es un hash que rota cada día (IP +
 * navegador + fecha) — se cuentan personas únicas sin identificar a nadie,
 * el patrón de Plausible/Umami. Los robots no ejecutan JavaScript, así que
 * ni llegan; a los que llegan se les revisa el User-Agent.
 *
 * Nunca responde error al visitante: medir jamás puede estorbar la visita.
 */

/**
 * ══ MIRAR NO ESCRIBE (5 nov 2026, regla «La nube no se come el dinero») ══
 *
 * Una visita no escribe en la base: ni contadores ni «estuvo aquí». Desde hoy
 * la página ni siquiera manda el pulso (`pulso-de-visita.tsx` no se monta), y
 * si alguien llama a esta ruta, la visita queda en los registros del servidor
 * y nada más. La tabla `visitas` conserva la historia hasta el 5 nov 2026.
 */
export async function POST(peticion: Request) {
  try {
    const ua = peticion.headers.get("user-agent");
    if (esRobot(ua)) return Response.json({ ok: true });
    const cuerpo = (await peticion.json().catch(() => null)) as {
      ruta?: string;
    } | null;
    if (cuerpo?.ruta) {
      console.log(
        JSON.stringify({ visita: rutaLimpia(cuerpo.ruta), hora: Date.now() }),
      );
    }
  } catch {
    /* Medir jamás estorba la visita. */
  }
  return Response.json({ ok: true });
}
