import { z } from "zod";

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
  nombre: z
    .string()
    .trim()
    .min(3, "Escribe el nombre de quien retira.")
    .max(120),
  telefono: z.string().trim().min(7, "Escribe un número de contacto.").max(30),
  ciudad: z.string().trim().min(2, "Escribe la ciudad.").max(80),
  pais: z.string().trim().max(60).optional(),
  direccion: z.string().trim().max(300).optional(),
  referencia: z.string().trim().max(200).optional(),
  notas: z.string().trim().max(500).optional(),
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
