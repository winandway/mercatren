import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { almacenesNombrados, slugDeLaUrl } from "@/lib/cj/diagnostico-puro";

/**
 * PROBAR Y COMPRAR A CJ SIN PASAR POR STRIPE (5 sep 2026).
 *
 * Tres compras de prueba, tres fallos, cada una con un cobro real en Stripe
 * para descubrir que el circuito moría del lado del proveedor. Este módulo
 * repite ese tramo las veces que haga falta. Las garantías de abajo son las
 * que, si se pierden, o vuelve a comprarse a ciegas o se toca dinero de un
 * cliente.
 */
describe("el enlace del producto", () => {
  it("acepta la dirección completa, en los dos idiomas, y el slug pelado", () => {
    expect(
      slugDeLaUrl("https://mercatren.com/en/producto/usb-c-charger-529858"),
    ).toBe("usb-c-charger-529858");
    expect(slugDeLaUrl("https://mercatren.com/es/producto/x-1?utm=a#b")).toBe(
      "x-1",
    );
    expect(slugDeLaUrl("  x-1  ")).toBe("x-1");
    expect(slugDeLaUrl("")).toBeNull();
    /* Una URL de otra cosa no se convierte en slug por descarte. */
    expect(slugDeLaUrl("https://mercatren.com/es/tienda/algo")).toBeNull();
  });
});

describe("los almacenes que CJ nombra", () => {
  it("recoge cualquier campo que suene a almacén, a cualquier profundidad", () => {
    /* CJ cambia el nombre del campo según el endpoint. El fallo de las tres
       compras vivía en un campo que no se leía: aquí no se adivina uno. */
    const crudo = [
      { logisticName: "USPS+", warehouseName: "Ohio", x: { areaEn: "US" } },
      { logisticName: "GOFO", fromCountryCode: "US" },
    ];
    const vistos = almacenesNombrados(crudo);
    expect(vistos).toContain("warehouseName=Ohio");
    expect(vistos).toContain("areaEn=US");
    expect(vistos).toContain("fromCountryCode=US");
    expect(almacenesNombrados(null)).toEqual([]);
  });
});

describe("la compra de verdad", () => {
  const fuente = readFileSync("src/lib/cj/probar-compra.ts", "utf8");
  const compra = fuente.slice(
    fuente.indexOf("export async function comprarDeVerdadACj"),
  );

  it("solo soporte DE VERDAD, y firma quién la hizo", () => {
    expect(compra).toContain("esSoporteDeVerdad()");
    expect(compra).toContain("obtenerUsuario()");
  });

  it("el número empieza por PRUEBA-, nunca por MT-", () => {
    /* En el panel de CJ se distingue a simple vista y no puede chocar con la
       serie de los pedidos de clientes. */
    expect(compra).toMatch(/`PRUEBA-\$\{/);
    expect(compra).not.toMatch(/`MT-/);
  });

  it("NO toca las tablas de ventas: ni pedidos ni pedidos_proveedor", () => {
    /* Esto no es una venta. Escribir ahí crearía un cliente que no existe o
       una compra que el vigilante perseguiría. El rastro va en configuracion. */
    expect(compra).not.toContain("insert(pedidos)");
    expect(compra).not.toContain("insert(pedidosProveedor)");
    expect(compra).not.toContain("update(pedidos)");
    expect(compra).not.toContain("update(pedidosProveedor)");
    /* El rastro va a `configuracion`: la compra llama a `anotar()`, que
       escribe bajo LLAVE_ULTIMA_PRUEBA. Se mira en el archivo entero porque
       el guardado vive en una función de arriba, no dentro de la compra. */
    expect(compra).toContain("await anotar(");
    expect(fuente).toContain("LLAVE_ULTIMA_PRUEBA");
    expect(fuente).toContain("insert(configuracion)");
  });

  it("crea con payType 1 y paga con payBalanceV2 por shipmentOrderId", () => {
    expect(compra).toContain("payType: 1");
    expect(compra).not.toContain("payType: 2");
    expect(compra).toContain("/shopping/pay/payBalanceV2");
    expect(compra).toContain("idsParaPagar(");
  });

  it("SI EL ALMACÉN NO TIENE STOCK, CAMBIA EL TRANSPORTE ANTES DE RENDIRSE", () => {
    /* Es donde murieron las tres compras. El arreglo del 2 sep existía y
       ninguna compra lo había llegado a usar. */
    expect(compra).toContain("esFalloDeInventario(confirmacion.motivo)");
    expect(compra).toContain("getOrderLogisticsInfo");
    expect(compra).toContain("elegirLogisticaConStock(");
    expect(compra).toContain("/shopping/order/updateLogistics");
    /* Y reconfirma después de cambiarlo, no da por bueno el cambio a secas. */
    const idx = compra.indexOf("updateLogistics");
    expect(compra.indexOf("confirmOrder", idx)).toBeGreaterThan(idx);
  });

  it("no compra a ciegas: pasa primero por el diagnóstico", () => {
    expect(compra).toContain("await probarCompraDeCj(");
    expect(compra).toContain("if (!previo.ok)");
  });

  it("la pantalla pide confirmación diciendo que es dinero real", () => {
    const pantalla = readFileSync(
      "src/components/panel/cj/probar-compra.tsx",
      "utf8",
    );
    expect(pantalla).toMatch(
      /window\.confirm\([\s\S]*?pedido REAL[\s\S]*?saldo/,
    );
    expect(pantalla).toContain("comprarDeVerdadACj(");
  });
});
