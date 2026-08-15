"use server";

import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

import { exigirEquipoInterno } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import {
  billeteras,
  imagenesProducto,
  productos,
  tiendas,
} from "@/lib/db/schema";
import { COMISION_US_PB } from "@/lib/dinero";
import { SOCIEDAD } from "@/lib/sociedad";
import { FUENTE_CJ, TIENDA_US } from "@/lib/cj/constantes";
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
 * ══ NACE EN BORRADOR, A PROPÓSITO ══
 *
 * Traerlo no es publicarlo. La ficha llega con el nombre en inglés de CJ y sin
 * descripción propia, y **una ficha de dos líneas es media suspensión** en
 * Merchant Center. Se revisa, se le escribe su texto, y entonces se publica.
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

  if (
    !externoId ||
    !nombre ||
    !Number.isFinite(costoCentavos) ||
    costoCentavos <= 0
  ) {
    return { ok: false, mensaje: "Ese producto llegó incompleto de CJ." };
  }

  const db = getDb();
  const tiendaId = await tiendaDeEstadosUnidos(usuario.id);

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
    /* BORRADOR. Traerlo no es publicarlo: la ficha todavía no tiene su texto
       propio, y una ficha de dos líneas es media suspensión en Merchant
       Center. */
    estado: "borrador",
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
