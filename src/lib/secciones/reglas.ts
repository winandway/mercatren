/**
 * LAS SECCIONES DE VIDEO DE MERCATREN: LAS REGLAS (24 ago 2026).
 *
 * Puro y con pruebas. Lo que toca la base vive en `consultas.ts` y
 * `acciones.ts`; lo que decide, aquí.
 */

/** La primera sección, la que pidió el dueño. Las demás se crean en el panel. */
export const SECCION_INICIAL = {
  slug: "tu-proximo-producto-ganador",
  nombreEs: "Tu Próximo Producto Ganador",
  nombreEn: "Your Next Winning Product",
  descripcionEs:
    "Vamos a los almacenes que trabajan con nosotros y te enseñamos productos que se están vendiendo. Sin vueltas: qué es, para quién y por qué funciona.",
  descripcionEn:
    "We visit the warehouses we work with and show you products that are selling. Straight to the point: what it is, who it's for and why it works.",
} as const;

/**
 * CUÁNTO PUEDE DURAR UN VIDEO DE SECCIÓN.
 *
 * El dueño graba de 15 segundos a 1 minuto. El tope se deja en los mismos 3
 * minutos que un video de comercio —el mismo `revisarVideo` los comprueba— y
 * el mínimo en 3 segundos: por debajo de eso es un toque sin querer al botón
 * de grabar, no un video.
 */
export const DURACIONES_SUGERIDAS = [15, 30, 60] as const;

/** Un PIN válido: exactamente cuatro dígitos. */
export function esPinValido(pin: string): boolean {
  return /^[0-9]{4}$/.test(pin);
}

/**
 * PINES QUE NO SE ACEPTAN.
 *
 * Cuatro dígitos son diez mil combinaciones, y de esas hay un puñado que
 * prueba cualquiera de primero. Con `1234` puesto, la segunda capa no existe.
 */
export const PINES_PROHIBIDOS = new Set([
  "0000",
  "1111",
  "2222",
  "3333",
  "4444",
  "5555",
  "6666",
  "7777",
  "8888",
  "9999",
  "1234",
  "4321",
  "0123",
  "1212",
  "2121",
  "1122",
  "6969",
  "1010",
  "2580",
  "0852",
]);

export function revisarPin(
  pin: string,
): { ok: true } | { ok: false; motivo: "formato" | "obvio" } {
  if (!esPinValido(pin)) return { ok: false, motivo: "formato" };
  if (PINES_PROHIBIDOS.has(pin)) return { ok: false, motivo: "obvio" };
  return { ok: true };
}

/**
 * El slug público de una sección, a partir de su nombre.
 *
 * Se calcula una vez, al crearla: después NO se toca, porque es la dirección
 * que circula y la que indexa Google.
 */
export function slugDeSeccion(nombre: string): string {
  const limpio = nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return limpio || "seccion";
}

/**
 * ¿A DÓNDE LLEVA EL BOTÓN DE UN VIDEO?
 *
 * Es la regla que define una sección y por eso es una función con pruebas, no
 * un `if` suelto dentro del visor.
 *
 * - Un video de un COMERCIO lleva a su tienda: es su vitrina y su venta.
 * - Un video de una SECCIÓN lleva a Mercatren — al catálogo, donde la persona
 *   puede buscar lo que acaba de ver. Nunca a una tienda concreta: en cuanto
 *   una recomendación empuja a un comercio deja de ser recomendación.
 */
export function destinoDelVideo(video: {
  seccionSlug?: string | null;
  tiendaSlug: string;
}): { tipo: "seccion"; href: string } | { tipo: "tienda"; href: string } {
  if (video.seccionSlug) return { tipo: "seccion", href: "/catalogo" };
  return { tipo: "tienda", href: `/tienda/${video.tiendaSlug}` };
}

/**
 * El nombre de la cookie que recuerda el PIN en ese teléfono.
 *
 * Vive aquí y no en `acciones.ts` porque un archivo `"use server"` solo puede
 * exportar funciones asíncronas: cualquier ayudante suelto ahí revienta la
 * compilación entera con «Server Actions must be async functions».
 *
 * Lleva un trozo de la llave para que dos secciones no compartan cookie, y
 * solo un trozo: la cookie viaja en cada petición y no hace falta que cargue
 * el secreto completo.
 */
export function cookieDeSeccion(llave: string): string {
  return `mt-seccion-${llave.slice(0, 12)}`;
}
