import { describe, expect, it } from "vitest";

import {
  ajusteCentavos,
  baseDesdePublicado,
  calcularComisionCentavos,
  calcularNetoVendedorCentavos,
  COMISION_TARJETA_PB,
  formatearPrecio,
  precioConAjusteCentavos,
  ahorroPorZelleCentavos,
  precioZelleCentavos,
} from "@/lib/dinero";

describe("formatearPrecio", () => {
  it("muestra los centavos como precio en dolares", () => {
    expect(formatearPrecio(129900)).toBe("$1,299.00");
  });

  it("no pierde el centavo suelto", () => {
    expect(formatearPrecio(1)).toBe("$0.01");
    expect(formatearPrecio(999)).toBe("$9.99");
  });

  it("usa el mismo formato de Estados Unidos en los dos idiomas", () => {
    expect(formatearPrecio(250000, "en")).toBe("$2,500.00");
    expect(formatearPrecio(250000, "es")).toBe("$2,500.00");
  });
});

describe("comision del mercado", () => {
  it("calcula el diez por ciento con 1000 puntos base", () => {
    expect(calcularComisionCentavos(10000, 1000)).toBe(1000);
  });

  it("redondea al centavo mas cercano, sin dejar fracciones", () => {
    // 3.33% de $10.00 = 33.3 centavos -> 33
    expect(calcularComisionCentavos(1000, 333)).toBe(33);
    expect(Number.isInteger(calcularComisionCentavos(9999, 777))).toBe(true);
  });

  it("la comision mas lo del vendedor siempre da el total exacto", () => {
    const casos = [1, 99, 1000, 129900, 7777];
    for (const subtotal of casos) {
      const comision = calcularComisionCentavos(subtotal, 1250);
      const vendedor = calcularNetoVendedorCentavos(subtotal, 1250);
      expect(comision + vendedor).toBe(subtotal);
    }
  });

  it("con comision cero el vendedor recibe todo", () => {
    expect(calcularNetoVendedorCentavos(50000, 0)).toBe(50000);
  });
});

describe("el ajuste por procesamiento en el precio publicado", () => {
  it("publica el precio que deja la base completa tras el procesador y el margen", () => {
    // V = (base + 30) / 0.951 — 2.9% del procesador + 2% de margen.
    expect(precioConAjusteCentavos(1000)).toBe(1084); // $10 → $10.84
    expect(precioConAjusteCentavos(10000)).toBe(10547); // $100 → $105.47
    expect(precioConAjusteCentavos(48)).toBe(83); // $0.48 → $0.83
  });

  it("después del procesador y del margen, al proveedor nunca le falta", () => {
    for (const base of [48, 199, 1000, 4999, 25000, 3313725]) {
      const publicado = precioConAjusteCentavos(base);
      const procesador = Math.round((publicado * 290) / 10_000) + 30;
      const margen = calcularComisionCentavos(publicado, COMISION_TARJETA_PB);
      // Lo que queda tras el procesador y el margen cubre la base, siempre.
      expect(publicado - procesador - margen).toBeGreaterThanOrEqual(base);
      // Y el colchón del redondeo es de centavos, no un sobreprecio.
      expect(publicado - procesador - margen - base).toBeLessThanOrEqual(2);
    }
  });

  it("un precio en cero o negativo no se ajusta", () => {
    expect(precioConAjusteCentavos(0)).toBe(0);
    expect(ajusteCentavos(0)).toBe(0);
  });

  it("el ajuste que se le enseña al comercio cuadra con el publicado", () => {
    expect(ajusteCentavos(1000)).toBe(84);
    expect(precioConAjusteCentavos(1000)).toBe(1000 + ajusteCentavos(1000));
  });
});

/**
 * EL PRECIO NO PUEDE SUBIR SOLO.
 *
 * El 5 ago 2026 un comercio subió un producto a $500 y el precio se fue
 * solo a $515.25, luego a $595. La causa: el formulario no recibía el precio
 * base, caía en el precio ya publicado y el ajuste se aplicaba encima del
 * ajuste en cada guardado.
 *
 * Estas pruebas fijan la propiedad que faltaba: guardar N veces tiene que dar
 * exactamente lo mismo que guardar una.
 */
