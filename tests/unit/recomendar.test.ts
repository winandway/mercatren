import { describe, expect, it } from "vitest";

import {
  esAfin,
  MAXIMO_AFINES_SEGUIDOS,
  ordenarPorAfinidad,
} from "@/lib/recomendar/ordenar";
import type { Senales } from "@/lib/recomendar/senales";

/**
 * EL ALGORITMO DE «LO TUYO PRIMERO» (24 ago 2026).
 *
 * Lo pidió el dueño: si un cliente le dio su corazón a un video, ese comercio
 * le interesa y lo suyo tiene que salirle de primero. La regla de oro: las
 * señales REORDENAN, nunca FILTRAN — un comercio nuevo sin corazones ni
 * ventas tiene que poder salir igual.
 */
type Item = { id: string; tiendaId: string; leGusto?: boolean };
const item = (id: string, tiendaId: string, leGusto = false): Item => ({
  id,
  tiendaId,
  leGusto,
});
const identificar = (i: Item) => ({ tiendaId: i.tiendaId, leGusto: i.leGusto });
const senales = (tiendas: string[], categorias: string[] = []): Senales => ({
  tiendas,
  categorias,
});

describe("esAfin", () => {
  it("un corazón directo manda sobre todo", () => {
    expect(esAfin({ leGusto: true }, senales([]))).toBe(true);
  });
  it("la tienda comprada o querida es afín; el resto no", () => {
    expect(esAfin({ tiendaId: "t1" }, senales(["t1"]))).toBe(true);
    expect(esAfin({ tiendaId: "t2" }, senales(["t1"]))).toBe(false);
  });
  it("la categoría comprada también cuenta", () => {
    expect(
      esAfin({ categoriaId: "ferreteria" }, senales([], ["ferreteria"])),
    ).toBe(true);
  });
});

describe("ordenarPorAfinidad", () => {
  const lista = [
    item("a", "otra1"),
    item("b", "otra2"),
    item("c", "mia"),
    item("d", "otra3"),
    item("e", "mia"),
    item("f", "otra4"),
    item("g", "mia"),
  ];

  it("sin señales devuelve la lista TAL CUAL", () => {
    expect(ordenarPorAfinidad(lista, senales([]), identificar)).toEqual(lista);
  });

  it("adelanta lo afín, intercalado: nunca más de dos seguidos", () => {
    const r = ordenarPorAfinidad(lista, senales(["mia"]), identificar);
    expect(r[0]!.tiendaId).toBe("mia");
    let seguidos = 0;
    for (const x of r) {
      seguidos = x.tiendaId === "mia" ? seguidos + 1 : 0;
      expect(seguidos).toBeLessThanOrEqual(MAXIMO_AFINES_SEGUIDOS);
    }
  });

  it("REORDENA, no filtra: están todos, exactamente una vez", () => {
    const r = ordenarPorAfinidad(lista, senales(["mia"]), identificar);
    expect(r.map((x) => x.id).sort()).toEqual(lista.map((x) => x.id).sort());
  });

  it("el video con MI corazón va antes que el resto de mi tienda", () => {
    const conCorazon = [
      item("a", "otra1"),
      item("b", "mia"),
      item("c", "mia", true),
      item("d", "otra2"),
    ];
    const r = ordenarPorAfinidad(conCorazon, senales(["mia"]), identificar);
    expect(r[0]!.id).toBe("c");
  });

  it("lo que no es afín conserva su orden relativo", () => {
    const r = ordenarPorAfinidad(lista, senales(["mia"]), identificar);
    const resto = r.filter((x) => x.tiendaId !== "mia").map((x) => x.id);
    expect(resto).toEqual(["a", "b", "d", "f"]);
  });

  it("con menos de tres no toca nada, y con todo afín tampoco", () => {
    const dos = [item("a", "mia"), item("b", "mia")];
    expect(ordenarPorAfinidad(dos, senales(["mia"]), identificar)).toEqual(dos);
    const todos = [item("a", "mia"), item("b", "mia"), item("c", "mia")];
    expect(ordenarPorAfinidad(todos, senales(["mia"]), identificar)).toEqual(
      todos,
    );
  });
});

describe("los candados de la pantalla (24 ago 2026)", () => {
  it("el visor deja el teclado en paz cuando la persona escribe", async () => {
    const { readFileSync } = await import("node:fs");
    const visor = readFileSync(
      "src/components/videos/visor-videos.tsx",
      "utf8",
    );
    /* El espacio pausa el video, como en YouTube — pero YouTube lo apaga con
       el foco en una casilla. Aquí se comió el espaciador de un comentario. */
    expect(visor).toContain('destino.tagName === "TEXTAREA"');
    expect(visor).toContain("isContentEditable");
  });

  it("las casillas del teléfono no bajan de 16px: menos dispara el zoom de iOS", async () => {
    const { readFileSync } = await import("node:fs");
    const css = readFileSync("src/app/globals.css", "utf8");
    expect(css).toContain("font-size: max(16px, 1em)");
  });

  it("la personalización va DESPUÉS de la caché, nunca en la llave", async () => {
    const { readFileSync } = await import("node:fs");
    const p = readFileSync("src/lib/videos/personalizar.ts", "utf8");
    expect(p).not.toContain("recordadoEnElBorde");
    expect(p).toContain("if (!usuario) return videos;");
  });
});
