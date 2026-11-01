import { z } from "zod";

/**
 * LAS REGLAS PURAS DE LOS CASOS DE AYUDA (1 nov 2026).
 *
 * El contrato con el gerente de correo de Richard es el mismo de Divoox
 * (`tumbite/apps/servidor/src/rutas/gerente.ts`): GET de los casos con su
 * chat, y POST para contestar. Aquí vive lo que se puede probar sin base:
 * el número que ve la persona, la forma de cada caso para el gerente (SIN
 * correo, sin la llave del chat, sin pagos ni direcciones) y lo que se acepta
 * al abrir o contestar.
 */

/** El número que ve la persona y el gerente: el mismo para los dos. */
export function numeroDeCaso(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

/** La llave secreta del chat de un caso: 24 caracteres al azar. */
export function nuevoCodigo(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export const MAX_CASOS_POR_HORA = 5;

/** Lo que se acepta al abrir un caso desde «Ayuda». */
export const esquemaCaso = z.object({
  nombre: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(200),
  asunto: z.string().trim().min(1).max(200),
  mensaje: z.string().trim().min(1).max(4000),
  /** La trampa para robots: una persona la deja vacía. */
  sitio_web: z.string().max(0).optional().default(""),
});

/** Lo que se acepta al contestar desde el chat. */
export const esquemaMensajeCliente = z.object({
  texto: z.string().trim().min(1).max(4000),
});

/** Lo que manda el gerente al contestar. */
export const esquemaRespuestaGerente = z.object({
  texto: z.string().trim().min(1).max(4000),
  plantilla: z
    .string()
    .regex(/^P[1-9]$/)
    .optional(),
  cerrar: z.boolean().default(false),
});

export type CasoParaGerente = {
  id: string;
  nombre: string;
  idioma: string;
  asunto: string;
  estado: string;
  creadoEn: Date;
};

export type MensajeParaGerente = {
  casoId: string;
  autor: string;
  texto: string;
  creadoEn: Date;
};

/** Un caso como lo pide el contrato. Nada de correo, llave del chat ni pagos. */
export function ticketParaGerente(
  caso: CasoParaGerente,
  mensajes: MensajeParaGerente[],
) {
  return {
    id: caso.id,
    numero: numeroDeCaso(caso.id),
    app: "mercatren",
    cliente_nombre: caso.nombre,
    idioma: caso.idioma === "en" ? "en" : "es",
    asunto: caso.asunto,
    estado: caso.estado,
    creado: caso.creadoEn.toISOString(),
    mensajes: mensajes
      .filter((m) => m.casoId === caso.id)
      .sort((a, b) => a.creadoEn.getTime() - b.creadoEn.getTime())
      .map((m) => ({
        de: m.autor === "soporte" ? "soporte" : "cliente",
        fecha: m.creadoEn.toISOString(),
        texto: m.texto,
      })),
  };
}

/**
 * ¿Es el secreto del gerente? Se comparan los resúmenes SHA-256 en tiempo
 * constante: comparar el texto con `===` corta en la primera letra distinta y
 * deja adivinar el secreto letra por letra. Sin secreto cargado, nadie pasa.
 */
export async function secretoValido(
  cabecera: string | null | undefined,
  esperado: string | null | undefined,
): Promise<boolean> {
  const limpio = (esperado ?? "").trim();
  if (!limpio || !cabecera?.startsWith("Bearer ")) return false;
  const resumen = async (texto: string) =>
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto)),
    );
  const [a, b] = await Promise.all([
    resumen(cabecera.slice(7).trim()),
    resumen(limpio),
  ]);
  let diferencia = a.length ^ b.length;
  for (let i = 0; i < Math.min(a.length, b.length); i++)
    diferencia |= a[i]! ^ b[i]!;
  return diferencia === 0;
}

/**
 * El límite de intentos de la puerta del gerente: 30 por minuto por
 * dirección. En memoria de cada instancia, como el de Divoox: el freno de
 * verdad es el secreto; esto corta a quien lo prueba a lo bruto.
 */
export function crearLimite(maximo = 30, ventanaMs = 60_000) {
  const registro = new Map<string, { cuenta: number; desde: number }>();
  return (llave: string, ahora = Date.now()): boolean => {
    const r = registro.get(llave);
    if (!r || ahora - r.desde > ventanaMs) {
      registro.set(llave, { cuenta: 1, desde: ahora });
      return true;
    }
    r.cuenta += 1;
    return r.cuenta <= maximo;
  };
}
