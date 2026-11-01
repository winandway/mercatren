import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import { crearLimite, secretoValido } from "@/lib/soporte/casos";

/**
 * LA PUERTA DEL GERENTE DE CORREO (1 nov 2026, pedido de Richard).
 *
 * El gerente de correo —otra sesión que lleva los buzones de Richard— lee los
 * casos de ayuda abiertos y los contesta por `/datos/gerente/tickets`. El
 * contrato es el de Divoox. Solo con «Authorization: Bearer <GERENTE_SECRETO>»
 * (variable del panel del sitio, nunca en el código), comparación en tiempo
 * constante y 30 intentos por minuto. Sin la variable cargada, la puerta no
 * existe para nadie (401).
 */
const limite = crearLimite(30, 60_000);

export async function revisarPuerta(
  peticion: Request,
): Promise<Response | null> {
  const ip =
    peticion.headers.get("cf-connecting-ip") ??
    peticion.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "desconocida";
  if (!limite(`${ip}:${new URL(peticion.url).pathname}`)) {
    return Response.json({ error: "Demasiados intentos." }, { status: 429 });
  }
  let esperado: string | undefined;
  try {
    esperado = (getCloudflareContext().env as { GERENTE_SECRETO?: string })
      .GERENTE_SECRETO;
  } catch {
    esperado = process.env.GERENTE_SECRETO;
  }
  if (!(await secretoValido(peticion.headers.get("authorization"), esperado))) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }
  return null;
}
