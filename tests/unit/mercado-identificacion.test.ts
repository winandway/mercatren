import { describe, expect, it } from "vitest";

import {
  digitoVerificadorNit,
  digitoVerificadorRut,
  documentoDelMercado,
  formatearNit,
  formatearRut,
  tieneDocumentoPropio,
} from "@/lib/mercado/identificacion";
import { mercadoPorCodigo } from "@/lib/mercado/mercados";

const CHILE = mercadoPorCodigo("CL");
const PRINCIPAL = mercadoPorCodigo("US");

const COLOMBIA = mercadoPorCodigo("CO");

const rut = documentoDelMercado(CHILE);
const nit = documentoDelMercado(COLOMBIA);

describe("el dígito verificador del RUT", () => {
  it("sale bien en los tres casos del módulo 11", () => {
    /* Los tres finales posibles del algoritmo, que son donde se equivoca una
       implementación escrita de memoria: el resto normal, el 11 que se
       convierte en «0» y el 10 que se convierte en «K». */
    expect(digitoVerificadorRut("12345678")).toBe("5");
    expect(digitoVerificadorRut("76000000")).toBe("0");
    expect(digitoVerificadorRut("76000006")).toBe("K");
  });

  it("la K es un dígito de verdad, no una letra de relleno", () => {
    /* Es el once, que no cabe en una cifra. Un validador que solo acepte
       números rechaza a una de cada once empresas chilenas — y ese es
       justamente el fallo que trae media librería de internet. */
    const conK = "76000006K";
    expect(rut.revisar(conK)).toBeNull();
  });
});

describe("el RUT en el formulario de Chile", () => {
  it("se acepta escrito como lo escribe la gente", () => {
    /* Con puntos y guion, sin puntos, o pegado: las tres formas circulan en
       Chile. Rechazar un dato bueno es el error más caro — el comercio ya
       decidió vender con nosotros y no puede ni darse de alta. */
    expect(rut.revisar("12.345.678-5")).toBeNull();
    expect(rut.revisar("12345678-5")).toBeNull();
    expect(rut.revisar("123456785")).toBeNull();
    expect(rut.revisar(" 12.345.678-5 ")).toBeNull();
  });

  it("la minúscula de la k también pasa", () => {
    expect(rut.revisar("76.000.006-k")).toBeNull();
  });

  it("un dígito verificador que no cuadra se rechaza", () => {
    /* Es lo que atrapa el dedazo en el momento: un número cambiado o dos
       traspuestos. Sin esto se descubre semanas después, al facturarle. */
    expect(rut.revisar("12.345.678-9")).toBe("rutDigito");
    expect(rut.revisar("12.345.687-5")).toBe("rutDigito");
  });

  it("lo que no tiene forma de RUT se rechaza por forma, no por dígito", () => {
    /* El aviso tiene que decir qué está mal. «El dígito no cuadra» sobre algo
       que ni siquiera es un RUT manda a la persona a revisar el último
       carácter cuando el problema es todo lo demás. */
    expect(rut.revisar("J-12345678-9")).toBe("rutFormato");
    expect(rut.revisar("ABC")).toBe("rutFormato");
    expect(rut.revisar("123")).toBe("rutFormato");
  });

  it("vacío se avisa como que falta, no como que está mal", () => {
    expect(rut.revisar("")).toBe("faltaRut");
    expect(rut.revisar("   ")).toBe("faltaRut");
  });

  it("se guarda pelado y se enseña con puntos", () => {
    /* Lo guardado es lo que alguien copia y pega en un banco o en una
       factura, así que va sin adornos; lo que se ve en pantalla va como se
       lee en Chile. */
    expect(rut.normalizar("12.345.678-5")).toBe("123456785");
    expect(formatearRut("123456785")).toBe("12.345.678-5");
    expect(formatearRut("76000006K")).toBe("76.000.006-K");
  });
});

