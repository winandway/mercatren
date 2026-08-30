import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { lineasDeLaVenta } from "@/lib/pedidos/lineas-de-la-venta";

/**
 * EL DINERO NO SE DIVIDE ENTRE 100 A MANO (30 ago 2026).
 *
 * Lo cazó el dueño en el aviso de una venta real: MT-000010 por 65.423 COP
 * llegó como «Total: 654.23 COP» — el peso colombiano no tiene centavos y el
 * ÷100 fijo lo partió entre cien. «Se supone que para eso es un aviso, ¿no?
 * Para avisar, y si avisa mal, no tiene valor.»
 *
 * El divisor SIEMPRE sale de la moneda (`divisorDe`). Aquí se fijan los
 * caminos que tocaban dinero de moneda variable con ÷100 escrito a mano.
 */
describe("los avisos y archivos dicen el monto real", () => {
  it("LA FICHA DE VENTA DEL EQUIPO: 65.423 COP se dice entero, no partido", () => {
    const lineas = lineasDeLaVenta({
      numero: "MT-000010",
      moneda: "COP",
      totalCentavos: 65_423,
      metodoPago: "stripe",
      referencia: null,
      comercios: [],
      ordenesNumero: [],
      compradorNombre: null,
      compradorCorreo: null,
    } as never);
    const total = lineas[0]!;
    expect(total).toContain("65423 COP");
    expect(total).not.toContain("654.23");
    expect(total).not.toContain("USD");
  });

  it("y una venta en dólares sigue diciendo sus centavos", () => {
    const lineas = lineasDeLaVenta({
      numero: "MT-000002",
      moneda: "USD",
      totalCentavos: 3_187,
      metodoPago: "stripe",
      referencia: null,
      comercios: [],
      ordenesNumero: [],
      compradorNombre: null,
      compradorCorreo: null,
    } as never);
    expect(lineas[0]).toContain("31.87 USD");
  });

  it("LOS CAMINOS DE MONEDA VARIABLE NO LLEVAN ÷100 NI ×100 ESCRITOS A MANO", () => {
    /* Cada uno de estos formatea o parsea dinero que puede ser CLP/COP. Un
       «/ 100» o «* 100» pelado en ellos es el fallo del aviso otra vez. */
    const archivos = [
      "src/lib/pedidos/lineas-de-la-venta.ts",
      "src/lib/pedidos/ficha-para-el-equipo.ts",
      "src/app/datos/google/route.ts",
      "src/components/agentes/webmcp.tsx",
      "src/components/panel/formulario-producto.tsx",
      "src/lib/productos/acciones.ts",
      "src/lib/stripe/acreditar.ts",
    ];
    for (const archivo of archivos) {
      const sinComentarios = readFileSync(archivo, "utf-8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      /* Se admite «* 1000» (kilos a gramos) — lo prohibido es el 100 de
         dinero pelado. */
      const sospechosos = sinComentarios.match(/[*/] ?100(?!0)\b/g) ?? [];
      expect(
        sospechosos,
        `${archivo} divide o multiplica por 100 a mano`,
      ).toEqual([]);
    }
  });
});
