/**
 * Los números del reloj propio, sin `server-only` para poder probarlos.
 * El porqué de cada uno está en `tick.ts`.
 */
/** Lo que Cloudflare deja correr tras la respuesta (30 s); con margen. */
export const TICK_PRESUPUESTO_MS = 25_000;
/** Dos latidos dentro de este rato se pisarían: el segundo no trabaja. */
/* 30 s y no 60 (3 sep 2026): con 41.000 fichas por afinar a dos llamadas
   cada una, un latido por minuto tardaba cinco días. Con uno cada 30 s el
   sitio le habla a CJ casi todo el tiempo y tarda la mitad. */
export const TICK_MINIMO_MS = 30_000;
/** El vigilante corre dentro del latido cuando lleva esto sin correr. */
export const VIGILANTE_CADA_MS = 20 * 60_000;
