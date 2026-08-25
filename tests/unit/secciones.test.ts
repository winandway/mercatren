import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import es from "@/../messages/es.json";
import en from "@/../messages/en.json";
import {
  destinoDelVideo,
  esPinValido,
  PINES_PROHIBIDOS,
  revisarPin,
  SECCION_INICIAL,
  slugDeSeccion,
} from "@/lib/secciones/reglas";

/**
 * LAS SECCIONES DE VIDEO DE MERCATREN (24 ago 2026).
 *
 * «Tu Próximo Producto Ganador» es la primera: el dueño graba en los almacenes
 * y recomienda productos. Lo que las define es que son NEUTRAS — no llevan a
 * la tienda de nadie.
 */
describe("el destino de un video", () => {
  it("un video de sección lleva al catálogo de Mercatren, NUNCA a una tienda", () => {
    const r = destinoDelVideo({
      seccionSlug: "tu-proximo-producto-ganador",
      tiendaSlug: "bley-ferreteria",
    });
    expect(r.tipo).toBe("seccion");
    expect(r.href).toBe("/catalogo");
    /* Es la regla entera: en cuanto una recomendación empuja a un comercio
       concreto deja de ser recomendación y pasa a ser su publicidad. */
    expect(r.href).not.toContain("bley-ferreteria");
  });

  it("un video de un comercio sigue llevando a su tienda", () => {
    const r = destinoDelVideo({ seccionSlug: null, tiendaSlug: "megayes" });
    expect(r).toEqual({ tipo: "tienda", href: "/tienda/megayes" });
  });
});

describe("el PIN de 4 dígitos", () => {
  it("son exactamente cuatro dígitos", () => {
    expect(esPinValido("4821")).toBe(true);
    expect(esPinValido("482")).toBe(false);
    expect(esPinValido("48211")).toBe(false);
    expect(esPinValido("48a1")).toBe(false);
    expect(esPinValido("")).toBe(false);
  });

  it("rechaza los que prueba cualquiera de primero", () => {
    /* Con `1234` puesto, la segunda capa no existe. */
    for (const obvio of ["1234", "0000", "1111", "4321"]) {
      expect(revisarPin(obvio), obvio).toEqual({ ok: false, motivo: "obvio" });
    }
    expect(PINES_PROHIBIDOS.size).toBeGreaterThan(10);
  });

  it("distingue el formato malo del PIN obvio: no es el mismo consejo", () => {
    expect(revisarPin("12")).toEqual({ ok: false, motivo: "formato" });
    expect(revisarPin("4821")).toEqual({ ok: true });
  });
});

describe("el slug de una sección", () => {
  it("sale del nombre, sin acentos ni signos", () => {
    expect(slugDeSeccion(SECCION_INICIAL.nombreEs)).toBe(
      "tu-proximo-producto-ganador",
    );
    expect(slugDeSeccion("¿Qué compro hoy?")).toBe("que-compro-hoy");
    expect(slugDeSeccion("  Ofertas   de la semana  ")).toBe(
      "ofertas-de-la-semana",
    );
  });

  it("nunca sale vacío: una dirección vacía rompería la página", () => {
    expect(slugDeSeccion("¡!¿?")).toBe("seccion");
    expect(slugDeSeccion("")).toBe("seccion");
  });
});

describe("los candados del enlace con PIN", () => {
  const acciones = readFileSync("src/lib/secciones/acciones.ts", "utf8");

  it("el PIN se comprueba en el SERVIDOR y con límite de intentos", () => {
    /* Cuatro dígitos son diez mil combinaciones: sin límite, una máquina las
       prueba todas. Y un PIN validado en el navegador no es un PIN. */
    expect(acciones).toContain("dejaIntentar");
    expect(acciones).toContain("anotarFallo");
    expect(acciones).toContain("pinCoincide");
  });

  it("a una llave que no existe se le contesta igual que a un PIN malo", () => {
    /* Si no, el enlace se convierte en un detector de llaves válidas. */
    expect(acciones).toContain("Boolean(seccion) &&");
    expect(acciones).not.toContain("seccion no existe");
  });

  it("el pase va en cookie httpOnly y muere si se cambia el PIN", () => {
    expect(acciones).toContain("httpOnly: true");
    expect(acciones).toContain("seccion!.pinHash === guardado");
  });

  it("crear secciones y ver sus llaves es solo de soporte DE VERDAD", () => {
    /* Con el disfraz de «ver su panel» no se crean canales de Mercatren.
       Se mira el CÓDIGO, no los comentarios: el porqué está escrito ahí
       arriba justo nombrando la función que NO se usa. */
    const sinComentarios = acciones
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");
    expect(sinComentarios).toContain("esSoporteDeVerdad");
    expect(sinComentarios).not.toContain("esEquipoInterno");
    const panel = readFileSync(
      "src/app/[locale]/panel/secciones/page.tsx",
      "utf8",
    );
    expect(panel).toContain("esSoporteDeVerdad");
  });

  it("el PIN se guarda derivado con PBKDF2, nunca en claro", () => {
    const pin = readFileSync("src/lib/secciones/pin.ts", "utf8");
    expect(pin).toContain("PBKDF2");
    expect(pin).toContain("iterations: ITERACIONES");
    /* La comparación no corta al primer dígito distinto: el tiempo que tarda
       en decir «no» revelaría cuántos acertó. */
    expect(pin).toContain("diferencia |=");
  });

  it("la subida por enlace pasa por el pase, y la opción va explícita", () => {
    const videos = readFileSync("src/lib/videos/acciones.ts", "utf8");
    const trozo = videos.slice(videos.indexOf("subirVideoDeSeccion"));
    expect(trozo).toContain("await tienePase(llave)");
    /* `comoEquipo` por defecto en false: si alguien la olvida la puerta se
       queda cerrada; al revés, el olvido la abriría. */
    expect(videos).toContain("opciones?.comoEquipo");
  });

  it("el subidor deja ELEGIR del carrete, no solo grabar", () => {
    const subidor = readFileSync(
      "src/components/secciones/subidor-movil.tsx",
      "utf8",
    );
    /* `capture="environment"` abre la cámara directo y esconde la fototeca:
       con quince videos ya grabados, la herramienta no servía para nada. */
    expect(subidor).toContain('accept="video/*"');
    expect(subidor).not.toContain('capture="environment"');
  });

  it("la página del enlace NUNCA se indexa", () => {
    const pagina = readFileSync(
      "src/app/[locale]/subir/[llave]/page.tsx",
      "utf8",
    );
    /* Si Google guardara una de estas direcciones, la llave dejaría de ser un
       secreto para siempre. */
    expect(pagina).toContain("robots: { index: false");
    expect(pagina).toContain("notFound()");
  });
});

describe("los textos, en los dos idiomas", () => {
  it("la sección y el panel tienen todas sus claves", () => {
    for (const [idioma, textos] of [
      ["es", es],
      ["en", en],
    ] as const) {
      const sec = textos.secciones as Record<string, string>;
      for (const clave of [
        "etiqueta",
        "pidePin",
        "elegirVideo",
        "publicarVideo",
        "verEnMercatren",
      ]) {
        expect(sec[clave], `${idioma}.secciones.${clave}`).toBeTruthy();
      }
      const panel = (textos.panel as { secciones: Record<string, string> })
        .secciones;
      for (const clave of ["titulo", "nueva", "pin", "enlaceParaSubir"]) {
        expect(panel[clave], `${idioma}.panel.secciones.${clave}`).toBeTruthy();
      }
    }
  });
});
