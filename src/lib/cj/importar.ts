"use server";

import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

import { exigirEquipoInterno } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import {
  billeteras,
  fuentesCatalogo,
  imagenesProducto,
  productos,
  tiendas,
} from "@/lib/db/schema";
import { COMISION_US_PB } from "@/lib/dinero";
import { SOCIEDAD } from "@/lib/sociedad";
import { FUENTE_CJ, TIENDA_US } from "@/lib/cj/constantes";
import { idDeDepartamento } from "@/lib/cj/departamento";
import { DEPARTAMENTOS } from "@/lib/catalogo/departamentos";
import { desglosarUs } from "@/lib/destino/precio-us";

/**
 * AGREGAR UN PRODUCTO DE CJ AL CATÁLOGO DE ESTADOS UNIDOS.
 *
 * ══ CUELGA DE UNA TIENDA INTERNA NUESTRA ══
 *
 * `productos.tiendaId` es obligatorio, y eso resulta ser lo correcto aquí: en
 * Estados Unidos **Mercatren LLC es quien vende y factura**, no un tercero. El
 * producto cuelga de una tienda nuestra con `paisOrigen: "US"`, y de ahí sale
 * su destino sin necesidad de una columna nueva.
 *
 * Es además lo que Merchant Center necesita: un solo vendedor responsable, con
 * una política de envío y una de devoluciones. Un mercado de terceros habría
 * que demostrarlo tienda por tienda.
 *
 * ══ SE GUARDA DE DÓNDE VINO ══
 *
 * `fuenteId` = `cj` y `externoId` = el id del producto en CJ. La pareja
 * (tienda, externoId) ya es única en el esquema, así que volver a agregar el
 * mismo producto **actualiza** en vez de duplicar — igual que el importador de
 * catálogo que ya existe. Sin eso, la segunda pasada llenaría el catálogo de
 * copias.
 *
 * ══ SE PUBLICA AL AGREGARLO, Y CAE EN SU DEPARTAMENTO ══
 *
 * Antes entraba en borrador. La intención era buena —una ficha de dos líneas en
 * inglés es media suspensión en Merchant Center— pero en borrador **no se ve en
 * la tienda**, y entonces el catálogo se arma a ciegas: veinte productos
 * elegidos y una tienda que sigue vacía.
 *
 * El departamento se calcula de la categoría que ya trae CJ (ver
 * `cj/departamento.ts`) y se ve en la tarjeta antes de pulsar el botón, para
 * corregir ahí el que caiga mal y no en una revisión de trescientos.
 *
 * Lo de Merchant Center sigue pendiente y se atiende donde de verdad está: en
 * el archivo que se le manda a Google, no en la tienda. Falta la descripción
 * propia y el título en español.
 */

type Resultado = { ok: boolean; mensaje: string };

/**
 * La tienda interna, creándola la primera vez.
 *
 * Se crea aquí y no en `schema.sql` porque necesita un propietario, y quién es
 * Soporte depende de la base de cada entorno. La primera vez que se agrega un
 * producto queda hecha, y de ahí en adelante solo se lee.
 */
