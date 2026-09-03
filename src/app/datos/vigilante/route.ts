import { getCloudflareContext } from "@opennextjs/cloudflare";

import { autorizadoPorLlave } from "@/lib/seguridad/llave-del-reloj";
import { correrVigilante } from "@/lib/vigilante/correr";

/**
 * LA PUERTA DEL VIGILANTE. La toca el flujo `vigilante.yml` de GitHub cada
 * 20 minutos con la misma llave del reloj de sincronización. Sin llave
 * cargada, 503 y no hace nada; a quien no corresponde, 404.
 */
export const dynamic = "force-dynamic";

async function correr(peticion: Request) {
  const { env } = getCloudflareContext();
  const permiso = autorizadoPorLlave(peticion, env.SINCRONIZAR_LLAVE);
  if (permiso === "sin_llave") {
    return Response.json(
      { ok: false, motivo: "Falta SINCRONIZAR_LLAVE." },
      { status: 503 },
    );
  }
  if (permiso === "no") return Response.json({ ok: false }, { status: 404 });

  const latido = await correrVigilante("reloj");
  return Response.json({
    ok: true,
    id: latido.id,
    duracionMs: latido.duracionMs,
    alertas: latido.alertas,
    acciones: latido.acciones,
    correoEnviado: latido.correoEnviado,
    hechos: latido.hechos,
  });
}

export async function POST(peticion: Request) {
  return correr(peticion);
}

export async function GET(peticion: Request) {
  return correr(peticion);
}
