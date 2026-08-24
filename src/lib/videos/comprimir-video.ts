/**
 * EL VIDEO SE ENCOGE EN EL NAVEGADOR ANTES DE SUBIRLO (24 ago 2026).
 *
 * La misma historia de las fotos, con cifras medidas: el primer video real
 * del sitio era un `.mov` de iPhone de **61,8 MB por 34 segundos** — 14,5
 * megabits por segundo, cuando YouTube le sirve a un espectador de 720p unos
 * 3. Quien lo miraba con una conexión normal veía «arranca, se corta,
 * arranca»: el video pedía cinco veces el caudal disponible. Y el índice
 * (`moov`) venía al FINAL del archivo, así que el navegador necesitaba dos
 * viajes antes del primer cuadro.
 *
 * ══ QUÉ SE HACE ══
 *
 * Se reencodea a H.264 con el perfil de las redes de video: lado mayor a
 * 1280 (720p vertical u horizontal), 30 cuadros, ~2,8 Mbps de video y AAC de
 * 128 kbps — y el índice ADELANTE (`fastStart`), que es lo que hace que
 * arranque al toque. Un video de teléfono queda en un sexto de su peso sin
 * que se note en una pantalla de teléfono, que es donde se ve.
 *
 * ══ LAS REGLAS QUE NO SE TOCAN (las mismas de las fotos) ══
 *
 * 1. **Si comprimir falla, se sube el original.** Un navegador sin WebCodecs,
 *    un códec raro: subir pesado es mucho mejor que no poder subir.
 * 2. **Lo ya eficiente no se toca**: un `.mp4` por debajo del umbral se sube
 *    tal cual. Un `.mov` liviano sí pasa por aquí — solo para reempaquetarlo
 *    con el índice adelante (las pistas se copian, no se recodifican).
 * 3. **Nunca se agranda**: un video más chico que 720p conserva su tamaño.
 * 4. **La librería se carga solo aquí** (import dinámico): quien no sube
 *    videos no descarga ni un byte de ella.
 */

/** Por encima de esto, el video se recodifica. 3,5 Mbps ya es holgado. */
export const UMBRAL_BITS_POR_SEGUNDO = 3_500_000;

/** El perfil de salida: el de las redes de video. */
export const LADO_MAYOR_MAXIMO = 1280;
export const CUADROS_POR_SEGUNDO = 30;
export const BITRATE_VIDEO = 2_800_000;
export const BITRATE_AUDIO = 128_000;

export type VideoComprimido = {
  archivo: File;
  comprimido: boolean;
  ancho?: number;
  alto?: number;
};

export function haceFaltaComprimir(
  pesoBytes: number,
  duracionSegundos: number,
  nombre: string,
): boolean {
  if (duracionSegundos <= 0) return false;
  const bitsPorSegundo = (pesoBytes * 8) / duracionSegundos;
  if (bitsPorSegundo > UMBRAL_BITS_POR_SEGUNDO) return true;
  /* Liviano pero en otro envase: se reempaqueta a MP4 con el índice
     adelante. Las pistas se copian, así que es rápido. */
  return !/\.mp4$/i.test(nombre);
}

export async function comprimirVideo(
  archivo: File,
  duracionSegundos: number,
  alAvanzar?: (avance: number) => void,
): Promise<VideoComprimido> {
  try {
    if (!haceFaltaComprimir(archivo.size, duracionSegundos, archivo.name)) {
      return { archivo, comprimido: false };
    }
    if (typeof VideoEncoder === "undefined") {
      return { archivo, comprimido: false };
    }

    const {
      ALL_FORMATS,
      BlobSource,
      BufferTarget,
      Conversion,
      Input,
      Mp4OutputFormat,
      Output,
    } = await import("mediabunny");

    const entrada = new Input({
      source: new BlobSource(archivo),
      formats: ALL_FORMATS,
    });

    /* Nunca se agranda: si el video ya es más chico que 720p, se conserva. */
    const pista = await entrada.getPrimaryVideoTrack();
    const anchoOriginal = pista?.displayWidth ?? 0;
    const altoOriginal = pista?.displayHeight ?? 0;
    const ladoMayor = Math.max(anchoOriginal, altoOriginal);
    const escala =
      ladoMayor > LADO_MAYOR_MAXIMO ? LADO_MAYOR_MAXIMO / ladoMayor : 1;
    const par = (n: number) => Math.round((n * escala) / 2) * 2;

    const salida = new Output({
      format: new Mp4OutputFormat({ fastStart: "in-memory" }),
      target: new BufferTarget(),
    });

    const conversion = await Conversion.init({
      input: entrada,
      output: salida,
      video: {
        codec: "avc",
        bitrate: BITRATE_VIDEO,
        frameRate: CUADROS_POR_SEGUNDO,
        ...(escala < 1 && anchoOriginal && altoOriginal
          ? {
              width: par(anchoOriginal),
              height: par(altoOriginal),
              fit: "fill" as const,
            }
          : {}),
      },
      audio: { codec: "aac", bitrate: BITRATE_AUDIO },
    });
    if (alAvanzar) conversion.onProgress = alAvanzar;
    await conversion.execute();

    const buffer = salida.target.buffer;
    if (!buffer || buffer.byteLength === 0)
      return { archivo, comprimido: false };
    /* Si por lo que sea salió MÁS pesado (un video ya óptimo), gana el
       original: comprimir jamás puede empeorar. */
    if (buffer.byteLength >= archivo.size)
      return { archivo, comprimido: false };

    const nombre = archivo.name.replace(/\.[a-z0-9]+$/i, "") + ".mp4";
    return {
      archivo: new File([buffer], nombre, { type: "video/mp4" }),
      comprimido: true,
      ancho: escala < 1 ? par(anchoOriginal) : anchoOriginal || undefined,
      alto: escala < 1 ? par(altoOriginal) : altoOriginal || undefined,
    };
  } catch (fallo) {
    console.error("[videos] no se pudo comprimir; se sube el original:", fallo);
    return { archivo, comprimido: false };
  }
}
