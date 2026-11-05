import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import * as app from "../../app-movil/src/lib/ganar";
import {
  cargoDelClic,
  CPC_CENTAVOS,
  PRESUPUESTO_MAXIMO_CENTAVOS,
  PRESUPUESTO_MINIMO_CENTAVOS,
  proPrimero,
} from "@/lib/ganar/reglas";

/**
 * FASE 4 · LAS PIEZAS ARMADAS (5 nov 2026). Las reglas puras viven en
 * `ganar-reglas.test.ts`; aquí, que cada pieza use esas reglas donde toca:
 * el tope de publicados en la acción de la web (que también usa la app), el
 * clic que no se cobra a robots ni dos veces, los promocionados solo en la
 * primera página, y la app con las mismas cifras que el servidor.
 */
const leer = (ruta: string) => readFileSync(ruta, "utf-8");

describe("la app usa las mismas reglas del servidor", () => {
  it("el clic y el presupuesto valen lo mismo en los dos lados", () => {
    expect(app.CPC_CENTAVOS).toBe(CPC_CENTAVOS);
    expect(app.PRESUPUESTO_MINIMO_CENTAVOS).toBe(PRESUPUESTO_MINIMO_CENTAVOS);
    expect(app.PRESUPUESTO_MAXIMO_CENTAVOS).toBe(PRESUPUESTO_MAXIMO_CENTAVOS);
  });

  it("el presupuesto se lee como lo escribe la persona, de 1 a 50", () => {
    expect(app.presupuestoACentavos("5")).toBe(500);
    expect(app.presupuestoACentavos("12,50")).toBe(1250);
    expect(app.presupuestoACentavos("0.50")).toBeNull();
    expect(app.presupuestoACentavos("51")).toBeNull();
    expect(app.presupuestoACentavos("cinco")).toBeNull();
  });

  it("«hasta N personas» es lo que de verdad alcanza con el tope del servidor", () => {
    for (const presupuesto of [100, 500, 1250, 5000]) {
      let gastado = 0;
      let personas = 0;
      while (
        cargoDelClic({
          gastadoHoyCentavos: gastado,
          presupuestoCentavos: presupuesto,
        }) > 0
      ) {
        gastado += cargoDelClic({
          gastadoHoyCentavos: gastado,
          presupuestoCentavos: presupuesto,
        });
        personas++;
      }
      expect(app.clicsPorDia(presupuesto), String(presupuesto)).toBe(personas);
    }
  });

  it("qué se enseña del plan", () => {
    const base = {
      hasta: null,
      estado: null,
      enPrueba: false,
      cancelado: false,
      publicados: 0,
      tope: 100,
    };
    expect(app.vistaDelPlan({ ...base, pro: false, puedeProbar: true })).toBe(
      "ofrecer",
    );
    expect(app.vistaDelPlan({ ...base, pro: true, puedeProbar: false })).toBe(
      "pro",
    );
    expect(
      app.vistaDelPlan({
        ...base,
        pro: true,
        puedeProbar: false,
        cancelado: true,
      }),
    ).toBe("termina");
    expect(app.vistaDelPlan({ ...base, pro: false, puedeProbar: false })).toBe(
      "terminado",
    );
  });
});

