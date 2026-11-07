import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  conLegalesDelPais,
  LEGALES_ES,
  LEGALES_VE,
  legalesDeEspanaListos,
  legalesListos,
  seccionesLegalesDelPais,
  type DatosLegalesEspana,
} from "@/contenido/paginas/legales-por-pais";
import { DEVOLUCIONES_ES } from "@/contenido/paginas/devoluciones";
import { PRIVACIDAD_ES } from "@/contenido/paginas/privacidad";
import { TERMINOS_ES } from "@/contenido/paginas/terminos";
import { enLaApp } from "@/lib/mercado/interruptores";
import { ESPANA_SIN_COBRO } from "@/lib/ventas/pausa";

/**
 * LOS TEXTOS LEGALES DE CADA PAÍS (5 nov 2026, Fase 5). Base legal en
 * `docs/paises/`. Lo que no puede pasar sin que esto se ponga en rojo:
 * - que se encienda España o Venezuela en la app (o se abra el cobro de
 *   España) sin sus textos legales listos y revisados por el abogado;
 * - que se publique un texto legal a medias, con huecos por llenar;
 * - que a España le falte lo que la ley obliga: el desistimiento de 14 días
 *   con su formulario, la garantía de 3 años, los tribunales del consumidor,
 *   el representante en la UE y la Agencia de Protección de Datos;
 * - que se vuelva a enlazar la plataforma europea de litigios, derogada desde
 *   el 20 de julio de 2025.
 */
const RAIZ = join(import.meta.dirname, "..", "..");

const COMPLETOS: DatosLegalesEspana = {
  revisadoPorAbogado: true,
  nifEspana: "N0000000X",
  representanteFiscal: "Representante, Calle de ejemplo 1, 28001 Madrid",
  representanteUE: "Representante UE, Calle de ejemplo 2, 28001 Madrid",
  domicilioPublicado: "Domicilio de ejemplo",
  telefonoPublicado: "+00 000 000 000",
  devolucionPaga: "comprador",
  diasParaResponder: 10,
};
const DATOS = {
  ES: COMPLETOS,
  VE: { revisadoPorAbogado: true, publicadoSinRevision: false },
};

const texto = (s: unknown) => JSON.stringify(s);

describe("ningún país se enciende sin sus textos legales", () => {
  it("España: ni en la app ni con el cobro abierto sin textos listos", () => {
    if (enLaApp("ES") || !ESPANA_SIN_COBRO) {
      expect(legalesListos("ES")).toBe(true);
    }
  });

  it("Venezuela: no se enciende en la app sin sus textos revisados", () => {
    if (enLaApp("VE")) expect(legalesListos("VE")).toBe(true);
  });

  it("España hoy no está lista, y por eso sus páginas no cambian", () => {
    expect(legalesListos("ES")).toBe(false);
    expect(legalesListos("US")).toBe(true);
    expect(seccionesLegalesDelPais("terminos", "ES", "es")).toEqual([]);
    expect(conLegalesDelPais(TERMINOS_ES, "terminos", "ES", "es")).toBe(
      TERMINOS_ES,
    );
  });

  it("Venezuela se publica ya (orden de Gerencia), pendiente del abogado", () => {
    /* Con la venta abierta, unos términos de EE. UU. en mercatren.com.ve
       eran peores que unos venezolanos sin revisar. */
    expect(LEGALES_VE.publicadoSinRevision).toBe(true);
    expect(seccionesLegalesDelPais("terminos", "VE", "es")).toHaveLength(1);
    expect(seccionesLegalesDelPais("privacidad", "VE", "en")).toHaveLength(1);
    const pagina = conLegalesDelPais(TERMINOS_ES, "terminos", "VE", "es");
    expect(pagina.secciones.at(-1)!.id).toBe("venezuela");
    expect(pagina.secciones.at(-1)!.numero).toBe(
      String(TERMINOS_ES.secciones.length + 1),
    );
    /* Pero eso NO cuenta como revisado: la app sigue sin poder encenderse. */
    expect(legalesListos("VE")).toBe(false);
  });

  it("un solo dato que falte, o la revisión del abogado, y no se publica", () => {
    expect(legalesDeEspanaListos(COMPLETOS)).toBe(true);
    for (const campo of [
      "nifEspana",
      "representanteFiscal",
      "representanteUE",
      "domicilioPublicado",
      "telefonoPublicado",
    ] as const) {
      expect(legalesDeEspanaListos({ ...COMPLETOS, [campo]: " " }), campo).toBe(
        false,
      );
    }
    expect(
      legalesDeEspanaListos({ ...COMPLETOS, revisadoPorAbogado: false }),
    ).toBe(false);
    expect(legalesDeEspanaListos({ ...COMPLETOS, devolucionPaga: null })).toBe(
      false,
    );
    expect(legalesDeEspanaListos({ ...COMPLETOS, diasParaResponder: 0 })).toBe(
      false,
    );
    expect(LEGALES_ES.revisadoPorAbogado).toBe(false);
  });
});

