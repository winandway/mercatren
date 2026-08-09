import {
  LADO_MAXIMO_LOGO,
  LADO_MAXIMO_PRODUCTO,
  medidaDestino,
  PESO_OBJETIVO,
} from "@/lib/imagenes/medidas";

/**
 * ENCOGER Y COMPRIMIR LA FOTO EN EL NAVEGADOR, ANTES DE SUBIRLA.
 *
 * ══ EL PROBLEMA QUE RESUELVE (9 ago 2026) ══
 *
 * Los comercios no podían subir sus fotos. Tres causas apiladas:
 *
 *  1. **No se comprimía nada.** El archivo salía del teléfono tal cual, entre
 *     3 y 8 MB. Con la conexión de Venezuela son minutos por foto, y basta un
 *     parpadeo de la red para perderlo todo. Quien tiene treinta productos
 *     abandona en el tercero.
 *  2. **El iPhone quedaba fuera.** Su formato por defecto es HEIC y no estaba
 *     en la lista de aceptados: el sistema lo rechazaba sin más. Un comerciante
 *     con iPhone **literalmente no podía subir su propia foto**.
 *  3. **El tope de 5 MB** lo pasa sola una foto de celular moderno.
 *
 * Comprimir aquí resuelve los tres a la vez: sale un WebP de 1600 px y unos
 * 200 KB, que viaja treinta veces más rápido y entra de sobra en cualquier
 * tope. Y el HEIC deja de importar, porque lo que se sube ya no es el archivo
 * original sino lo que dibujó el navegador.
 *
 * ══ POR QUÉ NO SE HACE EN EL SERVIDOR ══
 *
 * Porque el problema es la SUBIDA, no el almacenamiento. Comprimir en el
 * servidor obliga a que los 6 MB crucen igual la conexión mala; el ahorro tiene
 * que pasar antes de salir del teléfono.
 *
 * ══ SI ALGO FALLA, SE SUBE EL ORIGINAL ══
 *
 * Un navegador viejo, un formato que no se puede dibujar, un lienzo que no da.
 * En todos esos casos se devuelve el archivo tal como vino: una subida lenta es
 * mucho mejor que un comerciante que no puede subir nada.
 */

export type Resultado = {
  archivo: File;
  /** Bytes del original, para poder decir cuánto se ahorró. */
  antes: number;
  despues: number;
  /** `false` cuando no se pudo y va el original. */
  seComprimio: boolean;
};

/** Lo que el navegador logra dibujar, o `null` si no puede con este archivo. */
async function dibujable(archivo: File): Promise<ImageBitmap | null> {
  try {
    /* `createImageBitmap` decodifica con el motor del navegador, así que en un
       iPhone abre el HEIC sin librerías: Safari sabe leerlo. En un Android o
       un escritorio con un HEIC ajeno fallará, y ahí se sube el original. */
    return await createImageBitmap(archivo);
  } catch {
    return null;
  }
}

function lienzoDe(
  bitmap: ImageBitmap,
  ancho: number,
  alto: number,
): HTMLCanvasElement | null {
  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;

  const pincel = lienzo.getContext("2d");
  if (!pincel) return null;

  /* Suavizado en alto: encoger sin él deja los bordes dentados, y en la foto
     de un producto eso se nota como si estuviera mal tomada. */
  pincel.imageSmoothingEnabled = true;
  pincel.imageSmoothingQuality = "high";
  pincel.drawImage(bitmap, 0, 0, ancho, alto);

  return lienzo;
}

function aBlob(
  lienzo: HTMLCanvasElement,
  tipo: string,
  calidad: number,
): Promise<Blob | null> {
  return new Promise((listo) => lienzo.toBlob(listo, tipo, calidad));
}

/**
 * Prepara una imagen para subirla.
 *
 * `ladoMaximo` sale de `medidas.ts`: 1600 para un producto, 512 para un logo.
 */
export async function comprimirImagen(
  archivo: File,
  ladoMaximo: number = LADO_MAXIMO_PRODUCTO,
): Promise<Resultado> {
  const sinTocar: Resultado = {
    archivo,
    antes: archivo.size,
    despues: archivo.size,
    seComprimio: false,
  };

  // Un GIF puede estar animado y el lienzo se quedaría con el primer cuadro.
  if (archivo.type === "image/gif") return sinTocar;

  const bitmap = await dibujable(archivo);
  if (!bitmap) return sinTocar;

  try {
    const { ancho, alto } = medidaDestino(
      { ancho: bitmap.width, alto: bitmap.height },
      ladoMaximo,
    );

    const lienzo = lienzoDe(bitmap, ancho, alto);
    if (!lienzo) return sinTocar;

    /* Se baja la calidad por pasos hasta entrar en el objetivo. Se empieza
       alto: en una foto de producto el detalle importa, y casi siempre la
       primera pasada ya entra. */
    let mejor: Blob | null = null;
    for (const calidad of [0.82, 0.7, 0.6, 0.5]) {
      const blob = await aBlob(lienzo, "image/webp", calidad);
      if (!blob) break;
      mejor = blob;
      if (blob.size <= PESO_OBJETIVO) break;
    }

    if (!mejor) return sinTocar;

    /* SI COMPRIMIR NO AYUDÓ, SE SUBE EL ORIGINAL. Pasa con fotos ya
       optimizadas o con logos PNG chiquitos, donde el WebP puede salir más
       grande. Subir algo peor "porque lo procesamos" no tiene sentido. */
    if (mejor.size >= archivo.size) return sinTocar;

    const nombre = archivo.name.replace(/\.[^.]+$/, "") || "imagen";

    return {
      archivo: new File([mejor], `${nombre}.webp`, { type: "image/webp" }),
      antes: archivo.size,
      despues: mejor.size,
      seComprimio: true,
    };
  } finally {
    // Sin esto la memoria del bitmap se queda tomada hasta que pase el
    // recolector, y subiendo treinta fotos seguidas eso se siente.
    bitmap.close();
  }
}

/** El atajo para un logo, que se dibuja pequeño y conviene más liviano. */
export function comprimirLogo(archivo: File): Promise<Resultado> {
  return comprimirImagen(archivo, LADO_MAXIMO_LOGO);
}
