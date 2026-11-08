import "server-only";

import { obtenerUsuario } from "@/lib/autorizacion";

import { tiendasBloqueadasPor } from "./para-la-app";

/**
 * EL BLOQUEO TAMBIÉN VALE EN LA WEB (8 nov 2026, dictamen de Google Play).
 *
 * La ficha y la tienda ya leen la sesión (son dinámicas); aquí solo se
 * pregunta si quien mira bloqueó a ese vendedor. Sin sesión no se toca la
 * base de bloqueos.
 */
export async function bloqueoAlVendedor(tiendaSlug: string): Promise<boolean> {
  const usuario = await obtenerUsuario().catch(() => null);
  if (!usuario) return false;
  const bloqueadas = await tiendasBloqueadasPor(usuario.id).catch((fallo) => {
    console.error("[moderacion/web] no se pudieron leer los bloqueos:", fallo);
    return new Set<string>();
  });
  return bloqueadas.has(tiendaSlug);
}
