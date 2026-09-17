/**
 * ══ CUÁNTO CUESTA MANDAR ESTE PAQUETE ══
 *
 * Puro y con pruebas: es dinero que alguien va a leer para decidir si
 * compra, y el desglose se le enseña entero — un total a secas sin explicar
 * de dónde sale es lo que hace que un cliente crea que le están cobrando de
 * más y no vuelva.
 *
 * ══ CÓMO COBRA LA INDUSTRIA (medido el 9 sep 2026) ══
 *
 * Se miró cómo cobran de verdad los casilleros de Miami a Sudamérica
 * (Liberty Express, Tealca, CasilleroYa, envioshaciavenezuela.com) y todos
 * usan la misma estructura:
 *
 * 1. **Peso facturable**: el mayor entre el real y el volumétrico
 *    (largo × ancho × alto ÷ 166 en pulgadas y libras).
 * 2. **Tarifa por libra** sobre ese peso ($3 a $7 la libra a Venezuela).
 * 3. **Un mínimo**, en libras (5 lb es común) y a veces también en dólares.
 * 4. **Cargo fijo de despacho**: papeleo, guía y manejo.
 * 5. **Seguro** como porcentaje del valor declarado, y solo a partir de
 *    cierto monto (3 % de $500 a $1.000, 5 % por encima).
 * 6. **Almacenaje** después de unos días gratis, normalmente 30.
 *
 * Los números NO viven aquí: los llena Richard en el panel, por país. Sin
 * tarifa activa esto **no cotiza** en vez de inventar un precio.
 */

import { pesoFacturableLb, type Medidas } from "./peso";

export type TarifaPais = {
  pais: string;
  tarifaLibraCentavos: number;
  minimoLb: number;
  minimoCobroCentavos: number;
  despachoCentavos: number;
  seguroPuntosBase: number;
  seguroDesdeCentavos: number;
  divisorVolumetrico: number;
  diasAlmacenajeGratis: number;
  almacenajeDiaCentavos: number;
  impuestoIncluido: boolean;
  activa: boolean;
};

export type PaqueteACotizar = {
  pesoRealLb: number;
  medidas: Medidas | null;
  valorDeclaradoCentavos: number | null;
  /**
   * El seguro es OPCIONAL (el agente, 16 sep 2026: «no es obligatorio»).
   * `true` lo cobra sobre el valor declarado; `false` no lo cobra; sin
   * decir nada, se aplica la regla de la tarifa (desde cierto valor).
   */
  conSeguro?: boolean;
  /** Días que lleva en la bodega. Cero si se despacha el mismo día. */
  diasEnBodega?: number;
};

export type Cotizacion =
  | {
      ok: true;
      pesoFacturableLb: number;
      pesoVolumetricoLb: number;
      /** Cada renglón, en el orden en que se le enseña al cliente. */
      renglones: Array<{ concepto: string; centavos: number }>;
      totalCentavos: number;
      impuestoIncluido: boolean;
    }
  | { ok: false; motivo: "sin-tarifa" | "sin-peso" };

/** El peso volumétrico con el divisor de esa plaza. */
function volumetrico(medidas: Medidas | null, divisor: number): number {
  if (!medidas) return 0;
  const { largoIn, anchoIn, altoIn } = medidas;
  if ([largoIn, anchoIn, altoIn].some((v) => !(v > 0))) return 0;
  return Math.round(((largoIn * anchoIn * altoIn) / divisor) * 100) / 100;
}

export function cotizarEnvio(
  paquete: PaqueteACotizar,
  tarifa: TarifaPais | null,
): Cotizacion {
  /* Sin tarifa cargada NO se cotiza. Enseñar un número inventado es
     prometerle un precio a alguien que después va a pagar otro. */
  if (!tarifa || !tarifa.activa || tarifa.tarifaLibraCentavos <= 0) {
    return { ok: false, motivo: "sin-tarifa" };
  }
  if (!(paquete.pesoRealLb > 0) && !paquete.medidas) {
    return { ok: false, motivo: "sin-peso" };
  }

  const divisor =
    tarifa.divisorVolumetrico > 0 ? tarifa.divisorVolumetrico : 166;
  const pesoVol = volumetrico(paquete.medidas, divisor);
  const facturable = pesoFacturableLb(paquete.pesoRealLb, paquete.medidas, {
    divisor,
    minimoLb: tarifa.minimoLb,
    modo: "decima",
  });

  const renglones: Array<{ concepto: string; centavos: number }> = [];

  const flete = Math.round(facturable * tarifa.tarifaLibraCentavos);
  renglones.push({ concepto: "flete", centavos: flete });

  if (tarifa.despachoCentavos > 0) {
    renglones.push({ concepto: "despacho", centavos: tarifa.despachoCentavos });
  }

  /* El seguro solo desde el monto que diga la tarifa: cobrarle un
     porcentaje a una caja de veinte dólares es un renglón que molesta más
     de lo que recauda. */
  const seguro = renglonDeSeguro(
    paquete.valorDeclaradoCentavos,
    paquete.conSeguro,
    tarifa.seguroPuntosBase,
    tarifa.seguroDesdeCentavos,
  );
  if (seguro) renglones.push(seguro);

  const dias = paquete.diasEnBodega ?? 0;
  const cobrables = Math.max(0, dias - tarifa.diasAlmacenajeGratis);
  if (cobrables > 0 && tarifa.almacenajeDiaCentavos > 0) {
    renglones.push({
      concepto: "almacenaje",
      centavos: cobrables * tarifa.almacenajeDiaCentavos,
    });
  }

  const suma = renglones.reduce((t, r) => t + r.centavos, 0);

  /* El mínimo se aplica AL TOTAL y como un renglón visible, no subiendo el
     flete a escondidas: el cliente tiene que poder ver por qué su paquete
     de media libra cuesta lo que cuesta. */
  let total = suma;
  if (tarifa.minimoCobroCentavos > 0 && suma < tarifa.minimoCobroCentavos) {
    renglones.push({
      concepto: "ajuste-minimo",
      centavos: tarifa.minimoCobroCentavos - suma,
    });
    total = tarifa.minimoCobroCentavos;
  }

  return {
    ok: true,
    pesoFacturableLb: facturable,
    pesoVolumetricoLb: pesoVol,
    renglones,
    totalCentavos: total,
    impuestoIncluido: tarifa.impuestoIncluido,
  };
}

