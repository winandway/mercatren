/**
 * SUBIR UN VIDEO CON BARRA DE AVANCE.
 *
 * Vive aparte porque lo usan el panel del comercio y el enlace de las
 * secciones: una copia en cada sitio se separa al primer arreglo.
 *
 * Va con `XMLHttpRequest` y no con `fetch` por una sola razón: es lo único que
 * informa del progreso de subida. Un video de 30 MB por la conexión de un
 * almacén son minutos, y sin barra la gente cree que se colgó y vuelve a
 * empezar.
 */
export type RespuestaSubida =
  { ok: true; mensaje: string; slug: string } | { ok: false; mensaje: string };

export function subirConAvance(
  datos: FormData,
  avanzar: (pct: number) => void,
  errorDeRed: string,
): Promise<RespuestaSubida> {
  return new Promise((resolver, fallar) => {
    const peticion = new XMLHttpRequest();
    peticion.open("POST", "/upload/video");
    peticion.upload.onprogress = (e) => {
      if (e.lengthComputable) avanzar(Math.round((e.loaded / e.total) * 100));
    };
    peticion.onload = () => {
      try {
        resolver(JSON.parse(peticion.responseText) as RespuestaSubida);
      } catch {
        fallar(
          new Error(
            peticion.responseText.slice(0, 200) || `HTTP ${peticion.status}`,
          ),
        );
      }
    };
    peticion.onerror = () => fallar(new Error(errorDeRed));
    peticion.send(datos);
  });
}
