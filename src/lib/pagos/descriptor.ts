/**
 * LO QUE EL COMPRADOR LEE EN SU ESTADO DE CUENTA.
 *
 * ══ POR QUE ESTO ES DINERO Y NO COSMETICA ══
 *
 * Un cargo con tarjeta se puede desconocer hasta 120 dias despues. La razon
 * numero uno de un contracargo no es el fraude: es «no reconozco este cobro».
 * La persona mira su extracto tres semanas mas tarde, ve un nombre que no le
 * dice nada, y llama al banco. Ese contracargo cuesta la venta entera, la
 * comision que ya pagamos y la multa de Stripe — y ganarlo obliga a demostrar
 * que la mercancia llego.
 *
 * ══ COMO SE ARMA LA LINEA ══
 *
 * Stripe la compone en dos partes:
 *
 *     <prefijo de la cuenta> * <sufijo de este cobro>
 *              MERCATREN     *      MT-000003
 *
 * El prefijo se configura UNA VEZ en el panel de Stripe y es igual para todos
 * los cobros. El sufijo lo manda el codigo en cada cobro, y es lo unico que
 * puede decir DE CUAL compra se trata. Por eso va el numero de pedido: con el,
 * quien mira su extracto lo cruza con su correo de compra en cinco segundos.
 *
 * Antes el sufijo decia «MERCATREN», igual que el prefijo, asi que la linea
 * salia `MERCATREN* MERCATREN`: repetia la marca y no identificaba nada.
 *
 * ══ EL LIMITE DE 22 QUE ROMPE EL COBRO ══
 *
 * Stripe cuenta prefijo + separador + sufijo y **rechaza el cobro entero** si
 * pasa de 22 caracteres. Con el prefijo `MERCATREN` (9) mas `* ` (2) quedan
 * 11 para el sufijo. Se corta en 10 para dejar aire.
 *
 * Esto importa porque el sufijo de un cobro pedido por un comercio sale de SU
 * numero de factura, que lo escribe una persona en un mostrador: puede traer
 * acentos, comillas o venir larguisimo. Un cobro que Stripe rechaza por el
 * texto del extracto es una venta perdida en la pantalla de pago, y el motivo
 * no se parece en nada a la causa.
 */

/** Lo que caben despues de `MERCATREN* `, con un caracter de margen. */
export const LARGO_MAXIMO = 10;

/** Lo que se enseña cuando no queda nada utilizable. */
export const POR_DEFECTO = "MERCATREN";

/**
 * Stripe no admite estos en el sufijo. El asterisco se quita ademas porque es
 * el separador que el propio Stripe usa: dentro del texto se lee como si
 * hubiera dos cobros.
 */
const PROHIBIDOS = /[<>\\"'*]/g;

export function sufijoDelExtracto(
  referencia: string | null | undefined,
): string {
  if (!referencia) return POR_DEFECTO;

  const limpio = referencia
    /* Los acentos se descomponen y se tiran: el extracto de un banco
       estadounidense los enseña como signos raros o los come. */
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(PROHIBIDOS, "")
    /* Cualquier otra cosa fuera del ASCII imprimible tampoco viaja bien. */
    .replace(/[^\x20-\x7e]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!limpio) return POR_DEFECTO;

  const cortado = limpio.slice(0, LARGO_MAXIMO).replace(/[\s\-_./]+$/, "");
  if (!cortado) return POR_DEFECTO;

  /**
   * STRIPE EXIGE AL MENOS UNA LETRA.
   *
   * Una factura que se llama `0012` es perfectamente normal en un mostrador, y
   * sola haria que Stripe rechazara el cobro. Se le antepone `MT` —la marca—
   * en vez de renunciar al numero: `MT 0012` identifica la compra, y
   * `MERCATREN* MERCATREN` no identifica ninguna.
   */
  if (!/[a-zA-Z]/.test(cortado)) {
    return `MT ${cortado}`.slice(0, LARGO_MAXIMO).trim();
  }

  return cortado;
}
