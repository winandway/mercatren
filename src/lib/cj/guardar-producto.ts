import "server-only";

import { and, eq, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

import { FUENTE_CJ } from "@/lib/cj/constantes";
import { idDeDepartamento } from "@/lib/cj/departamento";
import { fleteDeProducto } from "@/lib/cj/flete";
import {
  fuenteDeCj,
  guardarEnvio,
  guardarTallas,
  slugDe,
  tiendaDelRubro,
  tiendaMayorista,
} from "@/lib/cj/guardar";
import { vaAlMayorista } from "@/lib/cj/mayorista";
import type { Plaza } from "@/lib/cj/plazas";
import { TIENDA_US_GENERAL } from "@/lib/cj/rubros";
import { getDb } from "@/lib/db";
import { imagenesProducto, productos } from "@/lib/db/schema";
import { desglosarChile } from "@/lib/destino/precio-chile";
import { desglosarColombia } from "@/lib/destino/precio-colombia";
import { desglosarUs } from "@/lib/destino/precio-us";

/**
 * ══ GUARDAR UN PRODUCTO DE CJ EN UNA PLAZA ══
 *
 * Vivía dentro de `importar.ts` (un archivo `"use server"`), y por eso solo
 * podía llamarlo el botón del panel. El 14 sep 2026 Richard pidió meter un
 * producto en las TRES plazas de una vez desde la puerta de pruebas, y una
 * función con `propietarioId` no puede exportarse desde un `"use server"`:
 * sería una acción alcanzable con un POST desde cualquier sitio. Aquí es
 * `server-only`: se importa, no se expone.
 *
 * Lo que hace no cambió: cotiza el flete de la plaza, fija el precio según
 * su moneda y sus reglas (Chile: tope de USD 500), elige la tienda por rubro,
 * y guarda o actualiza sin duplicar. Devuelve el id y el slug para que quien
 * lo llame pueda seguir (describir, enlazar).
 */
export type ResultadoGuardado = {
  ok: boolean;
  mensaje: string;
  productoId?: string;
  slug?: string;
  tiendaId?: string;
};

export async function guardarProducto({
  plaza,
  propietarioId,
  externoId,
  nombre,
  imagen,
  sku,
  costoCentavos,
  existencias,
  departamento,
}: {
  plaza: Plaza;
  propietarioId: string;
  externoId: string;
  nombre: string;
  imagen: string;
  sku: string;
  costoCentavos: number;
  existencias: number;
  departamento: string | null;
}): Promise<ResultadoGuardado> {
  const db = getDb();

  /**
   * EL ENVÍO ENTRA EN EL PRECIO, Y SE COTIZA AQUÍ.
   *
   * Hasta el 19 ago 2026 esto era `desglosarUs(costoCentavos, 0)`. Ese cero
   * significaba que el envío salía del margen: medido con MT-000004, el envío
   * fueron $1.57 y un producto que debía dejar $3.09 dejaba $0.82. No se
   * perdía dinero — se ganaba un tercio de lo declarado, y en silencio.
   *
   * Este es el único momento en que se puede cotizar de verdad, porque es
   * cuando el precio deja de ser una estimación de pantalla y se guarda como
   * el precio que va a pagar el comprador.
   *
   * Si CJ no cotiza, `envioAUsar` devuelve un estimado y lo marca como tal.
   * **Nunca cero**: cero es exactamente el fallo que esto cierra.
   */
  const envio = await fleteDeProducto(externoId, plaza);

  /**
   * ══ EL PRECIO SE FIJA SEGÚN LA PLAZA (27 ago 2026) ══
   *
   * EE. UU. publica en dólares con la fórmula de siempre. Chile y Colombia
   * convierten a pesos con la tasa del día — y si la tasa no está cargada,
   * AQUÍ SE DETIENE con el motivo claro: publicar con una tasa vieja o
   * inventada pone el catálogo entero al precio equivocado, en silencio.
   *
   * Y en Chile, lo que pasa del régimen de USD 500 NO SE PUBLICA: en la
   * aduana le cobrarían IVA más arancel de sorpresa al comprador.
   */
  let precioPublicadoCentavos: number;
  let margenParaMayorista: number | null = null;

  if (plaza.mercado === "US") {
    const d = desglosarUs(costoCentavos, envio.costoCentavos);
    precioPublicadoCentavos = d.publicadoCentavos;
    margenParaMayorista = d.margenCentavos;
  } else {
    const { tasaVigente } = await import("@/lib/mercado/tasas");
    const tasa = await tasaVigente(plaza.mercado === "CL" ? "CL" : "CO");
    if (tasa === null) {
      return {
        ok: false,
        mensaje: `Falta la tasa del dólar de ${plaza.mercado === "CL" ? "Chile" : "Colombia"}. Cárgala en Configuración → La tasa del dólar, y vuelve a intentar.`,
      };
    }
    if (plaza.mercado === "CL") {
      const d = desglosarChile(costoCentavos, envio.costoCentavos, tasa);
      if (!d) {
        return { ok: false, mensaje: "No se pudo calcular el precio chileno." };
      }
      if (d.superaTope) {
        return {
          ok: false,
          mensaje: `Este producto pasa del régimen de USD 500 (base $${(d.baseUsdCentavos / 100).toFixed(2)}): en Chile la aduana le cobraría IVA más arancel de sorpresa al comprador. No se publica en Chile.`,
        };
      }
      precioPublicadoCentavos = d.publicadoClp;
    } else {
      const d = desglosarColombia(costoCentavos, envio.costoCentavos, tasa);
      if (!d) {
        return {
          ok: false,
          mensaje: "No se pudo calcular el precio colombiano.",
        };
      }
      precioPublicadoCentavos = d.publicadoCop;
    }
  }

  /**
   * EL MARGEN MANDA SOBRE EL RUBRO — SOLO EN EE. UU.
   *
   * La mayorista es una tienda de mercatren.com: mandarle un producto chileno
   * lo haría desaparecer de .cl. En las otras plazas el rubro manda siempre.
   */
  const tiendaId =
    margenParaMayorista !== null && vaAlMayorista(margenParaMayorista)
      ? await tiendaMayorista(propietarioId)
      : await tiendaDelRubro(departamento, propietarioId, plaza);

  /* La fuente ANTES del producto: `productos.fuente_id` apunta a ella y la base
     rechaza el producto si todavía no existe. Cuelga de la tienda general de
     EE. UU., que existe desde el primer día. */
  await fuenteDeCj(TIENDA_US_GENERAL);

  /* ══ SE BUSCA POR EXTERNO **Y POR SLUG** (30 ago 2026) ══
     El único de la base cubre (tienda, externo) y TAMBIÉN (tienda, slug).
     Un producto guardado antes con otro formato de externo — o movido por
     «Repartir por rubro» — esquivaba la comprobación por externo y el
     insert reventaba contra el único del slug, con el SQL entero en la
     cara del panel. Si está por cualquiera de los dos, se ACTUALIZA. */
  const slugCalculado = slugDe(nombre, externoId);
  const [yaEsta] = await db
    .select({ id: productos.id })
    .from(productos)
    .where(
      and(
        eq(productos.tiendaId, tiendaId),
        or(
          eq(productos.externoId, externoId),
          eq(productos.slug, slugCalculado),
        ),
      ),
    )
    .limit(1);

  const ahora = new Date();

  if (yaEsta) {
    /* Actualizar, nunca duplicar: el precio y las existencias de CJ cambian. */
    await db
      .update(productos)
      .set({
        precioCentavos: precioPublicadoCentavos,
        precioBaseCentavos: costoCentavos,
        existencias,
        externoId,
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

    await guardarEnvio(yaEsta.id, envio, ahora);
    /* Las tallas se refrescan al reagregar: es lo que arregla los productos
       de ropa que entraron sin ninguna. */
    const tallas = await guardarTallas(
      yaEsta.id,
      externoId,
      plaza.almacen,
      precioPublicadoCentavos,
      ahora,
    );

    return {
      ok: true,
      mensaje: `Actualizado: ${nombre.slice(0, 60)}${tallas > 0 ? ` · ${tallas} tallas` : ""}`,
      productoId: yaEsta.id,
      slug: slugCalculado,
      tiendaId,
    };
  }

  const id = `prod-${nanoid(12)}`;

  await db.insert(productos).values({
    id,
    tiendaId,
    slug: slugCalculado,
    sku: sku || null,
    /* El título llega en inglés porque así viene de CJ. Se guarda en los dos
       campos para que la ficha no salga vacía en español, y se corrige al
       revisarla — NO se inventa una traducción automática. */
    tituloEs: nombre,
    tituloEn: nombre,
    precioCentavos: precioPublicadoCentavos,
    precioBaseCentavos: costoCentavos,
    /* La moneda de la plaza. En CLP y COP el número guardado YA son pesos
       enteros: `mercado/moneda.ts` sabe que su divisor es 1. */
    moneda: plaza.moneda,
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

  await guardarEnvio(id, envio, ahora);
  /* LAS TALLAS, en el mismo acto de agregar: sin esto la ropa se publicaba
     sin talla y el sistema le compraba a CJ «la más barata» (30 ago 2026). */
  const tallas = await guardarTallas(
    id,
    externoId,
    plaza.almacen,
    precioPublicadoCentavos,
    ahora,
  );

  revalidatePath("/[locale]/panel", "layout");
  return {
    ok: true,
    mensaje: `Agregado: ${nombre.slice(0, 60)}${tallas > 0 ? ` · ${tallas} tallas` : ""}`,
    productoId: id,
    slug: slugCalculado,
    tiendaId,
  };
}
