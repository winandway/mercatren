import "server-only";

/**
 * ══ CUÁNTO TARDA CADA PIEZA DEL PANEL, MEDIDO EN PRODUCCIÓN (21 sep 2026) ══
 *
 * Richard: «el menú está muy lento; navego y por ejemplo en Configuración
 * está muy lento». Desde fuera no se puede medir el panel (exige sesión), así
 * que esto corre DENTRO del sitio por la puerta de pruebas
 * (`{"accion":"medir-panel"}`) y cronometra, una por una, las consultas que
 * hacen el layout del panel y la pantalla de Configuración. Solo lectura.
 *
 * Las piezas que dependen de la sesión (alcance, mercado del panel) se miden
 * con lo que la puerta tiene: sin sesión, `mercadoDelPanel()` da el mercado
 * principal, que es justo lo que ve Soporte por defecto.
 */

type Medida = { pieza: string; ms: number; error?: string };

async function medir<T>(
  pieza: string,
  fn: () => Promise<T>,
  salida: Medida[],
): Promise<T | null> {
  const t0 = Date.now();
  try {
    const r = await fn();
    salida.push({ pieza, ms: Date.now() - t0 });
    return r;
  } catch (e) {
    salida.push({
      pieza,
      ms: Date.now() - t0,
      error: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}

export async function medirElPanel(): Promise<{
  totalMs: number;
  layout: Medida[];
  configuracion: Medida[];
}> {
  const arranque = Date.now();
  const layout: Medida[] = [];
  const configuracion: Medida[] = [];

  /* Lo del layout: se ejecuta en CADA navegación del panel. */
  {
    const { listarPendientesDeValidacion } =
      await import("@/lib/zelle/consultas");
    const { getDb } = await import("@/lib/db");
    const { pagosZelle, retiros, tiendas } = await import("@/lib/db/schema");
    const { and, eq, sql } = await import("drizzle-orm");
    await medir(
      "pendientes de validación (lista entera, como hoy)",
      () => listarPendientesDeValidacion(),
      layout,
    );
    await medir(
      "pendientes de validación (COUNT)",
      () =>
        getDb()
          .select({ n: sql<number>`COUNT(*)` })
          .from(pagosZelle)
          .where(eq(pagosZelle.estado, "pendiente")),
      layout,
    );
    await medir(
      "retiros pendientes",
      () =>
        getDb()
          .select({ n: sql<number>`COUNT(*)` })
          .from(retiros)
          .innerJoin(tiendas, eq(tiendas.id, retiros.tiendaId))
          .where(
            and(eq(retiros.estado, "solicitado"), eq(tiendas.mercado, "US")),
          ),
      layout,
    );
  }

  /* Lo de Configuración, en el mismo orden en que la página lo hace. */
  {
    const { auditarPrecios } = await import("@/lib/productos/auditoria");
    const { contarFotosPendientes } =
      await import("@/lib/catalogo/traer-fotos");
    const { contarFotosRotas, fotosPorHoraVigente } =
      await import("@/lib/catalogo/fotos-panel");
    const { estadoDelIndice } = await import("@/lib/busqueda-imagen/indexador");
    const { estadoDelTraductor, contarSinDescripcion, motivosDeFallo } =
      await import("@/lib/traduccion/acciones");
    const { saludDeLosComercios } = await import("@/lib/socios/salud");
    const { estadoZelleCobros } = await import("@/lib/cobros/zelle-admin");
    const { estadoTransferencia } =
      await import("@/lib/cobros/transferencia-admin");
    const { estadoDeTasasAutomaticas } = await import("@/lib/mercado/tasas");
    const { resumenF129 } = await import("@/lib/impuestos/f129");

    await medir(
      "auditarPrecios (trae TODOS los productos)",
      auditarPrecios,
      configuracion,
    );
    await medir("contarFotosPendientes", contarFotosPendientes, configuracion);
    await medir("contarFotosRotas", contarFotosRotas, configuracion);
    await medir("fotosPorHoraVigente", fotosPorHoraVigente, configuracion);
    await medir("estadoDelIndice", estadoDelIndice, configuracion);
    await medir("estadoDelTraductor", estadoDelTraductor, configuracion);
    await medir("contarSinDescripcion", contarSinDescripcion, configuracion);
    await medir("motivosDeFallo", motivosDeFallo, configuracion);
    await medir("saludDeLosComercios", saludDeLosComercios, configuracion);
    await medir("estadoZelleCobros", estadoZelleCobros, configuracion);
    await medir("estadoTransferencia", estadoTransferencia, configuracion);
    await medir(
      "estadoDeTasasAutomaticas (DolarApi)",
      estadoDeTasasAutomaticas,
      configuracion,
    );
    await medir("resumenF129", resumenF129, configuracion);
  }

  return { totalMs: Date.now() - arranque, layout, configuracion };
}
