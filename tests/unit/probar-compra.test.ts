import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  almacenesNombrados,
  rutaDeSondaPermitida,
  slugDeLaUrl,
} from "@/lib/cj/diagnostico-puro";

/**
 * PROBAR Y COMPRAR A CJ SIN PASAR POR STRIPE (5 sep 2026).
 *
 * Tres compras de prueba, tres fallos, cada una con un cobro real en Stripe
 * para descubrir que el circuito moría del lado del proveedor. Este módulo
 * repite ese tramo las veces que haga falta. Las garantías de abajo son las
 * que, si se pierden, o vuelve a comprarse a ciegas, o se paga con un
 * identificador que no es, o se toca dinero de un cliente.
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
  const nucleo = readFileSync("src/lib/cj/probar-compra-nucleo.ts", "utf8");
  const acciones = readFileSync("src/lib/cj/probar-compra.ts", "utf8");
  const entre = (fuente: string, desde: string, hasta: string) => {
    const a = fuente.indexOf(desde);
    const b = fuente.indexOf(hasta, a + 1);
    if (a < 0 || b < 0) throw new Error(`no encuentro ${desde} … ${hasta}`);
    return fuente.slice(a, b);
  };
  /* Cada rebanada acotada a SU función: si llegara hasta el final del
     archivo, quitar una compuerta seguiría en verde porque la prueba la
     encontraría en la función siguiente. Lo enseñó el chequeo en rojo. */
  const pago = entre(
    nucleo,
    "async function pagarPedidoEnCj",
    "export async function comprarDeVerdadACjNucleo",
  );
  const compra = entre(
    nucleo,
    "export async function comprarDeVerdadACjNucleo",
    "export async function pagarUltimaPruebaPendienteNucleo",
  );
  const pendiente = entre(
    nucleo,
    "export async function pagarUltimaPruebaPendienteNucleo",
    "export async function sondaCj",
  );

  it("cada acción del panel exige soporte DE VERDAD, y la compra firma quién la hizo", () => {
    for (const nombre of [
      "probarCompraDeCj",
      "comprarDeVerdadACj",
      "pagarUltimaPruebaPendiente",
      "leerUltimaCompraDePrueba",
    ]) {
      const desde = acciones.indexOf(`export async function ${nombre}(`);
      expect(desde, nombre).toBeGreaterThan(-1);
      const siguiente = acciones.indexOf("\nexport async function", desde + 1);
      const cuerpo = acciones.slice(
        desde,
        siguiente > 0 ? siguiente : undefined,
      );
      expect(cuerpo, nombre).toContain("esSoporteDeVerdad()");
    }
    expect(acciones).toContain("obtenerUsuario()");
    /* El archivo "use server" no exporta nada que no sea una acción: una
       constante o un tipo exportado tumba el módulo entero en Turbopack. */
    expect(acciones.startsWith('"use server";')).toBe(true);
    expect(acciones).not.toMatch(
      /^export (const|let|type|interface|function)\b/m,
    );
    /* Y el núcleo NO mira la sesión: es lo que deja usarlo desde la puerta. */
    expect(nucleo).not.toContain("esSoporteDeVerdad");
    expect(nucleo).not.toContain("obtenerUsuario");
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
    for (const trozo of [compra, pago, pendiente]) {
      expect(trozo).not.toContain("insert(pedidos)");
      expect(trozo).not.toContain("insert(pedidosProveedor)");
      expect(trozo).not.toContain("update(pedidos)");
      expect(trozo).not.toContain("update(pedidosProveedor)");
    }
    expect(compra).toContain("await anotar(");
    expect(nucleo).toContain("LLAVE_ULTIMA_PRUEBA");
    expect(nucleo).toContain("insert(configuracion)");
  });

  it("crea con payType 1 y GUARDA el shipmentOrderId que CJ devuelve al crear", () => {
    /* `getOrderDetail` no lo devuelve (su tabla de campos no lo tiene): si
       no se guarda al crear, no hay con qué pagar después. */
    expect(compra).toContain("payType: 1");
    expect(compra).not.toContain("payType: 2");
    expect(compra).toContain("creacion.datos?.shipmentOrderId");
    expect(compra).toContain("shipmentDeCreacion,");
    expect(compra).toContain("await pagarPedidoEnCj(");
  });

  it("PAGA PRIMERO con payBalance (v1) por el orderId numérico, y solo si CJ lo rechaza va por el carrito: addCart → addCartConfirm → saveGenerateParentOrder → payBalanceV2", () => {
    /* Medido el 5 sep 2026: v1 con el orderId de CJ pagó PRUEBA-20260905184139
       ($150 → $138.60). V2 con el orderId numérico daba «Order not found»,
       con el cjOrderId «pay fail», y con el código SD «Order not found»; y
       addCartConfirm a un pedido UNPAID contesta submitSuccess=false. El
       carrito es el camino de los pedidos padre con varios envíos (doc 2.2). */
    expect(pago).toContain("cuerpo: { orderId: orderIdCj }");
    expect(pago).toContain("if (!pagado) {");
    const orden = [
      "/shopping/pay/payBalance",
      "/shopping/order/addCart",
      "/shopping/order/addCartConfirm",
      "/shopping/order/saveGenerateParentOrder",
      "/shopping/pay/payBalanceV2",
    ];
    let cursor = -1;
    for (const ruta of orden) {
      const idx = pago.indexOf(`"${ruta}"`, cursor + 1);
      expect(idx, ruta).toBeGreaterThan(cursor);
      cursor = idx;
    }
    expect(pago).toContain("cjOrderIdList: [id]");
    expect(pago).toContain("confirmacion.datos.shipmentsId");
    expect(pago).toContain("{ shipmentOrderId: shipment, payId }");
  });

  it("si CJ no entrega el shipmentOrderId, NO llama a payBalanceV2 con otro id y lo dice", () => {
    const sinShipment = pago.indexOf('donde: "shipment"');
    const pagar = pago.indexOf('"/shopping/pay/payBalanceV2"');
    expect(sinShipment).toBeGreaterThan(-1);
    expect(sinShipment).toBeLessThan(pagar);
    /* Y nunca vuelve el camino viejo: probar orderId y cjOrderId como si
       fueran el shipmentOrderId. */
    expect(nucleo).not.toContain("idsParaPagar(");
  });

  it("SI EL ALMACÉN NO TIENE STOCK, CAMBIA EL TRANSPORTE Y VUELVE A CONFIRMAR", () => {
    /* Es donde murieron las tres compras. El arreglo del 2 sep existía y
       ninguna compra lo había llegado a usar. */
    expect(pago).toContain("esFalloDeInventario(motivoConfirmacion)");
    const reparar = pago.indexOf("await repararTransporte(");
    expect(reparar).toBeGreaterThan(-1);
    expect(pago.indexOf("await confirmar()", reparar)).toBeGreaterThan(reparar);
    const reparacion = entre(
      nucleo,
      "async function repararTransporte",
      "async function pagarPedidoEnCj",
    );
    expect(reparacion).toContain("getOrderLogisticsInfo");
    expect(reparacion).toContain("elegirLogisticaConStock(");
    expect(reparacion).toContain("/shopping/order/updateLogistics");
  });

  it("LA PRUEBA DE QUE SE PAGÓ ES QUE EL SALDO BAJE: se lee antes y después", () => {
    expect(nucleo).toContain('"/shopping/pay/getBalance"');
    expect(pago.split("await saldoDeCj()").length - 1).toBeGreaterThanOrEqual(
      2,
    );
    expect(pago).toContain("NO bajó");
  });

  it("UN PEDIDO UNPAID NO SE CONFIRMA: confirmOrder solo para CREATED / IN_CART", () => {
    /* Con payType 1 CJ lo crea ya en UNPAID y confirmarlo rebota. */
    expect(pago).toContain("if (hayQueConfirmar(detalle?.orderStatus)) {");
    const compuerta = entre(
      nucleo,
      "function hayQueConfirmar",
      "async function pagarPedidoEnCj",
    );
    expect(compuerta).toContain('s === "CREATED" || s === "IN_CART"');
    expect(pago.indexOf('"/shopping/order/confirmOrder"')).toBeLessThan(
      pago.indexOf('"/shopping/pay/payBalance"'),
    );
  });

  it("pagar la pendiente retoma la guardada y NUNCA crea otra", () => {
    expect(pendiente).toContain("leerUltimaCompraDePruebaNucleo()");
    expect(pendiente).toContain('ultima.estado !== "creado_sin_pagar"');
    expect(pendiente).not.toContain("createOrderV2");
    expect(pendiente).toContain("await pagarPedidoEnCj(");
    /* Y le pasa el shipmentOrderId guardado, que es lo que faltaba. */
    expect(pendiente).toContain("ultima.shipmentOrderId");
  });

  it("no compra a ciegas: pasa primero por el diagnóstico", () => {
    expect(compra).toContain("await probarCompraDeCjNucleo(");
    expect(compra).toContain("if (!previo.ok)");
  });

  it("la pantalla pide confirmación diciendo que es dinero real, en los dos idiomas", () => {
    /* El texto vive en los diccionarios (panel bilingüe), así que se mira
       cada mitad donde está: el confirm en la pantalla, y que el texto diga
       «pedido REAL» y «saldo» en es, «REAL order» y «balance» en en. */
    const pantalla = readFileSync(
      "src/components/panel/cj/probar-compra.tsx",
      "utf8",
    );
    expect(pantalla).toContain('window.confirm(t("comprarConfirmar"))');
    expect(pantalla).toContain("comprarDeVerdadACj(");
    const leer = (ruta: string) =>
      (
        JSON.parse(readFileSync(ruta, "utf8")) as {
          panel: { probarCompra: { comprarConfirmar: string } };
        }
      ).panel.probarCompra.comprarConfirmar;
    expect(leer("messages/es.json")).toMatch(/pedido REAL[\s\S]*saldo/);
    expect(leer("messages/en.json")).toMatch(/REAL order[\s\S]*balance/);
  });
});

