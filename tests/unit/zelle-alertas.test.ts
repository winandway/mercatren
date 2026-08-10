import { describe, expect, it } from "vitest";

import {
  alertasDelComprobante,
  bloqueaLaAprobacion,
  huellaDelArchivo,
  type HechosDelComprobante,
} from "@/lib/zelle/alertas";

const limpio = (
  h: Partial<HechosDelComprobante> = {},
): HechosDelComprobante => ({
  montoCentavos: 10_000,
  totalDelPedidoCentavos: 10_000,
  codigoConfirmacion: "ABC123",
  codigoYaAprobadoEn: null,
  codigoVistoEn: null,
  capturaYaAprobadaEn: null,
  capturaVistaEn: null,
  rechazosDelPagador: 0,
  ...h,
});

const claves = (h: HechosDelComprobante) =>
  alertasDelComprobante(h).map((a) => a.clave);

describe("un comprobante normal no levanta nada", () => {
  it("sin señales, la lista viene vacía", () => {
    expect(alertasDelComprobante(limpio())).toEqual([]);
  });
});

/**
 * LO QUE MOTIVÓ TODO ESTO.
 *
 * En el histórico está el código `kfrcrk9wp` usado dos veces por $100. Lo
 * atajó una persona con buena memoria, no el sistema. Un código ya aprobado
 * significa que ese dinero ya se contó: aprobarlo otra vez es regalar
 * mercancía.
 */
describe("un código ya aprobado NO se puede volver a aprobar", () => {
  it("bloquea", () => {
    const alertas = alertasDelComprobante(
      limpio({ codigoYaAprobadoEn: "MT-000123" }),
    );
    expect(alertas[0]!.clave).toBe("codigoYaAprobado");
    expect(bloqueaLaAprobacion(alertas)).not.toBeNull();
  });

  it("dice en qué pago se usó, para poder ir a mirarlo", () => {
    const [a] = alertasDelComprobante(
      limpio({ codigoYaAprobadoEn: "MT-000123" }),
    );
    expect(a!.datos?.pago).toBe("MT-000123");
  });
});

/**
 * LA OTRA CARA, Y ES IGUAL DE IMPORTANTE.
 *
 * Rechazar y volver a intentar con la transferencia corregida es lo normal.
 * Cerrarle la puerta a quien pagó de verdad cuesta más caro que el fraude que
 * evitaría.
 */
describe("un código visto en un pago SIN aprobar solo se avisa", () => {
  it("no bloquea", () => {
    const alertas = alertasDelComprobante(
      limpio({ codigoVistoEn: "MT-000900" }),
    );
    expect(alertas[0]!.clave).toBe("codigoVisto");
    expect(alertas[0]!.gravedad).toBe("revisar");
    expect(bloqueaLaAprobacion(alertas)).toBeNull();
  });

  it("si además está aprobado en otro, manda el que bloquea", () => {
    const alertas = alertasDelComprobante(
      limpio({ codigoYaAprobadoEn: "MT-000123", codigoVistoEn: "MT-000900" }),
    );
    expect(claves(limpio({ codigoYaAprobadoEn: "MT-000123" }))).toContain(
      "codigoYaAprobado",
    );
    expect(alertas.filter((a) => a.clave === "codigoVisto")).toHaveLength(0);
  });
});

describe("la misma captura otra vez", () => {
  it("si ya se aprobó con esa imagen, bloquea", () => {
    const alertas = alertasDelComprobante(
      limpio({ capturaYaAprobadaEn: "MT-000555" }),
    );
    expect(bloqueaLaAprobacion(alertas)?.clave).toBe("capturaYaAprobada");
  });

  it("si solo se vio sin aprobar, se avisa", () => {
    const alertas = alertasDelComprobante(
      limpio({ capturaVistaEn: "MT-000555" }),
    );
    expect(alertas[0]!.gravedad).toBe("revisar");
    expect(bloqueaLaAprobacion(alertas)).toBeNull();
  });
});

describe("el monto", () => {
  it("avisa cuando no cuadra con el pedido", () => {
    /* Es como se cuela la captura de otra compra más chica. */
    const alertas = alertasDelComprobante(
      limpio({ montoCentavos: 5_000, totalDelPedidoCentavos: 10_000 }),
    );
    const a = alertas.find((x) => x.clave === "montoNoCuadra");
    expect(a?.datos).toEqual({ delPedido: 10_000, delComprobante: 5_000 });
  });

  it("NO bloquea: puede ser un pago parcial acordado", () => {
    const alertas = alertasDelComprobante(
      limpio({ montoCentavos: 5_000, totalDelPedidoCentavos: 10_000 }),
    );
    expect(bloqueaLaAprobacion(alertas)).toBeNull();
  });

  it("un pago del histórico, sin pedido, no se compara con nada", () => {
    expect(claves(limpio({ totalDelPedidoCentavos: null }))).not.toContain(
      "montoNoCuadra",
    );
  });
});

describe("sin código de confirmación", () => {
  it("se avisa: sin él no se puede buscar en el banco", () => {
    expect(claves(limpio({ codigoConfirmacion: null }))).toContain("sinCodigo");
  });

  it("un código de solo espacios cuenta como que no hay", () => {
    expect(claves(limpio({ codigoConfirmacion: "   " }))).toContain(
      "sinCodigo",
    );
  });
});

describe("el historial de quien paga", () => {
  it("se avisa si ya le rechazaron comprobantes", () => {
    const [a] = alertasDelComprobante(limpio({ rechazosDelPagador: 2 })).filter(
      (x) => x.clave === "pagadorConRechazos",
    );
    expect(a?.datos?.veces).toBe(2);
  });

  it("sin rechazos no se dice nada", () => {
    expect(claves(limpio())).not.toContain("pagadorConRechazos");
  });
});

describe("varias señales a la vez", () => {
  it("se enseñan todas, no solo la primera", () => {
    const alertas = alertasDelComprobante(
      limpio({
        codigoConfirmacion: null,
        montoCentavos: 1,
        rechazosDelPagador: 3,
      }),
    );
    expect(alertas.map((a) => a.clave).sort()).toEqual([
      "montoNoCuadra",
      "pagadorConRechazos",
      "sinCodigo",
    ]);
  });
});

describe("la huella de la imagen", () => {
  it("el mismo archivo da la misma huella", async () => {
    const datos = new TextEncoder().encode("una captura cualquiera").buffer;
    expect(await huellaDelArchivo(datos)).toBe(await huellaDelArchivo(datos));
  });

  it("un archivo distinto da otra", async () => {
    const a = new TextEncoder().encode("captura A").buffer;
    const b = new TextEncoder().encode("captura B").buffer;
    expect(await huellaDelArchivo(a)).not.toBe(await huellaDelArchivo(b));
  });

  it("es de 64 caracteres hexadecimales", async () => {
    const h = await huellaDelArchivo(new TextEncoder().encode("x").buffer);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });
});
