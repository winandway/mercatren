import { z } from "zod";

/**
 * Lo que se acepta al cerrar una compra.
 *
 * Se valida en el servidor SIEMPRE, aunque el formulario ya haya revisado: lo
 * que llega del navegador puede venir de cualquier parte.
 */

export const esquemaEntrega = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, "Escribe el nombre de quien recibe.")
    .max(120),
  telefono: z.string().trim().min(7, "Escribe un número de contacto.").max(30),
  pais: z.string().trim().min(2, "Elige el país.").max(60),
  ciudad: z.string().trim().min(2, "Escribe la ciudad.").max(80),
  direccion: z
    .string()
    .trim()
    .min(8, "Escribe la dirección completa.")
    .max(300),
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
