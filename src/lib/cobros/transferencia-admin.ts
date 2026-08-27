import "server-only";

import { esSoporteDeVerdad } from "@/lib/autorizacion";

/**
 * ¿ESTÁ LISTA LA TRANSFERENCIA ACH? UNA PANTALLA QUE LO DICE.
 *
 * ══ POR QUÉ EXISTE (27 ago 2026) ══
 *
 * La transferencia solo se ofrece si están las CUATRO variables. Si falta una,
 * el método desaparece del enlace de cobro **y no lo dice en ninguna parte**:
 * desde el panel se ve exactamente igual que si estuviera todo bien.
 *
 * Y eso ya costó una equivocación de este lado. Yo afirmé que en producción esas
 * variables traían los datos de la sociedad anterior; lo que había comprobado
 * era **mi archivo local**, que es otra cosa. El dueño lo desmintió mirando su
 * panel, y tenía razón. Un dato que solo se puede suponer termina dicho como si
 * fuera un hecho: la salida no es acordarse de mirar mejor, es ponerlo en
 * pantalla.
 *
 * ══ NUNCA DEVUELVE UN VALOR, SOLO SI ESTÁ ══
 *
 * Ni el número de cuenta, ni la ruta, ni recortados, ni con asteriscos. Con los
 * últimos cuatro dígitos y el banco, alguien con la mitad del dato tiene más de
 * lo que debería. Esto contesta «¿está cargada?», que es la única pregunta que
 * hace falta responder desde aquí.
 *
 * El titular y el banco SÍ salen enteros, y es deliberado: no son secretos —se
 * los enseñamos a quien va a pagar— y son justamente los dos que delatarían que
 * quedó el nombre de otra sociedad.
 */
export type EstadoTransferencia = {
  /** ¿Se ofrece la transferencia hoy en los enlaces de cobro? */
  lista: boolean;
  /** El titular tal cual está cargado, o null. No es secreto: lo ve quien paga. */
  beneficiario: string | null;
  /** El banco, igual. */
  banco: string | null;
  /** Solo si está, jamás el número. */
  cuentaCargada: boolean;
  /** Solo si está, jamás la ruta. */
  rutaAchCargada: boolean;
  /**
   * ¿El titular dice algo que no es la sociedad de hoy?
   *
   * No se compara contra una lista de nombres viejos —mañana habría otro—: se
   * compara contra el nombre que manda, que sale de `sociedad.ts`. Cualquier
   * cosa distinta se marca para que se mire, no para acusar a nadie.
   */
  titularCoincide: boolean;
};

export async function estadoTransferencia(): Promise<EstadoTransferencia | null> {
  if (!(await esSoporteDeVerdad())) return null;

  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { SOCIEDAD } = await import("@/lib/sociedad");
  const { env } = getCloudflareContext();

  const beneficiario = env.PAGO_BENEFICIARIO?.trim() || null;
  const banco = env.PAGO_BANCO?.trim() || null;
  const cuentaCargada = Boolean(env.PAGO_CUENTA?.trim());
  const rutaAchCargada = Boolean(env.PAGO_RUTA_ACH?.trim());

  /* Se comparan sin acentos, sin comas y sin mayúsculas: «Mercatren LLC» y
     «MERCATREN LLC,» son el mismo titular y marcar eso en rojo sería ruido. */
  const limpio = (t: string) =>
    t
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]/gi, "")
      .toLowerCase();

  return {
    lista: Boolean(beneficiario && banco && cuentaCargada && rutaAchCargada),
    beneficiario,
    banco,
    cuentaCargada,
    rutaAchCargada,
    titularCoincide:
      beneficiario !== null && limpio(beneficiario) === limpio(SOCIEDAD.nombre),
  };
}
