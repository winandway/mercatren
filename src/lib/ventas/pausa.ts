/**
 * LA PAUSA DE LAS VENTAS DE ESTADOS UNIDOS — LEVANTADA EL 26 AGO 2026.
 *
 * ══ QUÉ PASÓ ══
 *
 * Se puso el 15 ago 2026 por un motivo concreto y correcto: el catálogo de
 * Estados Unidos estaba publicado pero **no se podía despachar** — la billetera
 * del proveedor estaba en cero y la pieza que le manda la orden no existía. Un
 * comprador que pagara ese día se quedaba con el cobro hecho y sin mercancía, y
 * eso no es un error de programación: es un contracargo y un cliente perdido.
 *
 * Las dos cosas que faltaban ya están:
 *
 * 1. **El pedido al proveedor se crea solo** (16 ago 2026, `src/lib/cj/pedidos.ts`):
 *    entra la venta, se abre el pedido en CJ con la dirección del comprador y
 *    queda el botón de pagarlo con tarjeta. Probado de punta a punta con la
 *    MT-000004, incluido el arreglo del `variantSku` del 18 ago.
 * 2. **El dinero llegó a Payoneer** para cargar la cuenta de CJ (26 ago 2026,
 *    confirmado por el dueño).
 *
 * ══ CÓMO SE VUELVE A PONER ══
 *
 * `EN_PAUSA = true` y un push. Toda la mecánica se queda montada a propósito:
 * el día que el proveedor falle, que se agote un almacén o que haya que parar
 * una plaza, la tienda se cierra en un minuto **sin apagar las fichas** — que
 * es lo que tiraría a la basura el posicionamiento que ya está corriendo.
 *
 * Sigue siendo constante y no variable de entorno: cerrar o abrir la venta de
 * un país es una decisión que pasa por una publicación mirada, no por alguien
 * tocando un panel a las dos de la mañana.
 *
 * ══ QUÉ PAUSA Y QUÉ NO, CUANDO ESTÁ PUESTA ══
 *
 * **Solo la COMPRA, y solo de los productos de Estados Unidos.** El catálogo se
 * sigue viendo, se busca, se navega y Google lo sigue leyendo.
 *
 * Venezuela **no se toca nunca**. Ahí hay comercios reales despachando de
 * verdad, y su venta no tiene por qué pagar por una prueba que es nuestra.
 */

/**
 * ══ PUESTA OTRA VEZ EL 27 OCT 2026 (Richard) ══
 *
 * «Vamos a pausar las ventas de CJ en Estados Unidos… y vamos a buscar otra
 * empresa. Pero los productos los dejamos allí, para que sigan adornando la
 * aplicación.» Los paquetes de prueba de CJ tardaron 38 días y la vara pedía
 * 8 hábiles (`PLAN-B-PROVEEDORES.md`). Hoy TODAS las tiendas de Estados Unidos
 * son las que se armaron con el catálogo de CJ, así que pausar `US` es pausar
 * CJ. Cuando entre otro proveedor de Estados Unidos, la pausa tiene que mirar
 * el proveedor y no el país (anotado en `PENDIENTES.md`).
 *
 * Con la pausa puesta, el feed de Google y los datos de la ficha dicen «sin
 * existencias»: anunciar algo que no se puede comprar va contra las reglas de
 * Merchant Center.
 */
/**
 * Mientras esté en `true`, las tiendas DE LA GENTE en Estados Unidos no venden
 * al público. Las tiendas de un proveedor siguen su propia llave (abajo).
 */
export const EN_PAUSA = true;

/** El país cuyas ventas se detienen al encender la pausa. */
export const PAIS_EN_PAUSA = "US";

/**
 * ══ ESPAÑA SE VE, SE ABREN TIENDAS Y SE CARGAN PRODUCTOS… PERO TODAVÍA NO
 * SE COBRA (27 oct 2026) ══
 *
 * España es el primer país donde los COMERCIOS cobran en una moneda que no
 * es el dólar. El saldo de cada comercio (`zelle/billetera.ts`) suma
 * centavos sin mirar la moneda y los retiros salen en dólares: un comercio
 * de Madrid que vendiera 100 € vería «$100» en su saldo y cobraría 100
 * dólares. Eso no se descubre con una prueba de pantalla: se descubre
 * cuando el comercio cuenta su dinero.
 *
 * Regla de Richard del 31 ago 2026: ningún país cobra sin haber probado el
 * circuito ENTERO —cobro, saldo del comercio, retiro—. Mientras esto esté en
 * `true`, en España todo funciona menos el botón de pagar; el equipo sí
 * puede comprar, que es justo lo que hace falta para la compra de prueba.
 *
 * ══ LO QUE YA SE HIZO (27 oct 2026, la misma noche) ══
 *
 * El saldo y el retiro ya hablan euros: la billetera toma la moneda del país
 * de la tienda (`monedaDeLaTienda`), el retiro solo va a cuentas de países
 * del euro y se hace a mano en Mercury eligiendo EUR, y Zelle, los enlaces
 * de cobro y el traspaso entre comercios ya no pueden meter dólares en una
 * billetera en euros (`tests/unit/saldo-en-la-moneda-de-la-tienda.test.ts`).
 *
 * Lo que FALTA para quitarlo: una compra real en euros mirada hasta el
 * saldo del comercio, y que Richard decida el margen de la tarjeta en
 * España (`VERIFICAR-PAGOS.md`).
 */
export const ESPANA_SIN_COBRO = true;

