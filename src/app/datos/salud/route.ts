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
    /* ══ EL AVISO DE STRIPE (31 ago 2026) ══
       Sin este secreto, el sitio NO SE ENTERA de los cobros: el dinero
       entra en Stripe y el pedido se queda «esperando el pago» hasta que
       alguien abre su página y se concilia a mano — y con él se queda sin
       dispararse la compra al proveedor. Es la pieza que más silenciosa
       falla de todo el circuito, y desde fuera no se veía. */
    avisoDeStripe: hay("STRIPE_WEBHOOK_SECRET"),
  };
}

/**
 * ══ EL PROVEEDOR TAMBIÉN ES UN CANARIO (31 ago 2026) ══
 *
 * Lo pidió la realidad: una venta cobrada en Stripe y CERO pedidos en CJ,
 * sin forma de saber desde fuera si la llave del proveedor seguía viva. Su
 * token CADUCA, y cuando caduca la compra al proveedor falla en silencio
 * mientras las ventas siguen entrando. Aquí se dice en una palabra: `ok`,
 * `sin_llave` o `error`. Ni un carácter del token sale de aquí.
 */
async function saludDelProveedor(): Promise<string> {
  try {
    const { cjConfigurado, llamarCj } = await import("@/lib/cj/cliente");
    if (!cjConfigurado()) return "sin_llave";
    const r = await llamarCj<unknown>("/product/list?pageNum=1&pageSize=1");
    return r.ok ? "ok" : "error";
  } catch {
    return "error";
  }
}

/**
 * ══ ¿ESTÁ ARMADO EL AVISO DE STRIPE? (31 ago 2026) ══
 *
 * De ese webhook depende que un cobro se acredite solo. Si nadie lo registró
 * en el panel de Stripe —o está apagado, o sin el evento de pago, o falta el
 * secreto para verificar su firma— los cobros entran al banco y los pedidos
 * se quedan en «esperando el pago» SIN NINGÚN ERROR en ninguna pantalla.
 * Es una consulta de SOLO LECTURA a Stripe; ni un carácter de la llave sale.
 */
async function avisoDeStripeArmado(
  env: Record<string, string | undefined>,
): Promise<string> {
  try {
    const clave = env.STRIPE_SECRET_KEY?.trim();
    if (!clave) return "sin_llave";
    const r = await fetch(
      "https://api.stripe.com/v1/webhook_endpoints?limit=16",
      { headers: { authorization: `Bearer ${clave}` } },
    );
    if (!r.ok) return "error";
    const d = (await r.json().catch(() => null)) as {
      data?: Array<{
        url?: string;
        status?: string;
        enabled_events?: string[];
      }>;
    } | null;
    const nuestro = (d?.data ?? []).find(
      (w) => (w.url ?? "").includes("/datos/stripe") && w.status === "enabled",
    );
    if (!nuestro) return "falta";
    const eventos = nuestro.enabled_events ?? [];
    if (!eventos.includes("*") && !eventos.includes("payment_intent.succeeded"))
      return "sin_evento";
    /* Registrado y oyendo — pero sin el secreto la firma no se puede
       verificar y la puerta rechaza todo con 400. */
    if (!env.STRIPE_WEBHOOK_SECRET?.trim()) return "sin_secreto";
    return "ok";
  } catch {
    return "error";
  }
}

export async function GET() {
  const hora = new Date().toISOString();
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const metodos = metodosArmados(
    getCloudflareContext().env as unknown as Record<string, string | undefined>,
  );
  try {
    await getDb().run(sql`SELECT 1`);
    const [proveedor, avisoStripe] = await Promise.all([
      saludDelProveedor(),
      avisoDeStripeArmado(
        getCloudflareContext().env as unknown as Record<
          string,
          string | undefined
        >,
      ),
    ]);
    return Response.json(
      {
        ok: true,
        servicio: SITIO.nombre,
        version: VERSION_AGENTES,
        base: "ok",
        metodos,
        proveedor,
        avisoStripe,
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
