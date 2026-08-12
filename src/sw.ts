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
 * AL PUBLICAR UNA VERSION NUEVA, EL CODIGO VIEJO SE TIRA.
 *
 * ══ EL PROBLEMA QUE RESUELVE (12 ago 2026) ══
 *
 * Un comercio pasó días reportando el mismo fallo **después** de que estuviera
 * arreglado y publicado. Del lado de aquí todo salía verde; del suyo, nada
 * cambiaba. Palabras del dueño: *«usted dice que ha arreglado algo cuando no lo
 * ha arreglado»*.
 *
 * La causa es esta pieza. Mercatren se instala como aplicación, y una vez
 * instalada el teléfono **sirve el sitio desde su propia despensa**, no de la
 * red. Un despliegue nuevo llega al servidor y al teléfono no le llega nada: se
 * queda ejecutando el programa del día que lo instaló, mes tras mes.
 *
 * Antes solo se vaciaban cuatro cajones con nombre propio, los de un problema
 * de agosto. Los que guardan el PROGRAMA —los guiones y los estilos— no se
 * tocaban nunca.
 *
 * ══ POR QUE SE TIRAN LOS GUIONES Y NO LAS FOTOS ══
 *
 * Los guiones y los estilos SON el programa: si están viejos, el arreglo no
 * existe para esa persona. Las fotos y las tipografías no cambian el
 * comportamiento de nada y volver a bajarlas en cada publicación es castigar a
 * quien tiene mala conexión — que es justo nuestra clientela. Por eso se
 * quedan.
 *
 * Esto corre en `activate`, o sea cuando el trabajador NUEVO toma el mando.
 * Junto con `skipWaiting` y `clientsClaim` que ya estaban puestos, el resultado
 * es que **abrir la aplicación una vez basta** para pasar a la versión nueva.
 */
const CAJONES_A_TIRAR = [
  /* Del problema de las sesiones guardadas (agosto 2026). */
  "pages",
  "pages-rsc",
  "pages-rsc-prefetch",
  "others",
  /* El programa. Estos son los que dejaban a un teléfono con la versión
     vieja para siempre. */
  "next-static-js-assets",
  "static-js-assets",
  "static-style-assets",
];

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
