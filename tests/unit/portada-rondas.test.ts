import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  CJ_POR_RONDA,
  MAXIMO_SEGUIDOS,
  PRODUCTOS_POR_RONDA,
} from "@/lib/catalogo/intercalar";

/**
 * LA PORTADA VA POR RONDAS DE VENDEDOR, VENEZUELA PRIMERO, CJ CON CUPO.
 *
 * El 22 ago se pasó de la lotería ciega a las rondas por tienda, y el 23 el
 * dueño volvió a verla mal: «sale primero el bloque de Bley completo, y ahí
 * viene todo lo de CJ, y el resto de productos como que no existen». Dos
 * causas: las veintitrés tiendas `us-<rubro>` contaban como veintitrés
 * tiendas (46 productos de CJ por ronda), y «las tiendas con novedades
 * primero» ponía siempre delante a la ferretería, que sincroniza a diario.
 *
 * Lo que pidió, con sus palabras: «esas tiendas son chiquitas, sácalas de
 * primero a todos; ¿que tiene un solo producto? no importa, sácalo de
 * primero; eso de CJ debe salir variadito, unos cinco, seis productos». Eso
 * vive en `ordenPorRondas` (consultas.ts); estas pruebas se ponen rojas si
 * alguien vuelve atrás.
 */
const fuente = readFileSync("src/lib/catalogo/consultas.ts", "utf8");

function tramo(desde: string, hasta: string): string {
  const a = fuente.indexOf(desde);
  const b = fuente.indexOf(hasta, a + 1);
  if (a < 0 || b < 0)
    throw new Error(`no encuentro el tramo ${desde} … ${hasta}`);
  return fuente.slice(a, b);
}

describe("el orden por rondas de vendedor", () => {
  const orden = tramo(
    "function ordenPorRondas(",
    "export async function parrillaDeProductos",
  );

  it("el puesto se cuenta por FAMILIA: cada comercio venezolano la suya, y todo lo de EE. UU. es una sola («us»)", () => {
    expect(orden).toContain("THEN 'us' ELSE ${productos.tiendaId} END");
    expect(orden).toContain("ROW_NUMBER() OVER (PARTITION BY ${familia}");
  });

  it("el cupo por ronda es distinto: dos por comercio venezolano, CJ_POR_RONDA para toda la familia de CJ", () => {
    expect(orden).toContain("sql.raw(String(CJ_POR_RONDA))");
    expect(orden).toContain("sql.raw(String(PRODUCTOS_POR_RONDA))");
  });

  it("dentro de la ronda, Venezuela primero", () => {
    expect(orden).toContain("CASE WHEN ${esUs} THEN 1 ELSE 0 END");
  });

  it("y las tiendas se barajan con la semilla, para que la portada «se mueva» entre visitas", () => {
    expect(orden).toContain("(tiendas.rowid * ${semilla}) % 104729");
  });

  it("ya NO hay ventaja entre tiendas por «tener novedades»: tapaba a las chicas", () => {
    expect(orden).not.toContain("MAX(${productos.creadoEn}) OVER");
  });

  it("la parrilla Y las bandas usan el mismo orden, y ninguna baraja con RANDOM() a secas", () => {
    const parrilla = tramo(
      "async function parrillaSinCache",
      "export type BandaDeDepartamento",
    );
    /* Desde que las bandas se recuerdan un minuto (24 ago 2026), la consulta
       vive en `bandasSinCache`: la exportada solo envuelve con la caché. */
    const bandas = tramo("async function bandasSinCache", "\n}\n");
    expect(parrilla).toContain("orderBy(...ordenPorRondas(semilla))");
    expect(bandas).toContain("orderBy(...ordenPorRondas(semilla))");
    expect(fuente).not.toContain("ABS(RANDOM())");
  });

  it("el intercalado posterior va por FAMILIA (familiaDe), no por tienda", () => {
    const parrilla = tramo(
      "async function parrillaSinCache",
      "export type BandaDeDepartamento",
    );
    /* Desde que las bandas se recuerdan un minuto (24 ago 2026), la consulta
       vive en `bandasSinCache`: la exportada solo envuelve con la caché. */
    const bandas = tramo("async function bandasSinCache", "\n}\n");
    expect(parrilla).toContain("familiaDe,");
    expect(bandas).toContain("familiaDe,");
  });

  it("los cupos cuentan la misma historia que el intercalado", () => {
    expect(PRODUCTOS_POR_RONDA).toBe(MAXIMO_SEGUIDOS);
    /* «unos cinco, seis productos» de CJ por ronda. */
    expect(CJ_POR_RONDA).toBeGreaterThanOrEqual(5);
    expect(CJ_POR_RONDA).toBeLessThanOrEqual(6);
  });

  it("la portada trae 48: los primeros 24 abren «De todas las tiendas», el resto arranca la parrilla infinita", () => {
    const portada = tramo(
      "export async function obtenerPortada",
      "export async function listarComerciosDestacados",
    );
    expect(portada).toContain(
      "parrillaDeProductos(mercado, semilla, 1, 48, zona)",
    );
    expect(portada).toContain(
      "bandasDeDepartamentos(mercado, idioma, 6, 21, zona, semilla)",
    );
    const pagina = readFileSync("src/app/[locale]/(tienda)/page.tsx", "utf8");
    expect(pagina).toContain("parrilla.productos.slice(0, 24)");
    expect(pagina).toContain("desdePagina={2}");
    expect(pagina.indexOf('t("deTodasLasTiendas")')).toBeLessThan(
      pagina.indexOf("bandas.map("),
    );
  });
});

