import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  MERCADO_DE_LA_MUDANZA,
  PRODUCTOS_MUDADOS,
  TIENDAS_MUDADAS,
} from "@/lib/mercado/mudados";

import {
  esMercadoPrincipal,
  MERCADOS,
  mercadoPorCodigo,
  mercadoPorHost,
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
  const middleware = leer("src/middleware.ts");
  const mudados = leer("src/lib/mercado/mudados.ts");

  it("EL 308 LO DA EL MIDDLEWARE, no la página", () => {
    expect(middleware).toContain("redireccionDeMudanza");
    expect(middleware).toContain("NextResponse.redirect(");
    expect(middleware).toContain("308");
    for (const pagina of [
      "src/app/[locale]/(tienda)/producto/[slug]/page.tsx",
      "src/app/[locale]/(tienda)/tienda/[slug]/page.tsx",
    ]) {
      expect(leer(pagina), pagina).not.toContain("permanentRedirect");
    }
  });

  it("EL MIDDLEWARE NO PIDE NADA POR RED", () => {
    /**
     * ══ ESTO ES LO QUE COSTÓ MIL FICHAS EN SILENCIO (7 sep 2026) ══
     *
     * La primera versión le pedía la lista a `/datos/mudanza` con un tope
     * de un segundo. Con el dato ya movido y esa ruta contestando bien,
     * SEIS intentos seguidos contra producción dieron 200 en vez de 308:
     * el middleware corre en el borde y esa consulta de más de mil filas
     * no llegaba nunca — y el `catch` lo tapaba.
     *
     * Un `fetch` dentro del middleware es una dependencia de red en el
     * camino de TODAS las páginas. Si vuelve a aparecer, vuelve el fallo.
     */
    expect(middleware).not.toContain("fetch(");
    expect(middleware).not.toContain("AbortSignal");
    expect(middleware).not.toContain("listaEnMemoria");
    /* Y la función es síncrona: no hay nada que esperar. */
    expect(middleware).toContain(
      "function redireccionDeMudanza(request: NextRequest): NextResponse | null",
    );
  });

  it("se decide ANTES que todo lo demás del middleware", () => {
    const mudanza = middleware.indexOf("redireccionDeMudanza(request)");
    const reloj = middleware.indexOf('pathname === "/__scheduled"');
    expect(mudanza).toBeGreaterThan(-1);
    expect(mudanza).toBeLessThan(reloj);
  });

  it("la lista trae las fichas de verdad que estaban indexadas", () => {
    /**
     * Se mide el SET, no el texto del archivo. La primera versión contaba
     * comas y se puso roja en el hook de push: prettier había reformateado
     * el archivo y las comas cambiaron de sitio. Una prueba que depende del
     * formato no protege nada — protege a un formato.
     */
    expect(PRODUCTOS_MUDADOS.size).toBeGreaterThan(900);
    expect(TIENDAS_MUDADAS.size).toBeGreaterThanOrEqual(6);
    expect(TIENDAS_MUDADAS.has("bley-ferreteria")).toBe(true);
    expect(MERCADO_DE_LA_MUDANZA).toBe("VE");
  });

  it("quien ya está en el dominio nuevo no se redirige a sí mismo", () => {
    expect(middleware).toContain("MERCADO_DE_LA_MUDANZA");
    const cuerpo = middleware.slice(
      middleware.indexOf("function redireccionDeMudanza"),
    );
    expect(cuerpo).toContain("mercadoPorHost");
  });

  it("solo redirige fichas de producto y de tienda, no el sitio entero", () => {
    expect(middleware).toContain("(producto|tienda)");
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
