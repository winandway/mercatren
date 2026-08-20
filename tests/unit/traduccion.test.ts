import { describe, expect, it } from "vitest";

import {
  faltaTraducir,
  leerRespuesta,
  traduccionUtil,
} from "@/lib/traduccion/reglas";

/** Cómo responde de verdad la API, para no probar contra un invento. */
const respuestaDe = (json: string) => ({
  candidates: [{ content: { parts: [{ text: json }] } }],
});

describe("qué producto falta traducir", () => {
  it("los dos idiomas iguales = nunca se tradujo", () => {
    expect(
      faltaTraducir({ tituloEs: "Fat Tire Bike", tituloEn: "Fat Tire Bike" }),
    ).toBe(true);
  });

  it("sin español, falta", () => {
    expect(faltaTraducir({ tituloEs: null, tituloEn: "Hand Truck" })).toBe(
      true,
    );
    expect(faltaTraducir({ tituloEs: "   ", tituloEn: "Hand Truck" })).toBe(
      true,
    );
  });

  it("YA TRADUCIDO NO SE VUELVE A TOCAR", () => {
    /* Este es el candado que importa. Si se pusiera rojo, una segunda pasada
       reescribiría títulos que una persona ya corrigió a mano, y eso no se
       puede deshacer. */
    expect(
      faltaTraducir({
        tituloEs: "Bicicleta de montaña 26 pulgadas",
        tituloEn: "26 Inch Mountain Bike",
      }),
    ).toBe(false);
  });

  it("sin inglés no hay de dónde traducir", () => {
    expect(faltaTraducir({ tituloEs: "Taladro", tituloEn: null })).toBe(false);
    expect(faltaTraducir({ tituloEs: "Taladro", tituloEn: "  " })).toBe(false);
  });

  it("las mayúsculas no engañan", () => {
    expect(
      faltaTraducir({ tituloEs: "HAND TRUCK", tituloEn: "Hand Truck" }),
    ).toBe(true);
  });
});

describe("lo que devuelve el modelo se comprueba antes de guardarlo", () => {
  it("una traducción normal sirve", () => {
    expect(
      traduccionUtil("26 Inch Mountain Bike", "Bicicleta de montaña 26 pulgadas"),
    ).toBe(true);
  });

  it("devolver lo mismo NO sirve", () => {
    /* Guardarlo marcaría el producto como traducido y no se volvería a
       intentar jamás: quedaría en inglés para siempre. */
    expect(traduccionUtil("Hand Truck", "Hand Truck")).toBe(false);
    expect(traduccionUtil("Hand Truck", "hand truck")).toBe(false);
  });

  it("vacío o casi vacío no sirve", () => {
    expect(traduccionUtil("Hand Truck", "")).toBe(false);
    expect(traduccionUtil("Hand Truck", "   ")).toBe(false);
    expect(traduccionUtil("Hand Truck", "ok")).toBe(false);
    expect(traduccionUtil("Hand Truck", null)).toBe(false);
  });

  it("una parrafada no es un título de producto", () => {
    const disculpa =
      "Lo siento, no puedo traducir ese texto porque no entiendo bien el " +
      "contexto del producto. Si me das más información sobre qué es " +
      "exactamente podría ayudarte mejor con la traducción al español.";
    expect(traduccionUtil("Hand Truck", disculpa)).toBe(false);
  });
});

describe("leer la respuesta del modelo", () => {
  const pedido = [
    { id: "p1", tituloEn: "26 Inch Mountain Bike" },
    { id: "p2", tituloEn: "Hand Truck, 600 Lbs" },
  ];

  it("saca las traducciones buenas", () => {
    const r = leerRespuesta(
      respuestaDe(
        JSON.stringify({
          t: [
            { id: "p1", titulo: "Bicicleta de montaña 26 pulgadas" },
            { id: "p2", titulo: "Carretilla de carga 600 libras" },
          ],
        }),
      ),
      pedido,
    );
    expect(r.ok).toBe(true);
    expect(r.ok && r.traducciones).toHaveLength(2);
  });

  it("DESCARTA un id que nadie pidió", () => {
    /* Sin esto, un modelo que se invente un id escribiría sobre un producto
       que nadie mandó a traducir. */
    const r = leerRespuesta(
      respuestaDe(
        JSON.stringify({
          t: [
            { id: "p1", titulo: "Bicicleta de montaña 26 pulgadas" },
            { id: "producto-de-otro", titulo: "Cualquier cosa" },
          ],
        }),
      ),
      pedido,
    );
    expect(r.ok && r.traducciones.map((t) => t.id)).toEqual(["p1"]);
  });

  it("descarta las que no sirven y se queda con las buenas", () => {
    const r = leerRespuesta(
      respuestaDe(
        JSON.stringify({
          t: [
            { id: "p1", titulo: "26 Inch Mountain Bike" },
            { id: "p2", titulo: "Carretilla de carga 600 libras" },
          ],
        }),
      ),
      pedido,
    );
    expect(r.ok && r.traducciones.map((t) => t.id)).toEqual(["p2"]);
  });

  it("un JSON que no es JSON no revienta, avisa", () => {
    const r = leerRespuesta(respuestaDe("aquí tienes la traducción:"), pedido);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.motivo).toContain("no devolvió JSON");
  });

  it("una respuesta vacía no revienta, avisa", () => {
    expect(leerRespuesta({}, pedido).ok).toBe(false);
    expect(leerRespuesta(respuestaDe("   "), pedido).ok).toBe(false);
  });

  it("un JSON con otra forma no revienta, avisa", () => {
    const r = leerRespuesta(respuestaDe(JSON.stringify({ otra: 1 })), pedido);
    expect(r.ok).toBe(false);
  });

  it("filas a medias se saltan sin tumbar la tanda", () => {
    const r = leerRespuesta(
      respuestaDe(
        JSON.stringify({
          t: [
            { id: "p1" },
            { titulo: "sin id" },
            { id: "p2", titulo: "Carretilla de carga 600 libras" },
          ],
        }),
      ),
      pedido,
    );
    expect(r.ok && r.traducciones).toHaveLength(1);
  });
});
