import { z } from "zod";

import { CAMPOS, opcional } from "@/lib/validacion/campos";

/**
 * Lo que se acepta al cerrar una compra.
 *
 * Se valida en el servidor SIEMPRE, aunque el formulario ya haya revisado: lo
 * que llega del navegador puede venir de cualquier parte.
 */

/**
 * TODO SE RETIRA EN EL DEPÓSITO: aquí no se pide dirección de entrega.
 *
 * Antes este esquema exigía país, calle y referencia, como si repartiéramos —
 * y cada ficha del sitio dice lo contrario. Lo que hace falta para un retiro
 * es saber QUIÉN va a buscarlo, un teléfono para avisarle y su ciudad. Los
 * campos viejos quedan opcionales para no romper pedidos ya guardados.
 */
export const esquemaEntrega = z.object({
  /**
   * LAS MISMAS REGLAS QUE APLICA LA PANTALLA.
   *
   * Antes esto solo miraba el largo: un teléfono de "llámame por WhatsApp"
   * pasaba con 25 caracteres, y el día de coordinar el retiro no había a quién
   * llamar. Ahora el servidor exige exactamente lo mismo que el formulario
   * —`src/lib/validacion/campos.ts`—, así que da igual por dónde llegue el
   * dato: si no es un teléfono, no entra.
   *
   * Los mensajes son claves de traducción; `crearPedido` las convierte al
   * idioma de quien compra.
   */
  nombre: CAMPOS.nombrePersona.esquema,
  telefono: CAMPOS.telefono.esquema,
  ciudad: CAMPOS.ciudad.esquema,

  /* Campos de cuando el sitio pedía dirección de entrega. Se quedan opcionales
     para no romper los pedidos ya guardados. */
  pais: opcional(CAMPOS.textoCorto),
  direccion: opcional(CAMPOS.direccion),
  referencia: opcional(CAMPOS.textoCorto),
  notas: opcional(CAMPOS.textoCorto),
});

export type Entrega = z.infer<typeof esquemaEntrega>;

export const esquemaLinea = z.object({
  productoId: z.string().min(1),
  cantidad: z.number().int().min(1).max(999),
});

export const esquemaPedido = z.object({
  entrega: esquemaEntrega,
  metodoPago: z.enum(["zelle", "stripe", "billetera"]),
  lineas: z.array(esquemaLinea).min(1, "El carrito está vacío."),
});

export type DatosPedido = z.infer<typeof esquemaPedido>;
