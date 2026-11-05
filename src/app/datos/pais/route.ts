import { eq } from "drizzle-orm";

import { cabeceraDeCookie, decidirPais } from "@/lib/mercado/elegir-pais";

/**
 * A DONDE LLEVAN LAS BANDERAS DE «MERCATREN EN EL MUNDO» (27 oct 2026).
 *
 * `GET /datos/pais?a=ES&idioma=es` pone el país elegido y lleva a su
 * portada. La lógica entera vive en `mercado/elegir-pais.ts`; aquí solo se
 * convierte en una redirección.
 *
 * Es un GET porque lo dispara un enlace (funciona sin JavaScript y en la
 * app), y no cambia nada que importe: solo una preferencia de quien mira.
 * Nunca se guarda en ninguna caché: la respuesta lleva su cookie.
 *
 * ══ EL PAÍS VA EN LA CUENTA (una sola Mercatren, 5 nov 2026) ══
 *
 * Con sesión, el país elegido se guarda también en la cuenta
 * (`paisEntrega`), así al entrar desde otro aparato la persona vuelve a su
 * país. Es una escritura por una elección explícita (nunca por mirar) y solo
 * si cambió. `luego` deja seguir a la cuenta o al panel (solo esas dos).
 */
export const dynamic = "force-dynamic";

export async function GET(peticion: Request) {
  const url = new URL(peticion.url);
  const decision = decidirPais(
    url.searchParams.get("a"),
    url.searchParams.get("idioma"),
    peticion.headers.get("host"),
    url.searchParams.get("luego"),
  );

  await recordarEnLaCuenta(decision.mercado.codigo);

  const cabeceras = new Headers({
    Location: decision.destino,
    "Cache-Control": "no-store",
  });
  const cookie = cabeceraDeCookie(
    decision,
    process.env.NODE_ENV === "production",
  );
  if (cookie) cabeceras.append("Set-Cookie", cookie);

  return new Response(null, { status: 303, headers: cabeceras });
}

/** Guarda el país en la cuenta de quien tiene sesión, si cambió. */
async function recordarEnLaCuenta(codigo: string): Promise<void> {
  try {
    const { obtenerUsuario } = await import("@/lib/autorizacion");
    const usuario = await obtenerUsuario().catch(() => null);
    if (!usuario) return;
    const actual = (usuario as { paisEntrega?: string | null }).paisEntrega;
    if (actual === codigo) return;
    const { getDb } = await import("@/lib/db");
    const { user } = await import("@/lib/db/schema");
    await getDb()
      .update(user)
      .set({ paisEntrega: codigo })
      .where(eq(user.id, usuario.id));
  } catch (fallo) {
    /* Elegir el país no se cae por esto: la cookie ya lo deja puesto. */
    console.error("[pais] no se pudo guardar en la cuenta", fallo);
  }
}