describe("la puerta para probar sin sesión (/datos/probar-compra)", () => {
  const ruta = readFileSync("src/app/datos/probar-compra/route.ts", "utf8");
  const flujo = readFileSync(".github/workflows/probar-compra.yml", "utf8");

  it("solo abre con la llave del reloj: sin llave 503, con otra 404", () => {
    expect(ruta).toContain(
      "autorizadoPorLlave(peticion, env.SINCRONIZAR_LLAVE)",
    );
    expect(ruta).toContain("status: 503");
    expect(ruta).toContain("status: 404");
  });

  it("todo lo que entra pasa por zod", () => {
    expect(ruta).toContain('z.discriminatedUnion("accion"');
    expect(ruta).toContain("safeParse(");
    expect(ruta).toContain("status: 400");
  });

  it("la sonda solo deja rutas de CJ de la lista; la autenticación queda fuera", () => {
    expect(
      rutaDeSondaPermitida("/shopping/order/getOrderDetail?orderId=PRUEBA-1"),
    ).toBe(true);
    expect(rutaDeSondaPermitida("/shopping/pay/getBalance")).toBe(true);
    expect(rutaDeSondaPermitida("/product/variant/query?pid=1")).toBe(true);
    expect(rutaDeSondaPermitida("/logistic/freightCalculate")).toBe(true);
    expect(rutaDeSondaPermitida("/authentication/getAccessToken")).toBe(false);
    expect(rutaDeSondaPermitida("/authentication/refreshAccessToken")).toBe(
      false,
    );
    expect(rutaDeSondaPermitida("/shopping/privateInventory/createOrder")).toBe(
      false,
    );
    expect(rutaDeSondaPermitida("shopping/order/list")).toBe(false);
    expect(rutaDeSondaPermitida("/shopping/order/../../authentication/x")).toBe(
      false,
    );
    expect(rutaDeSondaPermitida("/shopping/order/list x")).toBe(false);
    expect(rutaDeSondaPermitida("")).toBe(false);
    expect(rutaDeSondaPermitida(null)).toBe(false);
  });

  it("el flujo de GitHub la llama con el secreto, se dispara solo A MANO y enseña la respuesta entera", () => {
    expect(flujo).toContain("workflow_dispatch");
    expect(flujo).not.toContain("schedule:");
    expect(flujo).toContain("secrets.SINCRONIZAR_LLAVE");
    expect(flujo).toContain("https://mercatren.com/datos/probar-compra");
    expect(flujo).toContain("jq . respuesta.json");
  });
});
