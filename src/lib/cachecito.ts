/**
 * MEMORIA CORTA DEL SERVIDOR, por instancia.
 *
 * El menú de categorías, los bombillos de cobertura y los destacados de la
 * portada se calculan con agregados sobre el catálogo entero EN CADA PÁGINA,
 * y sus datos cambian poco: que cada visita repita esos viajes a la base es
 * puro tiempo de espera — la "pantalla en blanco" que se ve mientras el
 * servidor piensa.
 *
 * Esto los recuerda unos segundos. No es un caché de verdad (vive en la
 * memoria de la instancia y cada instancia tiene el suyo), y eso está bien:
 * lo peor que puede pasar es que un bombillo tarde un minuto en encenderse.
 *
 * QUÉ NO VA AQUÍ: nada que dependa de quién pregunta (sesión, alcance,
 * billetera) ni nada de dinero. Solo agregados públicos que ve todo el mundo
 * igual.
 *
 * Un fallo no se recuerda: si `traer` revienta, el error sube y la próxima
 * visita vuelve a intentar. Recordar un error sería dejar la página coja un
 * minuto entero por un tropiezo de un segundo.
 */
const almacen = new Map<string, { hasta: number; valor: unknown }>();

export async function recordado<T>(
  llave: string,
  vidaMs: number,
  traer: () => Promise<T>,
): Promise<T> {
  const guardado = almacen.get(llave);
  if (guardado && guardado.hasta > Date.now()) {
    return guardado.valor as T;
  }
  const valor = await traer();
  almacen.set(llave, { hasta: Date.now() + vidaMs, valor });
  return valor;
}

/** Para las pruebas y para forzar un refresco puntual. */
export function olvidar(llave?: string) {
  if (llave === undefined) {
    almacen.clear();
  } else {
    almacen.delete(llave);
  }
}

/**
 * LO MISMO, PERO EN EL BORDE (24 ago 2026).
 *
 * `recordado` guarda en la memoria del worker, y en producción **cada visita
 * puede caer en un worker distinto o recién arrancado**: medido el 24 ago, la
 * portada seguía dando picos de dos segundos con la memoria puesta. La caché
 * del borde (`caches.default`) sí se comparte, así que la segunda persona —y
 * la misma un minuto después— recibe lo ya calculado.
 *
 * Se guarda como JSON detrás de una dirección inventada (`https://cache.local/…`):
 * la Cache API solo entiende peticiones GET con una URL, no valores sueltos.
 *
 * Los dos niveles se usan juntos: memoria primero (instantánea), borde
 * después. Si la caché del borde no existe —en `next dev` no está— se sigue
 * como siempre, sin ruido.
 */
export async function recordadoEnElBorde<T>(
  llave: string,
  vidaMs: number,
  traer: () => Promise<T>,
): Promise<T> {
  const enMemoria = almacen.get(llave);
  if (enMemoria && enMemoria.hasta > Date.now()) return enMemoria.valor as T;

  const borde = (globalThis as { caches?: { default?: Cache } }).caches
    ?.default;
  const direccion = `https://cache.local/${encodeURIComponent(llave)}`;
  const segundos = Math.max(1, Math.round(vidaMs / 1000));

  if (borde) {
    try {
      const guardada = await borde.match(direccion);
      if (guardada) {
        const valor = (await guardada.json()) as T;
        almacen.set(llave, { hasta: Date.now() + vidaMs, valor });
        return valor;
      }
    } catch {
      /* Una caché ilegible no puede tumbar la página: se recalcula. */
    }
  }

  const valor = await traer();
  almacen.set(llave, { hasta: Date.now() + vidaMs, valor });
  if (borde) {
    try {
      void borde.put(
        direccion,
        new Response(JSON.stringify(valor), {
          headers: {
            "content-type": "application/json",
            "cache-control": `public, max-age=${segundos}`,
          },
        }),
      );
    } catch {
      /* idem */
    }
  }
  return valor;
}
