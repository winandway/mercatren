import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { formaDeEntrega } from "@/lib/pedidos/como-se-entrega";
import { queMostrarDelEnvio, rastreoDe } from "@/lib/pedidos/rastreo";

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

  /**
   * ══ SPEEDX FALTABA, Y ES EL QUE CJ USA (25 sep 2026) ══
   *
   * Las dos primeras compras reales a CJ salieron con «SpeedX US to US #2».
   * Sin él en la lista, el comprador recibía su número SIN enlace. Estos son
   * los datos exactos que devolvió la API de CJ ese día.
   */
  it("EL CASO REAL: SpeedX de CJ sale con su enlace y su nombre limpio", () => {
    const r = rastreoDe("YWE00001552040292", "SpeedX US to US #2");
    expect(r?.transportista).toBe("SpeedX");
    /* El mismo `trackingUrl` que devolvió CJ para esa compra. */
    expect(r?.url).toBe("https://t.17track.net/en#nums=YWE00001552040292");
  });

  it("la segunda compra real también", () => {
    const r = rastreoDe("YWE00001552040285", "SpeedX US to US #2");
    expect(r?.url).toBe("https://t.17track.net/en#nums=YWE00001552040285");
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

/**
 * ══ EL CORREO NO PUEDE DECIR «YA ESTÁ EN MANOS DEL TRANSPORTISTA» (25 sep 2026) ══
 *
 * El correo sale cuando CJ da la guía, y CJ la da al CREAR la etiqueta, no
 * cuando el transportista recoge la caja. Medido en las dos primeras compras
 * reales: CJ creó la guía el 17 sep y el 25 sep 17track seguía diciendo
 * «esperando ser recogido por la empresa de mensajería». Ocho días.
 *
 * Con el texto de antes —«tu compra ya salió y está en manos del
 * transportista»— el comprador abría el enlace, veía que el paquete no se
 * había movido, y concluía que le mintieron. Aquí se exige que el correo diga
 * solo lo que es cierto en el momento en que sale: que ya hay guía.
 */
describe("el correo dice solo lo que es cierto cuando sale", () => {
  const leer = (f: string) =>
    (
      JSON.parse(readFileSync(f, "utf8")) as {
        correos: { pedidoEnviado: Record<string, string | string[]> };
      }
    ).correos.pedidoEnviado;

  it("no afirma que el transportista ya tiene la caja, en ningún idioma", () => {
    const todo = JSON.stringify([
      leer("messages/es.json"),
      leer("messages/en.json"),
    ]);
    expect(todo).not.toMatch(/en manos del transportista/i);
    expect(todo).not.toMatch(/now with the carrier/i);
    expect(todo).not.toMatch(/ya va en camino/i);
    expect(todo).not.toMatch(/on its way/i);
  });

  it("dice que ya hay número de guía, que es lo que sí es cierto", () => {
    expect(String(leer("messages/es.json").asunto)).toContain("número de guía");
    expect(String(leer("messages/en.json").asunto)).toContain(
      "tracking number",
    );
  });
});

/**
 * ══ LA GUÍA EN CADA COMPRA, Y DÓNDE VA A APARECER (25 sep 2026) ══
 *
 * Richard miró su pedido como lo ve un comprador y pidió ver ahí, en cada
 * compra, el número de guía. Existía, pero solo dentro del pedido y solo con
 * guía ya puesta: en «Mis pedidos» no salía nunca, y mientras no llegaba la
 * pantalla no decía ni dónde mirar.
 */
describe("qué ve del envío quien compró", () => {
  const GUIA = rastreoDe("YWE00001552040285", "SpeedX US to US #2");

  it("con guía, se enseña la guía", () => {
    const e = queMostrarDelEnvio("enviado", true, GUIA);
    expect(e.tipo).toBe("guia");
    expect(e.tipo === "guia" && e.rastreo.guia).toBe("YWE00001552040285");
  });

  it("pagado y sin guía todavía: se dice dónde va a aparecer", () => {
    expect(queMostrarDelEnvio("pagado", true, null).tipo).toBe("pendiente");
    expect(queMostrarDelEnvio("preparando", true, null).tipo).toBe("pendiente");
  });

  it("la guía sigue a la vista después de entregado: es el comprobante", () => {
    expect(queMostrarDelEnvio("entregado", true, GUIA).tipo).toBe("guia");
  });

  it("sin pagar, cancelado o reembolsado no enseña envío", () => {
    expect(queMostrarDelEnvio("pendiente_pago", true, null).tipo).toBe("nada");
    expect(queMostrarDelEnvio("cancelado", true, GUIA).tipo).toBe("nada");
    expect(queMostrarDelEnvio("reembolsado", true, GUIA).tipo).toBe("nada");
  });

  it("lo que se retira en un mostrador no promete una guía", () => {
    expect(queMostrarDelEnvio("pagado", false, null).tipo).toBe("nada");
  });
});

describe("las dos pantallas deciden con la misma pieza", () => {
  it("«Mis pedidos» y el pedido usan queMostrarDelEnvio", () => {
    const lista = readFileSync(
      "src/app/[locale]/(tienda)/pedidos/page.tsx",
      "utf8",
    );
    const detalle = readFileSync(
      "src/app/[locale]/(tienda)/pedido/[numero]/page.tsx",
      "utf8",
    );
    for (const [nombre, fuente] of [
      ["lista", lista],
      ["detalle", detalle],
    ]) {
      expect(fuente, nombre).toContain("queMostrarDelEnvio(");
      expect(fuente, nombre).toContain('envio.tipo === "pendiente"');
    }
  });

  it("la lista trae la guía de cada pedido", () => {
    const acciones = readFileSync("src/lib/pedidos/acciones.ts", "utf8");
    const lista = acciones.slice(
      acciones.indexOf("export async function listarPedidosPropios"),
    );
    expect(lista).toContain("guia: sql");
    expect(lista).toContain("transportista: sql");
  });
});
