import { impuestoDelMercado } from "@/lib/impuestos/chile";
import { mercadoPorCodigo } from "@/lib/mercado/mercados";

/**
 * A QUÉ PAÍS SE LE PIDE EL DESPACHO A CJ, Y CON QUÉ NÚMERO FISCAL.
 *
 * ══ EL PAÍS IBA ESCRITO A MANO, Y ERA «US» ══
 *
 * `comprarAlProveedor` mandaba `shippingCountryCode: "US"` fijo. Mientras
 * Mercatren vendió solo en Estados Unidos eso fue correcto y no molestó a
 * nadie. El día que entre el primer pedido chileno, ese literal manda el
 * paquete al país equivocado — y el comprador ya pagó.
 *
 * ══ Y FALTABA EL DATO QUE EVITA QUE EL PAQUETE PAGUE DOS VECES ══
 *
 * Para que un envío entre a Chile **sin IVA y sin arancel**, hay que
 * demostrarle a la Aduana que el IVA ya se le cobró al comprador. La forma es
 * exacta y está en la Resolución Ex. SII N°103 de 2025 —la que aplica a un
 * vendedor remoto extranjero inscrito en el régimen simplificado, que es
 * nuestro caso; la 141 es para plataformas con domicilio en Chile—. Por cada
 * envío hay que entregarle al Servicio Nacional de Aduanas, a través del
 * operador logístico:
 *
 * > «a) Nombre comercial o legal del vendedor remoto […] b) **Número de usuario
 * > otorgado al inscribirse en el régimen de tributación simplificada** […]
 * > c) Atributo o señal de que el IVA fue efectivamente recargado al comprador
 * > […] d) Identificador del envío.»
 *
 * El `taxId` de la API de CJ es donde viaja el (b): nuestro `59330700K`, que
 * sale de la regla del mercado y **no se escribe a mano aquí**. Si no viaja,
 * cobramos el 19 %, lo declaramos en el F129, y al comprador se lo vuelven a
 * cobrar en la aduana. Paga dos veces y el que queda mal es Mercatren.
 *
 * ══ UN PAÍS QUE NO ESTÁ EN LA TABLA NO SE DESPACHA ══
 *
 * Devuelve `null` en vez de caer en Estados Unidos por descarte. Un respaldo
 * silencioso aquí significa mandar mercancía al otro lado del mundo y
 * enterarse por el reclamo del comprador; el `null` hace que la compra quede en
 * el panel con su motivo, que es como ya se comporta todo lo demás de esta
 * pantalla.
 */

/** Lo que CJ necesita saber del destino de un envío. */
export type DestinoDeEnvio = {
  /** ISO de dos letras. Es lo que CJ compara contra su tabla. */
  codigo: string;
  /** El nombre del país, que CJ pide aparte del código. */
  nombre: string;
  /**
   * El número fiscal que viaja con el envío, o cadena vacía si el país no
   * exige ninguno. Vacío y no `undefined`: CJ trata los dos igual y así el
   * cuerpo de la petición no cambia de forma según el destino.
   */
  taxId: string;
};

/** Los países a los que hoy se le puede pedir un despacho a CJ. */
const PAISES: Record<string, string> = {
  US: "United States",
  CL: "Chile",
  CO: "Colombia",
};

/**
 * LOS PEDIDOS VIEJOS GUARDAN EL NOMBRE, NO EL CÓDIGO.
 *
 * `paisDestino` decía «United States» hasta el 27 ago 2026, y esas filas
 * existen y se siguen comprando. Sin esta tabla, un reintento sobre un pedido
 * de ayer fallaría con «no despachamos a United States» — el fallo estuvo
 * unas horas en el código y lo destapó releer quién escribe el campo.
 */
const NOMBRES_VIEJOS: Record<string, string> = {
  "UNITED STATES": "US",
  "ESTADOS UNIDOS": "US",
  VENEZUELA: "VE",
  CHILE: "CL",
  COLOMBIA: "CO",
};

/**
 * El destino de un envío a partir del país guardado en el pedido.
 *
 * Un pedido **sin país** se trata como Estados Unidos: es lo que había antes de
 * que existiera el catálogo de otros países, y todos los pedidos viejos están
 * en ese caso. Cambiarlo por un fallo dejaría sin comprar pedidos que hoy
 * funcionan.
 */
export function destinoDeEnvio(
  paisDestino: string | null | undefined,
): DestinoDeEnvio | null {
  const crudo = (paisDestino ?? "").trim().toUpperCase() || "US";
  const codigo = NOMBRES_VIEJOS[crudo] ?? crudo;
  const nombre = PAISES[codigo];
  if (!nombre) return null;

  /* El número fiscal sale de la regla del mercado, nunca de un literal: así el
     día que Colombia entre al régimen simplificado, su número llega solo. */
  const regla = impuestoDelMercado(mercadoPorCodigo(codigo));

  return { codigo, nombre, taxId: regla?.numeroDeUsuario ?? "" };
}
