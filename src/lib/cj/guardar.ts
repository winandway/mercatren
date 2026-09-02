import "server-only";

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { getDb } from "@/lib/db";
import {
  billeteras,
  enviosProducto,
  fuentesCatalogo,
  tiendas,
  variantesProducto,
} from "@/lib/db/schema";
import { COMISION_US_PB } from "@/lib/dinero";
import { SOCIEDAD } from "@/lib/sociedad";
import { FUENTE_CJ } from "@/lib/cj/constantes";
import {
  esDepartamentoReal,
  nombrePropuesto,
  tiendaDeRubro,
} from "@/lib/cj/rubros";
import { MINIMO_MAYORISTA, TIENDA_MAYORISTA } from "@/lib/cj/mayorista";
import {
  descripcionDePlaza,
  plazaDelMercado,
  type Plaza,
} from "@/lib/cj/plazas";
import { mercadoPorCodigo } from "@/lib/mercado/mercados";

/**
 * LO QUE HACE FALTA PARA GUARDAR UN PRODUCTO DE CJ, COMPARTIDO.
 *
 * Estos ayudantes vivían dentro de `importar.ts`, que es `"use server"`: de
 * un archivo así **solo se pueden exportar acciones de servidor**, y cada
 * exportación es una puerta que cualquiera puede llamar desde el navegador.
 * La importación masiva (2 sep 2026) necesita crear las mismas tiendas por
 * rubro, la misma fuente `cj`, el mismo slug y las mismas tallas — y
 * exportarlos desde allá habría abierto esas puertas. Aquí son funciones
 * normales de servidor (`server-only`): las usan el botón de a uno y la
 * importación masiva, y nadie más.
 */

/**
 * La tienda interna, creándola la primera vez.
 *
 * Se crea aquí y no en `schema.sql` porque necesita un propietario, y quién es
 * Soporte depende de la base de cada entorno. La primera vez que se agrega un
 * producto queda hecha, y de ahí en adelante solo se lee.
 */
async function tiendaDeEstadosUnidos(propietarioId: string): Promise<string> {
  return tiendaGeneralDePlaza(
    plazaDelMercado(mercadoPorCodigo("US")),
    propietarioId,
  );
}

/**
 * LA TIENDA GENERAL DE UNA PLAZA, creada la primera vez que hace falta.
 *
 * Es la misma mecánica de siempre, con la plaza decidiendo id, mercado,
 * moneda de la vitrina y ficha. `mercado` va explícito: sin él, la tienda
 * chilena nacería con el default `US` y sus productos no saldrían nunca en
 * mercatren.cl — invisibles sin un solo error en ninguna pantalla.
 */
export async function tiendaGeneralDePlaza(
  plaza: Plaza,
  propietarioId: string,
): Promise<string> {
  const db = getDb();
  const general = plaza.tiendaGeneral;

  const [existente] = await db
    .select({ id: tiendas.id })
    .from(tiendas)
    .where(eq(tiendas.id, general.id))
    .limit(1);

  if (existente) return existente.id;

  const ahora = new Date();
  const ficha = descripcionDePlaza(
    plaza,
    { es: "Productos", en: "Products" },
    SOCIEDAD.nombre,
  );

  await db.insert(tiendas).values({
    id: general.id,
    slug: general.slug,
    nombre: general.nombre,
    propietarioId,
    paisOrigen: plaza.paisEntrega,
    mercado: plaza.mercado,
    estado: "activa",
    /* El margen de este catálogo es el de EE. UU., no el 3 % del mercado
       venezolano: aquí Mercatren compra, despacha y asume la devolución. */
    comisionPuntosBase: COMISION_US_PB,
    descripcionEs: ficha.es,
    descripcionEn: ficha.en,
    creadoEn: ahora,
    actualizadoEn: ahora,
  });

  /* Su billetera, como cualquier otra tienda: el resto del sistema la espera. */
  await db
    .insert(billeteras)
    .values({ id: `billetera-${nanoid(10)}`, tiendaId: general.id })
    .catch(() => undefined);

  return general.id;
}

