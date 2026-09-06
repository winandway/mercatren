import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  esMercadoPrincipal,
  MERCADOS,
  mercadoPorCodigo,
  mercadoPorHost,
  seMudoA,
  seRetiraEnCiudad,
} from "@/lib/mercado/mercados";

/**
 * VENEZUELA SE MUDÓ A SU PROPIO DOMINIO (6 sep 2026).
 *
 * Hasta hoy «mercado principal» y «Venezuela» eran la misma cosa: mercatren.com
 * enseñaba el catálogo de Estados Unidos Y los productos que se retiran en El
 * Vigía, con el selector de ciudades venezolanas arriba. Con la mudanza dejan
 * de serlo, y lo que estas pruebas fijan es justo lo que se rompería sin
 * darse cuenta: que el .com le siga preguntando a un comprador de Miami en
 * qué ciudad de Venezuela retira, o que mil fichas indexadas contesten 404.
 */
const leer = (ruta: string) => readFileSync(ruta, "utf8");

describe("el mercado de Venezuela", () => {
  it("existe, con su dominio, y NO es el principal", () => {
    const ve = mercadoPorCodigo("VE");
    expect(ve.codigo).toBe("VE");
    expect(ve.dominio).toBe("mercatren.com.ve");
    expect(esMercadoPrincipal(ve)).toBe(false);
    /* Y mercatren.com sigue siendo el principal: la mudanza no cambia
       quién contesta a un host desconocido. */
    expect(mercadoPorHost("mercatren.com").codigo).toBe("US");
    expect(mercadoPorHost("localhost:3000").codigo).toBe("US");
  });

  it("lo abre su dominio, con www, con puerto y por sus alias de prueba", () => {
    for (const host of [
      "mercatren.com.ve",
      "www.mercatren.com.ve",
      "MERCATREN.COM.VE:443",
      "ve.mercatren.sitios.dev",
    ]) {
      expect(mercadoPorHost(host).codigo, host).toBe("VE");
    }
  });

  it("es el ÚNICO donde la mercancía se retira en una ciudad", () => {
    /* Es lo que enciende el selector de ciudad, el filtro de zona y la
       ciudad de depósito. En los demás países todo se despacha. */
    const conRetiro = MERCADOS.filter(seRetiraEnCiudad).map((m) => m.codigo);
    expect(conRetiro).toEqual(["VE"]);
  });
});

describe("el selector de ciudad y la zona guardada", () => {
  it("el encabezado lo dibuja donde HAY algo que retirar, no por «es el principal»", () => {
    const encabezado = leer("src/components/layout/encabezado.tsx");
    /* La regla vieja preguntaba si era el principal: con Venezuela fuera,
       eso le pedía la ciudad al comprador de Estados Unidos. La nueva no
       nombra ningún país — y por eso se ajusta sola el día de la mudanza:
       el .com se queda sin cobertura y el selector desaparece de ahí sin
       publicar nada, mientras que hasta ese día el comprador venezolano
       sigue filtrando por su ciudad como siempre. */
    expect(encabezado).toContain("cobertura.length > 0");
    expect(encabezado).not.toContain("esMercadoPrincipal(mercado)");
  });

  it("fuera de Venezuela la cookie de ciudad NO se lee, aunque exista", () => {
    /* Quien venía usando mercatren.com desde El Vigía tiene la cookie
       puesta: sin este corte, en el .com le filtraríamos el catálogo de
       Estados Unidos por una ciudad venezolana. Se corta en la ÚNICA
       puerta a ese dato, no en cada pantalla. */
    const zona = leer("src/lib/entrega/zona-cliente.ts");
    const cuerpo = zona.slice(
      zona.indexOf("export async function zonaDelCliente"),
    );
    expect(cuerpo).toContain("if (!seRetiraEnCiudad(mercado)) return null;");
    const corte = cuerpo.indexOf("seRetiraEnCiudad");
    const lee = cuerpo.indexOf("cookies()");
    expect(corte).toBeLessThan(lee);
  });
});

