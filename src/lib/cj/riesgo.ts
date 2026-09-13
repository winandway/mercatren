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
/**
 * ══ EL CERO DE EE. UU. A EE. UU. ES ENVÍO GRATIS DE VERDAD (13 sep 2026) ══
 *
 * Hasta hoy un `logisticPrice: 0` se tomaba por respuesta vacía y la ficha
 * se quedaba en revisión. Se midió con dinero: la compra de prueba
 * `PRUEBA-20260905205642` (cargador, almacén L2US, SpeedX US to US) salió
 * con `productAmount 11.40 · postageAmount 0 · orderAmount 11.40`. CJ no
 * cobró envío. Y el teléfono que Richard encontró en 404 es un
 * `SUPPLIER_SHIPPED_PRODUCT` con «USPS US to US = 0»: el proveedor lo manda
 * con el envío dentro del precio. Había 41.796 fichas de EE. UU. en
 * revisión, casi todas por esto.
 *
 * `aceptarGratis` lo pasa SOLO la plaza de EE. UU. (almacén US → país US).
 * Para Chile y Colombia, que salen de China, un cero sigue siendo un fallo:
 * nadie cruza el Pacífico gratis.
 */
export function elegirCotizacion(
  opciones: readonly OpcionDeFlete[],
  ajustes: { aceptarGratis?: boolean } = {},
): { nombre: string; centavos: number } | null {
  const piso = ajustes.aceptarGratis ? 0 : 1;
  const validas = opciones
    .map((o) => ({
      nombre: o.logisticName?.trim() ?? "",
      centavos: Math.round(Number(o.logisticPrice) * 100),
    }))
    .filter(
      (o) => o.nombre && Number.isFinite(o.centavos) && o.centavos >= piso,
    );
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

/**
 * Lo cobrado, EN CENTAVOS DE DÓLAR, para compararlo con lo que CJ cobra.
 *
 * En Chile y Colombia el cliente paga en pesos enteros y CJ cobra en
 * dólares: comparar 96.742 pesos contra 1.173 centavos «no pierde nunca»
 * y el candado queda ciego. La tasa viene en centésimas (967,42 → 96742).
 * Sin tasa se devuelve null: mejor no juzgar que juzgar con un número
 * de otra moneda.
 */
export function cobradoEnUsdCentavos(
  cobradoCentavos: number,
  moneda: string,
  tasaCentesimas: number | null,
): number | null {
  if (moneda === "USD") return cobradoCentavos;
  if (
    tasaCentesimas === null ||
    !Number.isFinite(tasaCentesimas) ||
    tasaCentesimas <= 0
  ) {
    return null;
  }
  /* pesos → dólares = pesos ÷ (tasa/100); en centavos = × 100. */
  return Math.round((cobradoCentavos * 10_000) / tasaCentesimas);
}
