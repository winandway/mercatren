import { departamentoDeCj } from "@/lib/cj/departamento";
import { limpiarHtml, recortar } from "@/lib/cj/limpiar-descripcion";
import { aCentavos, existenciasDe, type FilaCj } from "@/lib/cj/lista";
import { divisorDe } from "@/lib/mercado/moneda";

/**
 * TRAER EL ALMACÉN COMPLETO DE CJ: LAS REGLAS, SIN RED NI LLAVES.
 *
 * ══ EL PROBLEMA ══
 *
 * Agregar productos de a uno cuesta TRES llamadas a CJ por producto
 * (variantes, flete, tallas) a UNA por segundo: cien mil productos serían
 * cuarenta días. Ningún botón aguanta eso.
 *
 * ══ LA SALIDA: PUBLICAR RÁPIDO CON UN ESTIMADO SERIO, Y AFINAR POR DETRÁS ══
 *
 * El listado de CJ trae cien productos por llamada con precio, foto, stock,
 * categoría y descripción. Con eso se crea la ficha y se publica con el
 * precio real de CJ más un envío ESTIMADO POR DEPARTAMENTO, sacado de las
 * cotizaciones reales que ya se hicieron (percentil 70: conservador, nunca
 * inventado). Después, el reloj de `/datos/sincronizar` toma unas decenas por
 * vuelta, les pide a CJ el flete y las tallas de verdad y corrige el precio.
 * Mientras tanto, los candados de la casa protegen la venta: stock preguntado
 * antes de cobrar y compra al proveedor que no se paga sola si pierde.
 *
 * ══ EL TOPE DE CJ: 6.000 RESULTADOS POR CONSULTA ══
 *
 * Documentado por ellos (`totalRecords` máximo 6.000). Un almacén con más se
 * recorre CATEGORÍA POR CATEGORÍA (tercer nivel), y una categoría que también
 * pase de 6.000 se parte en BANDAS DE PRECIO. Cada consulta es una «tanda».
 *
 * Este archivo no habla con nadie: recibe lo que CJ devolvió y decide. Por
 * eso se puede probar, que es lo que hace falta en la pieza que va a crear
 * cien mil fichas de golpe.
 */

/** Lo que CJ deja ver por consulta. Documentado: «Maximum value: 6000». */
export const TOPE_POR_CONSULTA = 6000;
/** Productos por página. Documentado: «maximum 100». */
export const POR_PAGINA = 100;
/** Cuántos afina el reloj por vuelta y cuántas vueltas da al día: es lo que
 *  la pantalla promete («unos N por día»), así que sale de aquí y no de un
 *  número escrito a mano en el texto. */
export const AFINADOS_POR_VUELTA = 40;
export const VUELTAS_POR_DIA = 96;
/** Con menos de esto en el almacén no vale la pena publicarlo: se agota el
 *  primer día y deja una ficha muerta en Google. */
export const STOCK_MINIMO_POR_DEFECTO = 5;
/** Una tanda tomada hace más de esto se considera abandonada (un navegador
 *  cerrado, una petición cortada) y otro trabajador la puede reclamar. */
export const ABANDONO_MS = 10 * 60 * 1000;
/** Percentil de las cotizaciones reales que se usa como estimado. 70 y no la
 *  mediana: se prefiere cobrar un poco de más a regalar margen en silencio. */
export const PERCENTIL_ESTIMADO = 0.7;
/** Con menos muestras reales que esto, un departamento no opina. */
export const MINIMO_MUESTRAS = 5;
/** El departamento que necesita TALLAS antes de venderse: se afina primero. */
export const DEPARTAMENTO_CON_TALLAS = "dep-ropa-calzado";

/**
 * Las bandas de precio (centavos USD) para partir una categoría que pasa del
 * tope. Cerradas por arriba salvo la última. Los bordes se solapan a
 * propósito (un producto de $5.00 exacto cae en dos): la deduplicación por
 * id lo cuenta una sola vez, y perder productos sería peor.
 */
