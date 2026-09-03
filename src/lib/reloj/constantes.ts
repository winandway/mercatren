/**
 * Los números del reloj propio, sin `server-only` para poder probarlos.
 * El porqué de cada uno está en `tick.ts`.
 */
/** Lo que Cloudflare deja correr tras la respuesta (30 s); con margen. */
export const TICK_PRESUPUESTO_MS = 25_000;
/** Dos latidos dentro de este rato se pisarían: el segundo no trabaja. */
export const TICK_MINIMO_MS = 50_000;
/** El vigilante corre dentro del latido cuando lleva esto sin correr. */
export const VIGILANTE_CADA_MS = 20 * 60_000;