describe("la foto de turno", () => {
  it("las tarjetas ya no clavan la primera foto: rota con la semilla, y las tres columnas hablan de la misma foto", () => {
    expect(fuente).not.toContain("PRIMERA_FOTO");
    const foto = tramo("function fotoDeTurno(", "function semillaDelDia(");
    expect(foto).toContain(
      "ROW_NUMBER() OVER (ORDER BY ${imagenesProducto.orden}, imagenes_producto.rowid)",
    );
    expect(foto).toContain("% COUNT(*) OVER ()");
    /* url, clave y alt salen de la misma función `elegir` con el mismo orden */
    expect(foto.match(/elegir\(sql`/g)?.length).toBe(3);
  });

  it("se usa en la parrilla, las bandas, el catálogo y los similares", () => {
    expect(
      fuente.match(/fotoDeTurno\((semilla|semillaDelDia\(\))\)/g)?.length,
    ).toBe(4);
  });
});

describe("los similares de la ficha", () => {
  const similares = tramo(
    "export async function productosSimilares",
    "export async function listarCategoriasConProductos",
  );

  it("existen, respetan el mercado y nunca devuelven el propio producto", () => {
    expect(similares.length).toBeGreaterThan(100);
    expect(similares).toContain("visibleAqui(mercado)");
    expect(similares).toContain("ne(productos.id, de.productoId)");
  });

  it("misma categoría antes que misma tienda", () => {
    expect(similares).toContain("THEN 0 ELSE 1 END");
    expect(similares).toContain("eq(productos.categoriaId, de.categoriaId)");
  });

  it("y la ficha los dibuja al pie", () => {
    const ficha = readFileSync(
      "src/app/[locale]/(tienda)/producto/[slug]/page.tsx",
      "utf8",
    );
    expect(ficha).toContain("productosSimilares(");
    expect(ficha).toContain("<VolverDeLaFicha");
    expect(
      ficha,
      "volvió el «Volver al catálogo» fijo que sacaba de la tienda",
    ).not.toContain('href="/catalogo"');
  });
});

describe("dónde se retira: sin depósito, la tienda", () => {
  it("la ficha le pasa la ciudad y la dirección de la tienda, y el bloque las usa de respaldo", () => {
    const ficha = readFileSync(
      "src/app/[locale]/(tienda)/producto/[slug]/page.tsx",
      "utf8",
    );
    expect(ficha).toContain("ciudad: ficha.tiendaCiudad");
    expect(ficha).toContain("direccion: ficha.tiendaDireccion");
    const bloque = readFileSync(
      "src/components/catalogo/donde-se-retira.tsx",
      "utf8",
    );
    expect(bloque).toContain("zonaPorNombre(tienda.ciudad)");
    expect(bloque).toContain('t("comoReclamar")');
    expect(bloque).toContain('t("sinLugar")');
    /* lo de Estados Unidos no se retira: se despacha */
    expect(bloque).toContain(`=== "US") return null`);
  });
});

/**
 * LA CACHÉ DE LA PORTADA NO PUEDE ROMPER EL ORDEN (24 ago 2026).
 *
 * La primera tanda se recuerda un minuto y se ROTA en memoria con la semilla
 * de la visita. La rotación mueve por dónde empieza; jamás agrupa por tienda
 * —eso sería deshacer las rondas—. La primera versión ordenaba por familia y
 * hacía justo eso: lo destapó la medición.
 */
describe("la caché de la portada", () => {
  const fuente = readFileSync("src/lib/catalogo/consultas.ts", "utf8");

  it("la primera tanda se recuerda con la semilla del día y se rota con la de la visita", () => {
    const parrilla = fuente.slice(
      fuente.indexOf("export async function parrillaDeProductos"),
      fuente.indexOf("function rotarComienzo"),
    );
    expect(parrilla).toContain("recordado(");
    expect(parrilla).toContain("semillaDelDia()");
    expect(parrilla).toContain("rotarComienzo(base.productos, semilla)");
    /* La llave lleva el mercado y la ciudad: sin eso, un dominio serviría el
       catálogo de otro y una ciudad el de la de al lado. */
    expect(parrilla).toContain("${mercado.codigo}");
    expect(parrilla).toContain('(zona ?? []).join(",")');
  });

  it("la rotación NO reordena por familia: solo mueve el comienzo", () => {
    const rotar = fuente.slice(
      fuente.indexOf("function rotarComienzo"),
      fuente.indexOf("async function parrillaSinCache"),
    );
    expect(rotar).toContain("slice(giro)");
    expect(
      rotar,
      "volvió el sort por familia, que agrupa los productos de cada tienda",
    ).not.toContain(".sort(");
  });

  it("las bandas y los videos de la portada también se recuerdan, con el mercado en la llave", () => {
    expect(fuente).toContain("portada-bandas-${mercado.codigo}");
    const videos = readFileSync("src/lib/videos/consultas.ts", "utf8");
    expect(videos).toContain("videos-hilera-${mercado.codigo}");
  });
});
