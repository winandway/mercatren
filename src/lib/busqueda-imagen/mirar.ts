import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import { extraerTerminos } from "@/lib/busqueda-imagen/parsear";

/**
 * EL OJO DE LA BÚSQUEDA POR FOTO (30 ago 2026).
 *
 * El cliente sube una foto del producto que anda buscando y Gemini la mira y
 * la convierte en TÉRMINOS DE BÚSQUEDA para nuestro propio catálogo. La IA
 * no elige productos: describe lo que ve, y el buscador de siempre — con sus
 * sinónimos y su alcance por mercado — hace el resto.
 *
 * ══ EL MODELO ES EL MISMO DEL TRADUCTOR, Y NO SE ESCALA ══
 *
 * `gemini-2.5-flash` con la misma `TRADUCCION_LLAVE`: es multimodal, cuesta
 * una fracción de centavo por imagen y está dentro de lo aprobado por la
 * casa. El bloqueo de modelos caros sigue intacto: si esta llamada falla, se
 * devuelve el motivo y NO se intenta con nada más caro.
 */

function llaveYModelo(): { llave: string; modelo: string } | null {
  let entorno: Record<string, string | undefined> = {};
  try {
    entorno = getCloudflareContext().env as unknown as Record<
      string,
      string | undefined
    >;
  } catch {
    entorno = process.env as Record<string, string | undefined>;
  }
  const llave = entorno.TRADUCCION_LLAVE?.trim();
  if (!llave) return null;
  return {
    llave,
    modelo: entorno.TRADUCCION_MODELO?.trim() || "gemini-2.5-flash",
  };
}

/** ¿Está configurado el ojo? Sin llave, el botón de la cámara no se ofrece. */
export function busquedaPorImagenDisponible(): boolean {
  return llaveYModelo() !== null;
}

const INSTRUCCION = `Eres el buscador visual de una tienda en línea. Te llega la foto de UN producto que un cliente quiere encontrar en el catálogo. Devuelve SOLO un JSON con esta forma exacta:
{"es": ["término uno", "término dos", "término tres"], "en": ["term one", "term two"], "descripcion": "qué se ve en la foto, en una frase"}
Los términos son CORTOS (1 a 3 palabras), del más específico al más general, como los escribiría una persona en un buscador: el nombre del producto, su tipo, su uso. Nada de marcas salvo que se lean claras en la foto. Nada de colores ni adjetivos decorativos en los dos primeros términos.`;

export type MiradaDeGemini =
  | { ok: true; es: string[]; en: string[]; descripcion: string }
  | { ok: false; motivo: string };

/** Le enseña la foto a Gemini y devuelve los términos de búsqueda. */
export async function mirarImagen(
  bytes: ArrayBuffer,
  tipoMime: string,
): Promise<MiradaDeGemini> {
  const config = llaveYModelo();
  if (!config) {
    return { ok: false, motivo: "Falta TRADUCCION_LLAVE en el panel." };
  }

  const base64 = Buffer.from(bytes).toString("base64");

  let respuesta: Response;
  try {
    respuesta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.modelo}:generateContent`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": config.llave,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: INSTRUCCION }] },
          contents: [
            {
              parts: [
                { inlineData: { mimeType: tipoMime, data: base64 } },
                { text: "¿Qué producto es y con qué términos lo busco?" },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      },
    );
  } catch (fallo) {
    return {
      ok: false,
      motivo: `No se pudo hablar con el ojo: ${String(fallo)}`,
    };
  }

  if (!respuesta.ok) {
    const cuerpo = await respuesta.text().catch(() => "");
    return {
      ok: false,
      motivo: `Gemini respondió ${respuesta.status}: ${cuerpo.slice(0, 300)}`,
    };
  }

  const datos = (await respuesta.json().catch(() => null)) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  } | null;
  const texto = datos?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return extraerTerminos(texto);
}
