/**
 * CUÁNTO HAY QUE ENCOGER UNA FOTO ANTES DE SUBIRLA.
 *
 * ══ POR QUÉ EXISTE (9 ago 2026) ══
 *
 * Los comercios se quejaban de que no podían subir sus fotos: unas se
 * rechazaban, otras tardaban tanto que se cortaban. El sitio subía el archivo
 * **tal como salía del teléfono** — entre 3 y 8 MB por foto.
 *
 * Con la conexión de Venezuela, subir 6 MB puede ser un par de minutos, y basta
 * un parpadeo de la red para perderlo todo y volver a empezar. Un comerciante
 * con treinta productos abandona en el tercero.
 *
 * Y no hace falta ese peso: la foto se ve en una tarjeta de catálogo y en una
 * ficha. Con 1600 píxeles del lado largo se ve perfecta hasta en una pantalla
 * grande, y pesa entre veinte y cuarenta veces menos.
 *
 * Aquí vive solo la cuenta de las medidas, que es pura y se puede probar. El
 * trabajo con el lienzo está en `comprimir.ts`, que necesita un navegador.
 */

/**
 * El lado largo al que se encoge una foto de producto.
 *
 * 1600 no es un número redondo cualquiera: es el ancho al que se sirve una
 * ficha de producto en una pantalla grande con la foto ampliada. Más que eso
 * es peso que nadie llega a ver.
 */
export const LADO_MAXIMO_PRODUCTO = 1600;

/**
 * El logo se dibuja pequeño —en la portada de la tienda y en el directorio—,
 * así que 512 sobra. Y conviene que sea liviano: aparece en muchas pantallas a
 * la vez, no en una sola como la foto de un producto.
 */
export const LADO_MAXIMO_LOGO = 512;

/**
 * Cuánto puede pesar lo que sale de aquí. Si tras comprimir sigue por encima,
 * se vuelve a intentar con menos calidad antes de rendirse.
 */
export const PESO_OBJETIVO = 400 * 1024;

export type Medida = { ancho: number; alto: number };

/**
 * La medida a la que hay que dibujar una foto para que su lado largo no pase
 * del máximo, sin deformarla.
 *
 * **Una foto que ya es pequeña NO se agranda.** Estirar una foto de 300px a
 * 1600 no le agrega detalle: solo la deja borrosa y pesando más. Es el error
 * fácil de cometer y por eso hay una prueba dedicada.
 */
export function medidaDestino(origen: Medida, ladoMaximo: number): Medida {
  const { ancho, alto } = origen;

  // Sin medidas no hay nada que calcular: se devuelve tal cual y que decida
  // quien llame. Devolver 0 haría un lienzo vacío y una foto en negro.
  if (!Number.isFinite(ancho) || !Number.isFinite(alto)) return origen;
  if (ancho <= 0 || alto <= 0) return origen;

  const ladoLargo = Math.max(ancho, alto);
  if (ladoLargo <= ladoMaximo) return { ancho, alto };

  const factor = ladoMaximo / ladoLargo;

  /* Se redondea hacia arriba con un mínimo de 1: una foto muy alargada
     —digamos 4000x20— daría 0 de alto al redondear hacia abajo, y un lienzo
     con un lado en cero no dibuja nada. */
  return {
    ancho: Math.max(1, Math.round(ancho * factor)),
    alto: Math.max(1, Math.round(alto * factor)),
  };
}

/** Cuánto se ahorró, en porcentaje, para poder decírselo a quien sube. */
export function cuantoSeAhorro(antes: number, despues: number): number {
  if (antes <= 0) return 0;
  return Math.max(0, Math.round((1 - despues / antes) * 100));
}

/** "4.2 MB", "318 KB". Para que el aviso hable en algo que se entienda. */
export function pesoLegible(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
