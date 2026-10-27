/**
 * ══ BORRAR LA CUENTA: LAS REGLAS (27 oct 2026) ══
 *
 * Google Play exige que toda app donde se crea una cuenta deje borrarla desde
 * la app y desde una página web, sin escribirle a nadie. Mercatren no tenía
 * ninguna de las dos: la política de privacidad decía «escríbenos» y punto.
 *
 * ══ SE ANONIMIZA, NO SE BORRA LA FILA ══
 *
 * La base no deja borrar a un usuario con pedidos (`pedidos.cliente_id` no
 * tiene borrado en cascada) y no debe dejarlo: los pedidos, pagos y facturas
 * se guardan cinco años porque lo pide la ley (sección «Cuánto tiempo los
 * guardamos» de la privacidad). Así que la cuenta muere de verdad —sin
 * contraseña, sin sesiones, sin nombre, sin correo, sin teléfono, sin
 * direcciones— y los registros de compra quedan colgando de un usuario que ya
 * no dice quién era.
 *
 * ══ QUIÉN NO PUEDE HACERLO SOLO ══
 *
 * - Las cuentas del equipo y de los comercios: detrás hay ventas, saldos y
 *   retiros. Se cierran con soporte.
 * - Quien tiene un pedido pagado que todavía no llegó, o paquetes esperando en
 *   Miami: borrar ahora le quitaría la guía y el aviso de llegada. Cuando
 *   termine, puede. Es la retención temporal que Google admite.
 *
 * Este archivo es puro: decide con números y textos, sin tocar la base.
 */

/** Las palabras que hay que escribir para confirmar, por idioma. */
export const PALABRA_DE_CONFIRMACION = { es: "BORRAR", en: "DELETE" } as const;

/** Lo que queda en el lugar del nombre. */
export const NOMBRE_DE_CUENTA_ELIMINADA = "Cuenta eliminada";

/**
 * Los pedidos que todavía se mueven y que, por eso, frenan el borrado.
 * `pendiente_pago` no está: un pedido sin pagar no le debe nada a nadie.
 */
export const ESTADOS_DE_PEDIDO_EN_CAMINO = [
  "pagado",
  "preparando",
  "enviado",
] as const;

export type MotivoParaNoBorrar = "equipo" | "tienda" | "pedidos" | "paquetes";

export type SituacionDeLaCuenta = {
  rol: string;
  /** Si es dueña de alguna tienda, aunque el rol diga «cliente». */
  tieneTienda: boolean;
  pedidosEnCamino: number;
  paquetesEnBodega: number;
};

export type PuedeBorrar =
  { ok: true } | { ok: false; motivo: MotivoParaNoBorrar };

/** ¿Puede esta persona borrar su cuenta ella sola, ahora? */
export function puedeBorrarSuCuenta(s: SituacionDeLaCuenta): PuedeBorrar {
  if (s.rol !== "cliente") return { ok: false, motivo: "equipo" };
  if (s.tieneTienda) return { ok: false, motivo: "tienda" };
  if (s.pedidosEnCamino > 0) return { ok: false, motivo: "pedidos" };
  if (s.paquetesEnBodega > 0) return { ok: false, motivo: "paquetes" };
  return { ok: true };
}

/**
 * ¿Escribió la palabra? Sin distinguir mayúsculas ni espacios de los lados, y
 * en cualquiera de los dos idiomas: quien cambió de idioma a mitad de camino
 * no tiene por qué fallar.
 */
export function confirmoElBorrado(escrito: string): boolean {
  const limpio = escrito.trim().toUpperCase();
  return Object.values(PALABRA_DE_CONFIRMACION).some((p) => p === limpio);
}

/**
 * El correo que queda en la fila. Tiene que ser único (la columna lo exige) y
 * no puede llegarle a nadie: `.invalid` es un dominio reservado que no existe
 * (RFC 2606). Así la dirección vieja queda libre para una cuenta nueva.
 */
export function correoDeCuentaEliminada(usuarioId: string): string {
  return `eliminada-${usuarioId}@cuentas.invalid`;
}

/** ¿Es una cuenta ya eliminada? Para no borrarla dos veces. */
export function esCuentaEliminada(correo: string): boolean {
  return correo.endsWith("@cuentas.invalid");
}
