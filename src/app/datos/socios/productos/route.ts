import { and, eq, isNull, lt, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import {
  agruparPorCodigo,
  type ProductoDeOrigen,
} from "@/lib/catalogo/agrupar";
import { getDb } from "@/lib/db";
import {
  imagenesProducto,
  productos,
  sociosAlias,
  sociosTienda,
} from "@/lib/db/schema";
import { precioConAjusteCentavos } from "@/lib/dinero";
import {
  aCentavos,
  envioDelSocio,
  estadoDesdeElSocio,
  existenciasDesdeElSocio,
} from "@/lib/socios/contrato";
import {
  hashDeToken,
  igualesEnTiempoConstante,
  tokenDeLaPeticion,
} from "@/lib/socios/token";

/**
 * LO QUE LA PLATAFORMA SOCIA MANDA HACIA MERCATREN.
 *
 * El comerciante guarda algo en su panel de QRbott y su sistema lo empuja aquí.
 * Es la otra mitad de `/datos/socios/cambios`.
 *
 * ══ LA BANDERA QUE EVITA BORRARLE EL CATÁLOGO A UN CLIENTE ══
 *
 * `completo` dice si el envío trae el catálogo ENTERO o solo lo que cambió.
 * **Retirar lo ausente solo se permite con el entero.**
 *
 * El caso que lo motiva es real: el piloto tiene 21 productos aquí y 1 allá. Con
 * un delta de un producto, retirar por ausencia le borraría los otros 20 —fuera
 * de la tienda y fuera de Google— y el resumen diría «1 actualizado, 20
 * retirados» en verde, sin un solo error.
 *
 * Y por defecto es `false`: si un día el socio deja de mandar el campo, lo
 * seguro es no retirar nada.
 *
 * ══ LO QUE NUNCA SE RETIRA, AUNQUE VENGA EL CATÁLOGO ENTERO ══
 *
 * Los productos que el comerciante cargó A MANO en el panel de Mercatren. No
 * tienen identificador de origen, así que el socio no puede saber que existen y
 * jamás van a estar en su archivo. Retirarlos sería borrarle al comercio el
 * trabajo que hizo de este lado.
 *
 * ══ EL PRECIO QUE LLEGA ES LA BASE ══
 *
 * Se le suma el ajuste aquí, igual que cuando el comercio carga un producto a
 * mano. Lo que NO se hace nunca es devolverle el publicado: eso lo explica
 * `src/lib/socios/contrato.ts`.
 */

function json(cuerpo: unknown, status = 200) {
  return Response.json(cuerpo, { status });
}

export async function POST(peticion: Request) {
  const presentado = tokenDeLaPeticion(peticion);
  if (!presentado) return json({ error: "no_autorizado" }, 401);

  const db = getDb();
  const hash = await hashDeToken(presentado);

  const [socio] = await db
    .select({
      id: sociosTienda.id,
      tiendaId: sociosTienda.tiendaId,
      tokenHash: sociosTienda.tokenHash,
    })
    .from(sociosTienda)
    .where(eq(sociosTienda.tokenHash, hash))
    .limit(1);

  if (!socio || !igualesEnTiempoConstante(hash, socio.tokenHash)) {
    return json({ error: "no_autorizado" }, 401);
  }

  const analisis = envioDelSocio.safeParse(
    await peticion.json().catch(() => null),
  );
  if (!analisis.success) {
    return json(
      { error: "envio_invalido", detalle: analisis.error.issues.slice(0, 5) },
      400,
    );
  }
  const envio = analisis.data;

  const tiendaId = socio.tiendaId;
  const ahora = new Date();

  /* UN CÓDIGO = UN PRODUCTO. El socio manda una línea por sucursal, así que el
     mismo tubo llega dos veces con las existencias de cada galpón. Se reusa la
     misma función que la sincronización de archivo, con sus pruebas. */
  const { grupos, fusionadas, repetidasEnUnGalpon } = agruparPorCodigo(
    envio.products.map((p): ProductoDeOrigen => ({
      id: p.id,
      sku: p.sku,
      slug: p.slug,
      title_es: p.title_es,
      title_en: p.title_en,
      description_es: p.description_es,
      description_en: p.description_en,
      brand: p.brand,
      price: p.price,
      compare_at_price: p.compare_at_price,
      stock: p.stock,
      unit: p.unit,
      weight_grams: p.weight_grams,
      status: p.status,
      featured: p.featured,
      sucursal: p.sucursal,
      images: (p.images ?? []).map((i) => ({
        url: i.url,
        alt: i.alt,
        position: i.position ?? 0,
      })),
    })),
  );

  /* Todo lo que hay que saber de la base, en tres consultas. Preguntar producto
     por producto son cientos de viajes y la petición no alcanza a terminar. */
  const existentes = new Map<string, string>();
  for (const fila of await db
    .select({ id: productos.id, externoId: productos.externoId })
    .from(productos)
    .where(eq(productos.tiendaId, tiendaId))) {
    if (fila.externoId) existentes.set(fila.externoId, fila.id);
  }

  /* Y los identificadores "hermanos": cuando un producto llega en dos líneas
     —una por sucursal— solo una queda en `productos.externo_id`. Sin esto, la
     otra no se reconoce y una baja que llegue por ella no encuentra nada. */
  for (const alias of await db
    .select({
      externoId: sociosAlias.externoId,
      productoId: sociosAlias.productoId,
    })
    .from(sociosAlias)
    .where(eq(sociosAlias.tiendaId, tiendaId))) {
    existentes.set(alias.externoId, alias.productoId);
  }

  const conFotoPropia = new Set(
    (
      await db
        .selectDistinct({ productoId: imagenesProducto.productoId })
        .from(imagenesProducto)
        .innerJoin(productos, eq(productos.id, imagenesProducto.productoId))
        .where(
          and(
            eq(productos.tiendaId, tiendaId),
            sql`${imagenesProducto.clave} IS NOT NULL`,
          ),
        )
    ).map((f) => f.productoId),
  );

  let creados = 0;
  let actualizados = 0;
  let sinPrecio = 0;

  for (const grupo of grupos) {
    const p = grupo.principal;
    if (!p.title_es?.trim()) continue;

    /* Se prefiere un identificador que Mercatren ya tenga: así el producto
       conserva su dirección web —que Google ya indexó— y las fotos que ya se
       trajeron al bucket. */
    const externoId =
      grupo.ids.find((id) => existentes.has(id)) ?? grupo.ids[0];
    if (!externoId) continue;

    // Llega la base; el ajuste se suma aquí, como con cualquier producto.
    const precioBase = aCentavos(p.price);
    const precio =
      precioBase && precioBase > 0
        ? precioConAjusteCentavos(precioBase)
        : precioBase;

    let estado = estadoDesdeElSocio(p.status);
    if (estado === "publicado" && (precio === null || precio <= 0)) {
      // Publicado sin precio no se publica: se vendería regalado.
      estado = "borrador";
      sinPrecio++;
    }

    const inventario = existenciasDesdeElSocio(grupo.existencias);

    const campos = {
      sku: p.sku ?? null,
      marca: p.brand ?? null,
      tituloEs: p.title_es,
      tituloEn: p.title_en ?? null,
      descripcionEs: p.description_es ?? null,
      descripcionEn: p.description_en ?? null,
      precioCentavos: precio ?? 0,
      precioBaseCentavos: precioBase ?? 0,
      precioAntesCentavos: (() => {
        const antes = aCentavos(p.compare_at_price);
        return antes && antes > 0 ? precioConAjusteCentavos(antes) : null;
      })(),
      existencias: inventario.existencias,
      controlaExistencias: inventario.controlaExistencias,
      unidad: p.unit ?? null,
      pesoGramos: p.weight_grams ?? null,
      estado,
      destacado: Boolean(p.featured),
      sincronizadoEn: ahora,
      actualizadoEn: ahora,
    };

    const existente = existentes.get(externoId);
    let productoId: string;

    if (existente) {
      productoId = existente;
      await db.update(productos).set(campos).where(eq(productos.id, existente));
      actualizados++;
    } else {
      productoId = nanoid();
      await db.insert(productos).values({
        ...campos,
        id: productoId,
        tiendaId,
        externoId,
        slug: `${aSlug(p)}-${nanoid(4).toLowerCase()}`,
        moneda: "USD",
        creadoEn: ahora,
      });
      existentes.set(externoId, productoId);
      creados++;
    }

    /* Se anotan TODOS los identificadores del grupo, no solo el canónico. Son
       los que permiten reconocer una baja que llegue por la línea de la otra
       sucursal, y saber cuándo el producto desapareció de todas. */
    for (const id of grupo.ids) {
      await db
        .insert(sociosAlias)
        .values({ id: nanoid(), tiendaId, externoId: id, productoId })
        .onConflictDoUpdate({
          target: [sociosAlias.tiendaId, sociosAlias.externoId],
          set: { productoId },
        });
      existentes.set(id, productoId);
    }

    // Las fotos que ya trajimos a nuestro almacenamiento no se pisan.
    const fotos = (p.images ?? []).filter((f) => f.url);
    if (fotos.length > 0 && !conFotoPropia.has(productoId)) {
      await db
        .delete(imagenesProducto)
        .where(eq(imagenesProducto.productoId, productoId));

      for (const [i, f] of fotos.entries()) {
        await db.insert(imagenesProducto).values({
          id: nanoid(),
          productoId,
          url: f.url!,
          textoAltEs: f.alt ?? null,
          orden: f.position ?? i,
        });
      }
    }
  }

  /**
   * LAS BAJAS, QUE VIENEN EXPLÍCITAS.
   *
   * El socio borra de verdad, así que un delta por fecha no las vería nunca.
   *
   * ══ UNA BAJA NO ES SIEMPRE UNA DESPUBLICACIÓN ══
   *
   * Si el mismo producto estaba en dos sucursales y el comercio borra la línea
   * de una, el producto SIGUE EXISTIENDO en la otra: despublicarlo sería
   * quitarle de la vitrina algo que todavía vende. Solo desaparece cuando ya no
   * le queda ningún identificador.
   *
   * Y cuando se despublica, pasa a BORRADOR — no se borra: puede tener pedidos
   * viejos colgando.
   */
  let dadosDeBaja = 0;
  for (const baja of envio.deletions) {
    const productoId = existentes.get(baja.id);
    if (!productoId) continue;

    await db
      .delete(sociosAlias)
      .where(
        and(
          eq(sociosAlias.tiendaId, tiendaId),
          eq(sociosAlias.externoId, baja.id),
        ),
      );
    existentes.delete(baja.id);

    const [quedan] = await db
      .select({ n: sql<number>`COUNT(*)` })
      .from(sociosAlias)
      .where(eq(sociosAlias.productoId, productoId));

    // Todavía lo tiene otra sucursal: no se toca.
    if (Number(quedan?.n ?? 0) > 0) continue;

    await db
      .update(productos)
      .set({ estado: "borrador", actualizadoEn: ahora })
      .where(eq(productos.id, productoId));
    dadosDeBaja++;
  }

  /**
   * RETIRAR LO QUE NO VINO — solo si el socio dijo que mandaba el catálogo
   * entero.
   *
   * Se reconoce por la fecha y no por una lista de identificadores: la base
   * acepta como mucho 100 valores por consulta, y aquí son cientos.
   *
   * Y NUNCA toca lo que no tiene identificador de origen: eso es lo que el
   * comerciante cargó a mano aquí, que el socio no puede conocer.
   */
  let aBorrador = 0;
  if (envio.completo) {
    const quitados = await db
      .update(productos)
      .set({ estado: "borrador", actualizadoEn: ahora })
      .where(
        and(
          eq(productos.tiendaId, tiendaId),
          sql`${productos.externoId} IS NOT NULL`,
          or(
            isNull(productos.sincronizadoEn),
            lt(productos.sincronizadoEn, ahora),
          ),
          sql`${productos.estado} != 'borrador'`,
        ),
      )
      .returning({ id: productos.id });
    aBorrador = quitados.length;
  }

  const resumen = `${creados} nuevos, ${actualizados} actualizados${dadosDeBaja ? `, ${dadosDeBaja} de baja` : ""}${aBorrador ? `, ${aBorrador} retirados` : ""}${sinPrecio ? `, ${sinPrecio} sin precio` : ""}`;

  await db
    .update(sociosTienda)
    .set({
      // El corte lo pone el socio y se guarda tal cual: dos relojes distintos
      // se comen los cambios de esa ventana sin que nadie lo note.
      cursor: envio.hasta,
      ultimoResultado: resumen,
      actualizadoEn: ahora,
    })
    .where(eq(sociosTienda.id, socio.id));

  return json({
    ok: true,
    resumen,
    creados,
    actualizados,
    de_baja: dadosDeBaja,
    retirados: aBorrador,
    sin_precio: sinPrecio,
    fusionadas,
    repetidas_en_un_galpon: repetidasEnUnGalpon,
    // Se devuelve para que el socio sepa desde dónde pedir la próxima vez.
    cursor: envio.hasta,
  });
}

function aSlug(origen: ProductoDeOrigen) {
  const pareceIdentificador =
    !origen.slug ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      origen.slug,
    );

  const base = pareceIdentificador ? (origen.title_es ?? "") : origen.slug!;

  return (
    base
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || `producto-${nanoid(6).toLowerCase()}`
  );
}