/**
 * LA FUENTE «CJ», SIN LA CUAL NINGÚN PRODUCTO SE PUEDE GUARDAR.
 *
 * ══ ESTE ERA EL FALLO DEL BOTÓN «AGREGAR AL CATÁLOGO» ══
 *
 * `productos.fuente_id` tiene una llave foránea contra `fuentes_catalogo`. Yo
 * guardaba `"cj"` ahí dando por hecho que era una simple etiqueta de texto, y
 * nunca creé la fila. La base rechaza el producto —«FOREIGN KEY constraint
 * failed»—, la acción revienta, y al dueño le sale un error de servidor sin una
 * sola pista de qué pasó.
 *
 * Y no es una fila de relleno para contentar a la base: es la misma ficha que
 * ya usa el catálogo importado de cualquier comercio. Ahí queda registrado
 * **de dónde salió cada producto**, que es lo que permite volver a
 * sincronizarlo, saber cuándo se miró por última vez, y apagar la fuente sin
 * borrar nada. Sin ella, los productos de CJ serían huérfanos.
 *
 * Se crea una sola vez, la primera; de ahí en adelante solo se lee.
 */
export async function fuenteDeCj(tiendaId: string): Promise<string> {
  const db = getDb();

  const [existente] = await db
    .select({ id: fuentesCatalogo.id })
    .from(fuentesCatalogo)
    .where(eq(fuentesCatalogo.id, FUENTE_CJ))
    .limit(1);

  if (existente) return existente.id;

  await db.insert(fuentesCatalogo).values({
    id: FUENTE_CJ,
    tiendaId,
    nombre: "CJ Dropshipping",
    estado: "activa",
    /* SIN `url`, Y A PROPÓSITO. Las otras fuentes leen un archivo que el
       comercio publica; esta se lee por la API de CJ con su propia llave, así
       que aquí no hay dirección que guardar. Inventarle una haría creer que se
       sincroniza sola desde ahí. */
    creadoEn: new Date(),
  });

  return FUENTE_CJ;
}

/**
 * LA TIENDA DEL RUBRO, creándola la primera vez que hace falta.
 *
 * ══ SE CREA AL AGREGAR, NO ANTES ══
 *
 * Pedirle al equipo que dé de alta veintitrés tiendas antes de poder cargar el
 * primer producto es un trámite que nadie hace. Así, la tienda nace cuando
 * entra su primer producto y ya queda lista para el resto.
 *
 * El nombre que se le pone es **una propuesta** —el del departamento— y se
 * cambia después desde el panel como el de cualquier comercio. Un formulario
 * en blanco antes de poder trabajar es lo que hace que nadie empiece.
 *
 * ══ Y EL PRODUCTO MANDA SOBRE LA PANTALLA ══
 *
 * A qué tienda va lo decide el departamento del producto, no lo que estuviera
 * abierto: si estando en repuestos se agrega una cartera, la cartera se va a la
 * de carteras. El equipo no tiene que acordarse de cambiar de tienda antes de
 * cada producto — que es justo donde se equivocaría, y el error no se ve hasta
 * que un comprador entra a una tienda de repuestos llena de bolsos.
 */
/**
 * LA TIENDA MAYORISTA, creándose la primera vez que entra un producto flaco.
 *
 * Los que dejan menos de dos dólares sueltos —donde una sola devolución
 * convierte la venta en pérdida— no se descartan: se venden **de a diez**. El
 * mismo producto que deja $0.90 suelto deja nueve en un lote.
 */
