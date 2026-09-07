import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import es from "@/../messages/es.json";
import en from "@/../messages/en.json";
import { MERCADOS } from "@/lib/mercado/mercados";

const leer = (r: string) => readFileSync(r, "utf8");
const global = leer("src/components/marca/mercatren-global.tsx");
/** El mismo archivo sin comentarios: los dominios se nombran ahí al explicar
    la mudanza, y eso no es una lista escrita a mano. */
const globalSinComentarios = global
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");
const bandera = leer("src/components/marca/bandera-pais.tsx");
const encabezado = leer("src/components/layout/encabezado.tsx");

/**
 * ══ LA VENTANA «MERCATREN EN EL MUNDO» (7 sep 2026) ══
 *
 * Richard la pidió el día que Venezuela se mudó a su dominio, y el motivo
 * manda sobre el diseño: hay gente que tenía su cuenta en mercatren.com y su
 * tienda amaneció en mercatren.com.ve. Sin una explicación a la vista, eso
 * se lee como que el sitio perdió su trabajo.
 */
describe("Mercatren en el mundo", () => {
  it("ofrece TODOS los países declarados, sin escribir ninguno a mano", () => {
    /* La lista sale de MERCADOS: un país nuevo aparece solo el día que se
       declara. Escrita a mano se queda vieja con el primero que entre. */
    expect(global).toContain("MERCADOS.map");
    for (const m of MERCADOS) {
      expect(globalSinComentarios, m.dominio).not.toContain(m.dominio);
    }
  });

  it("los enlaces van con la dirección COMPLETA, no con el Link de Next", () => {
    /**
     * Van a OTRO dominio. El enrutador de Next solo sabe moverse dentro de
     * este: con `<Link>` la navegación muere sin decir nada — que es
     * exactamente lo que no puede pasarle a alguien buscando su tienda.
     */
    expect(global).toContain("href={`https://${m.dominio}/${idioma}`}");
    expect(global).not.toContain('from "@/i18n/navigation"');
  });

  it("conserva el idioma de quien está leyendo", () => {
    /* Quien lee en inglés en el .com llega a /en en el dominio nuevo. */
    expect(global).toContain("${idioma}");
  });

  it("CUENTA LA MUDANZA, y antes de la lista de países", () => {
    /* Quien abre esto porque «no encuentra sus productos» necesita el
       porqué antes que cuatro enlaces que no pidió. */
    const aviso = global.indexOf("textos.mudanza");
    const lista = global.indexOf("MERCADOS.map");
    expect(aviso).toBeGreaterThan(-1);
    expect(aviso).toBeLessThan(lista);

    for (const [idioma, textos] of [
      ["es", es],
      ["en", en],
    ] as const) {
      const t = (textos as unknown as Record<string, Record<string, string>>)
        .global;
      expect(t, idioma).toBeDefined();
      /* El aviso nombra el dominio nuevo: sin él no explica nada. */
      expect(t.mudanza, idioma).toContain("mercatren.com.ve");
      for (const clave of ["boton", "titulo", "entrada", "aqui", "cerrar"]) {
        expect(t[clave], `${idioma}.${clave}`).toBeTruthy();
      }
    }
  });

  it("marca dónde está parado quien mira, y no se ofrece a sí mismo", () => {
    expect(global).toContain("m.codigo === mercado.codigo");
    expect(global).toContain("textos.aqui");
  });

  it("se cierra con Escape y tocando fuera", () => {
    /* `showModal` es lo que trae el foco atrapado y el cierre con Escape;
       un div con estado no da ninguna de las dos. */
    expect(global).toContain("showModal()");
    expect(global).toContain("e.target === ventana.current");
  });

  it("EL .COM TAMBIÉN LLEVA BANDERA", () => {
    /**
     * Hasta la mudanza, el dominio principal iba sin bandera («lo normal no
     * se marca»). Dejó de ser cierto el día que pasó a ser el dominio de UN
     * país más. Lo pidió Richard mirando su propio encabezado.
     */
    expect(bandera).toContain("US: BanderaEstadosUnidos");
    expect(bandera).not.toContain(
      "if (esMercadoPrincipal(mercado)) return null",
    );
  });

  it("en el celular la bandera ES el botón, para que quepa el carrito", () => {
    /**
     * Medido a 360 px: con la bandera junto al logo Y un globo aparte, el
     * carrito se caía a una segunda línea. Arriba se dibuja UNA cosa.
     */
    expect(global).toContain("soloBandera");
    expect(encabezado).toContain('<span className="hidden lg:flex">');
    expect(encabezado).toContain("soloIcono");
  });

  it("va en la barra de TODOS los dominios, no solo en uno", () => {
    /* El encabezado es único para las cuatro plazas: si estuviera detrás de
       un `if` de mercado, al venezolano que llega al .com no le saldría. */
    expect(encabezado).toContain("<MercatrenGlobal");
    const trozo = encabezado.slice(encabezado.indexOf("<MercatrenGlobal"));
    expect(trozo.slice(0, 400)).not.toContain("esMercadoPrincipal");
  });
});
