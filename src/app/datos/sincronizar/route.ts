import { getCloudflareContext } from "@opennextjs/cloudflare";
import { isNotNull, ne, and } from "drizzle-orm";

import { sincronizarCatalogo } from "@/lib/catalogo/sincronizar";
import { getDbAsync, schema } from "@/lib/db";

/**
 * LA SINCRONIZACIÓN QUE CORRE SOLA.
 *
 * ══ EL PROBLEMA QUE RESUELVE ══
 *
 * El comercio piloto sigue vendiendo en su mostrador y cargando productos en su
 * propio sistema. Los dos caminos para enterarnos estaban construidos —él nos
 * empuja el catálogo, o nosotros leemos el archivo que publica— pero **ninguno
 * corría solo**: eran botones que alguien tenía que pulsar, y nadie los pulsaba.
 *
 * Resultado comprobado el 15 ago 2026: lijas nuevas en su depósito que aquí no
 * existían, y ventas suyas que no bajaban nuestro stock. Los dos catálogos se
 * separan un poco más cada día, y el final de esa historia es un comprador que
 * paga algo que en la ferretería ya se vendió.
 *
 * ══ POR QUÉ UNA DIRECCIÓN Y NO UNA TAREA DENTRO DE LA APP ══
 *
 * Next sobre este adaptador no expone un `scheduled()`: no hay dónde colgar un
 * cron por dentro. Así que el reloj vive fuera —en GitHub Actions, que ya está
 * montado y no cuesta nada— y aquí solo queda la puerta que toca.
 *
 * ══ LA LLAVE NO ES OPCIONAL ══
 *
 * Sin `SINCRONIZAR_LLAVE` cargada, esto responde 503 y no hace nada. Una
 * dirección que reescribe el catálogo de los comercios **no puede quedar
 * abierta** porque una variable no esté puesta: cualquiera podría dispararla en
 * bucle y tumbar el sitio, o peor, forzar lecturas contra el servidor del
 * comercio hasta que lo bloquee.
 */

export const dynamic = "force-dynamic";

/** Se comparan en tiempo constante: comparar con `===` filtra la llave. */
function igualesEnTiempoConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) {
    diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diferencia === 0;
}

async function sincronizarTodas(peticion: Request) {
  const { env } = getCloudflareContext();
  const llave = env.SINCRONIZAR_LLAVE?.trim();

  if (!llave) {
    return Response.json(
      { ok: false, motivo: "Falta SINCRONIZAR_LLAVE." },
      { status: 503 },
    );
  }

  const enviada = (peticion.headers.get("authorization") ?? "").replace(
    /^Bearer\s+/i,
    "",
  );

  if (!enviada || !igualesEnTiempoConstante(enviada, llave)) {
    /* 404 y no 401: a quien no corresponde ni se le confirma que esto existe. */
    return Response.json({ ok: false }, { status: 404 });
  }

  const db = await getDbAsync();
  const { fuentesCatalogo } = schema;

  /* Solo las que publican un archivo y están activas. Una fuente apagada se
     apagó por algo — normalmente porque su archivo está roto. */
  const fuentes = await db
    .select({ id: fuentesCatalogo.id, nombre: fuentesCatalogo.nombre })
    .from(fuentesCatalogo)
    .where(
      and(
        isNotNull(fuentesCatalogo.url),
        ne(fuentesCatalogo.url, ""),
        ne(fuentesCatalogo.estado, "pausada"),
      ),
    )
    .catch(() => []);

  const resultados: Array<{ fuente: string; ok: boolean; mensaje: string }> =
    [];

  for (const fuente of fuentes) {
    /**
     * UNA POR UNA, Y EL FALLO DE UNA NO DETIENE A LAS DEMÁS.
     *
     * Si el servidor de un comercio está caído, el de los otros no tiene por
     * qué quedarse sin actualizar. Y el motivo queda escrito en la respuesta:
     * una sincronización que falla en silencio es peor que no tenerla, porque
     * se sigue confiando en un stock que ya no es cierto.
     */
    try {
      const r = await sincronizarCatalogo(fuente.id, { sinSesion: true });
      resultados.push({ fuente: fuente.nombre, ok: r.ok, mensaje: r.mensaje });
    } catch (fallo) {
      console.error(`[sincronizar] ${fuente.id} falló:`, fallo);
      resultados.push({
        fuente: fuente.nombre,
        ok: false,
        mensaje: fallo instanceof Error ? fallo.message : String(fallo),
      });
    }
  }

  /* ══ EL STOCK DE CJ, POR TANDAS (2 sep 2026) ══
     En cada vuelta del reloj se miran 25 productos de CJ, del más viejo sin
     revisar al más nuevo: en una hora el catálogo entero está al día y lo
     agotado allá se ve agotado aquí. Un fallo no detiene a las fuentes. */
  let cj: { mirados: number; agotados: number; fallidos: number } | null = null;
  try {
    const { refrescarExistenciasCj } = await import("@/lib/cj/existencias");
    cj = await refrescarExistenciasCj(25);
  } catch (fallo) {
    console.error("[sincronizar] el stock de CJ no se pudo refrescar:", fallo);
  }

  /* ══ LA IMPORTACIÓN MASIVA Y SU AFINADO (2 sep 2026) ══
     Si hay un «traer el almacén completo» en marcha en alguna plaza, el reloj
     lo empuja unos minutos; después afina —flete real, tallas y stock— los
     productos que entraron con envío estimado; y al final traduce unas
     tandas de títulos y descripciones. Los tres tienen su presupuesto de
     tiempo: juntos caben de sobra en el `--max-time` del reloj (10 min) y
     dejan margen a las fuentes de los comercios. Un fallo no detiene al
     siguiente ni a lo de arriba. */
  let importacionCj: unknown = null;
  try {
    const { avanzarImportacionesEnCurso } =
      await import("@/lib/cj/masivo-servidor");
    importacionCj = await avanzarImportacionesEnCurso(120_000);
  } catch (fallo) {
    console.error("[sincronizar] la importación masiva no avanzó:", fallo);
  }

  let afinadoCj: unknown = null;
  try {
    const { afinarImportados } = await import("@/lib/cj/afinar");
    const { AFINADOS_POR_VUELTA } = await import("@/lib/cj/masivo");
    afinadoCj = await afinarImportados({
      limite: AFINADOS_POR_VUELTA,
      presupuestoMs: 110_000,
    });
  } catch (fallo) {
    console.error("[sincronizar] el afinado de CJ falló:", fallo);
  }

  let traduccion: unknown = null;
  try {
    const { traducirDesdeElReloj } = await import("@/lib/traduccion/tanda");
    traduccion = await traducirDesdeElReloj({
      tandasTitulos: 3,
      tandasDescripciones: 2,
    });
  } catch (fallo) {
    console.error("[sincronizar] la traducción del reloj falló:", fallo);
  }

  return Response.json({
    ok: true,
    fuentes: resultados.length,
    conFallo: resultados.filter((r) => !r.ok).length,
    resultados,
    stockCj: cj,
    importacionCj,
    afinadoCj,
    traduccion,
  });
}

export async function POST(peticion: Request) {
  return sincronizarTodas(peticion);
}

/* GET también, para poder comprobarlo a mano con un `curl` sin armar un POST. */
export async function GET(peticion: Request) {
  return sincronizarTodas(peticion);
}
