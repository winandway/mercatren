import { sugerencias } from "@/lib/catalogo/buscar";

export const dynamic = "force-dynamic";

/**
 * Las sugerencias del buscador, mientras la persona escribe.
 *
 * Vive en /datos y no en /api porque en YaDominios Cloud ese prefijo lo
 * capturan los archivos estaticos antes de llegar al codigo (ver
 * src/lib/rutas.ts).
 *
 * Solo devuelve catalogo publico: titulo, precio, foto y comercio. Nada de
 * aqui necesita sesion ni toca datos de nadie.
 */
export async function GET(peticion: Request) {
  const q = new URL(peticion.url).searchParams.get("q") ?? "";

  // Una sola letra devuelve medio catalogo y no ayuda: se espera a la segunda.
  if (q.trim().length < 2) {
    return Response.json({ productos: [], comercios: [], total: 0 });
  }

  try {
    const resultado = await sugerencias(q, 8);
    return Response.json(resultado, {
      // Se puede cachear un ratito: las mismas letras dan lo mismo, y asi el
      // que escribe rapido no golpea la base en cada tecla.
      headers: { "Cache-Control": "public, max-age=30" },
    });
  } catch (e) {
    console.error("[buscar] fallo la busqueda:", e);
    // El buscador nunca puede romper el encabezado: se responde vacio.
    return Response.json({ productos: [], comercios: [], total: 0 });
  }
}
