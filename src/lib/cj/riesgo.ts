/**
 * EL RIESGO DE VENDER POR DEBAJO DEL COSTO — puro, para poder probarlo.
 *
 * ══ LO QUE ENSEÑÓ LA MT-000011 (2 sep 2026) ══
 *
 * Se publicó una camiseta a $7.95 con un envío cotizado de $1.70: el más
 * barato del listado de CJ, que era un repartidor REGIONAL (GOFO+/UniUni+)
 * sin capacidad en el almacén. Al ir a comprarla de verdad, CJ recalculó el
 * envío a $6.70 → costo $11.73 contra $7.95 cobrados. Tres candados salen de
 * ahí: cotizar con transportes de verdad, comprobar el stock antes de cobrar
 * y no pagarle al proveedor una venta que pierde dinero sin que una persona
 * lo decida.
 */

/**
 * Repartidores regionales de última milla de CJ: baratos en el listado y
 * casi nunca con capacidad de almacén. Cotizar el precio de venta con ellos
 * es prometer un envío que después cuesta cuatro veces más.
 */
export const REGIONALES = [
  "gofo",
  "uniuni",
  "unione",
  "ontrac",
  "lasership",
  "pandion",
];

export function esTransporteRegional(
  nombre: string | null | undefined,
): boolean {
  const n = (nombre ?? "").toLowerCase();
  return REGIONALES.some((r) => n.includes(r));
}

export type OpcionDeFlete = {
  logisticName?: string;
  logisticPrice?: number | string;
};

/**
 * La cotización con la que se FIJA EL PRECIO: la más barata entre los
 * transportes nacionales. Solo si no hay ninguno nacional se cae a un
 * regional — mejor un precio con envío regional que un envío en cero.
 */
export function elegirCotizacion(
  opciones: readonly OpcionDeFlete[],
): { nombre: string; centavos: number } | null {
  const validas = opciones
    .map((o) => ({
      nombre: o.logisticName?.trim() ?? "",
      centavos: Math.round(Number(o.logisticPrice) * 100),
    }))
    .filter((o) => o.nombre && Number.isFinite(o.centavos) && o.centavos > 0);
  if (validas.length === 0) return null;
  const nacionales = validas.filter((o) => !esTransporteRegional(o.nombre));
  const candidatas = nacionales.length > 0 ? nacionales : validas;
  return [...candidatas].sort((a, b) => a.centavos - b.centavos)[0]!;
}

/**
 * ¿Esta compra al proveedor pierde dinero?
 *
 * `costo` es lo que CJ va a cobrar (producto + envío); `cobrado` lo que el
 * cliente pagó por esos renglones. Con menos de `margenMinimo` de diferencia
 * no se paga sola: lo decide una persona con la cifra delante.
 */
export function pierdeDinero(
  costoCentavos: number | null,
  cobradoCentavos: number,
  margenMinimoCentavos: number,
): { pierde: boolean; diferenciaCentavos: number } {
  if (costoCentavos === null || !Number.isFinite(costoCentavos)) {
    return { pierde: false, diferenciaCentavos: 0 };
  }
  const diferencia = cobradoCentavos - costoCentavos;
  return {
    pierde: diferencia < margenMinimoCentavos,
    diferenciaCentavos: diferencia,
  };
}
