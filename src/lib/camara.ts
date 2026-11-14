/**
 * TODA SUBIDA DE IMAGEN OFRECE LA CÁMARA (regla global de Richard, 9 nov 2026;
 * puesta en Mercatren el 14 nov 2026).
 *
 * La pieza que entrega la foto a la casilla de siempre. No sube nada por su
 * cuenta: mete la foto en el `<input type="file">` que ya existía y dispara su
 * `change`, así pasa por la MISMA validación, compresión y envío que un archivo
 * elegido a mano. Ningún formulario necesita un camino nuevo.
 *
 * Candado: `tests/unit/camara.test.ts` revisa todas las casillas de imagen del
 * sitio y se pone en rojo si una queda sin «Tomar foto».
 */

/** ¿Es un celular o una tableta? Ahí se abre la cámara del aparato. */
export function esCelular(
  nav:
    | Pick<Navigator, "userAgent" | "maxTouchPoints">
    | undefined = typeof navigator === "undefined" ? undefined : navigator,
): boolean {
  if (!nav) return false;
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(nav.userAgent)) return true;
  /* El iPad nuevo se presenta como Mac: lo delata la pantalla táctil. */
  return /Macintosh/i.test(nav.userAgent) && (nav.maxTouchPoints ?? 0) > 1;
}

/**
 * Mete la foto en la casilla y avisa como si la persona la hubiera elegido.
 * Devuelve `false` si la casilla no existe o el navegador no deja escribirla.
 */
export function entregarAlInput(
  input: HTMLInputElement | null | undefined,
  archivo: File,
): boolean {
  if (!input) return false;
  try {
    if (typeof DataTransfer !== "undefined") {
      const dt = new DataTransfer();
      /* Una casilla de varias fotos no pierde las que ya se habían elegido:
         la foto nueva se suma. */
      if (input.multiple && input.files) {
        for (const previo of Array.from(input.files)) dt.items.add(previo);
      }
      dt.items.add(archivo);
      input.files = dt.files;
    } else {
      /* Navegadores viejos sin DataTransfer: una lista hecha a mano. */
      const lista = Object.assign([archivo], {
        item: (i: number) => (i === 0 ? archivo : null),
      });
      Object.defineProperty(input, "files", {
        configurable: true,
        value: lista,
      });
    }
  } catch (error) {
    console.error("[camara] no se pudo poner la foto en la casilla", error);
    return false;
  }
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

/** Por qué no se abrió la cámara, en una palabra que se traduce en pantalla. */
export type FalloCamara = "sinCamara" | "sinPermiso";

export function motivoDelFallo(error: unknown): FalloCamara {
  const nombre =
    error && typeof error === "object" && "name" in error
      ? String((error as { name: unknown }).name)
      : "";
  return nombre === "NotAllowedError" || nombre === "SecurityError"
    ? "sinPermiso"
    : "sinCamara";
}

/** Un cuadro del video convertido en una foto JPG lista para la casilla. */
export async function fotoDelVideo(
  video: HTMLVideoElement,
): Promise<File | null> {
  const ancho = video.videoWidth;
  const alto = video.videoHeight;
  if (!ancho || !alto) return null;
  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;
  const ctx = lienzo.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, ancho, alto);
  const blob = await new Promise<Blob | null>((ok) =>
    lienzo.toBlob(ok, "image/jpeg", 0.9),
  );
  if (!blob) return null;
  return new File([blob], `foto-${Date.now()}.jpg`, { type: "image/jpeg" });
}
