import {
  esMercadoPrincipal,
  MERCADO_PRINCIPAL,
  MERCADOS,
  type Mercado,
} from "@/lib/mercado/mercados";
import { dentroDeMercatren } from "@/lib/mercado/interruptores";
import type { DecisionDePais, Idioma } from "@/lib/mercado/elegir-pais";

/**
 * LAS PÁGINAS LEGALES DEL PAÍS QUE ELIGIÓ LA PERSONA, DESDE LA APP (5 nov
 * 2026, Fase 5).
 *
 * Los términos, la privacidad, la ayuda y las devoluciones dicen cosas
 * distintas en cada país (`paraElMercado`), y la web decide el país por el
 * dominio o por la galleta de la bandera. La app abre esas páginas en un
 * navegador propio, que no sabe en qué país está la persona. Así hacen las
 * tiendas grandes: cada país abre las condiciones de SU tienda.
 *
 * - Un país con dominio propio (Venezuela): su dominio.
 * - Un país que vive dentro de mercatren.com (España): se pone la galleta
 *   de ese país y se abre la página.
 * - Estados Unidos: se quita la galleta (por si quedó otra) y se abre.
 *
 * NUNCA toca la cuenta: abrir los términos no es elegir país. Por eso no pasa
 * por `/datos/pais`, que con sesión guarda el país en la cuenta.
 *
 * Puro, para probarlo sin levantar nada.
 */

/** Lista cerrada: nada de armar desde fuera un salto a otra página. */
export const PAGINAS_LEGALES = [
  "terminos",
  "privacidad",
  "ayuda",
  "devoluciones",
] as const;
export type PaginaLegal = (typeof PAGINAS_LEGALES)[number];

export function esPaginaLegal(valor: unknown): valor is PaginaLegal {
  return (
    typeof valor === "string" &&
    (PAGINAS_LEGALES as readonly string[]).includes(valor)
  );
}

/**
 * La dirección PÚBLICA de cada página (7 nov 2026): en inglés, como
 * manda la regla para Estados Unidos. La clave de arriba ("terminos",
 * "privacidad") es el nombre que ya mandan las apps publicadas a
 * `/datos/app/v1/legal`: no cambia. Solo cambia a dónde lleva.
 */
export const RUTA_DE_LA_PAGINA: Record<PaginaLegal, string> = {
  terminos: "terms",
  privacidad: "privacy",
  ayuda: "ayuda",
  devoluciones: "devoluciones",
};

export function destinoLegal(
  codigo: string | null | undefined,
  idioma: Idioma,
  pagina: PaginaLegal,
): DecisionDePais {
  const limpio = (codigo ?? "").trim().toUpperCase();
  const mercado: Mercado =
    MERCADOS.find((m) => m.codigo === limpio) ?? MERCADO_PRINCIPAL;
  const viveDentro =
    mercado.enElPrincipal === true || dentroDeMercatren(mercado.codigo);

  if (!viveDentro && !esMercadoPrincipal(mercado)) {
    return {
      destino: `https://${mercado.dominio}/${idioma}/${RUTA_DE_LA_PAGINA[pagina]}`,
      cookie: "nada",
      mercado,
    };
  }
  return {
    destino: `/${idioma}/${RUTA_DE_LA_PAGINA[pagina]}`,
    cookie: esMercadoPrincipal(mercado) ? "quitar" : "poner",
    mercado,
  };
}
