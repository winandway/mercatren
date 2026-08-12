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

/** El token sale del entorno del sitio, igual que el del correo. */
function token(): string | undefined {
  return getCloudflareContext().env.MERCURY_TOKEN;
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
