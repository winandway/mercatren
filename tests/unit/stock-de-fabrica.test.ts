import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  haceFaltaMirarLaFabrica,
  mezclarStockDeFabrica,
  stockTotalEn,
} from "@/lib/cj/stock-fabrica-puro";

/**
 * ══ EL STOCK DE FÁBRICA CUENTA EN CHINA (14 sep 2026) ══
 *
 * El limpiador de gorras: `variant/query` decía `inventoryNum 0` y
 * `stock/queryByVid` decía `cjInventoryNum 0 · factoryInventoryNum 9953`.
 * CJ lo despacha igual (compra a la fábrica al entrar el pedido). Sin
 * esto, la ficha salía «sin existencias» y no se agregaba.
 */
const CJ_DIJO = [
  {
    vid: "2507010316311601600",
    countryCode: "CN",
    storageNum: 9953,
    totalInventoryNum: 9953,
    cjInventoryNum: 0,
    factoryInventoryNum: 9953,
  },
];

describe("el total en un almacén", () => {
  it("EL CASO DEL LIMPIADOR: bodega 0 + fábrica 9.953 = 9.953 en China", () => {
    expect(stockTotalEn(CJ_DIJO, "CN")).toBe(9953);
  });
  it("no cuenta lo de otro almacén", () => {
    expect(stockTotalEn(CJ_DIJO, "US")).toBe(0);
  });
  it("sin total, suma bodega y fábrica", () => {
    expect(
      stockTotalEn(
        [
          {
            vid: "v",
            countryCode: "CN",
            cjInventoryNum: 2,
            factoryInventoryNum: 5,
          },
        ],
        "CN",
      ),
    ).toBe(7);
  });
});

describe("mezclar", () => {
  it("pisa SOLO el cero; un número propio de variant/query se respeta", () => {
    const r = mezclarStockDeFabrica(
      [
        { vid: "a", inventoryNum: 0 },
        { vid: "b", inventoryNum: 4 },
        { vid: "c", inventoryNum: 0 },
      ],
      new Map([
        ["a", 9953],
        ["b", 100],
      ]),
    );
    expect(r.map((v) => v.inventoryNum)).toEqual([9953, 4, 0]);
  });
});

describe("cuándo hace falta preguntar", () => {
  it("nunca en EE. UU.: allá solo existe la bodega de CJ", () => {
    expect(haceFaltaMirarLaFabrica([{ inventoryNum: 0 }], "US")).toBe(false);
  });
  it("en China, solo si TODAS dicen cero", () => {
    expect(
      haceFaltaMirarLaFabrica([{ inventoryNum: 0 }, { inventoryNum: 0 }], "CN"),
    ).toBe(true);
    expect(
      haceFaltaMirarLaFabrica([{ inventoryNum: 0 }, { inventoryNum: 3 }], "CN"),
    ).toBe(false);
    expect(haceFaltaMirarLaFabrica([], "CN")).toBe(false);
  });
});

describe("los candados en el código", () => {
  it("las tres lecturas de variantes pasan por completarStockDeFabrica", () => {
    expect(readFileSync("src/lib/cj/flete.ts", "utf8")).toContain(
      "return completarStockDeFabrica(variantes, almacen);",
    );
    const ex = readFileSync("src/lib/cj/existencias.ts", "utf8");
    expect(ex.match(/completarStockDeFabrica\(/g)?.length).toBe(2);
  });
  it("nunca se inventa stock: si CJ no contesta, la variante sigue en cero", () => {
    const s = readFileSync("src/lib/cj/stock-fabrica.ts", "utf8");
    expect(s).toContain("if (!r.ok) continue;");
  });
});
