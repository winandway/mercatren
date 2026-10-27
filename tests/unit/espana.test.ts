import { describe, expect, it } from "vitest";

import { formatearPrecio } from "@/lib/dinero";
import {
  esCodigoPostalDe,
  faltantesDeEntrega,
  listaDeEstados,
  PROVINCIAS_ES,
} from "@/lib/destino/direccion";
import { metodosDelDestino } from "@/lib/destino/metodos";
import { destinoDeLaTienda } from "@/lib/destino/reglas";
import { cabeceraDeCookie, decidirPais } from "@/lib/mercado/elegir-pais";
import {
  controlDelCif,
  documentoDelMercado,
  letraDelDni,
} from "@/lib/mercado/identificacion";
import {
  COOKIE_DEL_PAIS,
  enlaceParaElegirPais,
  marcaDelMercado,
  mercadoDeLaVisita,
  mercadoPorCodigo,
  mercadoPorHost,
} from "@/lib/mercado/mercados";
import { monedaDelMercado } from "@/lib/mercado/moneda";

/**
 * ESPAÑA, QUE VIVE DENTRO DE mercatren.com (27 oct 2026).
 *
 * España no tiene dominio todavía: se elige con su bandera y una cookie
 * dice que la persona está en España. Lo que estas pruebas trancan:
 *
 * - que la cookie solo mande DENTRO de mercatren.com, y solo para un país
 *   sin dominio (con `CL` en la cookie no se ve Chile en el .com);
 * - que nadie caiga en España por el host (ni por ningún dominio);
 * - que la bandera de Estados Unidos QUITE la cookie (si no, quien estaba
 *   en España vuelve a España al querer salir);
 * - el euro, el NIF, las provincias y el código postal.
 */
const ES = mercadoPorCodigo("ES");

describe("el mercado de la visita", () => {
  it("España existe y vive dentro del principal", () => {
    expect(ES.codigo).toBe("ES");
    expect(ES.enElPrincipal).toBe(true);
  });

  it("ningún host abre España por sí solo", () => {
    expect(mercadoPorHost("mercatren.com").codigo).toBe("US");
    expect(mercadoPorHost("www.mercatren.com").codigo).toBe("US");
    expect(mercadoPorHost("localhost:3000").codigo).toBe("US");
  });

  it("en mercatren.com, la cookie de España enseña España", () => {
    expect(mercadoDeLaVisita("mercatren.com", "ES").codigo).toBe("ES");
    expect(mercadoDeLaVisita("mercatren.com", " es ").codigo).toBe("ES");
  });

  it("sin cookie, o con una cookie rara, mercatren.com sigue siendo EE. UU.", () => {
    expect(mercadoDeLaVisita("mercatren.com", undefined).codigo).toBe("US");
    expect(mercadoDeLaVisita("mercatren.com", "XX").codigo).toBe("US");
    /* Un país con dominio propio NO se abre en el .com por cookie. */
    expect(mercadoDeLaVisita("mercatren.com", "CL").codigo).toBe("US");
    expect(mercadoDeLaVisita("mercatren.com", "VE").codigo).toBe("US");
  });

  it("en el dominio de otro país, la cookie no cambia nada", () => {
    expect(mercadoDeLaVisita("mercatren.cl", "ES").codigo).toBe("CL");
    expect(mercadoDeLaVisita("mercatren.com.ve", "ES").codigo).toBe("VE");
  });

  it("la marca de España no es un dominio que no existe", () => {
    expect(marcaDelMercado(ES)).toBe("Mercatren España");
  });

  it("España vende en euros", () => {
    expect(monedaDelMercado(ES)).toBe("EUR");
  });
});

describe("las banderas del selector", () => {
  const US = mercadoPorCodigo("US");
  const CL = mercadoPorCodigo("CL");

  it("desde mercatren.com, toda bandera pasa por /datos/pais", () => {
    expect(enlaceParaElegirPais(ES, US, "es")).toBe(
      "/datos/pais?a=ES&idioma=es",
    );
    expect(enlaceParaElegirPais(US, ES, "en")).toBe(
      "/datos/pais?a=US&idioma=en",
    );
    expect(enlaceParaElegirPais(CL, ES, "es")).toBe(
      "/datos/pais?a=CL&idioma=es",
    );
  });

  it("desde otro dominio, España va al /datos/pais de mercatren.com", () => {
    expect(enlaceParaElegirPais(ES, CL, "es")).toBe(
      "https://mercatren.com/datos/pais?a=ES&idioma=es",
    );
    expect(enlaceParaElegirPais(mercadoPorCodigo("CO"), CL, "en")).toBe(
      "https://mercatren.com.co/en",
    );
  });
});

