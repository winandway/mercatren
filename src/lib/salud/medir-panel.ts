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

  /* Lo de Configuración. Las piezas que exigen el rol de Soporte se miden
     por debajo del guardián —la consulta tal cual, para el mercado
     principal—, y las que traían el catálogo entero se miden en las dos
     formas: como estaban (filas al servidor) y como quedaron (COUNT en la
     base). Así el «antes» y el «después» salen del mismo run. */
  {
    const { getDb } = await import("@/lib/db");
    const { productos, tiendas, intentosDescripcion, enviosProducto } =
      await import("@/lib/db/schema");
    const { and, eq, isNotNull, isNull, or, sql, like } =
      await import("drizzle-orm");
    const db = getDb();

    const { auditarPrecios } = await import("@/lib/productos/auditoria");
    await medir(
      "auditarPrecios · 1.ª vez (recorre el catálogo)",
      auditarPrecios,
      configuracion,
    );
    await medir(
      "auditarPrecios · 2.ª vez (recordada)",
      auditarPrecios,
      configuracion,
    );

    await medir(
      "sin traducir · ANTES (47.000 títulos al servidor)",
      async () =>
        (
          await db
            .select({ es: productos.tituloEs, en: productos.tituloEn })
            .from(productos)
            .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
            .where(
              and(eq(tiendas.paisOrigen, "US"), isNotNull(productos.tituloEn)),
            )
        ).length,
      configuracion,
    );
    await medir(
      "sin traducir · AHORA (COUNT)",
      () =>
        db
          .select({ n: sql<number>`COUNT(*)` })
          .from(productos)
          .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
          .where(
            and(
              eq(tiendas.paisOrigen, "US"),
              sql`trim(coalesce(${productos.tituloEn}, '')) <> '' AND (trim(coalesce(${productos.tituloEs}, '')) = '' OR lower(trim(${productos.tituloEs})) = lower(trim(${productos.tituloEn})))`,
            ),
          ),
      configuracion,
    );

    const sinDescripcion = and(
      eq(tiendas.paisOrigen, "US"),
      isNotNull(productos.externoId),
      isNull(intentosDescripcion.productoId),
      or(
        isNull(productos.descripcionEs),
        eq(sql`trim(${productos.descripcionEs})`, ""),
      ),
    );
    await medir(
      "sin descripción · ANTES (filas al servidor)",
      async () =>
        (
          await db
            .select({ id: productos.id })
            .from(productos)
            .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
            .leftJoin(
              intentosDescripcion,
              eq(intentosDescripcion.productoId, productos.id),
            )
            .where(sinDescripcion)
        ).length,
      configuracion,
    );
    await medir(
      "sin descripción · AHORA (COUNT)",
      () =>
        db
          .select({ n: sql<number>`COUNT(*)` })
          .from(productos)
          .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
          .leftJoin(
            intentosDescripcion,
            eq(intentosDescripcion.productoId, productos.id),
          )
          .where(sinDescripcion),
      configuracion,
    );

    const sinEnvio = and(
      eq(tiendas.paisOrigen, "US"),
      or(
        isNull(enviosProducto.productoId),
        like(sql`lower(${enviosProducto.transporte})`, "%regional%"),
      ),
    );
    await medir(
      "sin envío · ANTES (filas al servidor)",
      async () =>
        (
          await db
            .select({ id: productos.id })
            .from(productos)
            .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
            .leftJoin(
              enviosProducto,
              eq(enviosProducto.productoId, productos.id),
            )
            .where(sinEnvio)
        ).length,
      configuracion,
    );
    await medir(
      "sin envío · AHORA (COUNT)",
      () =>
        db
          .select({ n: sql<number>`COUNT(*)` })
          .from(productos)
          .innerJoin(tiendas, eq(tiendas.id, productos.tiendaId))
          .leftJoin(enviosProducto, eq(enviosProducto.productoId, productos.id))
          .where(sinEnvio),
      configuracion,
    );

    await medir(
      "motivos de fallo · ANTES (todos los intentos al servidor)",
      async () =>
        (
          await db
            .select({ motivo: intentosDescripcion.motivo })
            .from(intentosDescripcion)
        ).length,
      configuracion,
    );
    await medir(
      "motivos de fallo · AHORA (GROUP BY)",
      () =>
        db
          .select({
            m: sql<string>`substr(${intentosDescripcion.motivo}, 1, 90)`,
            n: sql<number>`COUNT(*)`,
          })
          .from(intentosDescripcion)
          .groupBy(sql`substr(${intentosDescripcion.motivo}, 1, 90)`)
          .orderBy(sql`COUNT(*) DESC`)
          .limit(6),
      configuracion,
    );

    const { contarFotosRotas, fotosPorHoraVigente } =
      await import("@/lib/catalogo/fotos-panel");
    const { saludDeLosComercios } = await import("@/lib/socios/salud");
    const { estadoZelleCobros } = await import("@/lib/cobros/zelle-admin");
    const { estadoTransferencia } =
      await import("@/lib/cobros/transferencia-admin");
    const { resumenF129 } = await import("@/lib/impuestos/f129");
    await medir("contarFotosRotas", contarFotosRotas, configuracion);
    await medir("fotosPorHoraVigente", fotosPorHoraVigente, configuracion);
    await medir("saludDeLosComercios", saludDeLosComercios, configuracion);
    await medir("estadoZelleCobros", estadoZelleCobros, configuracion);
    await medir("estadoTransferencia", estadoTransferencia, configuracion);
    await medir("resumenF129", resumenF129, configuracion);
  }

  return { totalMs: Date.now() - arranque, layout, configuracion };
}

