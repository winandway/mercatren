import { MERCADOS, MERCADO_PRINCIPAL } from "@/lib/mercado/mercados";

/**
 * ¿ESTA COMPRA SE RETIRA EN UN MOSTRADOR O LLEGA A UNA DIRECCIÓN?
 *
 * ══ EL FALLO QUE ESTO CIERRA (21 sep 2026) ══
 *
 * `avanzarPedido` mandaba SIEMPRE el correo de «tu pedido está listo para
 * retirar»: dónde queda el depósito, y «lleva tu documento de identidad».
 * Eso es Venezuela, donde el comprador paga desde fuera y alguien pasa por
 * el mostrador. En mercatren.com la caja va a la casa del comprador con un
 * transportista.
 *
 * O sea: al comprador de Miami se le decía que fuera a buscar con su cédula
 * algo que ya venía en camino. Es el mismo fallo del 20 de septiembre —texto
 * de Venezuela donde mira Estados Unidos— pero dentro de un correo, que es
 * donde nadie lo ve hasta que un cliente contesta preguntando a qué depósito
 * tiene que ir.
 *
 * ══ DE DÓNDE SALE LA RESPUESTA ══
 *
 * De `retiroEnCiudad` de `mercados.ts`, que ya existía y es lo que enciende
 * el selector de ciudad y el filtro «¿dónde lo retiro?». Un solo sitio
 * decide esto: si mañana se abre un país que también se retira, se marca
 * allá y este correo cambia solo.
 *
 * ══ POR QUÉ ES PURO ══
 *
 * Decide cuál de dos correos recibe una persona. Un error aquí es un correo
 * que manda a alguien a un sitio que no existe.
 */
export type FormaDeEntrega = "retiro" | "a_domicilio";

export function formaDeEntrega(
  mercado: string | null | undefined,
): FormaDeEntrega {
  const codigo = (mercado ?? "").trim().toUpperCase();
  /* ANTE LA DUDA, A DOMICILIO. Un mercado que no está en la lista —o un
     pedido viejo sin el dato— cae aquí, y este es el lado seguro: decirle a
     alguien «pasa a retirarlo» cuando su caja va en camino lo manda a un
     mostrador que no existe. Al revés solo se omite un dato que el pedido
     sigue enseñando en pantalla. */
  const m = MERCADOS.find(
    (x) => x.codigo === (codigo || MERCADO_PRINCIPAL.codigo),
  );
  return m?.retiroEnCiudad ? "retiro" : "a_domicilio";
}