describe("las mil fichas que ya estaban indexadas", () => {
  it("una dirección que se mudó devuelve el dominio nuevo, con su idioma", () => {
    const us = mercadoPorCodigo("US");
    const ve = mercadoPorCodigo("VE");
    expect(seMudoA(us, ve, "es", "/producto/electrodo-3-32")).toBe(
      "https://mercatren.com.ve/es/producto/electrodo-3-32",
    );
    expect(seMudoA(us, ve, "en", "/tienda/bley-ferreteria")).toBe(
      "https://mercatren.com.ve/en/tienda/bley-ferreteria",
    );
  });

  it("lo que NO se mudó no se redirige: eso sí es un 404 de verdad", () => {
    const us = mercadoPorCodigo("US");
    expect(seMudoA(us, null, "es", "/producto/no-existe")).toBeNull();
    /* Y nunca a sí mismo: sería un bucle de redirecciones. */
    expect(seMudoA(us, us, "es", "/producto/x")).toBeNull();
  });

  it("el 301 se decide en generateMetadata, ANTES del primer byte", () => {
    /**
     * Estaba en el cuerpo de la página y ahí NO sirve: para cuando la página
     * corre, el renderizado ya empezó y la redirección sale DENTRO del HTML
     * con un 200 — medido en la compilación de producción. Google lee ese 200
     * como «sigue aquí» y no traspasa nada. `generateMetadata` corre antes del
     * primer byte, así que es el único sitio donde se convierte en 308.
     */
    for (const ruta of [
      "src/app/[locale]/(tienda)/producto/[slug]/page.tsx",
      "src/app/[locale]/(tienda)/tienda/[slug]/page.tsx",
    ]) {
      const fuente = leer(ruta);
      const meta = fuente.indexOf("export async function generateMetadata");
      const pagina = fuente.indexOf("\nexport default async function", meta);
      const dentroDeMeta = fuente.slice(meta, pagina > 0 ? pagina : undefined);
      expect(dentroDeMeta, ruta).toContain("permanentRedirect(destino)");
    }
  });

  it("es 301 y no 307: un 307 no traspasa el posicionamiento", () => {
    /* `permanentRedirect` de Next responde 308 (permanente), que es lo que
       Google trata como mudanza definitiva. `redirect` a secas es 307 y le
       dice al buscador «esto es temporal, quédate con la vieja». */
    for (const ruta of [
      "src/app/[locale]/(tienda)/producto/[slug]/page.tsx",
      "src/app/[locale]/(tienda)/tienda/[slug]/page.tsx",
    ]) {
      expect(leer(ruta), ruta).toContain("permanentRedirect");
    }
  });
});

describe("el SQL de la mudanza", () => {
  const sql = leer("drizzle/mudanzas/2026-09-08-venezuela-a-su-dominio.sql");

  it("mueve por pais_origen, nunca por una lista de slugs a mano", () => {
    /* Una lista escrita a mano se queda vieja el día que entre el séptimo
       comercio venezolano, y ese se quedaría publicado en el .com. */
    expect(sql).toContain("UPDATE tiendas");
    expect(sql).toContain("UPPER(TRIM(COALESCE(pais_origen,''))) = 'VE'");
    expect(sql).not.toMatch(/slug\s+IN\s*\(/i);
  });

  it("se lleva los pedidos ya hechos, o el panel los escondería", () => {
    expect(sql).toContain("UPDATE pedidos");
    expect(sql).toContain("items_pedido");
  });

  it("trae la marcha atrás escrita", () => {
    expect(sql).toContain("SET mercado = 'US'");
  });

  it("no borra nada", () => {
    expect(sql).not.toMatch(/\bDELETE\b|\bDROP\b|\bTRUNCATE\b/i);
  });
});
