import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import { MEDIA_PRIVADOS, MEDIA_PRIVADOS_URL } from "@/lib/media/privados";

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
      for (const ruta of [
        "/panel/",
        "/checkout",
        "/nueva-clave",
        ...MEDIA_PRIVADOS_URL,
      ]) {
        expect(cerrado, `${agente} deja abierto ${ruta}`).toContain(ruta);
      }
    }
  });

  /**
   * LA PRUEBA QUE FALTABA, Y QUE ANTES DECÍA JUSTO LO CONTRARIO.
   *
   * Hasta el 8 ago 2026 aquí se exigía que `/media/` estuviera cerrado para
   * los tres. Sonaba prudente y costó carísimo: el catálogo manda las fotos
   * como `/media/productos/...`, así que le dábamos a Google la dirección de
   * la foto y le prohibíamos abrirla. Merchant Center rechazó 634 productos,
   * el 99,8 %, y el error estaba clavado por escrito en esta misma prueba.
   */
  it("las FOTOS de los productos les quedan abiertas: sin eso no hay catálogo", () => {
    for (const agente of ["*", "Googlebot", "Googlebot-Image"]) {
      const cerrado = cerradas(agente);
      expect(
        cerrado,
        `${agente} tiene cerrada la carpeta entera de /media: las fotos de los productos salen de ahí`,
      ).not.toContain("/media/");

      for (const ruta of cerrado) {
        expect(
          ruta.startsWith("/media/") && !MEDIA_PRIVADOS_URL.includes(ruta),
          `${agente} cierra ${ruta}, que no está en la lista de lo privado`,
        ).toBe(false);
      }
    }
  });

  it("lo que cierra el robots es exactamente lo que la ruta /media protege", () => {
    /* Si mañana se agrega un prefijo privado nuevo y solo se pone en un lado,
       o queda un documento indexable o se cierra una foto sin querer. */
    for (const prefijo of MEDIA_PRIVADOS) {
      expect(MEDIA_PRIVADOS_URL).toContain(`/media/${prefijo}`);
    }
    expect(MEDIA_PRIVADOS_URL).toHaveLength(MEDIA_PRIVADOS.length);
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
