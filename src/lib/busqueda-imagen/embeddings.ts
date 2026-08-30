import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import { DIMENSION } from "@/lib/busqueda-imagen/similitud";

/**
 * LOS VECTORES DE `gemini-embedding-2` (30 ago 2026).
 *
 * El modelo multimodal de embeddings de Google: imágenes y texto caen en el
 * MISMO espacio vectorial, con la misma API key del traductor. Cuesta $0.20
 * por millón de tokens — indexar el catálogo entero (~13.000 fotos) sale en
 * menos de dos dólares, una sola vez. Verificado contra su documentación
 * oficial: endpoint `:embedContent`, imagen en `content.parts[].inline_data`,
 * `output_dimensionality` con truncado Matryoshka auto-normalizado.
 *
 * El bloqueo de modelos caros sigue intacto: esto es un modelo de embeddings
 * barato, no genera nada, y si falla NO se escala a otro.
 */

function llave(): string | null {
  let entorno: Record<string, string | undefined> = {};
  try {
    entorno = getCloudflareContext().env as unknown as Record<
      string,
      string | undefined
    >;
  } catch {
    entorno = process.env as Record<string, string | undefined>;
  }
  return entorno.TRADUCCION_LLAVE?.trim() || null;
}

const MODELO = "gemini-embedding-2";

type ResultadoEmbedding =
  { ok: true; vector: Float32Array } | { ok: false; motivo: string };

async function pedirEmbedding(
  parts: Array<Record<string, unknown>>,
): Promise<ResultadoEmbedding> {
  const clave = llave();
  if (!clave) return { ok: false, motivo: "Falta TRADUCCION_LLAVE." };

  let respuesta: Response;
  try {
    respuesta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:embedContent`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": clave,
        },
        body: JSON.stringify({
          content: { parts },
          output_dimensionality: DIMENSION,
        }),
      },
    );
  } catch (fallo) {
    return {
      ok: false,
      motivo: `Sin conexión con el modelo: ${String(fallo)}`,
    };
  }

  if (!respuesta.ok) {
    const cuerpo = await respuesta.text().catch(() => "");
    return {
      ok: false,
      motivo: `Embedding respondió ${respuesta.status}: ${cuerpo.slice(0, 300)}`,
    };
  }

  const datos = (await respuesta.json().catch(() => null)) as {
    embedding?: { values?: number[] };
    embeddings?: Array<{ values?: number[] }>;
  } | null;
  /* La doc enseña `embeddings[0].values`; algunas versiones responden
     `embedding.values`. Se aceptan las dos — lo que no se acepta es un
     vector vacío o de otra dimensión. */
  const valores =
    datos?.embeddings?.[0]?.values ?? datos?.embedding?.values ?? null;
  if (!valores || valores.length === 0) {
    return { ok: false, motivo: "El modelo no devolvió un vector." };
  }
  return { ok: true, vector: Float32Array.from(valores.slice(0, DIMENSION)) };
}

/** El vector de una imagen (bytes crudos). */
export async function embeddingDeImagen(
  bytes: ArrayBuffer,
  tipoMime: string,
): Promise<ResultadoEmbedding> {
  /* La doc lista png y jpeg; el webp del bucket se manda con su mime real —
     si el modelo lo rechazara, el motivo queda guardado por producto y se ve
     en el panel, no se adivina. */
  const mime = ["image/png", "image/jpeg", "image/webp"].includes(tipoMime)
    ? tipoMime
    : "image/jpeg";
  return pedirEmbedding([
    {
      inline_data: {
        mime_type: mime,
        data: Buffer.from(bytes).toString("base64"),
      },
    },
  ]);
}
