/**
 * Lo que manda la página del escudo (`/datos/app/escudo` del sitio, escrita en
 * `src/lib/app-movil/escudo.ts`), leído con cuidado. Puro: lo prueba el sitio.
 */
export type EstadoEscudo =
  | { tipo: "pase"; pase: string }
  | { tipo: "esperando" }
  | { tipo: "sin-escudo" }
  | { tipo: "error" };

export const CABECERA_ESCUDO = "x-escudo";

export function leerMensajeDelEscudo(crudo: string): EstadoEscudo {
  try {
    const m = JSON.parse(crudo) as Record<string, unknown>;
    if (m.sinEscudo === true) return { tipo: "sin-escudo" };
    if (
      typeof m.pase === "string" &&
      m.pase.length > 0 &&
      m.pase.length < 4096
    ) {
      return { tipo: "pase", pase: m.pase };
    }
    if (m.pase === null) return { tipo: "esperando" };
  } catch {
    /* cae al error de abajo */
  }
  return { tipo: "error" };
}

/**
 * Las cabeceras para entrar o crear cuenta. `null` = todavía no se puede
 * mandar (falta el pase). Sin escudo configurado se manda sin cabecera, igual
 * que la web.
 */
export function cabeceraDelEscudo(
  estado: EstadoEscudo,
): Record<string, string> | null {
  if (estado.tipo === "pase") return { [CABECERA_ESCUDO]: estado.pase };
  if (estado.tipo === "sin-escudo") return {};
  return null;
}
