import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { puedeBorrarSuCuenta } from "@/lib/cuenta/borrar-puro";
import {
  cierreListo,
  DIAS_TIPICOS_DEL_CIERRE,
  pasosPendientes,
} from "@/lib/cuenta/cierre-puro";
import es from "@/../messages/es.json";
import en from "@/../messages/en.json";

/**
 * CERRAR UNA CUENTA CON TIENDA (5 nov 2026, Apple 5.1.1(v), pedido de
 * Gerencia). Lo que no puede pasar sin que esto se ponga en rojo: que a un
 * comercio se le vuelva a mandar a «escribir a soporte», que la tienda siga
 * vendiendo después de pedir el cierre, que la cuenta se borre con pedidos,
 * pagos o dinero pendientes, que un pendiente resuelto no revise el cierre (la
 * cuenta quedaría para siempre sin borrar), o que la web y la app usen piezas
 * distintas.
 */
const leer = (r: string) => readFileSync(r, "utf-8");
const base = {
  rol: "cliente",
  tieneTienda: false,
  pedidosEnCamino: 0,
  paquetesEnBodega: 0,
};

describe("un comercio nunca va a «escribir a soporte»", () => {
  it("con tienda, el motivo es «tienda» (el camino del cierre), nunca «equipo»", () => {
    expect(
      puedeBorrarSuCuenta({ ...base, rol: "vendedor", tieneTienda: true }),
    ).toEqual({ ok: false, motivo: "tienda" });
    expect(puedeBorrarSuCuenta({ ...base, rol: "vendedor" })).toEqual({
      ok: false,
      motivo: "tienda",
    });
    expect(puedeBorrarSuCuenta({ ...base, tieneTienda: true })).toEqual({
      ok: false,
      motivo: "tienda",
    });
  });

  it("el texto de «tienda» explica el cierre y no manda a escribir a nadie", () => {
    for (const textos of [es, en]) {
      const t = (textos.borrarCuenta.errores as Record<string, string>).tienda!;
      expect(t).not.toMatch(/\{correo\}|@|email us|escríbenos/i);
    }
  });
});

describe("las reglas del cierre", () => {
  it("dice lo que falta, en orden, y solo cierra sin nada pendiente", () => {
    expect(
      pasosPendientes({
        pedidosAbiertos: 2,
        pagosPendientes: 1,
        saldoCentavos: 500,
      }),
    ).toEqual(["pedidos", "pagos", "saldo"]);
    expect(
      pasosPendientes({
        pedidosAbiertos: 0,
        pagosPendientes: 0,
        saldoCentavos: 1,
      }),
    ).toEqual(["saldo"]);
    expect(
      cierreListo({ pedidosAbiertos: 0, pagosPendientes: 0, saldoCentavos: 0 }),
    ).toBe(true);
    expect(
      cierreListo({ pedidosAbiertos: 1, pagosPendientes: 0, saldoCentavos: 0 }),
    ).toBe(false);
    expect(DIAS_TIPICOS_DEL_CIERRE).toBe(30);
  });
});

describe("pedir el cierre", () => {
  const cierre = leer("src/lib/cuenta/cierre.ts");

  it("apaga la tienda a la venta en el mismo momento, y la saca del catálogo", () => {
    const pedir = cierre.slice(
      cierre.indexOf("export async function pedirCierre("),
    );
    expect(pedir).toMatch(
      /\.set\(\{ estado: "suspendida", actualizadoEn: new Date\(\) \}\)/,
    );
    expect(pedir).toContain("await catalogoCambioEnTienda(tienda.id);");
  });

  it("solo borra cuando no queda nada, con la MISMA borrarCuenta de siempre", () => {
    const revisar = cierre.slice(
      cierre.indexOf("export async function revisarCierreDeUsuario("),
    );
    const listo = revisar.indexOf("if (!cierreListo(");
    const borrar = revisar.indexOf("await borrarCuenta(");
    expect(listo).toBeGreaterThan(-1);
    expect(borrar).toBeGreaterThan(listo);
  });

  it("cuenta el dinero con la billetera del panel, no con una cuenta propia", () => {
    expect(cierre).toContain(
      'const { obtenerPosicion } = await import("@/lib/zelle/billetera");',
    );
  });
});

describe("cuando algo pendiente se resuelve, se revisa el cierre", () => {
  it("al entregar un pedido", () => {
    expect(leer("src/lib/pedidos/acciones.ts")).toContain(
      "await revisarCierreDePedido(pedido.id)",
    );
  });
  it("al pagar un retiro y al cerrar un saldo por fuera", () => {
    const retiros = leer("src/lib/retiros/acciones.ts");
    expect(retiros).toContain("await revisarCierreDeTienda(retiro.tiendaId)");
    expect(retiros).toContain("await revisarCierreDeTienda(tiendaId)");
  });
  it("al aprobar o rechazar un pago", () => {
    expect(
      leer("src/lib/zelle/acciones.ts").match(
        /await revisarCierreDeTienda\(pago\.tiendaId\)/g,
      ),
    ).toHaveLength(2);
  });
  it("y al mirar su propia cuenta", () => {
    expect(leer("src/lib/cuenta/borrar-acciones.ts")).toContain(
      "await revisarCierreDeUsuario(usuario.id)",
    );
  });
});

describe("la web y la app usan la MISMA pieza", () => {
  it("la página «Delete account» enseña el cierre a una cuenta con tienda", () => {
    const pagina = leer(
      "src/app/[locale]/(tienda)/(docs)/delete-account/page.tsx",
    );
    expect(pagina).toContain('estado.motivo === "tienda" && estado.cierre');
    expect(pagina).toContain("<CerrarTienda");
    expect(leer("src/components/cuenta/cerrar-tienda.tsx")).toContain(
      'pedirCierreDeMiCuenta({ palabra, origen: "web" })',
    );
  });

  it("la app pide el cierre por /datos/app/mi/cerrar-cuenta, con la misma acción", () => {
    const ruta = leer("src/app/datos/app/mi/cerrar-cuenta/route.ts");
    expect(ruta).toMatch(
      /pedirCierreDeMiCuenta\(\{\s*palabra:\s*cuerpo\.data\.palabra,\s*origen:\s*"app"/,
    );
    expect(ruta).toContain("estadoParaBorrar()");
    const pantalla = leer("app-movil/src/app/borrar-cuenta.tsx");
    expect(pantalla).toMatch(
      /conTienda \? urlCerrarCuenta\(pais, idioma\) : urlBorrarCuenta\(idioma\)/,
    );
  });

  it("la tabla llega a producción", () => {
    expect(leer("schema.sql")).toContain(
      "CREATE TABLE IF NOT EXISTS `solicitudes_cierre`",
    );
  });

  it("los pasos y los días se dicen en los dos idiomas", () => {
    for (const textos of [es, en]) {
      const c = textos.borrarCuenta.cierre;
      for (const k of [
        "paso1",
        "paso2",
        "paso3",
        "paso4",
        "boton",
        "enCurso",
      ] as const) {
        expect(c[k].trim(), k).not.toBe("");
      }
      expect(c.paso4).toContain("{dias}");
    }
  });
});