async function tiendaDeEstadosUnidos(propietarioId: string): Promise<string> {
  const db = getDb();

  const [existente] = await db
    .select({ id: tiendas.id })
    .from(tiendas)
    .where(eq(tiendas.id, TIENDA_US.id))
    .limit(1);

  if (existente) return existente.id;

  const ahora = new Date();

  await db.insert(tiendas).values({
    id: TIENDA_US.id,
    slug: TIENDA_US.slug,
    nombre: TIENDA_US.nombre,
    propietarioId,
    paisOrigen: "US",
    estado: "activa",
    /* El margen de este catálogo es el de EE. UU., no el 3 % del mercado
       venezolano: aquí Mercatren compra, despacha y asume la devolución. */
    comisionPuntosBase: COMISION_US_PB,
    /* El nombre sale de la constante, nunca escrito a mano: el día que la
       sociedad cambie, esta ficha cambia con ella. Hay una prueba que lo
       exige. */
    descripcionEs: `Productos con entrega en Estados Unidos en 2 a 5 días hábiles, con el envío incluido en el precio. Los vende y factura ${SOCIEDAD.nombre}.`,
    descripcionEn: `Products delivered anywhere in the United States in 2 to 5 business days, shipping included in the price. Sold and invoiced by ${SOCIEDAD.nombre}.`,
    creadoEn: ahora,
    actualizadoEn: ahora,
  });

  /* Su billetera, como cualquier otra tienda: el resto del sistema la espera. */
  await db
    .insert(billeteras)
    .values({ id: `billetera-${nanoid(10)}`, tiendaId: TIENDA_US.id })
    .catch(() => undefined);

  return TIENDA_US.id;
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
async function fuenteDeCj(tiendaId: string): Promise<string> {
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
 * Una dirección web a partir del nombre.
 *
 * El nombre de CJ viene en inglés y a veces larguísimo. Se recorta y se le pega
 * un trozo del id: sin eso, dos productos parecidos chocarían en la misma
 * dirección y el segundo no se podría guardar.
 */
function slugDe(nombre: string, id: string): string {
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

export async function agregarProductoDeCj(
  formulario: FormData,
): Promise<Resultado> {
  const quien = await exigirEquipoInterno()
    .then(() => true)
    .catch(() => false);

  if (!quien) {
    return { ok: false, mensaje: "Esta parte es solo para el equipo." };
  }

  const { obtenerUsuario } = await import("@/lib/autorizacion");
  const usuario = await obtenerUsuario();
  if (!usuario) return { ok: false, mensaje: "Hace falta una sesión." };

  const externoId = String(formulario.get("id") ?? "").trim();
  const nombre = String(formulario.get("nombre") ?? "").trim();
  const imagen = String(formulario.get("imagen") ?? "").trim();
  const sku = String(formulario.get("sku") ?? "").trim();
  const costoCentavos = Number(formulario.get("costo") ?? 0);
  const existencias = Number(formulario.get("existencias") ?? 0);

  /**
   * EL DEPARTAMENTO SE COMPRUEBA CONTRA LA LISTA, no se guarda tal cual.
   *
   * Llega calculado desde la pantalla —para que se vea antes de pulsar— pero
   * `productos.categoria_id` tiene una llave foránea: un slug que no exista
   * haría fallar el guardado entero. Se compara contra la lista real y, si no
   * está, el producto entra sin departamento en vez de no entrar.
   */
  const pedido = String(formulario.get("departamento") ?? "").trim();
  const departamento = DEPARTAMENTOS.some((d) => d.slug === pedido)
    ? pedido
    : null;

  if (
    !externoId ||
    !nombre ||
    !Number.isFinite(costoCentavos) ||
    costoCentavos <= 0
  ) {
    return { ok: false, mensaje: "Ese producto llegó incompleto de CJ." };
  }

  try {
    return await guardarProducto({
      propietarioId: usuario.id,
      externoId,
      nombre,
      imagen,
      sku,
      costoCentavos,
      existencias,
      departamento,
    });
  } catch (fallo) {
    /**
     * ══ EL MOTIVO SE DICE, NO SE ESCONDE ══
     *
     * Sin esto, un fallo de la base sale como «Error del servidor» y hay que
     * adivinar entre la llave foránea, una columna que falta y un permiso.
     * Ya se perdió una noche así con el botón de agregar.
     *
     * Aquí se puede enseñar entero porque esta pantalla es **solo del equipo
     * interno**: no hay un comprador del otro lado a quien filtrarle nada.
     */
    console.error("[cj] no se pudo guardar el producto:", fallo);
    const motivo = fallo instanceof Error ? fallo.message : String(fallo);
    return { ok: false, mensaje: `No se pudo guardar: ${motivo}` };
  }
}

async function guardarProducto({
  propietarioId,
  externoId,
  nombre,
  imagen,
  sku,
  costoCentavos,
  existencias,
  departamento,
}: {
  propietarioId: string;
  externoId: string;
  nombre: string;
  imagen: string;
  sku: string;
  costoCentavos: number;
  existencias: number;
  departamento: string | null;
}): Promise<Resultado> {
  const db = getDb();
  const tiendaId = await tiendaDeEstadosUnidos(propietarioId);

  /* La fuente ANTES del producto: `productos.fuente_id` apunta a ella y la base
     rechaza el producto si todavía no existe. */
  await fuenteDeCj(tiendaId);

  /* El envío se sigue asumiendo en cero hasta que se cotice contra una
     dirección real. El precio queda como mínimo y se ajusta al publicarlo. */
  const precio = desglosarUs(costoCentavos, 0);

  const [yaEsta] = await db
    .select({ id: productos.id })
    .from(productos)
    .where(
      and(eq(productos.tiendaId, tiendaId), eq(productos.externoId, externoId)),
    )
    .limit(1);

  const ahora = new Date();

  if (yaEsta) {
    /* Actualizar, nunca duplicar: el precio y las existencias de CJ cambian. */
    await db
      .update(productos)
      .set({
        precioCentavos: precio.publicadoCentavos,
        precioBaseCentavos: costoCentavos,
        existencias,
        categoriaId: idDeDepartamento(departamento),
        /* Volver a pulsar el botón también lo publica, y es a propósito: es lo
           que arregla los que se agregaron cuando nacían en borrador, sin
           tener que ir a buscarlos uno por uno. El precio de esto es que un
           producto retirado a mano vuelve a la tienda si alguien lo agrega de
           nuevo desde aquí — que es, literalmente, lo que dice el botón. */
        estado: "publicado",
        actualizadoEn: ahora,
      })
      .where(eq(productos.id, yaEsta.id));

    return { ok: true, mensaje: `Actualizado: ${nombre.slice(0, 60)}` };
  }

  const id = `prod-${nanoid(12)}`;

  await db.insert(productos).values({
    id,
    tiendaId,
    slug: slugDe(nombre, externoId),
    sku: sku || null,
    /* El título llega en inglés porque así viene de CJ. Se guarda en los dos
       campos para que la ficha no salga vacía en español, y se corrige al
       revisarla — NO se inventa una traducción automática. */
    tituloEs: nombre,
    tituloEn: nombre,
    precioCentavos: precio.publicadoCentavos,
    precioBaseCentavos: costoCentavos,
    moneda: "USD",
    existencias,
    controlaExistencias: true,
    categoriaId: idDeDepartamento(departamento),
    /**
     * ══ NACE PUBLICADO (decisión del dueño, 15 ago 2026) ══
     *
     * Antes entraba en borrador para que nadie publicara una ficha de dos
     * líneas en inglés, que es media suspensión en Merchant Center. Pero en
     * borrador **no se ve en la tienda**, así que el catálogo se armaba a
     * ciegas: veinte productos elegidos y una tienda que seguía vacía.
     *
     * El riesgo de Merchant Center no desaparece — se atiende donde de verdad
     * está, que es el archivo que se le manda a Google, no la tienda. Ver la
     * nota del `CLAUDE.md`: al catálogo de EE. UU. le falta la descripción
     * propia y el título en español antes de mandárselo a Google.
     */
    estado: "publicado",
    fuenteId: FUENTE_CJ,
    externoId,
    creadoEn: ahora,
    actualizadoEn: ahora,
  });

  /* La foto se guarda por su dirección, como el resto del catálogo importado.
     Traerla a nuestro bucket es el paso de después, con el botón que ya existe
     en Configuración. */
  if (imagen) {
    await db
      .insert(imagenesProducto)
      .values({
        id: `img-${nanoid(12)}`,
        productoId: id,
        url: imagen,
        orden: 0,
      })
      .catch((fallo) => {
        console.error("[cj] producto agregado; la foto no:", fallo);
      });
  }

  revalidatePath("/[locale]/panel", "layout");
  return { ok: true, mensaje: `Agregado: ${nombre.slice(0, 60)}` };
}