/** El seguro: si la persona decidió, manda ella; si no, la regla de la tarifa. */
function renglonDeSeguro(
  valorCentavos: number | null,
  conSeguro: boolean | undefined,
  puntosBase: number,
  desdeCentavos: number,
): { concepto: "seguro"; centavos: number } | null {
  const valor = valorCentavos ?? 0;
  if (puntosBase <= 0 || valor <= 0) return null;
  const aplica = conSeguro === undefined ? valor >= desdeCentavos : conSeguro;
  if (!aplica) return null;
  return {
    concepto: "seguro",
    centavos: Math.round((valor * puntosBase) / 10_000),
  };
}

/* ══ LIBRAS Y KILOS ══ La tienda dice «2 kg» y la etiqueta «4.4 lb»; el
   cliente elige en qué unidad escribe y aquí se pasa a libras, que es como
   cobra el agente. 1 kg = 2,20462 lb. */
export const LB_POR_KG = 2.20462;
export function aLibras(valor: number, unidad: "lb" | "kg"): number {
  if (!(valor > 0)) return 0;
  return unidad === "kg" ? Math.round(valor * LB_POR_KG * 100) / 100 : valor;
}

/* ══ MARÍTIMO: POR PIE CÚBICO, EL PESO NO APLICA (16 sep 2026) ══
   Richard: «en lo marítimo el peso no aplica». El agente: $30 el pie cúbico
   a Venezuela. Pie cúbico = largo × ancho × alto en pulgadas ÷ 1728. */
export type TarifaMaritima = {
  pais: string;
  tarifaPieCentavos: number;
  minimoPies: number;
  minimoCobroCentavos: number;
  seguroPuntosBase: number;
  seguroDesdeCentavos: number;
  impuestoIncluido: boolean;
  activa: boolean;
};

export type CotizacionMaritima =
  | {
      ok: true;
      piesCubicos: number;
      piesFacturables: number;
      renglones: Array<{ concepto: string; centavos: number }>;
      totalCentavos: number;
      impuestoIncluido: boolean;
    }
  | { ok: false; motivo: "sin-tarifa" | "sin-medidas" };

export function piesCubicos(medidas: Medidas | null): number {
  if (!medidas) return 0;
  const { largoIn, anchoIn, altoIn } = medidas;
  if ([largoIn, anchoIn, altoIn].some((v) => !(v > 0))) return 0;
  return Math.round(((largoIn * anchoIn * altoIn) / 1728) * 100) / 100;
}

export function cotizarEnvioMaritimo(
  paquete: {
    medidas: Medidas | null;
    valorDeclaradoCentavos: number | null;
    conSeguro?: boolean;
  },
  tarifa: TarifaMaritima | null,
): CotizacionMaritima {
  if (!tarifa || !tarifa.activa || tarifa.tarifaPieCentavos <= 0) {
    return { ok: false, motivo: "sin-tarifa" };
  }
  const pies = piesCubicos(paquete.medidas);
  if (pies <= 0) return { ok: false, motivo: "sin-medidas" };
  /* Se factura a la centésima de pie, nunca por debajo del mínimo. */
  const facturables = Math.max(
    pies,
    tarifa.minimoPies > 0 ? tarifa.minimoPies : 0,
  );

  const renglones: Array<{ concepto: string; centavos: number }> = [
    {
      concepto: "flete-maritimo",
      centavos: Math.round(facturables * tarifa.tarifaPieCentavos),
    },
  ];
  const seguro = renglonDeSeguro(
    paquete.valorDeclaradoCentavos,
    paquete.conSeguro,
    tarifa.seguroPuntosBase,
    tarifa.seguroDesdeCentavos,
  );
  if (seguro) renglones.push(seguro);

  const suma = renglones.reduce((t, r) => t + r.centavos, 0);
  let total = suma;
  if (tarifa.minimoCobroCentavos > 0 && suma < tarifa.minimoCobroCentavos) {
    renglones.push({
      concepto: "ajuste-minimo",
      centavos: tarifa.minimoCobroCentavos - suma,
    });
    total = tarifa.minimoCobroCentavos;
  }
  return {
    ok: true,
    piesCubicos: pies,
    piesFacturables: facturables,
    renglones,
    totalCentavos: total,
    impuestoIncluido: tarifa.impuestoIncluido,
  };
}
