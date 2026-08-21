import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import {
  leerRespuesta,
  type PeticionDeTraduccion,
  type ResultadoModelo,
} from "./reglas";

/**
 * EL TRADUCTOR DEL CATÁLOGO.
 *
 * ══ POR QUÉ UN MODELO DE TEXTO Y NO UN TRADUCTOR ══
 *
 * Los títulos de CJ no son frases: son montones de palabras sueltas puestas
 * para su propio buscador («S24109 Elecony 24 Inch Fat Tire Bike Youth Full
 * Shimano 7 Speed»). Un traductor palabra por palabra devuelve eso mismo en
 * español y sigue siendo ilegible. Lo que hace falta es **reescribirlo como lo
 * escribiría una tienda**, y eso lo hace un modelo de texto.
 *
 * ══ EL BLOQUEO DE MODELOS CAROS SIGUE PUESTO ══
 *
 * La regla de la casa bloquea los modelos de IMAGEN caros, y con razón: dos
 * facturas de $500 y $200. Esto es TEXTO, que es otro orden de magnitud: un
 * título con su descripción son unas 200 fichas, así que traducir diez mil
 * productos cuesta menos de un dólar. Aun así, aquí no se llama a ningún
 * modelo de imagen ni se escala a uno más caro si el barato falla: si falla,
 * se devuelve el error y se deja el producto como estaba.
 *
 * ══ SIN LLAVE, NO PASA NADA — Y ESO ES LO CORRECTO ══
 *
 * Si `TRADUCCION_LLAVE` no está cargada, esto devuelve un error claro y el
 * catálogo se queda como está. Nunca inventa una traducción, nunca borra un
 * título, y el resto del sitio sigue funcionando igual. Un catálogo en inglés
 * se vende mal; un catálogo con los títulos borrados no se vende.
 */

const MODELO_POR_DEFECTO = "gemini-2.5-flash";

const INSTRUCCION = `Eres el redactor de catálogo de una tienda en línea que vende en Estados Unidos y Latinoamérica.

Te van a pasar títulos de productos en inglés, tal como vienen de un proveedor mayorista. Vienen sucios: llevan códigos de referencia, marcas, medidas y palabras sueltas puestas para un buscador.

Tu trabajo es escribir el título EN ESPAÑOL como lo escribiría una tienda de verdad.

Reglas:
- Español neutro, para todo el continente. Nada regional.
- Deja las marcas y los códigos de referencia tal como están (Shimano, VEVOR, S24109).
- Convierte las medidas al español cuando tenga sentido: "26 Inch" a "26 pulgadas", "6000 Lbs" a "6000 libras".
- Máximo 90 caracteres. Lo primero tiene que ser QUÉ ES el producto.
- No inventes características que el original no diga.
- Si el original ya está en español, devuélvelo igual.

Responde SOLO con un JSON así, sin texto alrededor:
{"t":[{"id":"...","titulo":"..."}]}`;

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
  /**
   * LA LLAVE NO SE VALIDA POR FORMATO, Y ESO ES DELIBERADO.
   *
   * Lo único que se comprueba es que no venga vacía. Nada de exigir que
   * empiece por «AIza» ni que mida 39 caracteres.
   *
   * ══ POR QUÉ, CON UN CASO REAL ══
   *
   * Google emite hoy DOS formatos de llave. El viejo empieza por `AIza` y mide
   * 39; el nuevo de Google Cloud empieza por **`AQ.`** y mide **53**. La
   * nuestra es del segundo tipo, y funciona: se probó contra la API el 20 ago
   * 2026 y devolvió 200.
   *
   * Una comprobación de formato «por seguridad» habría rechazado una llave
   * perfectamente válida, y el mensaje habría dicho que falta la variable —
   * mandando a buscar el fallo en el panel del sitio, que es donde no está.
   * Google puede sacar un tercer formato mañana y nadie nos avisaría.
   *
   * Quien decide si la llave sirve es Google, y lo dice con su respuesta: si
   * no vale, devuelve 400 y ese motivo sale entero en el panel.
   */
  const llave = (entorno.TRADUCCION_LLAVE ?? "").trim();
  if (!llave) return null;
  return {
    llave,
    modelo: (entorno.TRADUCCION_MODELO ?? "").trim() || MODELO_POR_DEFECTO,
  };
}

/** ¿Está configurado el traductor? Para que el panel lo diga antes de nada. */
export function traductorConfigurado(): boolean {
  return llaveYModelo() !== null;
}

export async function traducirTanda(
  peticiones: PeticionDeTraduccion[],
): Promise<ResultadoModelo> {
  if (peticiones.length === 0) return { ok: true, traducciones: [] };

  const config = llaveYModelo();
  if (!config) {
    return {
      ok: false,
      motivo:
        "Falta la variable TRADUCCION_LLAVE en el panel del sitio. Sin ella no se traduce nada.",
    };
  }

  const entrada = peticiones.map((p) => ({
    id: p.id,
    titulo: p.tituloEn,
  }));

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
          contents: [{ parts: [{ text: JSON.stringify(entrada) }] }],
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
      motivo: `No se pudo hablar con el traductor: ${String(fallo)}`,
    };
  }

  if (!respuesta.ok) {
    /* El motivo entero, no un «no se pudo». Esta pantalla es del equipo
       interno: no hay un comprador del otro lado a quien filtrarle nada, y un
       error genérico obliga a adivinar entre una llave mal pegada, una cuota
       agotada y un modelo que no existe. */
    const cuerpo = await respuesta.text().catch(() => "");
    return {
      ok: false,
      motivo: `El traductor respondió ${respuesta.status}: ${cuerpo.slice(0, 400)}`,
    };
  }

  return leerRespuesta(await respuesta.json(), peticiones);
}