describe("España: lo que la ley obliga a decir", () => {
  const terminos = texto(
    seccionesLegalesDelPais("terminos", "ES", "es", DATOS),
  );
  const terms = texto(seccionesLegalesDelPais("terminos", "ES", "en", DATOS));
  const privacidad = texto(
    seccionesLegalesDelPais("privacidad", "ES", "es", DATOS),
  );

  it("quién vende, con su registro, su NIF y su representante fiscal", () => {
    expect(terminos).toContain("900260648");
    expect(terminos).toContain("N0000000X");
    expect(terminos).toContain("Representante fiscal en España");
  });

  it("el desistimiento de 14 días con su formulario modelo", () => {
    expect(terminos).toContain("14 días naturales");
    expect(terminos).toContain("Modelo de formulario de desistimiento");
    expect(terminos).toContain("Táchese lo que no proceda");
    expect(terms).toContain("14 calendar days");
    expect(terms).toContain("Model withdrawal form");
  });

  it("la garantía de 3 años y los tribunales del consumidor", () => {
    expect(terminos).toContain("3 años");
    expect(terminos).toContain("tribunales de tu domicilio");
    expect(terms).toContain("courts where you live");
  });

  it("nunca la plataforma europea de litigios, derogada en 2025", () => {
    for (const t of [terminos, terms]) {
      expect(t.toLowerCase()).not.toContain("odr");
      expect(t).not.toContain("ec.europa.eu/consumers");
    }
  });

  it("la privacidad con el representante en la UE, los derechos y la AEPD", () => {
    expect(privacidad).toContain("Representante en la Unión Europea");
    expect(privacidad).toContain("portabilidad");
    expect(privacidad).toContain("Agencia Española de Protección de Datos");
    expect(privacidad).toContain("Marco de Privacidad de Datos UE-EE. UU.");
  });

  it("sin huecos por llenar ni «null» en lo publicado", () => {
    for (const t of [terminos, terms, privacidad]) {
      expect(t).not.toMatch(/\[[a-záéíóú ]+\]/i);
      expect(t).not.toContain("null");
      expect(t).not.toContain("undefined");
    }
  });

  it("es una sola sección, que solo sale en España", () => {
    const secciones = seccionesLegalesDelPais("terminos", "ES", "en", DATOS);
    expect(secciones).toHaveLength(1);
    expect(secciones[0]!.mercados).toEqual(["ES"]);
  });
});

describe("España: las devoluciones", () => {
  const dev = texto(seccionesLegalesDelPais("devoluciones", "ES", "es", DATOS));

  it("14 días para arrepentirse, el reembolso completo y la garantía de 3 años", () => {
    expect(dev).toContain("14 días naturales");
    expect(dev).toContain("incluido el envío estándar");
    expect(dev).toContain("3 años");
    expect(dev).toContain("El envío de vuelta lo pagas tú");
  });

  it("va al principio de la página de devoluciones, solo en España", () => {
    const pagina = conLegalesDelPais(
      DEVOLUCIONES_ES,
      "devoluciones",
      "ES",
      "es",
      DATOS,
    );
    expect(pagina.secciones[0]!.id).toBe("espana");
    expect(pagina.secciones[0]!.mercados).toEqual(["ES"]);
    /* Hoy, sin los datos de Richard, la página no cambia. */
    expect(conLegalesDelPais(DEVOLUCIONES_ES, "devoluciones", "ES", "es")).toBe(
      DEVOLUCIONES_ES,
    );
  });

  it("Venezuela conserva sus devoluciones de retiro, sin duplicar", () => {
    expect(seccionesLegalesDelPais("devoluciones", "VE", "es", DATOS)).toEqual(
      [],
    );
  });
});

describe("Venezuela: quién vende, dónde se retira y la ley que protege", () => {
  const terminos = texto(
    seccionesLegalesDelPais("terminos", "VE", "es", DATOS),
  );
  const privacidad = texto(
    seccionesLegalesDelPais("privacidad", "VE", "es", DATOS),
  );

  it("dice quién vende y que se retira en el comercio, en Venezuela", () => {
    expect(terminos).toContain("se retira en el comercio indicado");
    expect(terminos).toContain("ley venezolana");
    expect(terminos).toContain("tarjeta o por Zelle");
  });

  it("no promete «IVA incluido» hasta que hable el contador venezolano", () => {
    expect(terminos).not.toContain("IVA");
  });

  it("la privacidad dice que los datos se tratan en EE. UU. y qué recibe el comercio", () => {
    expect(privacidad).toContain("en los Estados Unidos");
    expect(privacidad).toContain("No recibe tu comprobante de pago");
  });

  it("no toca la privacidad de Estados Unidos", () => {
    expect(conLegalesDelPais(PRIVACIDAD_ES, "privacidad", "US", "es")).toBe(
      PRIVACIDAD_ES,
    );
  });
});

describe("el botón de pagar en España dice que se paga", () => {
  it("«Comprar y pagar», no «Confirmar pedido» (TRLGDCU art. 98.2)", () => {
    const leer = (r: string) => readFileSync(join(RAIZ, r), "utf-8");
    const es = JSON.parse(leer("messages/es.json")) as {
      checkout: Record<string, string>;
    };
    const en = JSON.parse(leer("messages/en.json")) as {
      checkout: Record<string, string>;
    };
    expect(es.checkout.confirmarConPago).toBe("Comprar y pagar");
    expect(en.checkout.confirmarConPago).toBe("Buy and pay");
    expect(leer("src/app/[locale]/(tienda)/checkout/page.tsx")).toContain(
      '(await mercadoActual()).codigo === "ES"',
    );
    expect(leer("src/components/carrito/formulario-checkout.tsx")).toContain(
      't("confirmarConPago")',
    );
    /* En la app el botón ya dice «Pagar con tarjeta». */
    expect(leer("app-movil/src/lib/textos.ts")).toContain(
      'pagarConTarjeta: "Pagar con tarjeta"',
    );
  });
});

describe("las páginas y la versión para agentes usan la misma pieza", () => {
  it("términos, privacidad y el Markdown", () => {
    const leer = (r: string) => readFileSync(join(RAIZ, r), "utf-8");
    for (const p of ["terms", "privacy", "returns"]) {
      expect(
        leer(`src/app/[locale]/(tienda)/(docs)/${p}/page.tsx`),
        p,
      ).toContain("conLegalesDelPais(");
    }
    expect(leer("src/app/datos/markdown/route.ts")).toContain(
      "conLegalesDelPais(",
    );
  });
});