export const BANDAS_DE_PRECIO: ReadonlyArray<readonly [number, number | null]> =
  [
    [0, 500],
    [500, 1000],
    [1000, 2000],
    [2000, 3500],
    [3500, 5000],
    [5000, 8000],
    [8000, 12000],
    [12000, 20000],
    [20000, null],
  ];

/* ═══════════════════════ El árbol de categorías ═══════════════════════ */

export type CategoriaCj = {
  /** El id de tercer nivel, que es el que filtra `listV2`. */
  id: string;
  /** «Primer nivel > segundo > tercero», legible. */
  nombre: string;
  /** Del más específico al más general, que es como se prueba el departamento. */
  niveles: [string, string, string];
};

type NodoTercero = { categoryId?: string; categoryName?: string };
type NodoSegundo = {
  categorySecondName?: string;
  categorySecondList?: NodoTercero[];
};
type NodoPrimero = {
  categoryFirstName?: string;
  categoryFirstList?: NodoSegundo[];
};

/**
 * Aplana lo que devuelve `/product/getCategory` (tres niveles anidados) en la
 * lista de categorías de tercer nivel. Lee el arreglo directo o envuelto en
 * `{ list }`, como el resto de la API de CJ. Un id repetido entra una vez.
 */
export function aplanarCategorias(datos: unknown): CategoriaCj[] {
  const envuelto = (datos ?? {}) as { list?: unknown };
  const lista: unknown[] = Array.isArray(datos)
    ? datos
    : Array.isArray(envuelto.list)
      ? envuelto.list
      : [];

  const salida: CategoriaCj[] = [];
  const vistos = new Set<string>();

  for (const p of lista as NodoPrimero[]) {
    const n1 = (p?.categoryFirstName ?? "").trim();
    const segundos = Array.isArray(p?.categoryFirstList)
      ? p.categoryFirstList
      : [];
    for (const s of segundos) {
      const n2 = (s?.categorySecondName ?? "").trim();
      const terceros = Array.isArray(s?.categorySecondList)
        ? s.categorySecondList
        : [];
      for (const t of terceros) {
        const id = (t?.categoryId ?? "").trim();
        if (!id || vistos.has(id)) continue;
        vistos.add(id);
        const n3 = (t?.categoryName ?? "").trim();
        salida.push({
          id,
          nombre: [n1, n2, n3].filter(Boolean).join(" > "),
          niveles: [n3, n2, n1],
        });
      }
    }
  }
  return salida;
}

/** Vuelve a sacar los tres niveles del nombre guardado («A > B > C»). */
export function nivelesDe(nombre: string | null | undefined): string[] {
  if (!nombre?.trim()) return [];
  return nombre
    .split(">")
    .map((x) => x.trim())
    .filter(Boolean)
    .reverse();
}

/* ═══════════════════════ La consulta a CJ ═══════════════════════ */

export type ConsultaMasiva = {
  almacen: "US" | "CN";
  pagina: number;
  categoriaId: string | null;
  desdeCentavos: number | null;
  hastaCentavos: number | null;
  stockMinimo: number;
  soloVerificado: boolean;
  /** Pedir descripción y nombres de categoría dentro del listado: una
   *  llamada por cien productos en vez de una por producto. */
  conExtras: boolean;
};

/**
 * Los parámetros de `listV2`, tal como los documenta CJ: `page`/`size`,
 * `countryCode` (el almacén), `categoryId`, `startWarehouseInventory`,
 * `verifiedWarehouse=1`, `startSellPrice`/`endSellPrice` en dólares.
 */
