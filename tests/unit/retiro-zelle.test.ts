import { describe, expect, it } from "vitest";

import { ZELLE_RETIRO_MAXIMO_CENTAVOS } from "@/lib/dinero";
import { aCentavos } from "@/lib/retiros/monto";

/**
 * EL TOPE DE ZELLE PARA PAGARLE A UN COMERCIO.
 *
 * No protege al comercio: protege la cuenta del banco de Windoce, LLC, que es
 * de donde sale el dinero de TODOS. Los bancos vigilan Zelle con un umbral
 * más bajo que ACH, y una cuenta que paga proveedores por Zelle todos los
 * días termina restringida — y entonces no cobra nadie.
 *
 * Por eso el número está fijado y probado: si alguien lo sube sin pensarlo,
 * al menos tiene que venir aquí y verlo escrito.
 */

/** La misma cuenta que hace la acción del servidor. */
function pasaElTope(monto: string): boolean {
  const centavos = aCentavos(monto);
  return centavos !== null && centavos > ZELLE_RETIRO_MAXIMO_CENTAVOS;
}

describe("el tope de Zelle", () => {
  it("el tope es de $500", () => {
    expect(ZELLE_RETIRO_MAXIMO_CENTAVOS).toBe(50_000);
  });

  it("justo en el tope se puede", () => {
    expect(pasaElTope("500")).toBe(false);
    expect(pasaElTope("500.00")).toBe(false);
  });

  it("un centavo por encima ya no", () => {
    expect(pasaElTope("500.01")).toBe(true);
  });

  it("los montos normales pasan sin problema", () => {
    for (const monto of ["10", "99.99", "250", "499.99"]) {
      expect(pasaElTope(monto), `${monto} debería poder`).toBe(false);
    }
  });

  it("los montos grandes se detienen", () => {
    for (const monto of ["501", "1000", "24283.75"]) {
      expect(pasaElTope(monto), `${monto} debería detenerse`).toBe(true);
    }
  });

  it("el tope está muy por debajo del límite diario del banco", () => {
    /**
     * El límite de Zelle de un banco es UNO SOLO al día y se reparte entre
     * todos los comercios. El más bajo que encontramos en cuentas de negocio
     * es $5,000 (Chase, U.S. Bank). Con este tope caben diez pagos en un día
     * sin acercarse al borde; si algún día el tope se acercara a ese límite,
     * el segundo comercio de la mañana se quedaría sin cobrar.
     */
    const LIMITE_DIARIO_MAS_BAJO = 500_000; // $5,000 en centavos
    const cabenEnUnDia = Math.floor(
      LIMITE_DIARIO_MAS_BAJO / ZELLE_RETIRO_MAXIMO_CENTAVOS,
    );
    expect(cabenEnUnDia).toBeGreaterThanOrEqual(10);
  });
});