describe("el tope de publicados, en la acción que usan la web y la app", () => {
  const acciones = leer("src/lib/productos/acciones.ts");

  it("guardar y publicar revisan el tope; lo ya publicado no se frena", () => {
    const veces = acciones.match(/revisarTopeAlPublicar\(\{/g)?.length ?? 0;
    expect(veces).toBe(2);
    expect(acciones).toContain("yaEstabaPublicado: estabaPublicado");
    expect(acciones).toContain(
      'yaEstabaPublicado: producto.estado === "publicado"',
    );
  });

  it("el aviso dice el tope en los dos idiomas", () => {
    for (const idioma of ["es", "en"]) {
      const m = JSON.parse(leer(`messages/${idioma}.json`)).panel.mensajes;
      expect(m.topeSinPlan, idioma).toContain("{tope}");
      expect(m.topePro, idioma).toContain("{tope}");
    }
  });
});

describe("el clic que se cobra", () => {
  const promos = leer("src/lib/ganar/promociones.ts");
  const ruta = leer("src/app/datos/promo/clic/route.ts");

  it("solo por POST, sin decir por qué no contó", () => {
    expect(ruta).toContain("export async function POST");
    expect(ruta).not.toContain("export async function GET");
    expect(ruta).toContain("status: 204");
  });

  it("primero el robot y la firma; la huella antes de sumar; el tope en la sentencia", () => {
    const robot = promos.indexOf("if (esRobot(o.agente))");
    const firma = promos.indexOf("if (o.firma !== (await firmaDeClic(");
    const huella = promos.indexOf(".insert(clicsPromocion)");
    const suma = promos.indexOf(".insert(gastoPromociones)");
    expect(robot).toBeGreaterThan(-1);
    expect(firma).toBeGreaterThan(robot);
    expect(huella).toBeGreaterThan(firma);
    expect(suma).toBeGreaterThan(huella);
    expect(promos).toContain('if (nueva.length === 0) return "repetido";');
    expect(promos).toMatch(/MIN\(\$\{promo\.presupuesto\}/);
    /* Con el presupuesto agotado no se escribe nada. */
    expect(promos).toContain('if (cargo === 0) return "gratis";');
  });
});

describe("dónde salen los promocionados", () => {
  it("solo en la primera página, sin departamento ni tienda, en la app y en la web", () => {
    const appRuta = leer("src/app/datos/app/v1/catalogo/route.ts");
    expect(appRuta).toContain("filtros.data.pagina === 1");
    expect(appRuta).toContain("!filtros.data.categoria");
    expect(appRuta).toContain("!filtros.data.tienda");
    const web = leer("src/app/[locale]/(tienda)/catalogo/page.tsx");
    expect(web).toContain("resultado.pagina === 1");
    expect(web).toContain("!filtros.categoria");
    expect(web).toContain("!filtros.comercio");
    for (const fuente of [appRuta, web]) {
      expect(fuente).toContain("mezclarPromocionados(");
      expect(fuente).toContain("PROMOCIONADOS_POR_DOCENA");
    }
  });

  it("la tarjeta lleva la marca y avisa el clic, en la web y en la app", () => {
    const web = leer("src/components/catalogo/tarjeta-producto.tsx");
    expect(web).toContain('t("patrocinado")');
    expect(web).toContain("navigator.sendBeacon(");
    const tarjetaApp = leer("app-movil/src/components/tarjeta-producto.tsx");
    expect(tarjetaApp).toContain('texto(idioma, "patrocinado")');
    expect(tarjetaApp).toContain("urlClicPromocion()");
  });
});

describe("el vendedor", () => {
  it("las puertas de la app sacan la tienda de la sesión", () => {
    for (const r of ["plan", "promociones"]) {
      const ruta = `src/app/datos/app/mi/${r}/route.ts`;
      expect(existsSync(ruta), ruta).toBe(true);
      expect(leer(ruta)).toContain("tiendaDeLaSesion()");
    }
  });

  it("en el panel, solo el comercio con su sesión de vendedor (el equipo solo mira)", () => {
    const acciones = leer("src/lib/ganar/acciones.ts");
    expect(acciones).toContain('alcance.tipo !== "tienda"');
    expect(acciones).toContain('quien?.rol !== "vendedor"');
  });

  it("las tiendas con Pro salen primero en el directorio, sin cambiar el resto", () => {
    const lista = [{ slug: "a" }, { slug: "b" }, { slug: "c" }, { slug: "d" }];
    expect(
      proPrimero(lista, new Set(["c"])).map(
        (t) => `${t.slug}${t.pro ? "*" : ""}`,
      ),
    ).toEqual(["c*", "a", "b", "d"]);
    expect(leer("src/app/[locale]/(tienda)/tiendas/page.tsx")).toContain(
      "proPrimero(comercios, conPro)",
    );
  });
});
