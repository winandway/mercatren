import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  EN_PAUSA,
  PROVEEDORES_EN_PAUSA,
  TIENDAS_DE_PROVEEDOR,
  carritoPausado,
  proveedorDeLaTienda,
  ventaPausada,
  type Proveedor,
} from "@/lib/ventas/pausa";

/**
 * ══ LA PAUSA POR PROVEEDOR Y NO POR PAÍS (14 nov 2026) ══
 *
 * Desde el 5 nov las tiendas de Estados Unidos también las abre la gente y
 * TopDawg viene en camino. La pausa de CJ no puede cerrar a TopDawg, ni abrir
 * TopDawg puede obligar a abrir a todos los demás.
 */
const tabla: Record<string, Proveedor> = {
  "tienda-topdawg": "topdawg",
  "tienda-cj": "cj",
};
const soloCj = new Set<Proveedor>(["cj"]);

describe("la pausa mira el proveedor de la tienda", () => {
  it("CJ está retirado y pausado", () => {
    expect(PROVEEDORES_EN_PAUSA.has("cj")).toBe(true);
  });

  it("una tienda de TopDawg en EE. UU. vende aunque CJ y las tiendas de la gente estén cerradas", () => {
    expect(
      ventaPausada("US", {
        tiendaId: "tienda-topdawg",
        tabla,
        enPausa: soloCj,
      }),
    ).toBe(false);
  });

  it("una tienda de CJ queda pausada en cualquier país", () => {
    expect(
      ventaPausada("US", { tiendaId: "tienda-cj", tabla, enPausa: soloCj }),
    ).toBe(true);
    expect(
      ventaPausada("VE", { tiendaId: "tienda-cj", tabla, enPausa: soloCj }),
    ).toBe(true);
  });

  it("si se pausa TopDawg, su tienda se cierra", () => {
    expect(
      ventaPausada("US", {
        tiendaId: "tienda-topdawg",
        tabla,
        enPausa: new Set<Proveedor>(["topdawg"]),
      }),
    ).toBe(true);
  });

  it("una tienda de la gente en EE. UU. sigue la llave de su país", () => {
    expect(ventaPausada("US", { tiendaId: "tienda-de-alguien", tabla })).toBe(
      EN_PAUSA,
    );
  });

  it("Venezuela de la gente no se toca", () => {
    expect(ventaPausada("VE", { tiendaId: "ferreteria", tabla })).toBe(false);
  });

  it("sin el id de la tienda, cae en la regla del país (el olvido cierra)", () => {
    expect(ventaPausada("US", { tabla })).toBe(EN_PAUSA);
  });

  it("España sin cobro manda aunque la tienda sea de un proveedor abierto", () => {
    expect(
      ventaPausada("ES", {
        tiendaId: "tienda-topdawg",
        tabla,
        enPausa: soloCj,
      }),
    ).toBe(true);
  });

  it("el equipo sí compra en una tienda pausada, para probar el circuito", () => {
    expect(
      ventaPausada("US", {
        tiendaId: "tienda-cj",
        tabla,
        esEquipoInterno: true,
      }),
    ).toBe(false);
  });

  it("un carrito mezclado con una tienda pausada se detiene entero", () => {
    expect(
      carritoPausado(
        [
          { pais: "US", tiendaId: "tienda-topdawg" },
          { pais: "US", tiendaId: "tienda-cj" },
        ],
        { tabla, enPausa: soloCj },
      ),
    ).toBe(true);
    expect(
      carritoPausado([{ pais: "US", tiendaId: "tienda-topdawg" }, "VE"], {
        tabla,
        enPausa: soloCj,
      }),
    ).toBe(false);
  });

  it("no confunde nombres heredados del objeto con tiendas", () => {
    expect(proveedorDeLaTienda("toString", tabla)).toBeNull();
    expect(proveedorDeLaTienda(" tienda-cj ", tabla)).toBe("cj");
    expect(proveedorDeLaTienda(null)).toBeNull();
  });

  it("hoy ninguna tienda real es de proveedor (las de CJ se borraron el 5 nov)", () => {
    expect(Object.keys(TIENDAS_DE_PROVEEDOR)).toEqual([]);
  });
});

describe("todos los lugares que deciden si se vende pasan la tienda", () => {
  const raiz = join(__dirname, "..", "..");
  const leer = (f: string) => readFileSync(join(raiz, f), "utf8");

  it.each([
    ["src/lib/pedidos/acciones.ts", /tiendaId: p\.tiendaId/],
    ["src/app/datos/google/route.ts", /tiendaId: p\.tiendaId/],
    ["src/lib/app-movil/datos.ts", /tiendaId: f\.tiendaId/],
    ["src/lib/seo/datos-estructurados.ts", /tiendaId: p\.tiendaId/],
    ["src/components/catalogo/boton-agregar.tsx", /tiendaId/],
    ["src/components/catalogo/boton-agregar-rapido.tsx", /tiendaId/],
  ])("%s", (archivo, patron) => {
    expect(leer(archivo)).toMatch(patron);
  });
});
