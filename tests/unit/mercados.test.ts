import { describe, expect, it } from "vitest";

import {
  esMercadoPrincipal,
  marcaDelMercado,
  MERCADO_PRINCIPAL,
  MERCADOS,
  mercadoPorCodigo,
  mercadoPorHost,
} from "@/lib/mercado/mercados";

describe("el dominio decide el mercado", () => {
  it("mercatren.com es el mercado principal", () => {
    expect(mercadoPorHost("mercatren.com").codigo).toBe("US");
  });

  it("mercatren.cl es el mercado de Chile", () => {
    expect(mercadoPorHost("mercatren.cl").codigo).toBe("CL");
    expect(mercadoPorHost("mercatren.cl").nombre).toBe("Chile");
  });

  it("el www y el puerto no cambian el mercado", () => {
    /* El mismo dominio llega como www.mercatren.cl desde un marcador viejo y
       como localhost:3000 en desarrollo. */
    expect(mercadoPorHost("www.mercatren.cl").codigo).toBe("CL");
    expect(mercadoPorHost("MERCATREN.CL:443").codigo).toBe("CL");
  });

  it("un host desconocido cae en el principal, no en un error", () => {
    /* localhost, sitios.dev y cualquier dominio que alguien apunte por su
       cuenta: el desarrollo local y las previsualizaciones no se pueden
       romper por proteger un catálogo que no esconde nada. */
    expect(mercadoPorHost("localhost:3000").codigo).toBe("US");
    expect(mercadoPorHost("mercatren.sitios.dev").codigo).toBe("US");
    expect(mercadoPorHost("otrodominio.com").codigo).toBe("US");
    expect(mercadoPorHost(null).codigo).toBe("US");
    expect(mercadoPorHost("").codigo).toBe("US");
  });
});

describe("el registro de mercados", () => {
  it("hay UN solo mercado principal", () => {
    /* Dos principales harían que el host desconocido cayera en cualquiera de
       los dos según el orden de la lista. */
    expect(MERCADOS.filter((m) => m.principal)).toHaveLength(1);
    expect(esMercadoPrincipal(MERCADO_PRINCIPAL)).toBe(true);
    expect(esMercadoPrincipal(mercadoPorCodigo("CL"))).toBe(false);
  });

  it("ningún dominio se repite ni trae www", () => {
    const dominios = MERCADOS.map((m) => m.dominio);
    expect(new Set(dominios).size).toBe(dominios.length);
    for (const d of dominios) {
      expect(d.startsWith("www.")).toBe(false);
      expect(d).toBe(d.toLowerCase());
    }
  });

  it("los códigos son de dos letras y en mayúsculas, como los guarda la base", () => {
    for (const m of MERCADOS) {
      expect(m.codigo).toMatch(/^[A-Z]{2}$/);
    }
  });

  it("un código que no existe cae en el principal", () => {
    expect(mercadoPorCodigo("XX").codigo).toBe("US");
    expect(mercadoPorCodigo(null).codigo).toBe("US");
    expect(mercadoPorCodigo(" cl ").codigo).toBe("CL");
  });

  it("la marca de un país es su dominio: «Mercatren.cl»", () => {
    /* Lo pidió el dueño al ver la miniatura de WhatsApp de mercatren.cl
       diciendo «Compra en Estados Unidos»: el enlace chileno enseña la casa
       chilena. */
    expect(marcaDelMercado(mercadoPorCodigo("CL"))).toBe("Mercatren.cl");
  });
});
