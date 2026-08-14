import { describe, expect, it } from "vitest";

import {
  avisoDeFichaNoPublica,
  esPublica,
  puedeVerLaFicha,
  seIndexa,
  type Mirador,
} from "@/lib/tiendas/visibilidad";

/**
 * LA FICHA DE UNA TIENDA QUE TODAVÍA NO ES PÚBLICA.
 *
 * El fallo que motivó esto: un comercio creó su tienda, subió su portada, tocó
 * «ver mi tienda» y se encontró un **404 de su propia tienda** — porque nace en
 * `pendiente` y la ficha pública solo enseñaba las `activa`. Desde su silla eso
 * no se lee como «está en revisión», se lee como que el sitio perdió su trabajo.
 */

const VISITANTE: Mirador = { tipo: "visitante" };
const EQUIPO: Mirador = { tipo: "equipo" };
const DUENNO: Mirador = { tipo: "comercio", tiendaId: "tienda-a" };
const OTRO: Mirador = { tipo: "comercio", tiendaId: "tienda-b" };

describe("quién ve una tienda que no está activa", () => {
  it("su dueño la ve, que es todo el motivo de esto", () => {
    expect(puedeVerLaFicha("pendiente", DUENNO, "tienda-a")).toBe(true);
    expect(puedeVerLaFicha("borrador", DUENNO, "tienda-a")).toBe(true);
  });

  it("el equipo la ve, para poder revisarla antes de aprobarla", () => {
    expect(puedeVerLaFicha("pendiente", EQUIPO, "tienda-a")).toBe(true);
  });

  it("un visitante NO la ve", () => {
    /* Enseñar tiendas sin revisar al público es justo lo que la revisión viene
       a evitar. Y un 404 no confirma siquiera que ese nombre exista. */
    expect(puedeVerLaFicha("pendiente", VISITANTE, "tienda-a")).toBe(false);
    expect(puedeVerLaFicha("borrador", VISITANTE, "tienda-a")).toBe(false);
  });

  it("otro comercio NO puede espiar la tienda sin publicar de un competidor", () => {
    /* Escribiendo su dirección a mano. Por eso se compara el id, y no basta
       con «es un comercio». */
    expect(puedeVerLaFicha("pendiente", OTRO, "tienda-a")).toBe(false);
  });

  it("una tienda activa la ve cualquiera", () => {
    expect(puedeVerLaFicha("activa", VISITANTE, "tienda-a")).toBe(true);
    expect(puedeVerLaFicha("activa", OTRO, "tienda-a")).toBe(true);
  });

  it("un estado desconocido NO se publica solo", () => {
    /* Si mañana alguien agrega `suspendida` y se olvida de esta lista, lo
       seguro es que no salga — no que salga por descuido. */
    expect(esPublica("suspendida")).toBe(false);
    expect(esPublica(null)).toBe(false);
    expect(esPublica(undefined)).toBe(false);
    expect(puedeVerLaFicha("loQueSea", VISITANTE, "tienda-a")).toBe(false);
  });
});

describe("qué se le dice al dueño", () => {
  it("cada estado tiene su aviso", () => {
    expect(avisoDeFichaNoPublica("borrador")).toBe("borrador");
    expect(avisoDeFichaNoPublica("pendiente")).toBe("pendiente");
  });

  it("una activa no avisa nada", () => {
    expect(avisoDeFichaNoPublica("activa")).toBeNull();
  });

  it("lo que no se reconoce se trata como suspendida", () => {
    /* El aviso más prudente. Inventar uno nuevo en silencio sería peor. */
    expect(avisoDeFichaNoPublica("loQueSea")).toBe("suspendida");
    expect(avisoDeFichaNoPublica(null)).toBe("suspendida");
  });
});

describe("los buscadores", () => {
  it("solo indexan lo que ya es público", () => {
    /* Aunque su dueño la esté mirando: si Google la guarda mientras está en
       revisión, queda en sus resultados una tienda que quizá no se aprobó. */
    expect(seIndexa("activa")).toBe(true);
    expect(seIndexa("pendiente")).toBe(false);
    expect(seIndexa("borrador")).toBe(false);
  });
});
