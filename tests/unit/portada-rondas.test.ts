import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  MAXIMO_SEGUIDOS,
  PRODUCTOS_POR_RONDA,
} from "@/lib/catalogo/intercalar";

/**
 * LA PORTADA VA POR RONDAS DE TIENDA, NO POR LOTERÍA CIEGA.
 *
 * El barajado con semilla era justo como mecánica pero ciego a la proporción:
 * la ferretería tiene 622 productos recientes contra 78 de nuestras tiendas,
 * así que «lo nuevo» era 90 % ferretería y la portada arrancaba con veintidós
 * de la misma tienda seguidos. Medido en la portada publicada el 22 ago 2026.
 *
 * Lo que pidió el dueño: «de cada tienda dos, tres productos, revueltos, y las
 * que están subiendo productos nuevos, primero». Eso vive en la consulta, con
 * funciones de ventana; estas pruebas se ponen rojas si alguien vuelve atrás.
 */
describe("la parrilla de la portada", () => {
  const fuente = readFileSync("src/lib/catalogo/consultas.ts", "utf8");
  const parrilla = fuente.slice(
    fuente.indexOf("export async function parrillaDeProductos"),
    fuente.indexOf("export type BandaDeDepartamento"),
  );

  it("ordena por RONDAS de tienda (los N más nuevos de cada una, luego los N siguientes)", () => {
    expect(
      parrilla,
      "la parrilla dejó de ordenar por rondas de tienda: vuelve la portada de una sola tienda",
    ).toContain("ROW_NUMBER() OVER (PARTITION BY ${productos.tiendaId}");
    expect(parrilla).toContain("PRODUCTOS_POR_RONDA");
  });

  it("las tiendas con novedades van primero dentro de la ronda", () => {
    expect(parrilla).toContain(
      "MAX(${productos.creadoEn}) OVER (PARTITION BY ${productos.tiendaId})",
    );
  });

  it("y las tiendas se barajan con la semilla, para que la portada «se mueva» entre visitas", () => {
    /* El dueño ya dijo una vez que un puesto fijo «mata la gracia». */
    expect(parrilla).toContain("(tiendas.rowid * ${semilla}) % 104729");
  });

  it("la ronda y el intercalado cuentan la misma historia", () => {
    /* Dos por tienda en la ronda, y tope de dos seguidos al intercalar: si
       alguien cambia uno sin el otro, la portada se contradice sola. */
    expect(PRODUCTOS_POR_RONDA).toBe(MAXIMO_SEGUIDOS);
  });

  it("el divisor de la ronda va como literal, no como parámetro", () => {
    /* Un parámetro numérico puede llegar como REAL y la división dejaría de
       ser entera: todas las rondas se volverían distintas y el orden, ruido. */
    expect(parrilla).toContain("sql.raw(String(PRODUCTOS_POR_RONDA))");
  });
});

describe("los similares de la ficha", () => {
  const fuente = readFileSync("src/lib/catalogo/consultas.ts", "utf8");
  const similares = fuente.slice(
    fuente.indexOf("export async function productosSimilares"),
    fuente.indexOf("export async function listarCategoriasConProductos"),
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