describe("los demás países no se tocan", () => {
  it("el mercado principal sigue con la regla genérica", () => {
    /* mercatren.com no cambia ni un carácter: sigue aceptando RIF, EIN o lo
       que corresponda, como antes de que existiera Chile. */
    expect(tieneDocumentoPropio(PRINCIPAL)).toBe(false);
    const generico = documentoDelMercado(PRINCIPAL);
    expect(generico.revisar("J-12345678-9")).toBeNull();
    expect(generico.revisar("12-3456789")).toBeNull();
  });

  it("y NO se le aplica la regla chilena", () => {
    /* Un RIF venezolano no pasa el módulo 11, así que si algún día se le
       colara la regla de Chile al mercado principal, se caerían todas las
       altas de Venezuela de golpe. */
    const generico = documentoDelMercado(PRINCIPAL);
    expect(generico.revisar("J-29486152-7")).toBeNull();
  });

  it("Chile sí tiene regla propia", () => {
    expect(tieneDocumentoPropio(CHILE)).toBe(true);
    expect(rut.nombre).toBe("RUT");
  });

  it("el ejemplo que se enseña es válido y obviamente ficticio", () => {
    /* Un ejemplo con el dígito mal enseña a escribirlo mal. Y no puede ser el
       RUT de una empresa real: regla de placeholders del proyecto. */
    expect(rut.revisar(rut.ejemplo)).toBeNull();
  });
});

describe("el NIT colombiano", () => {
  /**
   * Los pesos del algoritmo de la DIAN copiados de memoria son EXACTAMENTE el
   * error que pasa las pruebas que uno se inventa y falla con el primer
   * comercio real. Por eso se comprueban contra NIT públicos de empresas
   * grandes de Colombia, que cualquiera puede verificar.
   */
  it("da el dígito correcto de cinco empresas colombianas reales", () => {
    expect(digitoVerificadorNit("890903938")).toBe("8"); // Bancolombia
    expect(digitoVerificadorNit("899999068")).toBe("1"); // Ecopetrol
    expect(digitoVerificadorNit("860002964")).toBe("4"); // Banco de Bogotá
    expect(digitoVerificadorNit("800197268")).toBe("4"); // Grupo Éxito
    expect(digitoVerificadorNit("890900608")).toBe("9"); // Grupo Argos
  });

  it("acepta el NIT con puntos, sin puntos y con guion", () => {
    expect(nit.revisar("890.903.938-8")).toBeNull();
    expect(nit.revisar("890903938-8")).toBeNull();
    expect(nit.revisar("8909039388")).toBeNull();
  });

  it("un verificador que no cuadra se rechaza", () => {
    expect(nit.revisar("890.903.938-1")).toBe("nitDigito");
  });

  it("lo que no tiene forma de NIT se rechaza por forma", () => {
    /* El NIT es solo dígitos: una letra delante es un RIF venezolano, y el
       aviso tiene que mandar a corregir la forma, no el último carácter. */
    expect(nit.revisar("J-12345678-9")).toBe("nitFormato");
    expect(nit.revisar("123")).toBe("nitFormato");
  });

  it("vacío se avisa como que falta", () => {
    expect(nit.revisar("")).toBe("faltaNit");
  });

  it("se guarda pelado y se enseña con puntos", () => {
    expect(nit.normalizar("890.903.938-8")).toBe("8909039388");
    expect(formatearNit("8909039388")).toBe("890.903.938-8");
  });

  it("el ejemplo que se enseña es válido y ficticio", () => {
    expect(nit.revisar(nit.ejemplo)).toBeNull();
  });

  it("Colombia y Chile NO comparten regla", () => {
    /* Los dos acaban en un módulo 11 pero con pesos distintos. Si se cruzaran,
       cada país rechazaría los documentos buenos del otro. */
    expect(nit.nombre).toBe("NIT");
    expect(rut.nombre).toBe("RUT");
    expect(nit.revisar("12.345.678-5")).not.toBeNull();
    expect(rut.revisar("890.903.938-8")).not.toBeNull();
  });
});
