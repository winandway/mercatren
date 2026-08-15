import { describe, expect, it } from "vitest";

import {
  cabenJuntos,
  DESTINO_POR_DEFECTO,
  destinoDelContenido,
  destinoDeLaTienda,
  destinoElegido,
  esDestino,
  tienePlazoPropio,
} from "@/lib/destino/reglas";

/**
 * A DÓNDE SE ENTREGA.
 *
 * La regla que más se vigila aquí: **nunca se adivina por la conexión**. El
 * 100% de los compradores de Venezuela navegan desde Estados Unidos, así que
 * detectar por IP le daría el catálogo equivocado a toda la clientela actual.
 */

describe("el destino de un producto", () => {
  it("sale del país de la tienda que lo despacha", () => {
    expect(destinoDeLaTienda("US")).toBe("US");
    expect(destinoDeLaTienda("VE")).toBe("VE");
  });

  it("aguanta cómo esté escrito el país en la base", () => {
    /* Cada tienda la cargó alguien distinto: minúsculas, espacios. */
    expect(destinoDeLaTienda("us")).toBe("US");
    expect(destinoDeLaTienda("  US  ")).toBe("US");
  });

  it("lo que no es Estados Unidos se entrega en Venezuela", () => {
    /* Es de donde despachan todos los comercios de hoy. Un país nuevo no puede
       colarse en el catálogo de EE. UU. por descuido. */
    expect(destinoDeLaTienda("CO")).toBe("VE");
    expect(destinoDeLaTienda(null)).toBe("VE");
    expect(destinoDeLaTienda("")).toBe("VE");
  });
});

describe("lo que se le enseña a quien llega", () => {
  it("sin haber elegido, Estados Unidos", () => {
    /* Es lo que Google indexa y lo que busca quien llega de una búsqueda. */
    expect(destinoElegido(null)).toBe("US");
    expect(destinoElegido(undefined)).toBe(DESTINO_POR_DEFECTO);
  });

  it("lo que eligió se respeta", () => {
    expect(destinoElegido("VE")).toBe("VE");
    expect(destinoElegido("US")).toBe("US");
  });

  it("una cookie vieja o manipulada no rompe la pantalla", () => {
    expect(destinoElegido("MARTE")).toBe(DESTINO_POR_DEFECTO);
    expect(destinoElegido("")).toBe(DESTINO_POR_DEFECTO);
  });

  it("solo se reconocen los destinos que existen", () => {
    expect(esDestino("US")).toBe(true);
    expect(esDestino("VE")).toBe(true);
    expect(esDestino("us")).toBe(false);
    expect(esDestino(null)).toBe(false);
    expect(esDestino(7)).toBe(false);
  });
});

describe("el destino sigue al contenido que se abrió", () => {
  it("abrir la tienda de un comercio venezolano cambia el destino", () => {
    /* Es lo que hace que la clientela de siempre, que llega por un enlace de
       WhatsApp, nunca caiga en el catálogo equivocado. */
    expect(destinoDelContenido("VE")).toBe("VE");
    expect(destinoDelContenido("US")).toBe("US");
  });

  it("una página que no habla de un país no cambia nada", () => {
    /* La portada, el carrito: ahí manda lo que la persona eligió. */
    expect(destinoDelContenido(null)).toBeNull();
    expect(destinoDelContenido("")).toBeNull();
  });
});

describe("el carrito", () => {
  it("no mezcla destinos", () => {
    /* Un taladro de Texas y un tubo de PVC de Maracaibo no caben en la misma
       caja ni los despacha la misma persona. */
    expect(cabenJuntos("US", "VE")).toBe(false);
    expect(cabenJuntos("VE", "US")).toBe(false);
  });

  it("lo del mismo destino sí", () => {
    expect(cabenJuntos("US", "US")).toBe(true);
    expect(cabenJuntos("VE", "VE")).toBe(true);
  });
});

describe("los plazos", () => {
  it("Estados Unidos tiene plazo propio y se puede prometer", () => {
    expect(tienePlazoPropio("US")).toBe(true);
  });

  it("en Venezuela el plazo lo pone cada comercio, no nosotros", () => {
    /* Prometer un plazo que no es nuestro es justo lo que Google llama
       tergiversación, y es la causa número uno de suspensión. */
    expect(tienePlazoPropio("VE")).toBe(false);
  });
});
