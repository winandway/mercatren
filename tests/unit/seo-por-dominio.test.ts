import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { robotsTxt } from "@/lib/seo/robots";

/**
 * EL SEO DE CADA DOMINIO ES SUYO (30 ago 2026).
 *
 * El robots.txt de mercatren.cl le decía a Google
 * «Sitemap: https://mercatren.com/sitemap.xml» — el mapa de OTRO dominio — y
 * el título de la portada chilena decía «Muy pronto» con la tienda vendiendo
 * miles de productos. Aquí se fija que no vuelva.
 */
describe("el robots.txt por dominio", () => {
  it("CADA DOMINIO DECLARA SU PROPIO SITEMAP, nunca el del principal", () => {
    const cl = robotsTxt("https://mercatren.cl");
    expect(cl).toContain("Sitemap: https://mercatren.cl/sitemap.xml");
    expect(cl).toContain("Host: https://mercatren.cl");
    expect(cl).not.toContain("mercatren.com/sitemap.xml");
    const co = robotsTxt("https://mercatren.com.co");
    expect(co).toContain("Sitemap: https://mercatren.com.co/sitemap.xml");
  });

  it("sin base se cae al principal — los robots viejos no cambian", () => {
    expect(robotsTxt()).toContain("Sitemap: https://mercatren.com/sitemap.xml");
  });

  it("la ruta del robots le pasa el dominio del pedido", () => {
    const fuente = readFileSync("src/app/robots.txt/route.ts", "utf-8");
    expect(fuente).toContain("mercadoActual");
    expect(fuente).toContain("robotsTxt(base)");
  });
});

describe("el título y el llms.txt de las plazas", () => {
  it("EL TÍTULO VENDE, NO DICE «MUY PRONTO» — Chile ya vende", () => {
    const es = JSON.parse(readFileSync("messages/es.json", "utf-8"));
    const en = JSON.parse(readFileSync("messages/en.json", "utf-8"));
    for (const d of [es, en]) {
      expect(d.marca.lemaMercado).toBeTruthy();
      expect(d.marca.descripcionMercado).toBeTruthy();
      expect(d.marca.lemaMercado.toLowerCase()).not.toContain("pronto");
      expect(d.marca.lemaMercado.toLowerCase()).not.toContain("soon");
    }
    /* Las palabras que la gente de allá teclea tienen que estar. */
    expect(es.marca.lemaMercado).toContain("Compra online");
    expect(es.marca.lemaMercado).toContain("entrega a domicilio");
  });

  it("el llms.txt de una plaza habla de SU país, no de Estados Unidos", () => {
    const fuente = readFileSync("src/app/llms.txt/route.ts", "utf-8");
    expect(fuente).toContain("mercadoActual");
    expect(fuente).toContain("eq(tiendas.mercado, mercado.codigo)");
    /* La variante de plaza existe y dice tarjeta en la moneda local. */
    expect(fuente).toContain("pesos chilenos");
    expect(fuente).toContain("tarjeta");
  });
});