export async function tiendaMayorista(propietarioId: string): Promise<string> {
  const db = getDb();

  const [existente] = await db
    .select({ id: tiendas.id })
    .from(tiendas)
    .where(eq(tiendas.id, TIENDA_MAYORISTA.id))
    .limit(1);

  if (existente) return existente.id;

  await tiendaDeEstadosUnidos(propietarioId);

  const ahora = new Date();

  await db.insert(tiendas).values({
    id: TIENDA_MAYORISTA.id,
    slug: TIENDA_MAYORISTA.slug,
    nombre: TIENDA_MAYORISTA.nombreEs,
    propietarioId,
    paisOrigen: "US",
    estado: "activa",
    comisionPuntosBase: COMISION_US_PB,
    /* EL MÍNIMO SE DICE EN LA PROPIA FICHA DE LA TIENDA, no solo en el
       producto: quien entra por la tienda tiene que saber a qué entró antes de
       elegir nada. Y quién vende y factura, como en todas. */
    descripcionEs: `Compra por lotes con entrega en Estados Unidos en 2 a 5 días hábiles y el envío incluido en el precio. Mínimo ${MINIMO_MAYORISTA} unidades por producto. Vendido y facturado por ${SOCIEDAD.nombre}.`,
    descripcionEn: `Wholesale lots delivered anywhere in the United States in 2 to 5 business days, shipping included in the price. Minimum ${MINIMO_MAYORISTA} units per product. Sold and invoiced by ${SOCIEDAD.nombre}.`,
    creadoEn: ahora,
    actualizadoEn: ahora,
  });

  await db
    .insert(billeteras)
    .values({ id: `billetera-${nanoid(10)}`, tiendaId: TIENDA_MAYORISTA.id })
    .catch(() => undefined);

  return TIENDA_MAYORISTA.id;
}

export async function tiendaDelRubro(
  departamento: string | null,
  propietarioId: string,
  plaza: Plaza = plazaDelMercado(mercadoPorCodigo("US")),
): Promise<string> {
  if (!departamento || !esDepartamentoReal(departamento)) {
    /* Sin departamento reconocido se queda en la general: perder mercancía por
       no tener dónde ponerla es peor que tenerla un tiempo en la genérica. */
    return tiendaGeneralDePlaza(plaza, propietarioId);
  }

  const db = getDb();
  /* La pareja id/slug sale de los prefijos de la plaza: `tienda-cl-motos`
     vive en mercatren.cl y `tienda-us-motos` en mercatren.com, sin chocar. */
  const { id, slug } =
    plaza.mercado === "US"
      ? tiendaDeRubro(departamento)
      : {
          id: `${plaza.prefijoTienda}${departamento}`,
          slug: `${plaza.prefijoSlug}${departamento}`,
        };

  const [existente] = await db
    .select({ id: tiendas.id })
    .from(tiendas)
    .where(eq(tiendas.id, id))
    .limit(1);

  if (existente) return existente.id;

  /* La general tiene que existir igual: es el respaldo de todo lo que no
     encaje, y de ella cuelga la fuente `cj`. */
  await tiendaGeneralDePlaza(plaza, propietarioId);

  const ahora = new Date();
  const nombreEs = nombrePropuesto(departamento, "es");
  const nombreEn = nombrePropuesto(departamento, "en");
  /* QUIÉN VENDE Y FACTURA VA ESCRITO. Con esta línea son marcas de la casa
     —como las marcas propias de cualquier cadena— y es normal. Sin ella son
     vendedores inventados, y eso es tergiversación: causa de suspensión y de
     contracargos que el comprador gana. La ficha sale de la plaza, que NO
     promete plazo fuera de EE. UU.: el real lo dirán las compras de prueba. */
  const ficha = descripcionDePlaza(
    plaza,
    { es: nombreEs, en: nombreEn },
    SOCIEDAD.nombre,
  );

  await db.insert(tiendas).values({
    id,
    slug,
    nombre: nombreEs,
    propietarioId,
    paisOrigen: plaza.paisEntrega,
    mercado: plaza.mercado,
    estado: "activa",
    comisionPuntosBase: COMISION_US_PB,
    descripcionEs: ficha.es,
    descripcionEn: ficha.en,
    creadoEn: ahora,
    actualizadoEn: ahora,
  });

  await db
    .insert(billeteras)
    .values({ id: `billetera-${nanoid(10)}`, tiendaId: id })
    .catch(() => undefined);

  return id;
}

/**
 * Una dirección web a partir del nombre.
 *
 * El nombre de CJ viene en inglés y a veces larguísimo. Se recorta y se le pega
 * un trozo del id: sin eso, dos productos parecidos chocarían en la misma
 * dirección y el segundo no se podría guardar.
 */
export function slugDe(nombre: string, id: string): string {
  const base = nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");

  return `${base || "producto"}-${id.slice(-6).toLowerCase()}`;
}

