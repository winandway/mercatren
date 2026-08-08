import { z } from "zod";

/**
 * EL CONTRATO CON LAS PLATAFORMAS SOCIAS (hoy: QRbott).
 *
 * Las dos casas son de Windoce, LLC, así que esto no es leer el archivo de un
 * comercio ajeno como con Ferremateriales Bley: es una API nativa, de dos vías,
 * para todas las tiendas de golpe. El contrato completo, con el porqué de cada
 * decisión, está en `docs/integracion-qrbott.md`.
 *
 * Este archivo es PURO: convierte y valida, no toca la base ni la red. Por eso
 * tiene pruebas propias, y por eso las tres trampas de abajo se pueden probar
 * sin levantar nada.
 *
 * ══ TRAMPA 1 · EL PRECIO SE INFLA SOLO ══
 *
 * Mercatren publica **precio base + su margen**. Si por el cable devolviera el
 * precio PUBLICADO, el socio lo guardaría como base y en la vuelta siguiente
 * Mercatren le sumaría el margen otra vez:
 *
 *     100.00 → 103.09 → 106.28 → 109.57 → …
 *
 * Subiendo solo, todos los días, sin un solo error en pantalla. Cuando alguien
 * lo note, el producto lleva semanas impagable.
 *
 * Por eso `productoParaElSocio()` manda `precioBaseCentavos` y **jamás**
 * `precioCentavos`. Hay una prueba que falla si alguien los cambia de sitio.
 *
 * ══ TRAMPA 2 · EL `-1` DE «EXISTENCIAS ILIMITADAS» ══
 *
 * QRbott usa `-1` y `NULL` para decir «no llevo inventario de esto». Si ese
 * `-1` entrara crudo, Mercatren publicaría el producto con MENOS UNO de
 * existencias: agotado en la tienda y `out_of_stock` para Google. Un producto
 * que se vende siempre, invisible.
 *
 * Aquí se traduce a lo que Mercatren ya tiene: `controlaExistencias = false`.
 *
 * ══ TRAMPA 3 · RETIRAR LO QUE NO VINO ══
 *
 * `completo` dice si el envío trae el catálogo ENTERO o solo lo que cambió.
 * Retirar por ausencia solo se permite con el entero. El caso real: el piloto
 * tiene 21 productos aquí y 1 allá — con un delta, retirar por ausencia le
 * borraría 20 productos que hoy están vendiendo, y el resumen diría
 * «1 actualizado, 20 retirados» en verde.
 */

/** Estados de producto que viajan por el cable. */
export const ESTADOS_SOCIO = [
  "published",
  "draft",
  "out_of_stock",
  "archived",
] as const;

/** Cómo se vende: por unidad, por peso o por longitud. */
export const TIPOS_DE_VENTA = ["unit", "weight", "length"] as const;

export const productoDelSocio = z.object({
  /** La llave. Es el identificador del producto EN EL SOCIO y no cambia nunca. */
  id: z.string().trim().min(1),
  /** Código de barras. Opcional y editable: NUNCA sirve de llave. */
  sku: z.string().trim().nullish(),
  slug: z.string().trim().nullish(),
  title_es: z.string().trim().min(1),
  title_en: z.string().trim().nullish(),
  description_es: z.string().nullish(),
  description_en: z.string().nullish(),
  category_id: z.string().trim().nullish(),
  brand: z.string().trim().nullish(),
  /** El precio BASE del comercio: sin impuesto y sin el margen de Mercatren. */
  price: z.number().nonnegative().nullish(),
  /** El precio tachado. NO es la base: tomarlo por base infla el catálogo. */
  compare_at_price: z.number().nonnegative().nullish(),
  /** `null` = ilimitado. El `-1` del socio se normaliza antes de llegar aquí. */
  stock: z.number().nullish(),
  sale_type: z.enum(TIPOS_DE_VENTA).nullish(),
  unit: z.string().trim().nullish(),
  weight_grams: z.number().nullish(),
  status: z.enum(ESTADOS_SOCIO).nullish(),
  featured: z.boolean().nullish(),
  /** De qué galpón son estas existencias. `null` = la principal. */
  sucursal: z.string().trim().nullish(),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        alt: z.string().nullish(),
        position: z.number().int().nonnegative().nullish(),
      }),
    )
    .nullish(),
});

export const envioDelSocio = z.object({
  version: z.literal(1),
  /**
   * `true` = viene el catálogo ENTERO y se puede retirar lo que falte.
   * `false` = es un delta y NO se retira nada por ausencia.
   *
   * Por defecto `false`: si un día el socio deja de mandar este campo, lo
   * seguro es no retirar. Al revés se le borra el catálogo a un cliente.
   */
  completo: z.boolean().default(false),
  desde: z.string().datetime().nullish(),
  /** El corte que Mercatren debe usar como `desde` la próxima vez. */
  hasta: z.string().datetime(),
  tienda: z.object({
    externo_id: z.string().trim().min(1),
    nombre: z.string().trim().nullish(),
  }),
  categories: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        slug: z.string().trim().nullish(),
        name_es: z.string().trim().nullish(),
        name_en: z.string().trim().nullish(),
      }),
    )
    .nullish(),
  products: z.array(productoDelSocio).default([]),
  /**
   * Las bajas van EXPLÍCITAS porque el socio borra de verdad: un delta por
   * fecha no las vería nunca y el producto quedaría publicado para siempre.
   */
  deletions: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        deleted_at: z.string().datetime().nullish(),
      }),
    )
    .default([]),
});

export type ProductoDelSocio = z.infer<typeof productoDelSocio>;
export type EnvioDelSocio = z.infer<typeof envioDelSocio>;