/**
 * ══ LA PAUSA POR PROVEEDOR Y NO POR PAÍS (14 nov 2026) ══
 *
 * Hasta el 5 nov todas las tiendas de Estados Unidos eran las del catálogo de
 * CJ, y pausar `US` era pausar CJ. Desde el 5 nov las tiendas de Estados
 * Unidos también las abre la gente, y TopDawg viene en camino. Si la pausa
 * siguiera mirando el país, abrir TopDawg obligaría a abrir a la vez a todos
 * los demás (o pausar CJ cerraría a TopDawg). Por eso ahora hay DOS llaves:
 *
 * 1. **Por proveedor** (`PROVEEDORES_EN_PAUSA`): la tienda que vende lo de un
 *    proveedor (`TIENDAS_DE_PROVEEDOR`, por id) se abre o se cierra según SU
 *    proveedor, sin importar el país. CJ está retirado y pausado.
 * 2. **Las tiendas de la gente en Estados Unidos** (`EN_PAUSA`): siguen
 *    cerradas al público hasta que Richard decida abrir esa venta (está
 *    anotado con 👤 en `PENDIENTES.md`). Antes eran «la pausa de US».
 *
 * Una tienda que no aparece en `TIENDAS_DE_PROVEEDOR` es de la gente y sigue
 * la regla de su país. Si un llamador no pasa el `tiendaId`, cae en la regla
 * del país: el olvido CIERRA, nunca abre.
 *
 * Sigue siendo código y no panel: abrir o cerrar la venta de un proveedor pasa
 * por una publicación mirada. Candado: `tests/unit/pausa-por-proveedor.test.ts`.
 */
export type Proveedor = "cj" | "topdawg";

/** Los proveedores cuya venta está detenida para el público. */
export const PROVEEDORES_EN_PAUSA: ReadonlySet<Proveedor> = new Set<Proveedor>([
  /* Retirado el 5 nov 2026 (`cj/retirado.ts`): su catálogo y sus tiendas se
     borraron, pero si una ficha vieja volviera a aparecer, no se vende. */
  "cj",
]);

/**
 * Qué tienda vende lo de qué proveedor, por el `id` de la tienda.
 *
 * Vacío hoy: las tiendas de CJ se borraron el 5 nov y la de TopDawg todavía no
 * existe. Al crear la tienda de TopDawg se agrega aquí su id con `"topdawg"`,
 * y su venta queda abierta aunque las tiendas de la gente en Estados Unidos
 * sigan cerradas.
 */
export const TIENDAS_DE_PROVEEDOR: Readonly<Record<string, Proveedor>> = {};

/** El proveedor de una tienda, o `null` si la tienda es de la gente. */
export function proveedorDeLaTienda(
  tiendaId: string | null | undefined,
  tabla: Readonly<Record<string, Proveedor>> = TIENDAS_DE_PROVEEDOR,
): Proveedor | null {
  const id = (tiendaId ?? "").trim();
  if (!id) return null;
  return Object.prototype.hasOwnProperty.call(tabla, id)
    ? (tabla[id] ?? null)
    : null;
}

export type OpcionesPausa = {
  esEquipoInterno?: boolean;
  /** El id de la tienda: con él se sabe si vende lo de un proveedor. */
  tiendaId?: string | null;
  /** Solo para las pruebas: otra tabla de tiendas de proveedor. */
  tabla?: Readonly<Record<string, Proveedor>>;
  /** Solo para las pruebas: otros proveedores en pausa. */
  enPausa?: ReadonlySet<Proveedor>;
};

/**
 * ¿Se puede comprar este producto?
 *
 * Recibe el país y el id de la tienda, no el producto entero: así la misma
 * función sirve en el servidor y en la ficha. Pura, para probarla sin base.
 *
 * ══ EL EQUIPO SÍ PUEDE COMPRAR ══
 *
 * Y no es un privilegio: es la ÚNICA forma de probar el circuito completo
 * —venta, pedido al proveedor, pago con tarjeta, entrega— sin abrirle la
 * tienda al público antes de saber que se puede despachar.
 *
 * Se pasa explícito y por defecto es `false`: si algún día alguien olvida
 * pasarlo, el candado se queda puesto.
 */
export function ventaPausada(
  paisOrigen: string | null | undefined,
  opciones?: OpcionesPausa,
): boolean {
  if (opciones?.esEquipoInterno === true) return false;
  /* Se compara en mayúsculas y sin espacios: el país entra a mano en el panel
     y un « us » con espacio dejaría la venta abierta justo donde no debe. */
  const pais = (paisOrigen ?? "").trim().toUpperCase();
  if (ESPANA_SIN_COBRO && pais === "ES") return true;
  const proveedor = proveedorDeLaTienda(opciones?.tiendaId, opciones?.tabla);
  if (proveedor) {
    return (opciones?.enPausa ?? PROVEEDORES_EN_PAUSA).has(proveedor);
  }
  return EN_PAUSA && pais === PAIS_EN_PAUSA;
}

/** Un renglón del carrito: su país y, si se conoce, su tienda. */
export type RenglonPausa =
  | string
  | null
  | undefined
  | { pais: string | null | undefined; tiendaId?: string | null };

/**
 * ¿Hay algo pausado en este carrito?
 *
 * Un carrito puede mezclar productos de varios países y proveedores. Basta UNO
 * pausado para que el pedido no se pueda crear: despachar la mitad y cobrar el
 * total sería peor que no vender nada.
 */
export function carritoPausado(
  renglones: RenglonPausa[],
  opciones?: OpcionesPausa,
): boolean {
  return renglones.some((r) =>
    r !== null && typeof r === "object"
      ? ventaPausada(r.pais, { ...opciones, tiendaId: r.tiendaId })
      : ventaPausada(r, opciones),
  );
}
