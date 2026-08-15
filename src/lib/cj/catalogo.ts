import "server-only";

import { llamarCj } from "@/lib/cj/cliente";
import { desglosarUs, type DesgloseUs } from "@/lib/destino/precio-us";

/**
 * BUSCAR EN EL CATÁLOGO DE CJ, YA CON NUESTRO PRECIO CALCULADO.
 *
 * ══ SOLO ALMACÉN DE ESTADOS UNIDOS. NO ES NEGOCIABLE ══
 *
 * El catálogo de CJ mezcla el mismo producto en almacenes de China y de EE. UU.
 * El de China tarda 15–20 días. Meter uno de esos en el catálogo —y por tanto
 * en el feed de Google— mientras el sitio promete «2 a 5 días» es exactamente
 * la tergiversación que suspende cuentas de Merchant Center, y es la causa
 * número uno de suspensión.
 *
 * Por eso `countryCode=US` va **fijo en la consulta**, no como una casilla que
 * alguien pueda desmarcar. Un filtro que se puede apagar se apaga.
 *
 * ══ Y SOLO CON EXISTENCIAS DE VERDAD ══
 *
 * Un producto con dos unidades se agota el primer día y deja una ficha muerta
 * en Google, que es peor que no haberla publicado: la ficha sigue indexada y
 * quien llega encuentra «agotado». Se pide un mínimo.
 *
 * ══ EL PRECIO SE CALCULA AQUÍ, NO EN LA PANTALLA ══
 *
 * Para que la decisión de agregar un producto se tome viendo lo que de verdad
 * queda —después de que CJ, el envío y Stripe cobren lo suyo—, y no el precio
 * de CJ a secas.
 */

/**
 * Lo mínimo que tiene que haber en almacén para que valga la pena publicarlo.
 *
 * **Solo se descarta cuando SE SABE que hay menos.** Si CJ no manda el dato de
 * inventario en el listado —y no siempre lo manda—, el producto pasa igual con
 * `existencias: null`.
 *
 * Tratar «no viene el dato» como «hay cero» dejaba la pantalla vacía para
 * cualquier búsqueda, sin una sola pista de por qué. Un dato que falta se dice;
 * no se rellena con el que había a mano.
 */
export const EXISTENCIAS_MINIMAS = 10;

/** Un producto de CJ tal como lo vamos a mirar nosotros. */
export type ProductoCj = {
  id: string;
  nombre: string;
  imagen: string | null;
  sku: string | null;
  categoria: string | null;
  /** Lo que cobra CJ por el producto, en centavos. */
  costoCentavos: number;
  /** `null` cuando CJ no lo manda: no es lo mismo que cero. */
  existencias: number | null;
  /** Nuestro precio y el reparto del dinero. */
  precio: DesgloseUs;
};

type FilaCj = {
  id?: string;
  pid?: string;
  nameEn?: string;
  sku?: string;
  bigImage?: string;
  sellPrice?: number | string;
  nowPrice?: number | string;
  threeCategoryName?: string;
  twoCategoryName?: string;
  oneCategoryName?: string;
  warehouseInventoryNum?: number | string;
  totalVerifiedInventory?: number | string;
};

type RespuestaLista = { list?: FilaCj[]; total?: number };

/**
 * Un precio de CJ llega en dólares con decimales y a veces como texto.
 *
 * `toPrecision` antes de multiplicar: `45.90 * 100` da 4589.999999999999 en
 * coma flotante, y ese centavo perdido aparece después en una factura que no
 * cuadra. Es el mismo cuidado que ya se tiene en el cobro por enlace.
 */
function aCentavos(valor: number | string | undefined): number {
  /**
   * ══ CJ MANDA RANGOS, NO SIEMPRE UN NÚMERO ══
   *
   * Un producto con variantes —tallas, colores— llega con el precio así:
   * `"12.50 -- 15.30"`. Pasarlo por `Number()` da NaN, y ese NaN se convertía
   * en cero, y el cero hacía que el producto se descartara.
   *
   * Resultado: la pantalla salía **vacía** para cualquier búsqueda, sin decir
   * por qué. Se toma el número más bajo del rango, que es el que de verdad
   * cuesta la variante más barata.
   */
  if (typeof valor === "number") {
    return Number.isFinite(valor) && valor > 0
      ? Math.round(Number((valor * 100).toPrecision(12)))
      : 0;
  }

  if (!valor) return 0;

  const numeros = String(valor)
    .match(/\d+(?:\.\d+)?/g)
    ?.map(Number)
    .filter((n) => Number.isFinite(n) && n > 0);

  if (!numeros?.length) return 0;

  const menor = Math.min(...numeros);
  return Math.round(Number((menor * 100).toPrecision(12)));
}

function aEntero(valor: number | string | undefined): number | null {
  if (valor === undefined || valor === null || valor === "") return null;
  const n = typeof valor === "string" ? Number(valor) : valor;
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : null;
}

/**
 * Las existencias, o `null` si CJ no las mandó.
 *
 * Se prefiere el inventario verificado, que es el que de verdad está en el
 * almacén. Si ninguno de los dos viene, no se sabe — y no saber no es cero.
 */