export function parametrosDeLista(c: ConsultaMasiva): string {
  const p = new URLSearchParams({
    page: String(Math.max(1, Math.floor(c.pagina))),
    size: String(POR_PAGINA),
    countryCode: c.almacen,
  });
  if (c.categoriaId) p.set("categoryId", c.categoriaId);
  if (c.stockMinimo > 0) {
    p.set("startWarehouseInventory", String(Math.floor(c.stockMinimo)));
  }
  if (c.soloVerificado) p.set("verifiedWarehouse", "1");
  const divisor = divisorDe("USD");
  if (c.desdeCentavos !== null && c.desdeCentavos > 0) {
    p.set("startSellPrice", (c.desdeCentavos / divisor).toFixed(2));
  }
  if (c.hastaCentavos !== null && c.hastaCentavos > 0) {
    p.set("endSellPrice", (c.hastaCentavos / divisor).toFixed(2));
  }
  if (c.conExtras) p.set("features", "enable_description,enable_category");
  return p.toString();
}

/** ¿Esta consulta chocó contra el tope de CJ? Solo si SE SABE el total. */
export function estaTopada(totalRegistros: number | null | undefined): boolean {
  return (
    typeof totalRegistros === "number" && totalRegistros >= TOPE_POR_CONSULTA
  );
}

/**
 * Las bandas en que se parte una tanda topada, o `null` si ya era una banda:
 * una banda que también pasa del tope se recorre hasta donde CJ deje y se
 * anota — partirla otra vez no tiene fin.
 */
export function bandasPara(tanda: {
  desdeCentavos: number | null;
  hastaCentavos: number | null;
}): Array<{
  desdeCentavos: number | null;
  hastaCentavos: number | null;
}> | null {
  if (tanda.desdeCentavos !== null || tanda.hastaCentavos !== null) return null;
  return BANDAS_DE_PRECIO.map(([desde, hasta]) => ({
    desdeCentavos: desde > 0 ? desde : null,
    hastaCentavos: hasta,
  }));
}

/** La última página que vale la pena pedir: 6.000 / 100. */
export const ULTIMA_PAGINA = Math.ceil(TOPE_POR_CONSULTA / POR_PAGINA);

/* ═══════════════════════ De la fila de CJ a nuestra ficha ═══════════════════════ */

/** Lo que trae `listV2` con las extras encendidas. */
export type FilaMasiva = FilaCj & {
  description?: string | null;
  categoryId?: string;
};

export type FichaMasiva = {
  externoId: string;
  nombre: string;
  imagen: string | null;
  sku: string | null;
  costoCentavos: number;
  /** `null` = CJ no lo mandó, que no es lo mismo que cero. */
  existencias: number | null;
  /** El slug del departamento, o null si no se reconoce. */
  departamento: string | null;
  /** La descripción en inglés, ya sin HTML. `null` si no vino o no dice nada. */
  descripcion: string | null;
};

/**
 * Convierte una fila del listado en lo que vamos a guardar. `null` cuando
 * llega incompleta (sin id, sin nombre o sin precio): eso no se publica.
 */
export function fichaDesdeFila(
  f: FilaMasiva,
  categoria: CategoriaCj | { niveles: string[] } | null,
): FichaMasiva | null {
  const externoId = (f.id ?? f.pid ?? "").trim();
  if (!externoId) return null;
  const nombre = (f.nameEn ?? "").trim();
  if (!nombre) return null;
  const costoCentavos = aCentavos(f.nowPrice ?? f.sellPrice);
  if (costoCentavos <= 0) return null;

  /* De lo más específico a lo más general: primero lo que trae la propia
     fila (con las extras), después el árbol de la tanda. */
  const categorias = [
    f.threeCategoryName,
    f.twoCategoryName,
    f.oneCategoryName,
    ...(categoria?.niveles ?? []),
  ].filter((x): x is string => Boolean(x?.trim()));

  const limpia = limpiarHtml(f.description);

  return {
    externoId,
    nombre,
    imagen: f.bigImage?.trim() || null,
    sku: f.sku?.trim() || null,
    costoCentavos,
    existencias: existenciasDe(f),
    departamento: departamentoDeCj(categorias, nombre),
    descripcion: limpia.length >= 20 ? recortar(limpia) : null,
  };
}

