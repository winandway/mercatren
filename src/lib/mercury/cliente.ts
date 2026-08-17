import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * LA PUERTA AL BANCO.
 *
 * ══ QUÉ PUEDE Y QUÉ NO PUEDE HACER ══
 *
 * El token que usa este cliente es **Custom** y lleva cuatro permisos, ni uno
 * más: leer cuentas, leer destinatarios, leer transacciones y **pedir un pago
 * con aprobación**.
 *
 * NO tiene `Send Money`. Eso es deliberado y es la pieza de seguridad más
 * importante de todo esto: si este token se filtrara, quien lo tenga **no
 * puede sacar dinero**. Lo peor que puede hacer es dejar solicitudes de pago
 * que alguien tiene que aprobar a mano en Mercury, y que se rechazan de un
 * clic.
 *
 * Por eso tampoco hace falta lista blanca de IP: Mercury solo la exige para
 * los permisos que mueven dinero solos. El código corre en Cloudflare, que
 * sale por miles de direcciones distintas, así que una lista blanca ahí sería
 * o imposible o tan ancha que no protegería de nada.
 *
 * ══ EL ALTA DEL DESTINATARIO SE HACE A MANO, A PROPÓSITO ══
 *
 * Dar de alta la cuenta bancaria de un comercio pasa UNA vez y es justo el
 * momento en que conviene que una persona lea el titular, el banco y el
 * número. Ahí es donde se manda dinero a la cuenta equivocada, y un ACH no se
 * revierte. Lo que se repite mil veces —pedir el pago— sí es automático.
 */

const BASE = "https://api.mercury.com/api/v1";

export type RespuestaMercury<T> =
  { ok: true; datos: T } | { ok: false; estado: number; motivo: string };

/**
 * El token sale del entorno del sitio, igual que el del correo.
 *
 * **Se recorta a propósito.** Al pegar una credencial en el panel de la
 * plataforma es facilísimo arrastrar un salto de línea o un espacio del final,
 * y el banco devuelve el mismo 401 que si la llave fuera falsa. Recortar no
 * cuesta nada y ahorra una tarde de buscar dónde está el error.
 */
function token(): string | undefined {
  return getCloudflareContext().env.MERCURY_TOKEN?.trim() || undefined;
}

/**
 * CÓMO LLEGÓ LA LLAVE, SIN ENSEÑARLA.
 *
 * Cuando el banco rechaza el token hay tres culpables posibles y el síntoma es
 * idéntico en los tres: que esté mal, que le sobre un espacio, o que el panel
 * de la plataforma la haya guardado a medias — ya pasó con otros campos
 * largos. Adivinar entre los tres es una tarde perdida.
 *
 * Esto devuelve el LARGO y si venía con espacios, nunca el contenido. Con eso
 * se compara contra la llave original y se sabe en un vistazo si llegó
 * entera. Un token de Mercury ronda los 70 caracteres y empieza por
 * `secret-token:`.
 */
export function comoLlegoLaLlave(): {
  largo: number;
  teniaEspacios: boolean;
  empiezaBien: boolean;
} | null {
  const crudo = getCloudflareContext().env.MERCURY_TOKEN;
  if (!crudo) return null;

  const limpio = crudo.trim();
  return {
    largo: limpio.length,
    teniaEspacios: limpio.length !== crudo.length,
    empiezaBien: limpio.startsWith("secret-token:"),
  };
}

/** Si no hay token, el sistema sigue funcionando: solo no habla con el banco. */
export function mercuryConfigurado(): boolean {
  return Boolean(token());
}

async function pedir<T>(
  ruta: string,
  opciones?: { metodo?: string; cuerpo?: unknown },
): Promise<RespuestaMercury<T>> {
  const llave = token();
  if (!llave) {
    return { ok: false, estado: 0, motivo: "sin_token" };
  }

  try {
    const respuesta = await fetch(`${BASE}${ruta}`, {
      method: opciones?.metodo ?? "GET",
      headers: {
        Authorization: `Bearer ${llave}`,
        "Content-Type": "application/json",
      },
      body: opciones?.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined,
      /* El dinero no se lee de una caché. */
      cache: "no-store",
    });

    if (!respuesta.ok) {
      /* El cuerpo del error se devuelve tal cual para poder enseñarlo en el
         panel. Un «falló» a secas obliga a adivinar, y con el banco de por
         medio adivinar sale caro. */
      const texto = await respuesta.text().catch(() => "");
      return {
        ok: false,
        estado: respuesta.status,
        motivo: texto.slice(0, 300) || respuesta.statusText,
      };
    }

    return { ok: true, datos: (await respuesta.json()) as T };
  } catch (error) {
    return {
      ok: false,
      estado: 0,
      motivo: error instanceof Error ? error.message : "error_de_red",
    };
  }
}

