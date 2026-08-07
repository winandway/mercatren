import { describe, expect, it } from "vitest";

import { formatearNumero, SERIES } from "@/lib/facturas/numeracion";

/**
 * LA NUMERACIÓN DE LAS FACTURAS.
 *
 * Un correlativo que salta o que repite es lo primero que mira una revisión, y
 * es de los errores que no se ven hasta que alguien pide los papeles. Por eso
 * estas pruebas son más tercas de lo que parece necesario.
 *
 * Lo que NO se puede probar aquí es la atomicidad del `UPDATE ... RETURNING`,
 * porque hace falta la base. Eso se comprueba contra la base local, y el
 * diseño está explicado en `numeracion.ts`: lo que importa es que el número no
 * salga de `COUNT(*)`, que es como se numeran los pedidos y que bajo dos
 * confirmaciones simultáneas entrega el mismo número dos veces.
 */
describe("el número que se ve en el documento", () => {
  it("lleva su prefijo y seis dígitos", () => {
    expect(formatearNumero("MT-F-", 1)).toBe("MT-F-000001");
    expect(formatearNumero("MT-OC-", 1)).toBe("MT-OC-000001");
  });

  it("rellena con ceros para que el séptimo no parezca un borrador", () => {
    expect(formatearNumero("MT-F-", 7)).toBe("MT-F-000007");
    expect(formatearNumero("MT-F-", 42)).toBe("MT-F-000042");
    expect(formatearNumero("MT-F-", 999)).toBe("MT-F-000999");
  });

  it("los números ordenan bien como TEXTO, que es como los ordena la base", () => {
    /* Sin los ceros delante, "MT-F-10" iría antes que "MT-F-9" en cualquier
       listado ordenado por número, y el histórico se vería revuelto. */
    const numeros = [1, 2, 9, 10, 11, 100, 101].map((n) =>
      formatearNumero("MT-F-", n),
    );
    expect([...numeros].sort()).toEqual(numeros);
  });

  it("pasado el millón sigue creciendo, no se corta", () => {
    expect(formatearNumero("MT-F-", 1_000_000)).toBe("MT-F-1000000");
    expect(formatearNumero("MT-F-", 12_345_678)).toBe("MT-F-12345678");
  });

  it("dos correlativos distintos nunca dan el mismo número", () => {
    const vistos = new Set<string>();
    for (let n = 1; n <= 2_000; n++) vistos.add(formatearNumero("MT-F-", n));
    expect(vistos.size).toBe(2_000);
  });
});

describe("las series", () => {
  it("la factura de venta y la orden de compra no comparten prefijo", () => {
    /* Si compartieran, existiría un MT-000001 que es dos documentos distintos:
       la venta a un comprador y la compra a un comercio. */
    expect(SERIES.facturaVenta.prefijo).not.toBe(SERIES.ordenCompra.prefijo);
  });

  it("cada serie lleva su propio contador", () => {
    expect(SERIES.facturaVenta.id).not.toBe(SERIES.ordenCompra.id);
  });

  it("los prefijos terminan en guion, para que el número se lea aparte", () => {
    for (const serie of Object.values(SERIES)) {
      expect(serie.prefijo.endsWith("-")).toBe(true);
    }
  });
});
