/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * LO QUE NUNCA SE GUARDA EN EL NAVEGADOR (REGLA CRITICA DE ESTE ARCHIVO)
 *
 * Serwist trae una regla para no guardar nunca la autenticacion, pero esta
 * escrita para `/api/auth/...`. Mercatren NO usa `/api/` a proposito (en
 * YaDominios Cloud ese prefijo lo capturan los archivos estaticos), asi que
 * nuestra autenticacion vive en `/datos/auth` y esa proteccion NUNCA se
 * activaba: la sesion, el panel y hasta los comprobantes privados terminaban
 * guardados en el navegador.
 *
 * Eso rompia la entrada al panel de una forma dificil de ver: al entrar, la
 * navegacion a /panel pasaba por el trabajador, que devolvia una respuesta
 * REDIRIGIDA; el navegador rechaza eso en una navegacion y la deja morir en
 * silencio. La persona se quedaba mirando la misma pantalla, sin error, y el
 * caso sobrevivia a recargar y a cambiar de navegador.
 *
 * Por eso todo lo que depende de quien eres se sirve SIEMPRE de la red:
 *
 * - `/datos/...`  la sesion y las acciones del servidor
 * - `/media/...`  los comprobantes: son privados, no van a un caché compartido
 * - `/upload/...` las subidas
 * - las pantallas de sesion y el panel entero
 *
 * Lo que si se guarda es lo publico: catalogo, fotos de productos, tipografias
 * y los archivos del sitio. Eso es lo que hace que abra rapido y aguante una
 * conexion mala.
 */
const RUTAS_DE_SERVIDOR = /^\/(datos|media|upload)(\/|$)/;
const PANTALLAS_CON_SESION = /^\/(es|en)\/(panel|entrar|registro|cuenta)(\/|$)/;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // Va primero: gana sobre las reglas de Serwist, que se evaluan en orden.
      matcher: ({ url: { pathname }, sameOrigin }) =>
        sameOrigin &&
        (RUTAS_DE_SERVIDOR.test(pathname) ||
          PANTALLAS_CON_SESION.test(pathname)),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
});

/**
 * Limpieza de lo que quedo guardado con las reglas viejas.
 *
 * Quien ya visito el sitio tiene en su navegador paginas y sesiones guardadas
 * por la version anterior de este archivo. Sin esto seguiria arrastrando el
 * problema aunque el codigo ya este corregido: el trabajador nuevo se instala,
 * pero los cajones viejos siguen ahi. Se corre una sola vez, al activarse.
 */
const CAJONES_A_TIRAR = ["pages", "pages-rsc", "pages-rsc-prefetch", "others"];

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    (async () => {
      const nombres = await caches.keys();
      await Promise.all(
        nombres
          .filter((nombre) => CAJONES_A_TIRAR.includes(nombre))
          .map((nombre) => caches.delete(nombre)),
      );
    })(),
  );
});

serwist.addEventListeners();