export type CuentaMercury = {
  id: string;
  name: string;
  /** `checking` o `savings`. La operativa va siempre por la corriente. */
  kind: string;
  /** Mercury lo devuelve en dólares con decimales, no en centavos. */
  availableBalance: number;
  currentBalance: number;
  accountNumber: string;
  routingNumber: string;
  status: string;
};

export async function listarCuentas(): Promise<
  RespuestaMercury<{ accounts: CuentaMercury[] }>
> {
  return pedir<{ accounts: CuentaMercury[] }>("/accounts");
}

/**
 * ══════════════════════════════════════════════════════════════════════════
 * MANDAR DINERO: EL DESTINATARIO Y LA SOLICITUD DE PAGO
 * ══════════════════════════════════════════════════════════════════════════
 *
 * ══ POR QUÉ `request-send-money` Y NO `transactions` ══
 *
 * Son dos endpoints distintos y la diferencia lo decide todo. Comprobado en la
 * documentación de Mercury el 16 ago 2026:
 *
 *   · `POST /account/{id}/transactions` — envía de una. Solo acepta `ach`,
 *     `check` y `domesticWire`, y **exige lista blanca de IP** para el token
 *     de escritura.
 *
 *   · `POST /account/{id}/request-send-money` — **acepta también
 *     `internationalWire`**, deja el pago esperando aprobación humana dentro
 *     de Mercury, y **está EXENTO de la lista blanca de IP**.
 *
 * El tercer punto es el que hace esto posible: el sitio corre en el borde y no
 * tiene una IP fija que declarar. Con el primer endpoint la automatización
 * sería inviable. El segundo está exento **precisamente porque el dinero no
 * sale sin que una persona lo apruebe** — o sea, la forma de trabajar que
 * queríamos es la que el banco premia.
 *
 * ══ Y LOS WIRES INTERNACIONALES SON LA MAYORÍA ══
 *
 * De los doce países que acepta el formulario, once salen por wire. Con
 * `transactions` solo se habría podido automatizar Estados Unidos.
 */

/** Lo que Mercury entiende por forma de pago. */
export type MetodoMercury =
  "ach" | "check" | "domesticWire" | "internationalWire";

export type DestinatarioMercury = { id: string };

/**
 * Da de alta al comercio como destinatario.
 *
 * Mercury exige el destinatario ANTES de poder mandarle nada: la solicitud de
 * pago solo acepta un `recipientId`, nunca los datos sueltos. Por eso esto es
 * el primer paso y no un detalle.
 */
export async function crearDestinatario(cuerpo: {
  name: string;
  emails: string[];
  electronicRoutingInfo?: unknown;
  internationalWireRoutingInfo?: unknown;
}): Promise<RespuestaMercury<DestinatarioMercury>> {
  return pedir<DestinatarioMercury>("/recipients", {
    metodo: "POST",
    cuerpo,
  });
}

export type SolicitudMercury = {
  id?: string;
  status?: string;
};

/**
 * Pide que se le mande el dinero. NO lo manda: lo deja esperando aprobación.
 *
 * ══ LA LLAVE DE IDEMPOTENCIA ES LA RED DE SEGURIDAD ══
 *
 * Es obligatoria, y se usa el id del retiro. Repetir la misma llave devuelve
 * 409 en vez de crear un segundo pago — que con dinero de verdad es la
 * diferencia entre un reintento y pagarle dos veces al comercio. Mercury
 * además bloquea duplicados dentro de 24 horas, aunque cambie la llave.
 */
export async function solicitarEnvio(
  cuentaId: string,
  cuerpo: {
    recipientId: string;
    amount: number;
    paymentMethod: MetodoMercury;
    idempotencyKey: string;
    /** Obligatorio en los wires. Sin esto el banco lo rechaza. */
    purpose?: { simple: { category: string; additionalInfo?: string } };
    note?: string;
    externalMemo?: string;
  },
): Promise<RespuestaMercury<SolicitudMercury>> {
  return pedir<SolicitudMercury>(
    `/account/${encodeURIComponent(cuentaId)}/request-send-money`,
    { metodo: "POST", cuerpo },
  );
}
