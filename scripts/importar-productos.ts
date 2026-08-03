/**
 * Importa el catalogo de un comercio a la base de datos.
 *
 * Lee datos/mercatren-productos-export.json y arma un archivo SQL. No se
 * conecta a ninguna base: solo escribe el archivo. Aplicarlo es un paso aparte.
 *
 * CLAVE DEL ASUNTO: cada producto se guarda con el id que tiene en la tienda de
 * origen (`externo_id`). Por eso reimportar ACTUALIZA lo que ya existe en vez
 * de duplicarlo, y por eso el mismo archivo sirve luego para la sincronizacion
 * automatica.
 *
 * Las fotos NO se copian: se guarda la direccion donde ya estan publicadas.
 *
 * Uso:
 *   npm run productos:importar
 *   npm run productos:importar -- --tienda=tienda-bley-ferreteria
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const RAIZ = process.cwd();

const opciones = new Map<string, string>();
for (const argumento of process.argv.slice(2)) {
  const par = argumento.match(/^--([^=]+)=(.*)$/);
  if (par) opciones.set(par[1], par[2]);
}

const TIENDA_ID = opciones.get("tienda") ?? "tienda-bley-ferreteria";
const ENTRADA = path.resolve(
  RAIZ,
  opciones.get("archivo") ?? "datos/mercatren-productos-export.json",
);
const SALIDA = path.join(RAIZ, ".local", "catalogo.sql");

type Imagen = { url: string; alt?: string | null; position?: number | null };

type ProductoExterno = {
  id: string;
  sku?: string | null;
  slug?: string | null;
  title_es: string;
  title_en?: string | null;
  description_es?: string | null;
  description_en?: string | null;
  category_id?: string | null;
  brand?: string | null;
  price: number;
  compare_at_price?: number | null;
  currency?: string | null;
  stock?: number | null;
  unit?: string | null;
  weight_grams?: number | null;
  status?: string | null;
  featured?: boolean | null;
  images?: Imagen[] | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type CategoriaExterna = {
  id: string;
  slug?: string | null;
  name_es: string;
  name_en?: string | null;
  parent_id?: string | null;
};

type Archivo = {
  meta: {
    source?: string;
    account?: string;
    exported_at?: string;
    totals?: {
      products?: number;
      published?: number;
      categories?: number;
      with_images?: number;
    };
  };
  categories?: CategoriaExterna[];
  products: ProductoExterno[];
};

/** Dolares a centavos enteros. El dinero nunca se guarda con decimales. */
function aCentavos(valor: number | null | undefined) {
  if (valor === null || valor === undefined) return null;
  return Math.round(Number(valor) * 100);
}

function aSegundos(iso: string | null | undefined, porDefecto: number) {
  if (!iso) return porDefecto;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? porDefecto : Math.floor(t / 1000);
}

function texto(valor: string | null | undefined) {
  if (valor === null || valor === undefined || valor === "") return "NULL";
  return `'${String(valor).replace(/'/g, "''")}'`;
}

function numero(valor: number | null | undefined) {
  return valor === null || valor === undefined ? "NULL" : String(valor);
}