describe("/datos/pais", () => {
  it("elegir España pone la cookie y lleva a la portada", () => {
    const d = decidirPais("ES", "es", "mercatren.com");
    expect(d.cookie).toBe("poner");
    expect(d.destino).toBe("/es");
    expect(cabeceraDeCookie(d, true)).toBe(
      `${COOKIE_DEL_PAIS}=ES; Max-Age=31536000; Path=/; SameSite=Lax; Secure`,
    );
  });

  it("elegir Estados Unidos QUITA la cookie", () => {
    const d = decidirPais("US", "en", "mercatren.com");
    expect(d.cookie).toBe("quitar");
    expect(d.destino).toBe("/en");
    expect(cabeceraDeCookie(d, false)).toBe(
      `${COOKIE_DEL_PAIS}=; Max-Age=0; Path=/; SameSite=Lax`,
    );
  });

  it("elegir Chile quita la cookie y se va a su dominio", () => {
    const d = decidirPais("CL", "es", "mercatren.com");
    expect(d.cookie).toBe("quitar");
    expect(d.destino).toBe("https://mercatren.cl/es");
  });

  it("si llega por otro dominio, se reenvía al de mercatren.com", () => {
    const d = decidirPais("ES", "es", "mercatren.cl");
    expect(d.cookie).toBe("nada");
    expect(d.destino).toBe("https://mercatren.com/datos/pais?a=ES&idioma=es");
  });

  it("un código o un idioma raro no abre nada raro", () => {
    const d = decidirPais("<script>", "fr", "mercatren.com");
    expect(d.mercado.codigo).toBe("US");
    expect(d.destino).toBe("/es");
  });
});

describe("el NIF de los comercios de España", () => {
  const nif = documentoDelMercado(ES);

  it("se llama NIF", () => {
    expect(nif.nombre).toBe("NIF");
  });

  it("el ejemplo del formulario es válido", () => {
    expect(nif.revisar(nif.ejemplo)).toBeNull();
  });

  it("acepta un DNI, un NIE y un CIF con su control", () => {
    expect(letraDelDni("12345678")).toBe("Z");
    expect(nif.revisar("12345678Z")).toBeNull();
    expect(nif.revisar("12.345.678-z")).toBeNull();
    /* NIE: la X vale 0 → 01234567 → letra L. */
    expect(nif.revisar(`X1234567${letraDelDni("01234567")}`)).toBeNull();
    expect(controlDelCif("1234567").digito).toBe("4");
    expect(nif.revisar("B12345674")).toBeNull();
  });

  it("rechaza el control equivocado", () => {
    expect(nif.revisar("12345678A")).toBe("nifDigito");
    expect(nif.revisar("B12345675")).toBe("nifDigito");
  });

  it("rechaza lo que no tiene forma de NIF, y el vacío", () => {
    expect(nif.revisar("123")).toBe("nifFormato");
    expect(nif.revisar("")).toBe("faltaNif");
  });
});

describe("la entrega en España", () => {
  it("una tienda de España entrega en España, no en Venezuela", () => {
    expect(destinoDeLaTienda("ES")).toBe("ES");
  });

  it("solo con tarjeta", () => {
    expect(metodosDelDestino("ES")).toEqual(["stripe"]);
  });

  it("las 52 provincias, cada una con el número de su código postal", () => {
    expect(PROVINCIAS_ES).toHaveLength(52);
    expect(listaDeEstados("ES")).toBe(PROVINCIAS_ES);
    expect(PROVINCIAS_ES.find((p) => p.codigo === "28")?.nombre).toBe("Madrid");
    expect(new Set(PROVINCIAS_ES.map((p) => p.codigo)).size).toBe(52);
  });

  it("el código postal es obligatorio y de 5 dígitos con provincia real", () => {
    expect(faltantesDeEntrega("ES", { nombre: "x" })).toContain("codigoPostal");
    expect(esCodigoPostalDe("ES", "28001")).toBe(true);
    expect(esCodigoPostalDe("ES", "08001")).toBe(true);
    expect(esCodigoPostalDe("ES", "52001")).toBe(true);
    expect(esCodigoPostalDe("ES", "53001")).toBe(false);
    expect(esCodigoPostalDe("ES", "00123")).toBe(false);
    expect(esCodigoPostalDe("ES", "2800")).toBe(false);
  });

  it("los euros se escriben como en España", () => {
    expect(formatearPrecio(1250, "es", "EUR")).toBe("12,50 €");
    expect(formatearPrecio(1250, "en", "EUR")).toBe("€12.50");
    /* Y el dólar sigue como siempre. */
    expect(formatearPrecio(1250, "es", "USD")).toBe(
      new Intl.NumberFormat("es-US", {
        style: "currency",
        currency: "USD",
      }).format(12.5),
    );
  });
});

describe("España todavía no cobra", () => {
  it("el botón de pagar está cerrado para el público, abierto para el equipo", async () => {
    const { ESPANA_SIN_COBRO, ventaPausada } =
      await import("@/lib/ventas/pausa");
    expect(ventaPausada("ES")).toBe(ESPANA_SIN_COBRO);
    expect(ventaPausada(" es ")).toBe(ESPANA_SIN_COBRO);
    expect(ventaPausada("ES", { esEquipoInterno: true })).toBe(false);
    /* Venezuela no se toca nunca. */
    expect(ventaPausada("VE")).toBe(false);
  });
});