describe("el ajuste no se acumula", () => {
  it("guardar diez veces deja el mismo precio que guardar una", () => {
    const base = 50_000; // $500
    const primera = precioConAjusteCentavos(base);

    let publicado = primera;
    for (let i = 0; i < 10; i++) {
      // Cada guardado: el formulario enseña la base y el servidor reajusta.
      publicado = precioConAjusteCentavos(baseDesdePublicado(publicado));
    }

    expect(publicado).toBe(primera);
  });

  it("la vuelta atrás es estable en todo el rango de precios", () => {
    for (const base of [1, 50, 99, 100, 999, 1_000, 42_489, 50_000, 123_456]) {
      const publicado = precioConAjusteCentavos(base);
      const otraVez = precioConAjusteCentavos(baseDesdePublicado(publicado));
      expect(otraVez).toBe(publicado);
    }
  });

  it("el publicado cubre el procesador y el margen, y el proveedor cobra completo", () => {
    const base = 50_000;
    const publicado = precioConAjusteCentavos(base);

    // Lo que se lleva Stripe (2.9% + $0.30) y nuestro margen (2%).
    const stripe = Math.round((publicado * 290) / 10_000) + 30;
    const margen = calcularComisionCentavos(publicado, COMISION_TARJETA_PB);

    // Al proveedor le tiene que quedar su precio completo, nunca menos.
    expect(publicado - stripe - margen).toBeGreaterThanOrEqual(base);
  });
});

/**
 * EL PRECIO DE UNA VARIANTE LLEVA EL MISMO AJUSTE QUE EL DEL PADRE.
 *
 * Una talla especial suele costar más, y si su precio se publicara tal cual
 * lo escribe el proveedor, esa talla se vendería sin cubrir el procesador ni
 * el margen: la única que da pérdida, y sin que nadie lo note.
 */
describe("el precio de las variantes", () => {
  it("cada talla cubre el procesador y el margen por separado", () => {
    // La misma camisa: S más barata, XXL más cara.
    for (const base of [1_200, 1_500, 1_800]) {
      const publicado = precioConAjusteCentavos(base);
      const procesador = Math.round((publicado * 290) / 10_000) + 30;
      const margen = calcularComisionCentavos(publicado, COMISION_TARJETA_PB);

      expect(publicado - procesador - margen).toBeGreaterThanOrEqual(base);
    }
  });

  it("guardar las variantes dos veces no infla sus precios", () => {
    const base = 1_800;
    const primera = precioConAjusteCentavos(base);
    const segunda = precioConAjusteCentavos(baseDesdePublicado(primera));
    expect(segunda).toBe(primera);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   EL PRECIO POR ZELLE — corrección urgente del 6 ago 2026
   ══════════════════════════════════════════════════════════════════════════ */

describe("pagar por Zelle cuesta menos, y tiene que ser así", () => {
  it("por Zelle SOLO se cobra el 2%, sin el fee de la tarjeta", () => {
    /* $100 de base: al comercio le tienen que quedar sus $100 completos y a
       Mercatren su 2%. Nada de procesador, porque Zelle es gratis. */
    const publicado = precioZelleCentavos(10_000);
    expect(publicado).toBe(10_205); // $102.05

    // Al comercio le queda su precio íntegro después del 2%.
    const seLlevaMercatren = Math.round((publicado * 200) / 10_000);
    expect(publicado - seLlevaMercatren).toBeGreaterThanOrEqual(10_000);
  });

  it("SIEMPRE es más barato que con tarjeta", () => {
    for (const base of [1_000, 5_000, 20_000, 200_000, 1_000_000]) {
      expect(
        precioZelleCentavos(base),
        `con base ${base} Zelle no salió más barato`,
      ).toBeLessThan(precioConAjusteCentavos(base));
    }
  });

  it("el ahorro es exactamente lo que cobraba el procesador de más", () => {
    /* Los números que motivaron la corrección: en una compra de $2.000 el
       cliente pagaba $62,55 de más por un servicio que no se usó. */
    expect(ahorroPorZelleCentavos(200_000)).toBe(6_255);
    expect(ahorroPorZelleCentavos(10_000)).toBe(342);
  });

  it("nunca deja al comercio cobrando de menos", () => {
    /* La comprobación que de verdad importa: pase lo que pase con el redondeo,
       al comercio le tiene que quedar su precio COMPLETO. Un centavo de menos,
       multiplicado por miles de ventas, es dinero que alguien reclama. */
    for (let base = 100; base <= 500_000; base += 997) {
      const publicado = precioZelleCentavos(base);
      const comision = Math.round((publicado * 200) / 10_000);
      expect(
        publicado - comision,
        `con base ${base} al comercio le faltaría dinero`,
      ).toBeGreaterThanOrEqual(base);
    }
  });

  it("un precio de cero o negativo no inventa dinero", () => {
    expect(precioZelleCentavos(0)).toBe(0);
    expect(precioZelleCentavos(-500)).toBe(0);
    expect(ahorroPorZelleCentavos(0)).toBe(0);
  });

  it("devuelve centavos enteros, nunca decimales", () => {
    for (const base of [333, 1_001, 7_777, 99_999]) {
      expect(Number.isInteger(precioZelleCentavos(base))).toBe(true);
    }
  });
});