/**
 * Deja escrito lo que costó mandar este producto.
 *
 * ══ NUNCA TUMBA LA PUBLICACIÓN ══
 *
 * Va en su propio `try` y después de guardar el producto. Si esta escritura
 * falla, el producto queda publicado con su precio correcto —el envío ya está
 * DENTRO del precio, que es lo que importa— y lo único que se pierde es el
 * papel de trabajo para recalcular después. Tumbar la publicación de un
 * producto por no poder anotar su flete sería cambiar un problema chico por
 * uno grande.
 */
export async function guardarEnvio(
  productoId: string,
  envio: { costoCentavos: number; origen: string; transporte: string | null },
  ahora: Date,
) {
  try {
    const db = getDb();
    await db
      .insert(enviosProducto)
      .values({
        productoId,
        costoCentavos: envio.costoCentavos,
        origen: envio.origen,
        transporte: envio.transporte,
        cotizadoEn: ahora,
      })
      .onConflictDoUpdate({
        target: enviosProducto.productoId,
        set: {
          costoCentavos: envio.costoCentavos,
          origen: envio.origen,
          transporte: envio.transporte,
          cotizadoEn: ahora,
        },
      });
  } catch (fallo) {
    console.error("[cj] no se pudo guardar el flete de", productoId, fallo);
  }
}

/**
 * ══ LAS TALLAS DEL PRODUCTO (30 ago 2026) ══
 *
 * Lo cazó el dueño: la ropa entraba SIN TALLA y el comprador no podía
 * elegirla — el sistema le compraba a CJ «la más barata». El circuito de
 * variantes ya existía entero (ficha, carrito, pedido, compra al
 * proveedor); lo que faltaba era este eslabón: traerlas al importar.
 *
 * Nunca tumba el guardado: si CJ no contesta, el producto queda igual y las
 * tallas entran en la próxima pasada.
 */
export async function guardarTallas(
  productoId: string,
  pid: string | null,
  almacen: "US" | "CN",
  precioPublicadoCentavos: number,
  ahora: Date,
  /** Las variantes si ya se pidieron en este mismo acto (el afinado masivo
   *  las trae para el flete): así no se gasta otra llamada a CJ. */
  crudasYaPedidas?: unknown,
): Promise<number> {
  if (!pid) return 0;
  try {
    const { pedirVariantes } = await import("@/lib/cj/flete");
    const { variantesDeCj, nombreDeVariante } =
      await import("@/lib/cj/variantes");
    const { partirVariante, valeLaPenaGuardar } =
      await import("@/lib/cj/tallas");

    const crudas = crudasYaPedidas ?? (await pedirVariantes(pid, almacen));
    if (!crudas) return 0;
    const lista = variantesDeCj(crudas);
    const opciones = lista.map((v) => partirVariante(nombreDeVariante(v)));
    if (!valeLaPenaGuardar(opciones)) return 0;

    const db = getDb();
    const filas = lista
      .map((v, i) => ({ v, o: opciones[i]! }))
      .filter(({ o }) => o.talla !== null || o.color !== null)
      .map(({ v, o }, i) => ({
        id: `var-${nanoid(12)}`,
        productoId,
        talla: o.talla,
        color: o.color,
        colorHex: null,
        sku: v.variantSku?.trim() || null,
        /* El precio de la variante NO cambia lo que paga el cliente: el
           publicado ya lleva su margen y su flete. Guardarlo distinto haría
           que dos tallas del mismo producto costaran distinto sin que nadie
           lo decidiera. */
        precioBaseCentavos: 0,
        precioCentavos: precioPublicadoCentavos,
        existencias: 0,
        controlaExistencias: false,
        orden: i,
        activo: true,
        creadoEn: ahora,
        actualizadoEn: ahora,
      }));
    if (filas.length === 0) return 0;

    /* Se reemplazan: CJ es la fuente de verdad de sus tallas, y una talla
       que allá se agotó no puede seguir ofreciéndose aquí. */
    await db
      .delete(variantesProducto)
      .where(eq(variantesProducto.productoId, productoId));
    await db.insert(variantesProducto).values(filas).onConflictDoNothing();
    return filas.length;
  } catch {
    /* Las tallas nunca tumban el guardado del producto. */
    return 0;
  }
}
