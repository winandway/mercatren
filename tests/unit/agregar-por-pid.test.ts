import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  costoMinimoCentavos,
  existenciasDeVariantes,
  primeraImagen,
} from "@/lib/cj/agregar-por-pid-puro";

/**
 * ══ AGREGAR UN PRODUCTO DE CJ EN LA PLAZA QUE SE PIDA (14 sep 2026) ══
 *
 * Richard: «agrégalo en Estados Unidos, en Colombia y en Chile… con todos
 * los modelos… con todos los datos». La acción `agregar` de la puerta lo
 * hace por plaza; aquí se tranca lo que decide el precio y lo que impide
 * que la función de guardar quede expuesta como acción de servidor.
 */
describe("el costo con el que se fija el precio", () => {
  it("es el MÍNIMO de las variantes con precio", () => {
    expect(
      costoMinimoCentavos("99.00", [
        { variantSellPrice: "12.50" },
        { variantSellPrice: "9.99" },
        { variantSellPrice: null },
      ]),
    ).toBe(999);
  });

  it("sin variantes, el primer número del sellPrice, aunque venga en rango", () => {
    expect(costoMinimoCentavos("3.61")).toBe(361);
    expect(costoMinimoCentavos("3.61 -- 5.00")).toBe(361);
    expect(costoMinimoCentavos("3.61-5.00")).toBe(361);
  });

  it("sin precio válido devuelve cero, y con cero no se agrega", () => {
    expect(costoMinimoCentavos(null)).toBe(0);
    expect(costoMinimoCentavos("gratis")).toBe(0);
    expect(costoMinimoCentavos("0")).toBe(0);
  });
});

describe("la primera foto", () => {
  it("acepta URL suelta, lista por comas y arreglo JSON en texto", () => {
    expect(primeraImagen("https://a/1.jpg")).toBe("https://a/1.jpg");
    expect(primeraImagen("https://a/1.jpg,https://a/2.jpg")).toBe(
      "https://a/1.jpg",
    );
    expect(primeraImagen('["https://a/1.jpg","https://a/2.jpg"]')).toBe(
      "https://a/1.jpg",
    );
    expect(primeraImagen(["https://a/1.jpg"])).toBe("https://a/1.jpg");
  });
  it("lo que no es una URL no es una foto", () => {
    expect(primeraImagen("")).toBeNull();
    expect(primeraImagen(null)).toBeNull();
    expect(primeraImagen("foto.jpg")).toBeNull();
  });
});

describe("las existencias", () => {
  it("son la suma de las variantes con stock", () => {
    const stock = (v: Record<string, unknown>) => Number(v.inventoryNum ?? 0);
    expect(
      existenciasDeVariantes(
        [{ inventoryNum: 3 }, { inventoryNum: 0 }, { inventoryNum: 7 }],
        stock,
      ),
    ).toBe(10);
    expect(existenciasDeVariantes([], stock)).toBe(0);
  });
});

describe("los candados en el código", () => {
  it("guardarProducto vive en un módulo server-only, NO en el «use server»", () => {
    /* Con `propietarioId` como parámetro, exportarla desde un «use server»
       la volvería una acción alcanzable con un POST desde cualquier sitio. */
    const guardar = readFileSync("src/lib/cj/guardar-producto.ts", "utf8");
    expect(guardar.startsWith('import "server-only";')).toBe(true);
    expect(guardar).toContain("export async function guardarProducto(");
    const importar = readFileSync("src/lib/cj/importar.ts", "utf8");
    expect(importar.startsWith('"use server";')).toBe(true);
    expect(importar).not.toContain("export async function guardarProducto");
    expect(importar).toContain('from "@/lib/cj/guardar-producto"');
  });

  it("agregar no publica sin existencias en el almacén de ESA plaza, y las plazas van una tras otra", () => {
    const agregar = readFileSync("src/lib/cj/agregar-por-pid.ts", "utf8");
    expect(agregar).toContain("pedirVariantes(pid, plaza.almacen)");
    expect(agregar).toMatch(/if \(existencias <= 0\)/);
    const ruta = readFileSync("src/app/datos/probar-compra/route.ts", "utf8");
    expect(ruta).toContain('z.literal("agregar")');
    expect(ruta).toMatch(
      /for \(const mercado of e\.mercados\) \{\s*salidas\.push\(await agregarPorPid/,
    );
  });
});