function existenciasDe(f: FilaCj): number | null {
  const verificado = aEntero(f.totalVerifiedInventory);
  const almacen = aEntero(f.warehouseInventoryNum);
  if (verificado === null && almacen === null) return null;
  return Math.max(verificado ?? 0, almacen ?? 0);
}

export type BusquedaCj = {
  texto?: string;
  pagina?: number;
  /** Cuántos por página. CJ admite hasta 100. */
  porPagina?: number;
  /** En dólares, como los escribe una persona. */
  precioMinimo?: number;
  precioMaximo?: number;
};

export type ResultadoBusqueda =
  | {
      ok: true;
      productos: ProductoCj[];
      pagina: number;
      hayMas: boolean;
      /** Para que una pantalla vacía diga POR QUÉ está vacía. */
      diagnostico: { trajoCj: number; descartados: number };
    }
  | { ok: false; motivo: string };

export async function buscarEnCj(
  filtros: BusquedaCj = {},
): Promise<ResultadoBusqueda> {
  const pagina = Math.max(1, Math.floor(filtros.pagina ?? 1));
  const porPagina = Math.min(100, Math.max(1, filtros.porPagina ?? 24));

  const parametros = new URLSearchParams({
    page: String(pagina),
    size: String(porPagina),
    /* EL FILTRO QUE NO SE TOCA. Ver el comentario de arriba. */
    countryCode: "US",
  });

  /**
   * NO SE MANDA `orderBy` NI `sort`, Y ES DELIBERADO.
   *
   * Los puse para traer primero lo mejor surtido, y son justo la clase de
   * parámetro que uno da por bueno sin comprobar: si CJ no los admite tal como
   * se los mando, la respuesta vuelve vacía y la pantalla queda en blanco sin
   * decir nada.
   *
   * Ordenar es un lujo; que salgan productos es el requisito. Se vuelven a
   * poner el día que se compruebe contra su API de verdad que los acepta.
   */

  if (filtros.texto?.trim()) parametros.set("keyWord", filtros.texto.trim());
  if (filtros.precioMinimo) {
    parametros.set("startSellPrice", String(filtros.precioMinimo));
  }
  if (filtros.precioMaximo) {
    parametros.set("endSellPrice", String(filtros.precioMaximo));
  }

  const respuesta = await llamarCj<RespuestaLista>(
    `/product/listV2?${parametros.toString()}`,
  );

  if (!respuesta.ok) return { ok: false, motivo: respuesta.motivo };

  const filas = Array.isArray(respuesta.datos?.list)
    ? respuesta.datos.list
    : [];

  const convertidos = filas
    .map((f) => aProducto(f))
    .filter((p): p is ProductoCj => p !== null);

  const productos = convertidos.filter(
    (p) =>
      p.costoCentavos > 0 &&
      /* Solo se descarta si SE SABE que hay poco. Ver el comentario de
         `EXISTENCIAS_MINIMAS`. */
      (p.existencias === null || p.existencias >= EXISTENCIAS_MINIMAS),
  );

  return {
    ok: true,
    productos,
    pagina,
    /* CJ no siempre manda el total, así que «hay más» se deduce de si vino la
       página llena. Es lo único honesto sin inventarse un número. */
    hayMas: filas.length >= porPagina,
    /**
     * QUÉ TRAJO CJ Y QUÉ SE DESCARTÓ.
     *
     * Sin esto, una pantalla vacía tiene tres causas posibles —CJ no devolvió
     * nada, devolvió y se descartó todo por precio, o por existencias— y las
     * tres se ven idénticas. Con el conteo, la siguiente vez se sabe dónde
     * mirar en vez de adivinar.
     */
    diagnostico: {
      trajoCj: filas.length,
      descartados: convertidos.length - productos.length,
    },
  };
}

function aProducto(f: FilaCj): ProductoCj | null {
  const id = f.id ?? f.pid;
  if (!id) return null;

  const costo = aCentavos(f.nowPrice ?? f.sellPrice);

  /**
   * EL ENVÍO TODAVÍA NO SE SABE AQUÍ, Y VA EN CERO A PROPÓSITO.
   *
   * CJ lo calcula por dirección de destino, no por producto, y pedirlo para
   * cada uno de los 24 de esta página serían 24 llamadas más contra su límite
   * por minuto — para una pantalla que solo sirve para mirar.
   *
   * Se pide de verdad al agregar el producto al catálogo, que es cuando el
   * precio tiene que quedar bien. Aquí el precio que se enseña es el mínimo,
   * y la pantalla lo dice.
   */
  const precio = desglosarUs(costo, 0);

  return {
    id,
    nombre: (f.nameEn ?? "").trim() || "(sin nombre)",
    imagen: f.bigImage?.trim() || null,
    sku: f.sku?.trim() || null,
    categoria:
      f.threeCategoryName?.trim() ||
      f.twoCategoryName?.trim() ||
      f.oneCategoryName?.trim() ||
      null,
    costoCentavos: costo,
    existencias: existenciasDe(f),
    precio,
  };
}