/**
 * ══ QUÉ BANCO VE EL CLIENTE EN EL ENLACE DE COBRO (21 sep 2026) ══
 *
 * Richard: «yo solo tengo Mercury y Chase, no sé qué es Column». Los datos
 * que el enlace le enseña a quien paga salen de variables del panel, y desde
 * fuera no hay forma de saber A CUÁL de las dos cuentas apuntan — el archivo
 * privado lo dejaba anotado como pendiente desde agosto.
 *
 * Esto lo dice, SIN enseñar los números: el nombre del banco y del titular
 * (que es lo que el cliente lee), y de la cuenta y las rutas solo los cuatro
 * últimos dígitos, que es lo justo para reconocerlas.
 */
export async function queBancoVeElCliente(): Promise<{
  beneficiario: string | null;
  banco: string | null;
  cuentaTermina: string | null;
  rutaAchTermina: string | null;
  rutaWireTermina: string | null;
  listo: boolean;
}> {
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { env } = getCloudflareContext();
  const leer = (clave: string) =>
    (env as unknown as Record<string, string | undefined>)[clave]?.trim() ||
    null;
  const cola = (v: string | null) => (v ? v.slice(-4) : null);

  const cuenta = leer("PAGO_CUENTA");
  const ach = leer("PAGO_RUTA_ACH");
  return {
    beneficiario: leer("PAGO_BENEFICIARIO"),
    banco: leer("PAGO_BANCO"),
    cuentaTermina: cola(cuenta),
    rutaAchTermina: cola(ach),
    rutaWireTermina: cola(leer("PAGO_RUTA_WIRE")),
    listo: Boolean(
      leer("PAGO_BENEFICIARIO") && leer("PAGO_BANCO") && cuenta && ach,
    ),
  };
}

/**
 * ══ LOS ÚLTIMOS COBROS, SIN FILTROS Y SIN TRAGARSE EL ERROR (21 sep 2026) ══
 *
 * Richard cuadró una factura de $6.483,77, el sistema le dijo que el correo
 * salió, y la pantalla de enlaces de cobro le enseñó «ninguno». Una hora
 * buscando un enlace que no podía ver. La consulta de esa pantalla termina en
 * `.catch(() => [])`: si falla, dice que no hay cobros en vez de decir que se
 * rompió — y desde fuera del sitio no hay forma de saber cuál de las dos es.
 *
 * Esto lee los diez últimos cobros SIN filtro de comercio ni de país, con su
 * enlace, y si la consulta revienta devuelve el error de verdad.
 */
export async function ultimosCobros(): Promise<unknown> {
  const { getDb } = await import("@/lib/db");
  const { cobrosSolicitados, tiendas } = await import("@/lib/db/schema");
  const { desc, eq } = await import("drizzle-orm");
  try {
    const filas = await getDb()
      .select({
        enlace: cobrosSolicitados.enlace,
        referencia: cobrosSolicitados.referencia,
        montoCentavos: cobrosSolicitados.montoCentavos,
        estado: cobrosSolicitados.estado,
        correo: cobrosSolicitados.contactoCorreo,
        creadoEn: cobrosSolicitados.creadoEn,
        tienda: tiendas.nombre,
        tiendaMercado: tiendas.mercado,
      })
      .from(cobrosSolicitados)
      .leftJoin(tiendas, eq(tiendas.id, cobrosSolicitados.tiendaId))
      .orderBy(desc(cobrosSolicitados.creadoEn))
      .limit(10);
    return {
      cuantos: filas.length,
      cobros: filas.map((f) => ({
        ...f,
        url: `https://mercatren.com/es/cobro/${f.enlace}`,
        monto: (Number(f.montoCentavos) / 100).toFixed(2),
      })),
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * ¿VA A SALIR ZELLE EN UN COBRO DE ESTE MONTO, Y SI NO, POR QUÉ?
 *
 * Para comprobarlo desde fuera sin pedirle a Richard que pulse nada: el
 * aviso del panel (22 sep 2026) vive detrás de una sesión, y esto lee la
 * misma decisión con los mismos datos de producción.
 */
export async function saleZelle(
  montoCentavos: number,
  /* Un trozo del nombre del comercio. Sin él salen los 8 más nuevos, que
     son los del catálogo y casi nunca el que se está mirando. */
  tienda?: string,
): Promise<
  Array<{
    tienda: string;
    mercado: string;
    saldra: boolean;
    motivo: string | null;
    maximo: string;
  }>
> {
  const { porQueNoSaleZelle } = await import("@/lib/cobros/consultas");
  const { getDb } = await import("@/lib/db");
  const { tiendas } = await import("@/lib/db/schema");
  const { desc } = await import("drizzle-orm");

  const { like } = await import("drizzle-orm");
  const base = getDb()
    .select({
      id: tiendas.id,
      nombre: tiendas.nombre,
      mercado: tiendas.mercado,
    })
    .from(tiendas);
  const filas = await (tienda?.trim()
    ? base.where(like(tiendas.nombre, `%${tienda.trim()}%`)).limit(8)
    : base.orderBy(desc(tiendas.creadoEn)).limit(8));

  const salida = [];
  for (const t of filas) {
    const z = await porQueNoSaleZelle(t.id, montoCentavos);
    salida.push({
      tienda: t.nombre,
      mercado: t.mercado ?? "",
      saldra: z.saldra,
      motivo: z.motivo,
      maximo: (z.maximoCentavos / 100).toFixed(2),
    });
  }
  return salida;
}
