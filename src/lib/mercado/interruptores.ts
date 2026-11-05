/**
 * EL INTERRUPTOR DE CADA PAÍS (5 nov 2026, plan «una sola Mercatren»).
 *
 * Una sola Mercatren: el país es un dato de la persona (va en su cuenta), no
 * un dominio. Cada país tiene aquí dos llaves, y se encienden con una línea y
 * una publicación mirada, nunca desde un panel:
 *
 * - `enLaApp`: el país se puede elegir en la app y al crear la cuenta (en la
 *   web y en la app). Encenderlo abre ese país como canal de venta nuevo:
 *   **solo con el sí de Richard** (regla de Gerencia del 5 nov 2026).
 * - `dentroDeMercatren`: el país se puede usar DENTRO de mercatren.com
 *   tocando su bandera, sin saltar a su dominio. España ya vive así desde el
 *   27 oct (no tiene dominio); Venezuela queda preparada y apagada.
 *
 * NINGUNA de las dos abre ni cierra la VENTA: eso lo decide
 * `ventas/pausa.ts` (la pausa de Estados Unidos y España sin cobro). Y los
 * dominios que ya existen siguen como están: Venezuela sigue vendiendo en
 * mercatren.com.ve pase lo que pase aquí.
 */
export type Interruptor = { enLaApp: boolean; dentroDeMercatren: boolean };

export const INTERRUPTORES: Readonly<Record<string, Interruptor>> = {
  US: { enLaApp: true, dentroDeMercatren: true },
  /* Preparada en la app (moneda, retiro en ciudad, legales y guía).
     Apagada hasta el sí de Richard. */
  VE: { enLaApp: false, dentroDeMercatren: false },
  /* Ya se ve dentro de mercatren.com (sin cobro: `ESPANA_SIN_COBRO`).
     En la app, apagada hasta el sí de Richard. */
  ES: { enLaApp: false, dentroDeMercatren: true },
  CL: { enLaApp: false, dentroDeMercatren: false },
  CO: { enLaApp: false, dentroDeMercatren: false },
};

const limpio = (codigo: string | null | undefined) =>
  (codigo ?? "").trim().toUpperCase();

/** ¿Se puede elegir en la app y al crear la cuenta? */
export function enLaApp(codigo: string | null | undefined): boolean {
  return INTERRUPTORES[limpio(codigo)]?.enLaApp === true;
}

/** ¿Se puede usar dentro de mercatren.com, sin saltar a su dominio? */
export function dentroDeMercatren(codigo: string | null | undefined): boolean {
  return INTERRUPTORES[limpio(codigo)]?.dentroDeMercatren === true;
}

/** Los países que se ofrecen en la app y al crear la cuenta. */
export function paisesEnLaApp(): string[] {
  return Object.keys(INTERRUPTORES).filter((c) => enLaApp(c));
}
