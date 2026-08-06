import { describe, expect, it } from "vitest";

import robots from "@/app/robots";

/**
 * LAS REGLAS PARA LOS BUSCADORES.
 *
 * Dos cosas que ya costaron caro y que aquí quedan vigiladas:
 *
 * 1. **Googlebot y Googlebot-Image tienen que estar NOMBRADOS.** Con solo el
 *    comodín, Merchant Center rechazó 622 de 625 productos con "Unable to do
 *    quality & policy checks on product pages" (6 ago 2026). No se conforma
 *    con `*`: entra a cada ficha a comprobar precio y existencias, y para eso
 *    exige ver su nombre.
 *
 * 2. **Las tres listas tienen que cerrar lo mismo.** Si alguien agrega una
 *    ruta privada solo al comodín, el robot de Google entraría donde no debe
 *    — y ahí hay dinero de comercios y datos de quienes pagaron.
 */

const reglas = robots().rules;
const lista = Array.isArray(reglas) ? reglas : [reglas];

function regla(agente: string) {
  return lista.find((r) => r.userAgent === agente);
}

function cerradas(agente: string): string[] {
  const d = regla(agente)?.disallow;
  return Array.isArray(d) ? d : d ? [d] : [];
}

describe("las reglas para los buscadores", () => {
  it("Googlebot y Googlebot-Image están nombrados aparte", () => {
    // Sin esto, Merchant Center no publica ningún producto.
    expect(regla("Googlebot"), "falta Googlebot").toBeDefined();
    expect(regla("Googlebot-Image"), "falta Googlebot-Image").toBeDefined();
  });

  it("sigue estando la regla para todos los demás buscadores", () => {
    expect(regla("*")).toBeDefined();
  });

  it("lo privado está cerrado para los TRES", () => {
    /* El panel tiene el dinero de los comercios; los comprobantes, los datos
       de quienes pagaron. Nadie entra, se llame como se llame. */
    for (const agente of ["*", "Googlebot", "Googlebot-Image"]) {
      const cerrado = cerradas(agente);
      for (const ruta of ["/panel/", "/media/", "/checkout", "/nueva-clave"]) {
        expect(cerrado, `${agente} deja abierto ${ruta}`).toContain(ruta);
      }
    }
  });

  it("el catálogo de Merchant Center le queda abierto a Googlebot", () => {
    /* `/datos/google` es el archivo que Merchant Center va a leer. Cerrárselo
       sería darle una dirección que su propio robot tiene prohibida. */
    expect(cerradas("Googlebot")).not.toContain("/datos/");
    expect(cerradas("*"), "para los demás sí se cierra").toContain("/datos/");
  });

  it("el mapa del sitio va declarado", () => {
    expect(robots().sitemap).toContain("/sitemap.xml");
  });
});
