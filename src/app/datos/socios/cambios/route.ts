import { and, eq, gt } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { imagenesProducto, productos, sociosTienda } from "@/lib/db/schema";
import {
  productoParaElSocio,
  type ProductoDeMercatren,
} from "@/lib/socios/contrato";
import {
  hashDeToken,
  igualesEnTiempoConstante,
  tokenDeLaPeticion,
} from "@/lib/socios/token";
import { SITIO } from "@/lib/sitio";

/**
 * QUÉ CAMBIÓ EN MERCATREN — la vuelta que antes no existía.
 *
 * La plataforma socia pregunta cada pocos minutos qué se movió de este lado, y
 * lo aplica en el catálogo del comerciante. Sin esto la sincronización sería de
 * una sola dirección, y el trabajo que el comerciante hace en Mercatren no
 * llegaría nunca a su propio sistema.
 *
 * Es lo primero que se usa con el piloto: tiene 21 productos aquí y 1 allá, así
 * que la primera lectura los trae hacia QRbott.
 *
 * ══ EL PRECIO QUE SALE ES LA BASE, NUNCA EL PUBLICADO ══
 *
 * Mercatren publica base + su margen. Si saliera el publicado, el socio lo
 * guardaría como base y en la vuelta siguiente le sumaríamos el margen otra
 * vez: 100 → 103,09 → 106,28 → 109,57, subiendo solo todos los días sin un solo
 * error. Lo resuelve `productoParaElSocio()`, y hay pruebas que lo vigilan.
 *
 * ══ SIN `desde` SE MANDA TODO, Y ESO SE DECLARA ══
 *
 * La primera llamada no trae `desde`: se responde el catálogo entero con
 * `completo: true`. Las siguientes traen la fecha y se responde solo lo que
 * cambió, con `completo: false` — para que el otro lado sepa que NO puede
 * retirar lo que no vino.
 */

function json(cuerpo: unknown, status = 200) {
  return Response.json(cuerpo, { status });
}

export async function GET(peticion: Request) {
  const presentado = tokenDeLaPeticion(peticion);
  if (!presentado) return json({ error: "no_autorizado" }, 401);

  const db = getDb();
  const hash = await hashDeToken(presentado);

  /* Se busca por el hash y ADEMÁS se compara en tiempo constante. Buscar por
     hash ya es seguro, pero la comparación explícita deja el patrón escrito
     para quien copie esta ruta mañana. */
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

  const url = new URL(peticion.url);
  const desdeTexto = url.searchParams.get("desde");
  const desde = desdeTexto ? new Date(desdeTexto) : null;

  if (desde && Number.isNaN(desde.getTime())) {
    return json({ error: "desde_invalido" }, 400);
  }

  /* El corte se toma ANTES de leer, no después: si se tomara al final, lo que
     cambie mientras corre la consulta quedaría por debajo del corte y no se
     mandaría nunca. Perder un cambio así no da ningún error. */
  const hasta = new Date();

  const condiciones = [eq(productos.tiendaId, socio.tiendaId)];
  if (desde) condiciones.push(gt(productos.actualizadoEn, desde));

  /* Se nombran las columnas una por una a propósito. Pedir la tabla entera
     lista TODAS las del esquema, incluidas las que se acaban de agregar — y
     como `schema.sql` solo trae CREATE TABLE IF NOT EXISTS, una base que ya
     existe no las tiene y la ruta revienta con 500. Pasó el 5 ago 2026. */
  const filas = await db
    .select({
      id: productos.id,
      externoId: productos.externoId,
      sku: productos.sku,
      tituloEs: productos.tituloEs,
      tituloEn: productos.tituloEn,
      descripcionEs: productos.descripcionEs,
      descripcionEn: productos.descripcionEn,
      marca: productos.marca,
      precioBaseCentavos: productos.precioBaseCentavos,
      precioCentavos: productos.precioCentavos,
      precioAntesCentavos: productos.precioAntesCentavos,
      existencias: productos.existencias,
      controlaExistencias: productos.controlaExistencias,
      unidad: productos.unidad,
      pesoGramos: productos.pesoGramos,
      estado: productos.estado,
      destacado: productos.destacado,
    })
    .from(productos)
    .where(and(...condiciones));

  /**
   * Las fotos de todos, en UNA consulta y SIN mandar la lista de
   * identificadores.
   *
   * Mandarlos dentro de un `IN (...)` es lo natural y no funciona: la base
   * acepta como mucho **100 valores por consulta**, y aquí son cientos.
   * Comprobado en el servidor de desarrollo con los 689 productos del piloto —
   * «too many SQL variables»— y es el mismo tope que tumbaba la consulta que
   * retiraba productos en la sincronización.
   *
   * Con un join contra `productos` repitiendo el filtro de la tienda, la
   * consulta pesa igual con diez productos que con diez mil.
   */
  const condicionesFoto = [eq(productos.tiendaId, socio.tiendaId)];
  if (desde) condicionesFoto.push(gt(productos.actualizadoEn, desde));

  const fotos = await db
    .select({
      productoId: imagenesProducto.productoId,
      url: imagenesProducto.url,
      clave: imagenesProducto.clave,
      alt: imagenesProducto.textoAltEs,
      orden: imagenesProducto.orden,
    })
    .from(imagenesProducto)
    .innerJoin(productos, eq(productos.id, imagenesProducto.productoId))
    .where(and(...condicionesFoto));

  const fotosPorProducto = new Map<
    string,
    { url: string; alt: string | null; orden: number }[]
  >();

  for (const f of fotos) {
    /* Una foto usa `url` (el servidor de origen) o `clave` (nuestro bucket),
       nunca las dos. La que está en el bucket se sirve por /media.

       Y VA CON EL DOMINIO DELANTE. Una dirección como `/media/…` no le sirve
       de nada a un sistema que corre en otro servidor: la pediría contra el
       suyo y recibiría un 404. Se guarda relativa y sale absoluta. */
    const direccion =
      f.url ?? (f.clave ? `${SITIO.url}/media/${f.clave}` : null);
    if (!direccion) continue;

    const lista = fotosPorProducto.get(f.productoId) ?? [];
    lista.push({ url: direccion, alt: f.alt, orden: f.orden ?? 0 });
    fotosPorProducto.set(f.productoId, lista);
  }

  const listos = filas
    /* Sin identificador de origen no hay con qué emparejarlo del otro lado.
       Los productos cargados a mano aquí todavía no lo tienen: se les asigna
       cuando se manden por primera vez, no en una lectura. */
    .filter((f) => f.externoId)
    .map((f) => {
      const producto: ProductoDeMercatren = {
        ...f,
        imagenes: fotosPorProducto.get(f.id) ?? [],
      };
      return productoParaElSocio(producto);
    });

  await db
    .update(sociosTienda)
    .set({
      cursor: hasta.toISOString(),
      ultimoResultado: `${listos.length} entregados`,
      actualizadoEn: new Date(),
    })
    .where(eq(sociosTienda.id, socio.id));

  return json({
    version: 1,
    /* Solo la primera lectura trae el catálogo entero. En un delta esto va en
       false para que el otro lado NO retire lo que no vino. */
    completo: !desde,
    desde: desde?.toISOString() ?? null,
    hasta: hasta.toISOString(),
    tienda: { mercatren_id: socio.tiendaId },
    products: listos,
    /* Mercatren no borra productos: los pasa a borrador y viajan con su
       `status`. Por eso esta lista va siempre vacía, y va igual para que el
       formato sea el mismo en las dos direcciones. */
    deletions: [],
  });
}
