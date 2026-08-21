import { describe, expect, it } from "vitest";

import { limpiarHtml, recortar } from "@/lib/cj/limpiar-descripcion";

/**
 * CJ devuelve la descripción como HTML crudo, y a veces con la maquetación
 * entera de su ficha dentro. Lo que va a la base tiene que ser texto limpio:
 * meter el HTML de un tercero en nuestra página es dejar que su maquetación
 * rompa la nuestra.
 */

describe("limpiar el HTML que devuelve CJ", () => {
  it("quita las etiquetas y deja el texto", () => {
    expect(limpiarHtml("<p>Camisa de <b>algodón</b></p>")).toBe(
      "Camisa de algodón",
    );
  });

  it("los cortes de bloque se vuelven saltos de línea", () => {
    /* Sin esto, tres párrafos quedan pegados en una sola parrafada
       ilegible. */
    const r = limpiarHtml("<p>Primero</p><p>Segundo</p>");
    expect(r).toContain("Primero");
    expect(r).toContain("Segundo");
    expect(r.split("\n").filter(Boolean)).toHaveLength(2);
  });

  it("los <br> también", () => {
    const r = limpiarHtml("Talla S<br>Talla M<br/>Talla L");
    expect(r.split("\n").filter(Boolean)).toHaveLength(3);
  });

  it("las listas se leen como líneas", () => {
    const r = limpiarHtml("<ul><li>Uno</li><li>Dos</li></ul>");
    expect(r.split("\n").filter(Boolean)).toHaveLength(2);
  });

  it("FUERA los <script> y los <style>, con su contenido", () => {
    /* Un `<style>` sin quitar deja sus reglas CSS como texto dentro de la
       descripción, y el comprador ve «.cj-tabla{width:100%}» en la ficha. */
    const r = limpiarHtml(
      "<style>.x{color:red}</style><p>Camisa</p><script>robar()</script>",
    );
    expect(r).toBe("Camisa");
    expect(r).not.toContain("color");
    expect(r).not.toContain("robar");
  });

  it("las entidades se convierten", () => {
    expect(limpiarHtml("Talla&nbsp;M &amp; L")).toBe("Talla M & L");
    expect(limpiarHtml("&lt;10 cm&gt;")).toBe("<10 cm>");
    expect(limpiarHtml("&quot;grande&quot;")).toBe('"grande"');
  });

  it("los espacios y saltos de más se juntan", () => {
    expect(limpiarHtml("<p>Uno</p>\n\n\n\n<p>Dos</p>")).toBe("Uno\n\nDos");
    expect(limpiarHtml("Camisa    de     lino")).toBe("Camisa de lino");
  });

  it("vacío o basura no revienta", () => {
    expect(limpiarHtml("")).toBe("");
    expect(limpiarHtml("   ")).toBe("");
    expect(limpiarHtml(null)).toBe("");
    expect(limpiarHtml(undefined)).toBe("");
    expect(limpiarHtml("<div></div>")).toBe("");
  });

  it("un HTML de verdad de CJ queda legible", () => {
    const real =
      '<div class="detail"><p><strong>Material:</strong>&nbsp;Cotton and Linen</p>' +
      "<p>Size:&nbsp;S/M/L/XL</p><br/><p>Package includes: 1 x Shirt</p></div>";
    const r = limpiarHtml(real);
    expect(r).toContain("Material: Cotton and Linen");
    expect(r).toContain("Size: S/M/L/XL");
    expect(r).toContain("Package includes: 1 x Shirt");
    expect(r).not.toContain("<");
    expect(r).not.toContain("&nbsp;");
  });
});

describe("recortar la descripción", () => {
  it("una normal se deja entera", () => {
    const corta = "Camisa de algodón y lino con manga larga.";
    expect(recortar(corta)).toBe(corta);
  });

  it("una larguísima se corta en una frase completa", () => {
    /* Las de CJ traen a veces la ficha entera repetida tres veces. Cortar a
       mitad de palabra —«el produc»— se lee como si el sitio estuviera
       roto. */
    const larga = "Esta es una frase completa. ".repeat(200);
    const r = recortar(larga);
    expect(r.length).toBeLessThanOrEqual(2000);
    expect(r.endsWith(".")).toBe(true);
  });

  it("una larga sin puntos se corta igual, sin romper el tope", () => {
    const sinPuntos = "palabra ".repeat(500);
    expect(recortar(sinPuntos).length).toBeLessThanOrEqual(2000);
  });
});
