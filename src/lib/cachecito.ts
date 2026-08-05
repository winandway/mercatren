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