/**
 * Dólares con decimales a centavos enteros. El dinero nunca lleva decimales.
 *
 * El `toPrecision` no es adorno. `1.005 * 100` en coma flotante da
 * `100.49999999999999`, así que un `Math.round` pelado devuelve 100 en vez de
 * 101: un centavo perdido, hacia el mismo lado siempre. Con precios de dos
 * decimales no llega a pasar, pero el precio lo manda un sistema ajeno y no
 * controlamos con cuántos decimales lo serializa.
 */
export function aCentavos(valor: number | null | undefined): number | null {
  if (valor === null || valor === undefined) return null;
  if (!Number.isFinite(valor)) return null;
  return Math.round(Number((valor * 100).toPrecision(12)));
}

/** Centavos enteros a dólares con dos decimales, como los espera el socio. */
export function aDolares(centavos: number | null | undefined): number | null {
  if (centavos === null || centavos === undefined) return null;
  return Math.round(centavos) / 100;
}

/**
 * Las existencias que manda el socio, traducidas a lo que Mercatren guarda.
 *
 * `null` y `-1` significan lo mismo allá: «no llevo inventario de esto». Aquí
 * eso ya existe y se llama `controlaExistencias = false`. Sin esta traducción,
 * un `-1` crudo publicaría el producto con menos uno de existencias.
 */
export function existenciasDesdeElSocio(stock: number | null | undefined): {
  existencias: number;
  controlaExistencias: boolean;
} {
  if (stock === null || stock === undefined || !Number.isFinite(stock)) {
    return { existencias: 0, controlaExistencias: false };
  }
  // Cualquier negativo es el centinela de «ilimitado», no una cantidad.
  if (stock < 0) return { existencias: 0, controlaExistencias: false };
  return { existencias: stock, controlaExistencias: true };
}

/** Y la vuelta: lo que Mercatren guarda, como lo espera el socio. */
export function existenciasParaElSocio(
  existencias: number,
  controlaExistencias: boolean,
): number | null {
  return controlaExistencias ? existencias : null;
}

const ESTADO_DESDE: Record<
  (typeof ESTADOS_SOCIO)[number],
  "publicado" | "borrador" | "agotado"
> = {
  published: "publicado",
  draft: "borrador",
  out_of_stock: "agotado",
  archived: "borrador",
};

export function estadoDesdeElSocio(
  status: string | null | undefined,
): "publicado" | "borrador" | "agotado" {
  return ESTADO_DESDE[status as (typeof ESTADOS_SOCIO)[number]] ?? "borrador";
}

export function estadoParaElSocio(
  estado: string,
): (typeof ESTADOS_SOCIO)[number] {
  if (estado === "publicado") return "published";
  if (estado === "agotado") return "out_of_stock";
  return "draft";
}

/**
 * Cómo se vende, deducido de la unidad.
 *
 * Mercatren guarda la unidad como texto suelto; el socio distingue además si
 * se vende por unidad, por peso o por metro, y lo usa para exigir cantidades
 * enteras cuando corresponde. Se deduce en vez de guardarse aparte para no
 * tener dos verdades sobre el mismo producto.
 */
export function tipoDeVenta(
  unidad: string | null | undefined,
): (typeof TIPOS_DE_VENTA)[number] {
  const u = unidad?.trim().toLowerCase() ?? "";
  if (["kg", "kilo", "kilos", "g", "gr", "gramo", "gramos"].includes(u)) {
    return "weight";
  }
  if (["m", "mt", "mts", "metro", "metros", "cm"].includes(u)) return "length";
  return "unit";
}

/** Lo que Mercatren guarda de un producto, para armar lo que sale al socio. */
export type ProductoDeMercatren = {
  externoId: string | null;
  sku: string | null;
  tituloEs: string;
  tituloEn: string | null;
  descripcionEs: string | null;
  descripcionEn: string | null;
  marca: string | null;
  /** LO QUE VIAJA. Ver la trampa 1. */
  precioBaseCentavos: number | null;
  /** LO QUE **NO** VIAJA: base + margen. Está aquí solo para no confundirlo. */
  precioCentavos: number;
  precioAntesCentavos: number | null;
  existencias: number;
  controlaExistencias: boolean;
  unidad: string | null;
  pesoGramos: number | null;
  estado: string;
  destacado: boolean;
  imagenes: { url: string; alt: string | null; orden: number }[];
};

/**
 * Un producto de Mercatren, como lo espera el socio.
 *
 * OJO CON EL PRECIO: sale `precioBaseCentavos`, nunca `precioCentavos`. Si
 * alguien "arregla" esto mandando el publicado, los precios del socio empiezan
 * a subir solos en cada sincronización. `tests/unit/socios-contrato.test.ts`
 * falla si pasa.
 */
export function productoParaElSocio(p: ProductoDeMercatren): ProductoDelSocio {
  return {
    id: p.externoId ?? "",
    sku: p.sku,
    slug: null,
    title_es: p.tituloEs,
    title_en: p.tituloEn,
    description_es: p.descripcionEs,
    description_en: p.descripcionEn,
    category_id: null,
    brand: p.marca,
    price: aDolares(p.precioBaseCentavos),
    compare_at_price: aDolares(p.precioAntesCentavos),
    stock: existenciasParaElSocio(p.existencias, p.controlaExistencias),
    sale_type: tipoDeVenta(p.unidad),
    unit: p.unidad,
    weight_grams: p.pesoGramos,
    status: estadoParaElSocio(p.estado),
    featured: p.destacado,
    sucursal: null,
    images: p.imagenes.map((i) => ({
      url: i.url,
      alt: i.alt,
      position: i.orden,
    })),
  };
}
