import { getCloudflareContext } from "@opennextjs/cloudflare";

import { autorizadoPorLlave } from "@/lib/seguridad/llave-del-reloj";
import { correrTick, reclamarTick } from "@/lib/reloj/tick";

/**
 * LA PUERTA DEL RELOJ PROPIO (3 sep 2026). Ver `src/lib/reloj/tick.ts`.
 *
 * YaDominios Cloud invoca `/__scheduled` en el minuto declarado en
 * `yadominios.json` (`triggers.crons`), con la cabecera `x-yad-cron`, y el
 * middleware lo reescribe aquí: Next trata las carpetas que empiezan por
 * guion bajo como privadas y una ruta en `app/__scheduled` caía en la página
 * 404 (medido en producción). También la puede tocar el equipo con la llave
 * del reloj, para probarla a mano.
 *
 * Contesta ENSEGUIDA y trabaja después (`ctx.waitUntil`): así el planificador
 * no espera y el trabajo tiene sus 25 segundos completos. Sin cabecera ni
 * llave: 404, como toda puerta que no es para el público. Y aun con ellas,
 * el reclamo de la marca impide que dos latidos se pisen o que alguien
 * provoque más trabajo del que el reloj ya hace.
 */
export const dynamic = "force-dynamic";

async function latir(peticion: Request) {
  const { env, ctx } = getCloudflareContext();
  const desdeElPlanificador = Boolean(peticion.headers.get("x-yad-cron"));
  const conLlave = autorizadoPorLlave(peticion, env.SINCRONIZAR_LLAVE) === "si";
  if (!desdeElPlanificador && !conLlave) {
    return Response.json({ ok: false }, { status: 404 });
  }

  const ahoraMs = Date.now();
  let tomado = false;
  try {
    tomado = await reclamarTick(ahoraMs);
  } catch (fallo) {
    console.error("[tick] no se pudo reclamar la marca:", fallo);
    return Response.json({ ok: false, motivo: "sin base" }, { status: 503 });
  }
  if (!tomado) {
    return Response.json({
      ok: true,
      hizo: [],
      motivo: "otro latido acaba de pasar",
    });
  }

  const trabajo = correrTick().then(
    (r) =>
      console.log(
        "[tick]",
        r.duracionMs,
        "ms:",
        r.hizo.join(" · ") || "nada pendiente",
      ),
    (fallo) => console.error("[tick] falló:", fallo),
  );
  ctx.waitUntil(trabajo);
  return Response.json(
    { ok: true, arrancado: true, en: ahoraMs },
    { status: 202 },
  );
}

export async function GET(peticion: Request) {
  return latir(peticion);
}

export async function POST(peticion: Request) {
  return latir(peticion);
}