/** Arma una direccion legible a partir del titulo, si el origen no trae una. */
function comoSlug(entrada: string) {
  return entrada
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

/**
 * Un "slug" que en realidad es un identificador interno (UUID o similar).
 * No sirve para armar una direccion legible.
 */
const ES_IDENTIFICADOR =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$|^[0-9a-f]{24,}$/i;

const ESTADOS: Record<string, "borrador" | "publicado" | "agotado"> = {
  published: "publicado",
  draft: "borrador",
  out_of_stock: "agotado",
};

function salir(mensaje: string): never {
  console.error(`\n✗ ${mensaje}\n`);
  process.exit(1);
}

function main() {
  let archivo: Archivo;
  try {
    archivo = JSON.parse(readFileSync(ENTRADA, "utf8"));
  } catch {
    salir(
      `No encontre el archivo:\n  ${path.relative(RAIZ, ENTRADA)}\n\n` +
        "Pidele la exportacion al comercio y dejala ahi (ver datos/LEEME.md).",
    );
  }

  const { meta, products, categories = [] } = archivo;
  if (!Array.isArray(products) || products.length === 0) {
    salir("El archivo no trae productos.");
  }

  const ahora = aSegundos(meta.exported_at, Math.floor(Date.now() / 1000));
  const fuenteId = `fuente-${TIENDA_ID}`;

  const partes: string[] = [
    "-- Catalogo importado a Mercatren.",
    "-- Generado por scripts/importar-productos.ts. NO editar a mano.",
    `-- Comercio: ${meta.account ?? TIENDA_ID} — ${products.length} productos.`,
    "",
    "-- De donde viene este catalogo. La misma fila sirve luego para la",
    "-- sincronizacion automatica: solo hay que ponerle la direccion del feed.",
    `INSERT INTO fuentes_catalogo (id, tienda_id, nombre, estado, cada_minutos, ultima_sincronizacion, ultimo_resultado, productos_sincronizados, creado_en)`,
    `VALUES (${texto(fuenteId)}, ${texto(TIENDA_ID)}, ${texto(meta.source ?? "Importacion manual")}, 'pausada', 15, ${ahora}, ${texto(`Importacion manual de ${products.length} productos`)}, ${products.length}, ${ahora})`,
    "ON CONFLICT(id) DO UPDATE SET ultima_sincronizacion = excluded.ultima_sincronizacion, ultimo_resultado = excluded.ultimo_resultado, productos_sincronizados = excluded.productos_sincronizados;",
    "",
  ];

  // --- Categorias ---
  const idCategoria = new Map<string, string>();
  if (categories.length > 0) {
    const filas = categories.map((c) => {
      const id = `cat-${TIENDA_ID}-${comoSlug(c.slug || c.name_es || c.id)}`;
      idCategoria.set(c.id, id);
      return { c, id };
    });

    partes.push(
      "-- Categorias del comercio.",
      ...filas.map(
        ({ c, id }) =>
          `INSERT INTO categorias (id, tienda_id, slug, nombre_es, nombre_en, padre_id, orden, externo_id) VALUES (${texto(id)}, ${texto(TIENDA_ID)}, ${texto(comoSlug(c.slug || c.name_es))}, ${texto(c.name_es)}, ${texto(c.name_en)}, ${texto(c.parent_id ? (idCategoria.get(c.parent_id) ?? null) : null)}, 0, ${texto(c.id)}) ON CONFLICT(id) DO UPDATE SET nombre_es = excluded.nombre_es, nombre_en = excluded.nombre_en;`,
      ),
      "",
    );
  }

  // --- Productos ---
  const slugsUsados = new Set<string>();
  const idsProducto: string[] = [];
  const filasProducto: string[] = [];
  const filasImagen: string[] = [];
  let conImagenes = 0;
  let publicados = 0;
  let sinPrecio = 0;
  const sinNombre: string[] = [];
  let bajadosABorrador = 0;
  const saltados: string[] = [];
  let slugsDeIdentificador = 0;
  let conStockFraccionado = 0;

  for (const p of products) {
    if (!p.id) salir("Hay un producto sin id en el archivo.");

    let estado = ESTADOS[p.status ?? "published"] ?? "publicado";

    /**
     * Producto sin nombre.
     *
     * No se le inventa uno: se guarda con su codigo interno como referencia y
     * se deja en BORRADOR, para que no aparezca en la tienda con el titulo en
     * blanco. El comercio le pone nombre y con la siguiente sincronizacion se
     * publica solo.
     *
     * Si no trae ni nombre ni codigo, no hay por donde agarrarlo y se salta.
     */
    let titulo = p.title_es;
    if (!titulo) {
      if (!p.sku) {
        saltados.push(p.id);
        continue;
      }
      titulo = p.sku;
      if (estado === "publicado") bajadosABorrador++;
      estado = "borrador";
      sinNombre.push(p.sku);
    }

    if (estado === "publicado") publicados++;

    // Un borrador puede no tener precio todavia (el comercio aun no lo carga);
    // se guarda en cero y no se publica. Uno publicado SIN precio si es un
    // error: se venderia regalado.
    const precio = aCentavos(p.price);
    if (precio === null && estado === "publicado") {
      salir(`El producto ${p.id} esta publicado pero no trae precio.`);
    }
    if (precio !== null && precio < 0) {
      salir(`El producto ${p.id} trae un precio negativo: ${p.price}`);
    }
    if (precio === null) sinPrecio++;

    const id = `prod-${TIENDA_ID}-${p.id}`;
    idsProducto.push(id);

    /**
     * El slug tiene que ser unico dentro del comercio Y legible.
     * Hay tiendas cuyo "slug" es en realidad el identificador interno; usarlo
     * dejaria direcciones como /producto/9f3c1a7e-… Cuando pasa eso, la
     * direccion se arma del titulo. El identificador de origen se sigue
     * guardando aparte, asi que reimportar no duplica nada.
     */
    const slugUtil = p.slug && !ES_IDENTIFICADOR.test(p.slug) ? p.slug : null;
    if (!slugUtil && p.slug) slugsDeIdentificador++;

    const base = comoSlug(slugUtil || titulo) || `producto-${p.id}`;
    let slug = base;
    let intento = 2;
    while (slugsUsados.has(slug)) slug = `${base}-${intento++}`;
    slugsUsados.add(slug);

    const controlaExistencias = p.stock !== null && p.stock !== undefined;
    // Las existencias van con decimales tal cual vengan: hay mercancia que se
    // vende por metro o por kilo, y redondear 13.5 kg a 13 le quita al
    // comercio media unidad de inventario.
    if (controlaExistencias && !Number.isInteger(Number(p.stock))) {
      conStockFraccionado++;
    }

    filasProducto.push(
      `(${[
        texto(id),
        texto(TIENDA_ID),
        texto(p.category_id ? (idCategoria.get(p.category_id) ?? null) : null),
        texto(slug),
        texto(p.sku),
        texto(p.brand),
        texto(titulo),
        texto(p.title_en),
        texto(p.description_es),
        texto(p.description_en),
        numero(precio ?? 0),
        numero(aCentavos(p.compare_at_price)),
        texto(p.currency ?? "USD"),
        numero(controlaExistencias ? Number(p.stock) : 0),
        controlaExistencias ? 1 : 0,
        texto(p.unit),
        numero(p.weight_grams ?? null),
        texto(estado),
        p.featured ? 1 : 0,
        texto(fuenteId),
        texto(p.id),
        numero(ahora),
        numero(aSegundos(p.created_at, ahora)),
        numero(aSegundos(p.updated_at, ahora)),
      ].join(", ")})`,
    );

    const imagenes = (p.images ?? []).filter((i) => i?.url);
    if (imagenes.length > 0) conImagenes++;

    imagenes.forEach((imagen, indice) => {
      filasImagen.push(
        `(${[
          texto(`img-${id}-${indice}`),
          texto(id),
          "NULL",
          texto(imagen.url),
          texto(imagen.alt),
          numero(imagen.position ?? indice),
        ].join(", ")})`,
      );
    });
  }

  const COLUMNAS_PRODUCTO = [
    "id",
    "tienda_id",
    "categoria_id",
    "slug",
    "sku",
    "marca",
    "titulo_es",
    "titulo_en",
    "descripcion_es",
    "descripcion_en",
    "precio_centavos",
    "precio_antes_centavos",
    "moneda",
    "existencias",
    "controla_existencias",
    "unidad",
    "peso_gramos",
    "estado",
    "destacado",
    "fuente_id",
    "externo_id",
    "sincronizado_en",
    "creado_en",
    "actualizado_en",
  ];

  // Al reimportar se actualiza lo que ya existe. La fecha de alta no se toca.
  const ACTUALIZAR = COLUMNAS_PRODUCTO.filter(
    (c) => !["id", "tienda_id", "externo_id", "creado_en"].includes(c),
  )
    .map((c) => `${c} = excluded.${c}`)
    .join(", ");

  const LOTE = 100;
  for (let i = 0; i < filasProducto.length; i += LOTE) {
    partes.push(
      `INSERT INTO productos (${COLUMNAS_PRODUCTO.join(", ")}) VALUES\n${filasProducto.slice(i, i + LOTE).join(",\n")}\nON CONFLICT(tienda_id, externo_id) DO UPDATE SET ${ACTUALIZAR};`,
      "",
    );
  }

  // Las fotos se rehacen enteras: es mas simple y no deja huerfanas.
  partes.push(
    "-- Fotos: se borran y se vuelven a poner, para que no queden viejas.",
    `DELETE FROM imagenes_producto WHERE producto_id IN (SELECT id FROM productos WHERE fuente_id = ${texto(fuenteId)});`,
    "",
  );

  for (let i = 0; i < filasImagen.length; i += LOTE) {
    partes.push(
      `INSERT INTO imagenes_producto (id, producto_id, clave, url, texto_alt_es, orden) VALUES\n${filasImagen.slice(i, i + LOTE).join(",\n")};`,
      "",
    );
  }

  // Lo que ya no viene en el archivo se deja de mostrar, pero NO se borra:
  // puede tener pedidos viejos colgando.
  partes.push(
    "-- Lo que el comercio quito de su tienda deja de verse aqui.",
    `UPDATE productos SET estado = 'borrador', actualizado_en = ${ahora} WHERE fuente_id = ${texto(fuenteId)} AND id NOT IN (${idsProducto.map(texto).join(", ")});`,
    "",
  );

  mkdirSync(path.dirname(SALIDA), { recursive: true });
  writeFileSync(SALIDA, partes.join("\n"), "utf8");

  console.log("Catalogo preparado:");
  console.log(`  comercio:          ${meta.account ?? TIENDA_ID}`);
  console.log(`  productos:         ${products.length}`);
  console.log(`  publicados:        ${publicados}`);
  console.log(`  categorias:        ${categories.length}`);
  console.log(`  con fotos:         ${conImagenes}`);
  console.log(`  fotos en total:    ${filasImagen.length}`);

  // Cosas que no son errores, pero conviene que se sepan.
  if (sinPrecio > 0) {
    console.log(
      `\n  · ${sinPrecio} en borrador sin precio: quedan en $0.00 y NO se publican.`,
    );
  }
  if (slugsDeIdentificador > 0) {
    console.log(
      `  · ${slugsDeIdentificador} traian un identificador en vez de nombre:\n` +
        `    su direccion se armo del titulo, para que sea legible.`,
    );
  }
  if (sinNombre.length > 0) {
    console.log(
      `  · ${sinNombre.length} sin nombre: entran como BORRADOR con su codigo\n` +
        `    como referencia, para que no salgan en blanco en la tienda.\n` +
        `    Codigos: ${sinNombre.join(", ")}`,
    );
  }
  if (saltados.length > 0) {
    console.log(
      `  · ${saltados.length} SALTADOS por no traer ni nombre ni codigo.`,
    );
  }
  if (conStockFraccionado > 0) {
    console.log(
      `  · ${conStockFraccionado} con existencias fraccionadas (kg o metros):\n` +
        `    se guardan tal cual, sin redondear.`,
    );
  }

  const totales = meta.totals ?? {};
  const avisos: string[] = [];
  if (totales.products && totales.products !== products.length) {
    avisos.push(`productos: ${products.length} != ${totales.products}`);
  }
  // Los que se bajaron a borrador por no tener nombre no cuentan como
  // descuadre: es una decision de este importador, no un error del archivo.
  const esperadoPublicados = (totales.published ?? 0) - bajadosABorrador;
  if (totales.published && esperadoPublicados !== publicados) {
    avisos.push(
      `publicados: ${publicados} != ${esperadoPublicados} ` +
        `(${totales.published} del archivo menos ${bajadosABorrador} sin nombre)`,
    );
  }
  if (avisos.length) {
    salir(
      `Los numeros no cuadran con los del propio archivo:\n  - ${avisos.join("\n  - ")}`,
    );
  }

  console.log(`\nSQL escrito en ${path.relative(RAIZ, SALIDA)}`);
}

main();
