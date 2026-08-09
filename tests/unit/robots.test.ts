import { describe, expect, it } from "vitest";

import { MEDIA_PRIVADOS, MEDIA_PRIVADOS_URL } from "@/lib/media/privados";
import { reglasRobots, robotsTxt, SENAL_DE_CONTENIDO } from "@/lib/seo/robots";

/**
 * LAS REGLAS PARA LOS BUSCADORES.
 *
 * Tres cosas que ya costaron caro y que aquí quedan vigiladas:
 *
 * 1. **Googlebot y Googlebot-Image tienen que estar NOMBRADOS.** Con solo el
 *    comodín, Merchant Center rechazó 622 de 625 productos con "Unable to do
 *    quality & policy checks on product pages" (6 ago 2026).
 *
 * 2. **Las tres listas tienen que cerrar lo mismo.** Si alguien agrega una
 *    ruta privada solo al comodín, el robot de Google entraría donde no debe
 *    — y ahí hay dinero de comercios y datos de quienes pagaron.
 *
 * 3. **`/media/` entero NO se cierra.** Cerrarlo dejó 634 productos, el
 *    99,8 % del catálogo, fuera de Google Shopping (8 ago 2026).
 */

const lista = reglasRobots();

function regla(agente: string) {
  return lista.find((r) => r.agente === agente);
}

function cerradas(agente: string): string[] {
  return regla(agente)?.cerrado ?? [];
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
   * LA PRUEBA QUE ANTES DECÍA JUSTO LO CONTRARIO.
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
});

/**
 * LA SEÑAL PARA LAS IA (9 ago 2026).
 *
 * Es una declaración de preferencia, no un candado. Lo que se vigila aquí no
 * es que bloquee —no bloquea nada— sino que diga lo que el negocio decidió.
 */
describe("qué pueden hacer las IA con el catálogo", () => {
  const texto = robotsTxt();

  it("deja que un asistente CITE nuestros productos", () => {
    /* `ai-input=yes` es lo que permite que ChatGPT o Claude nombren un
       producto nuestro cuando alguien pregunta dónde comprar algo. Cerrarlo
       sería desaparecer del sitio donde la gente empezó a buscar. */
    expect(SENAL_DE_CONTENIDO).toContain("ai-input=yes");
  });

  it("y que salgamos en los buscadores, que es a lo que venimos", () => {
    expect(SENAL_DE_CONTENIDO).toContain("search=yes");
  });

  it("pero NO que entrenen modelos con el catálogo", () => {
    // Es lo único que se niega, y por un motivo: no devuelve nada a cambio.
    expect(SENAL_DE_CONTENIDO).toContain("ai-train=no");
  });

  it("la señal va en los TRES grupos, no suelta arriba del archivo", () => {
    /* Así está definida: dentro del grupo del agente al que le aplica. Suelta
       arriba, un robot que solo lee su propio grupo no la vería. */
    const señales = texto.match(/^Content-Signal:/gm) ?? [];
    expect(señales).toHaveLength(reglasRobots().length);
  });
});

describe("el archivo que sale", () => {
  const texto = robotsTxt();

  it("declara el mapa del sitio", () => {
    expect(texto).toContain("/sitemap.xml");
  });

  it("apunta a llms.txt, que es por donde entra un agente", () => {
    expect(texto).toContain("/llms.txt");
  });

  it("cada grupo abre con su User-agent", () => {
    for (const { agente } of reglasRobots()) {
      expect(texto).toContain(`User-agent: ${agente}`);
    }
  });

  it("no se cuela una línea vacía como Disallow", () => {
    /* Un `Disallow:` sin ruta significa «no bloquees nada», que es lo
       contrario de lo que parece. Si una ruta llegara vacía, se colaría. */
    expect(texto).not.toMatch(/^Disallow:\s*$/m);
  });
});