/** Pasa si tiene stock de sobra — o si CJ no dijo cuánto hay. */
export function pasaElFiltro(ficha: FichaMasiva, stockMinimo: number): boolean {
  return ficha.existencias === null || ficha.existencias >= stockMinimo;
}

/* ═══════════════════════ El envío estimado ═══════════════════════ */

export function percentil(valores: number[], p: number): number | null {
  const v = valores
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);
  if (v.length === 0) return null;
  const i = Math.min(v.length - 1, Math.max(0, Math.ceil(p * v.length) - 1));
  return v[i]!;
}

export type TablaDeEstimados = {
  /** Por `categoria_id` (dep-<slug>), solo con muestras suficientes. */
  porDepartamento: Record<string, number>;
  /** El del catálogo entero de la plaza, o null si casi no hay cotizaciones. */
  general: number | null;
  muestras: number;
};

/** Arma la tabla a partir de las cotizaciones REALES ya guardadas. */
export function tablaDeEstimados(
  filas: Array<{ categoriaId: string | null; costoCentavos: number }>,
): TablaDeEstimados {
  const grupos = new Map<string, number[]>();
  const todos: number[] = [];
  for (const f of filas) {
    if (!(f.costoCentavos > 0)) continue;
    todos.push(f.costoCentavos);
    if (f.categoriaId) {
      const lista = grupos.get(f.categoriaId) ?? [];
      lista.push(f.costoCentavos);
      grupos.set(f.categoriaId, lista);
    }
  }
  const porDepartamento: Record<string, number> = {};
  for (const [id, lista] of grupos) {
    if (lista.length < MINIMO_MUESTRAS) continue;
    const p = percentil(lista, PERCENTIL_ESTIMADO);
    if (p !== null) porDepartamento[id] = p;
  }
  return {
    porDepartamento,
    general:
      todos.length >= MINIMO_MUESTRAS
        ? percentil(todos, PERCENTIL_ESTIMADO)
        : null,
    muestras: todos.length,
  };
}

/**
 * El envío con el que se publica un producto nuevo: el de su departamento si
 * hay muestras, si no el general, si no el respaldo de la plaza. NUNCA cero.
 */
export function envioEstimadoPara(
  categoriaId: string | null,
  tabla: TablaDeEstimados,
  respaldoCentavos: number,
): number {
  const suyo = categoriaId ? tabla.porDepartamento[categoriaId] : undefined;
  const elegido = suyo ?? tabla.general ?? respaldoCentavos;
  return elegido > 0 ? elegido : respaldoCentavos;
}

/* ═══════════════════════ Reclamar una tanda ═══════════════════════ */

/** ¿Se puede tomar esta tanda? Pendiente, o en curso pero abandonada. */
export function reclamable(
  tanda: { estado: string; tomadaEn: Date | null },
  ahora: Date,
): boolean {
  if (tanda.estado === "pendiente") return true;
  if (tanda.estado !== "en_curso") return false;
  if (!tanda.tomadaEn) return true;
  return ahora.getTime() - tanda.tomadaEn.getTime() > ABANDONO_MS;
}

/** Cuánto lleva una importación, en porcentaje entero, para la barra. */
export function porcentajeDe(hechas: number, total: number): number {
  if (!(total > 0)) return 0;
  return Math.min(100, Math.max(0, Math.round((hechas / total) * 100)));
}

/** El stock de una variante de CJ, como lo cuenta `existencias.ts`: sin dato
 *  se asume UNA (CJ solo lista variantes con inventario en ese almacén). */
export function stockDeVariante(v: Record<string, unknown>): number {
  const crudo = v.variantStock ?? v.stockNum;
  const n = Number(crudo);
  return Number.isFinite(n) && n > 0 ? n : 1;
}
