/**
 * ══ DE QUIÉN ES ESTA CAJA ══
 *
 * El problema central del casillero: la compra es SILENCIOSA. Nadie nos
 * avisó, y la caja ya está en la puerta. Esto convierte un escaneo en un
 * candidato con puntaje.
 *
 * - Sobre el umbral y por un método fiable → se asigna solo.
 * - Bajo el umbral → decide el operario, con los candidatos delante.
 * - Sin candidatos → huérfano, a la cola de excepciones.
 *
 * **Regla dura: nunca se auto-asigna por parecido de nombre.** Ni con un
 * 99 %. Ver `texto.ts`.
 */

import { extraerCodigo } from "./codigo";
import { similitudNombres } from "./texto";
import { normalizarTracking } from "./tracking";

export const UMBRAL_AUTO = 90;
/** Bajo esta similitud ni siquiera se sugiere: sería ruido para el operario. */
export const UMBRAL_NOMBRE = 0.72;

export type MetodoMatch =
  | "prealerta"
  | "inbound"
  | "ocr_codigo"
  | "nombre"
  | "remitente"
  | "manual"
  | "reclamo";

export type CasilleroRef = {
  id: string;
  codigo: string;
  clienteId: string;
  nombreLegal: string;
  suspendido?: boolean;
};

export type PrealertaRef = {
  id: string;
  casilleroId: string;
  tracking: string | null;
  comercio?: string | null;
  descripcion?: string | null;
  valorUsd?: number | null;
};

export type InboundRef = {
  tracking: string;
  casilleroId: string | null;
  remitente?: string | null;
};

export type EntradaEscaneo = {
  tracking?: string | null;
  /** El texto crudo que devolvió el lector de la etiqueta, si lo hay. */
  textoOcr?: string | null;
  remitente?: string | null;
};

export type ContextoMatch = {
  casilleros: readonly CasilleroRef[];
  prealertas: readonly PrealertaRef[];
  inbounds?: readonly InboundRef[];
};

export type Candidato = {
  casilleroId: string;
  codigo: string;
  metodo: MetodoMatch;
  score: number;
  prealertaId?: string;
  motivo: string;
};

export type ResultadoMatch = {
  candidatos: Candidato[];
  mejor: Candidato | null;
  /** true solo si el sistema puede asignar sin preguntarle al operario. */
  automatico: boolean;
};

/** Los únicos métodos que pueden asignar solos: los tres que son PRUEBA. */
const METODOS_AUTOMATIZABLES: readonly MetodoMatch[] = [
  "prealerta",
  "inbound",
  "ocr_codigo",
];

export function resolverMatch(
  entrada: EntradaEscaneo,
  ctx: ContextoMatch,
): ResultadoMatch {
  const porId = new Map(ctx.casilleros.map((c) => [c.id, c]));
  const candidatos: Candidato[] = [];
  const tracking = entrada.tracking
    ? normalizarTracking(entrada.tracking)
    : null;

  const agregar = (
    casilleroId: string,
    metodo: MetodoMatch,
    score: number,
    motivo: string,
    prealertaId?: string,
  ) => {
    const casillero = porId.get(casilleroId);
    if (!casillero) return;
    candidatos.push({
      casilleroId,
      codigo: casillero.codigo,
      metodo,
      score,
      motivo,
      ...(prealertaId ? { prealertaId } : {}),
    });
  };

  /* 1 · La guía coincide con una prealerta del cliente. Es lo más fuerte:
        el propio cliente dijo «este paquete es mío» antes de que llegara. */
  if (tracking) {
    for (const p of ctx.prealertas) {
      if (p.tracking && normalizarTracking(p.tracking) === tracking) {
        agregar(p.casilleroId, "prealerta", 100, "Prealerta exacta", p.id);
      }
    }
  }

  /* 2 · La guía ya venía anunciada por el feed del transportista. */
  if (tracking && ctx.inbounds) {
    for (const i of ctx.inbounds) {
      if (i.casilleroId && normalizarTracking(i.tracking) === tracking) {
        agregar(i.casilleroId, "inbound", 95, "Anunciado por el transportista");
      }
    }
  }

  /* 3 · El lector sacó de la etiqueta un código con verificador válido. */
  if (entrada.textoOcr) {
    const codigo = extraerCodigo(entrada.textoOcr);
    if (codigo) {
      const casillero = ctx.casilleros.find((c) => c.codigo === codigo);
      if (casillero) {
        agregar(
          casillero.id,
          "ocr_codigo",
          90,
          `Código leído en la etiqueta (${codigo})`,
        );
      }
    }
  }

  /* 4 · El nombre del destinatario se parece al de un cliente. SUGERENCIA:
        nunca pasa de 85, que está bajo el umbral a propósito. */
  if (entrada.textoOcr) {
    for (const c of ctx.casilleros) {
      const similitud = similitudNombres(entrada.textoOcr, c.nombreLegal);
      if (similitud >= UMBRAL_NOMBRE) {
        const score = Math.min(
          85,
          60 + Math.round((similitud - UMBRAL_NOMBRE) * 90),
        );
        agregar(
          c.id,
          "nombre",
          score,
          `Nombre parecido a «${c.nombreLegal}» (${Math.round(similitud * 100)} %)`,
        );
      }
    }
  }

  /* 5 · Prealerta sin guía cuyo comercio coincide con el remitente. */
  if (entrada.remitente) {
    const remitente = entrada.remitente.toLowerCase();
    for (const p of ctx.prealertas) {
      if (p.tracking) continue;
      const comercio = p.comercio?.toLowerCase();
      if (comercio && remitente.includes(comercio)) {
        agregar(
          p.casilleroId,
          "remitente",
          55,
          `Prealerta sin guía del comercio «${p.comercio}»`,
          p.id,
        );
      }
    }
  }

  /* Un candidato por casillero: se queda el de mayor puntaje. Sin esto, un
     cliente con prealerta Y nombre parecido saldría dos veces y parecería
     que hay dos candidatos donde hay uno. */
  const mejorPorCasillero = new Map<string, Candidato>();
  for (const c of candidatos) {
    const previo = mejorPorCasillero.get(c.casilleroId);
    if (!previo || c.score > previo.score)
      mejorPorCasillero.set(c.casilleroId, c);
  }

  const ordenados = [...mejorPorCasillero.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const mejor = ordenados[0] ?? null;
  const casilleroMejor = mejor ? porId.get(mejor.casilleroId) : undefined;

  /* Empate en la cima: dos casilleros DISTINTOS con el mismo puntaje. Pasa
     con el mismo tracking en dos prealertas — alguien copió mal la guía.
     Lo decide una persona. */
  const hayEmpate =
    ordenados.length > 1 &&
    mejor !== null &&
    ordenados[1]!.score === mejor.score;

  const automatico =
    mejor !== null &&
    mejor.score >= UMBRAL_AUTO &&
    METODOS_AUTOMATIZABLES.includes(mejor.metodo) &&
    !casilleroMejor?.suspendido &&
    !hayEmpate;

  return { candidatos: ordenados, mejor, automatico };
}
