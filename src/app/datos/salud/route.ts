import { sql } from "drizzle-orm";

import { VERSION_AGENTES } from "@/lib/agentes/recursos";
import { getDb } from "@/lib/db";
import { SITIO } from "@/lib/sitio";

export const dynamic = "force-dynamic";

/**
 * EL CANARIO: ¿está vivo el sitio y contesta su base?
 *
 * Lo enlazan el catálogo de la API y la tarjeta MCP como `status`, y sirve
 * para la prueba de humo después de publicar. Si la base no responde se dice
 * (`ok: false`, 503) en vez de un 200 que mienta.
 */
/**
 * ¿QUÉ FORMAS DE COBRO ESTÁN ARMADAS?
 *
 * ══ POR QUÉ ESTÁ EN EL CANARIO Y NO SOLO EN EL PANEL ══
 *
 * Porque una variable a medio cargar **no se ve**: el método desaparece del
 * enlace de cobro y desde fuera el sitio se ve exactamente igual. La pantalla
 * del panel lo dice, pero está detrás de una sesión — así que la única forma de
 * comprobarlo después de publicar era pedirle a una persona que entrara a
 * mirar. Eso ya fue causa de una afirmación equivocada de nuestro lado.
 *
 * ══ NO SE EXPONE NI UN DÍGITO ══
 *
 * Solo un sí o un no por método. Es exactamente lo mismo que ve cualquiera que
 * abra un enlace de cobro —«aquí se puede pagar por ACH»—, así que no cuenta
 * nada que no fuera público ya. La cuenta y las rutas no salen de aquí ni
 * recortadas.
 */
function metodosArmados(env: Record<string, string | undefined>) {
  const hay = (...llaves: string[]) => llaves.every((k) => env[k]?.trim());
  return {
    zelle: hay("ZELLE_CORREO_RECEPTOR"),
    /* Las cuatro o ninguna: media instrucción bancaria manda el dinero a otra
       parte, así que el método solo cuenta como armado si está completo. */
    ach: hay("PAGO_BENEFICIARIO", "PAGO_BANCO", "PAGO_CUENTA", "PAGO_RUTA_ACH"),
    achAlterna: hay(
      "PAGO_ALT_BENEFICIARIO",
      "PAGO_ALT_BANCO",
      "PAGO_ALT_CUENTA",
      "PAGO_ALT_RUTA_ACH",
    ),
    wire: hay(
      "PAGO_BENEFICIARIO",
      "PAGO_BANCO",
      "PAGO_CUENTA",
      "PAGO_RUTA_WIRE",
    ),
  };
}

export async function GET() {
  const hora = new Date().toISOString();
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const metodos = metodosArmados(
    getCloudflareContext().env as unknown as Record<string, string | undefined>,
  );
  try {
    await getDb().run(sql`SELECT 1`);
    return Response.json(
      {
        ok: true,
        servicio: SITIO.nombre,
        version: VERSION_AGENTES,
        base: "ok",
        metodos,
        hora,
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (e) {
    console.error("[salud] la base no respondió:", e);
    return Response.json(
      {
        ok: false,
        servicio: SITIO.nombre,
        version: VERSION_AGENTES,
        base: "error",
        hora,
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
}
