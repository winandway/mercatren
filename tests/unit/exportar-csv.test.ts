import { describe, expect, it } from "vitest";

import {
  aCsv,
  celda,
  dinero,
  fechaIso,
  nombreDeArchivo,
} from "@/lib/exportar/csv";

describe("una celda", () => {
  it("el texto normal pasa tal cual", () => {
    expect(celda("Ferremateriales Bley")).toBe("Ferremateriales Bley");
  });

  it("lo vacío es vacío, no «null»", () => {
    // Una columna con la palabra «null» en cada hueco es ilegible.
    expect(celda(null)).toBe("");
    expect(celda(undefined)).toBe("");
  });

  it("el cero es un cero, no un vacío", () => {
    expect(celda(0)).toBe("0");
  });

  it("una coma dentro del texto se entrecomilla", () => {
    expect(celda("Bley, C.A")).toBe('"Bley, C.A"');
  });

  it("las comillas de dentro se duplican", () => {
    expect(celda('El "grande"')).toBe('"El ""grande"""');
  });

  it("un salto de línea no parte la fila", () => {
    expect(celda("linea1\nlinea2")).toBe('"linea1\nlinea2"');
  });
});

/**
 * LA INYECCIÓN DE FÓRMULAS ES REAL Y AQUÍ HAY DATOS DE FUERA.
 *
 * El nombre del cliente y el concepto del cobro los escriben personas que no
 * son de la casa. Si empiezan por «=», la hoja de cálculo los ejecuta al abrir
 * el archivo, en la computadora del contador.
 */
describe("lo que Excel tomaría por fórmula", () => {
  it("se neutraliza sin perder el dato", () => {
    expect(celda("=1+1")).toBe("'=1+1");
    expect(celda("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  it("también el signo más y el menos", () => {
    expect(celda("+1")).toBe("'+1");
    expect(celda("-cosa")).toBe("'-cosa");
  });

  it("un número negativo de verdad no se toca", () => {
    /* Marcarlo como texto dejaría una columna de importes que la hoja NO suma:
       los retiros y los reembolsos son negativos, y el total saldría mal sin
       un solo aviso. */
    expect(celda(-500)).toBe("-500");
    expect(celda(dinero(-2550))).toBe("-25.50");
  });

  it("un nombre que empieza con letra no se marca", () => {
    expect(celda("María Uzcátegui")).toBe("María Uzcátegui");
  });
});

describe("el dinero", () => {
  it("sale en dólares con dos decimales", () => {
    // Una columna en centavos se suma mal a la primera.
    expect(dinero(10310)).toBe("103.10");
    expect(dinero(3091)).toBe("30.91");
  });

  it("los centavos redondos llevan sus dos ceros", () => {
    expect(dinero(10000)).toBe("100.00");
  });

  it("menos de un dólar lleva su cero delante", () => {
    expect(dinero(5)).toBe("0.05");
    expect(dinero(0)).toBe("0.00");
  });

  it("los negativos conservan el signo", () => {
    expect(dinero(-2550)).toBe("-25.50");
  });

  it("sin separador de miles: es lo que la hoja entiende como número", () => {
    expect(dinero(33726122)).toBe("337261.22");
  });
});

describe("la fecha", () => {
  it("sale en ISO corto, que se ordena bien en cualquier país", () => {
    expect(fechaIso(new Date("2026-08-11T15:30:00Z"))).toBe("2026-08-11");
  });

  it("lo que no tiene fecha queda vacío, no en 1970", () => {
    expect(fechaIso(null)).toBe("");
    expect(fechaIso(undefined)).toBe("");
  });

  it("una fecha inválida no ensucia la columna", () => {
    expect(fechaIso(new Date("no es una fecha"))).toBe("");
  });
});

describe("el archivo entero", () => {
  const salida = aCsv(
    ["Pedido", "Cliente", "Monto"],
    [["MT-000002", "Bley, C.A", dinero(3091)]],
  );

  it("empieza con el BOM para que Excel no rompa los acentos", () => {
    expect(salida.charCodeAt(0)).toBe(0xfeff);
  });

  it("separa las filas con CRLF", () => {
    expect(salida).toContain("\r\n");
  });

  it("lleva la cabecera y la fila", () => {
    expect(salida).toContain("Pedido,Cliente,Monto");
    expect(salida).toContain('MT-000002,"Bley, C.A",30.91');
  });

  it("una tabla sin filas sigue trayendo su cabecera", () => {
    // Descargar un archivo en blanco parece un error del sistema.
    expect(aCsv(["Pedido"], [])).toContain("Pedido");
  });
});

describe("el nombre del archivo", () => {
  it("lleva la fecha, para no acabar con «ventas (1).csv»", () => {
    expect(nombreDeArchivo("ventas", new Date("2026-08-11T10:00:00Z"))).toBe(
      "mercatren-ventas-2026-08-11.csv",
    );
  });
});
