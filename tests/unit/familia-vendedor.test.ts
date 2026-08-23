import { describe, expect, it } from "vitest";

import {
  CJ_POR_RONDA,
  familiaDe,
  intercalarPorTienda,
  MAXIMO_SEGUIDOS,
} from "@/lib/catalogo/intercalar";
import { zonaPorNombre } from "@/lib/entrega/zonas";

/**
 * LA FAMILIA DEL VENDEDOR: a quién se le cuenta el cupo de la portada.
 * Un comercio venezolano es su propia familia; las veintitrés tiendas de
 * Estados Unidos son UNA («us»), porque detrás vende Mercatren LLC y surte
 * un solo proveedor.
 */
describe("familiaDe", () => {
  it("un comercio venezolano es su propia familia", () => {
    expect(familiaDe({ tiendaPais: "VE", tiendaSlug: "maxium" })).toBe(
      "maxium",
    );
    expect(familiaDe({ tiendaPais: null, tiendaSlug: "megayes" })).toBe(
      "megayes",
    );
  });

  it("todo lo de Estados Unidos es una sola, «us», se escriba como se escriba el país", () => {
    expect(familiaDe({ tiendaPais: "US", tiendaSlug: "us-ropa-calzado" })).toBe(
      "us",
    );
    expect(familiaDe({ tiendaPais: " us ", tiendaSlug: "us-mascotas" })).toBe(
      "us",
    );
    expect(
      familiaDe({ tiendaPais: "US", tiendaSlug: "mercatren-estados-unidos" }),
    ).toBe("us");
  });
});

describe("el intercalado por familia", () => {
  const ve = (slug: string, n: number) =>
    Array.from({ length: n }, (_, i) => ({
      id: `${slug}-${i}`,
      tiendaSlug: slug,
      tiendaPais: "VE",
    }));
  const cj = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      id: `cj-${i}`,
      tiendaSlug: `us-rubro-${i}`,
      tiendaPais: "US",
    }));

  it("seis de CJ seguidos (seis tiendas distintas) se reparten entre los comercios venezolanos", () => {
    /* Así llega de la consulta: ronda 0 = Venezuela y después el cupo de CJ. */
    const entrada = [
      ...ve("maxium", 1),
      ...ve("megayes", 2),
      ...ve("bley", 2),
      ...cj(CJ_POR_RONDA),
      ...ve("inversiones", 2),
      ...ve("bley-b", 2),
      ...cj(CJ_POR_RONDA),
    ];
    const salida = intercalarPorTienda(entrada, familiaDe);
    expect(salida).toHaveLength(entrada.length);

    /* mientras quede de Venezuela, nunca más de MAXIMO_SEGUIDOS de CJ seguidos */
    let racha = 0;
    let quedaVe = entrada.filter((p) => p.tiendaPais !== "US").length;
    for (const p of salida) {
      if (p.tiendaPais === "US") {
        racha += 1;
        if (quedaVe > 0) expect(racha).toBeLessThanOrEqual(MAXIMO_SEGUIDOS);
      } else {
        racha = 0;
        quedaVe -= 1;
      }
    }
  });

  it("por tienda (la llave vieja) NO lo habría repartido: seis rubros distintos son seis tiendas", () => {
    const entrada = [...ve("bley", 2), ...cj(6), ...ve("megayes", 2)];
    const porTienda = intercalarPorTienda(entrada, (p) => p.tiendaSlug);
    const seguidosCj = porTienda
      .slice(2, 8)
      .every((p) => p.tiendaPais === "US");
    expect(seguidosCj).toBe(true);
  });
});

describe("la zona a partir de la ciudad escrita a mano", () => {
  it("reconoce la ciudad sin acentos, con mayúsculas y con espacios", () => {
    expect(zonaPorNombre("Tucani")?.slug).toBe("tucani");
    expect(zonaPorNombre("EL VIGÍA ")?.slug).toBe("el-vigia");
    expect(zonaPorNombre("caracas")?.slug).toBe("caracas");
  });

  it("lo que no es una ciudad conocida no se adivina", () => {
    expect(zonaPorNombre("Michigan")).toBeNull();
    expect(zonaPorNombre("")).toBeNull();
    expect(zonaPorNombre(null)).toBeNull();
  });
});
