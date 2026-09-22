import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { formaDeEntrega } from "@/lib/pedidos/como-se-entrega";
import { rastreoDe } from "@/lib/pedidos/rastreo";

/**
 * «TU PEDIDO YA VA EN CAMINO» (21 sep 2026).
 *
 * ══ LOS DOS FALLOS QUE ESTO TRANCA ══
 *
 * 1. Entre «gracias por tu compra» y «entregado» no había NADA. Un comprador
 *    de Estados Unidos pagaba y no sabía nada más hasta que el paquete
 *    apareciera en su puerta.
 * 2. Cuando un comercio marcaba «enviado», salía el correo de RETIRAR en un
 *    mostrador —con su «lleva tu documento de identidad»— a gente a la que la
 *    caja le llega a su casa. Es el fallo del 20 de septiembre (texto de
 *    Venezuela donde mira Estados Unidos) dentro de un correo, que es donde
 *    nadie lo ve hasta que un cliente contesta preguntando a qué depósito va.
 */
describe("qué correo recibe cada comprador", () => {
  it("Venezuela retira en un mostrador", () => {
    expect(formaDeEntrega("VE")).toBe("retiro");
  });

  it("Estados Unidos, Chile y Colombia reciben en su dirección", () => {
    expect(formaDeEntrega("US")).toBe("a_domicilio");
    expect(formaDeEntrega("CL")).toBe("a_domicilio");
    expect(formaDeEntrega("CO")).toBe("a_domicilio");
  });

  it("el código se lee como venga escrito", () => {
    expect(formaDeEntrega(" ve ")).toBe("retiro");
    expect(formaDeEntrega("ve")).toBe("retiro");
  });

  it("ante la duda, a domicilio: nadie va a un mostrador que no existe", () => {
    /* Un pedido sin mercado guardado, o de un país que no está en la lista.
       El lado seguro es NO mandar a nadie a buscar su compra. */
    expect(formaDeEntrega(null)).toBe("a_domicilio");
    expect(formaDeEntrega("")).toBe("a_domicilio");
    expect(formaDeEntrega("XX")).toBe("a_domicilio");
  });
});

/**
 * UN ENLACE DE RASTREO EQUIVOCADO ES PEOR QUE NINGUNO: la persona lo abre, ve
 * «número no encontrado» y concluye que le vendieron humo. Solo se enlaza a
 * transportistas con formato comprobado; el resto sale con su número, que se
 * puede copiar igual.
 */
describe("el número de guía y dónde se mira", () => {
  it("sin número no hay nada que rastrear", () => {
    expect(rastreoDe(null, "USPS")).toBeNull();
    expect(rastreoDe("   ", "USPS")).toBeNull();
  });

  it("USPS se reconoce aunque CJ lo escriba a su manera", () => {
    const r = rastreoDe("9400111899223197428490", "CJPacket USPS");
    expect(r?.transportista).toBe("USPS");
    expect(r?.url).toContain("9400111899223197428490");
    expect(r?.url).toContain("usps.com");
  });

  it("un transportista desconocido sale con su nombre y SIN enlace", () => {
    const r = rastreoDe("ABC123", "Transportista Local");
    expect(r?.guia).toBe("ABC123");
    expect(r?.transportista).toBe("Transportista Local");
    expect(r?.url).toBeNull();
  });

  it("sin transportista sale solo el número, sin inventar nada", () => {
    const r = rastreoDe("ABC123", null);
    expect(r?.transportista).toBeNull();
    expect(r?.url).toBeNull();
  });

  it("el número va escapado en la dirección", () => {
    /* Un espacio o un signo dentro del número rompería la URL. */
    const r = rastreoDe("AB 12/34", "UPS");
    expect(r?.url).not.toContain(" ");
    expect(r?.url).toContain("AB%2012%2F34");
  });
});

/**
 * EL CANDADO CONTRA EL CORREO DUPLICADO.
 *
 * El reloj corre cada minuto y puede solaparse consigo mismo. Quien mueve el
 * estado del pedido es quien avisa, y el estado solo se puede mover una vez
 * porque va en el WHERE. Si alguien saca esa condición, el comprador recibe
 * «ya va en camino» una vez por minuto.
 */
describe("el despacho automático no avisa dos veces", () => {
  const codigo = readFileSync("src/lib/pedidos/despacho-automatico.ts", "utf8");

  it("el estado del pedido va en el WHERE del avance", () => {
    expect(codigo).toContain('set({ estado: "enviado"');
    expect(codigo).toContain("inArray(pedidos.estado, [...DESDE])");
  });

  it("solo avisa si ese update movió la fila", () => {
    expect(codigo).toContain("if (movido.length === 0) continue;");
    /* El aviso tiene que ir DESPUÉS de comprobar que se movió. */
    expect(codigo.indexOf("if (movido.length === 0) continue;")).toBeLessThan(
      codigo.indexOf("avisarAvanceAlCliente"),
    );
  });

  it("no le habla a CJ si no quedan puntos, y con tope por latido", () => {
    const reloj = readFileSync("src/lib/reloj/tick.ts", "utf8");
    const trozo = reloj.slice(
      reloj.indexOf("mirarDespachosDelProveedor") - 400,
    );
    expect(trozo).toContain("!cjEnPausa");
    expect(codigo).toContain("COMPRAS_POR_LATIDO");
    expect(codigo).toContain("ESPERA_ENTRE_PREGUNTAS_MS");
  });

  it("un pedido cancelado o ya entregado no se despacha", () => {
    expect(codigo).toContain('const DESDE = ["pagado", "preparando"] as const');
  });
});
