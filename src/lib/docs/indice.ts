/**
 * EL ÍNDICE DE DOCS (23 ago 2026): qué secciones hay, con qué ícono, y qué
 * va en cada una.
 *
 * Regla de la casa: la sección se llama «Docs» (nunca «Documentación»), se ve
 * como la de YaDominios —barra lateral con secciones e íconos, buscador, cada
 * guía en su propia página con su enlace fijo— y con los colores de la casa.
 *
 * Las guías escritas (`src/contenido/articulos`, tipo `documentacion`) entran
 * solas en su sección por el tema que declaran; las páginas fijas del sitio
 * (cómo funciona, entrega, términos…) y los recursos para máquinas van aquí,
 * con su clave de texto. El buscador de la portada de Docs recorre TODO esto.
 */
import type { Articulo } from "@/contenido/articulos/tipos";

export type IdSeccion =
  "empezar" | "compradores" | "comercios" | "desarrolladores" | "legal";

export const SECCIONES: {
  id: IdSeccion;
  icono: "route" | "bag" | "store" | "bot" | "scale";
}[] = [
  { id: "empezar", icono: "route" },
  { id: "compradores", icono: "bag" },
  { id: "comercios", icono: "store" },
  { id: "desarrolladores", icono: "bot" },
  { id: "legal", icono: "scale" },
];

/** Páginas fijas del sitio que también son Docs. La clave es la del texto (`docs.enlaces.<clave>`). */
export const ENLACES_FIJOS: {
  seccion: IdSeccion;
  clave: string;
  href: string;
  externo?: boolean;
}[] = [
  { seccion: "empezar", clave: "comoFunciona", href: "/como-funciona" },
  { seccion: "empezar", clave: "modelo", href: "/docs/modelo-de-negocio" },
  { seccion: "empezar", clave: "transparencia", href: "/transparencia" },
  { seccion: "empezar", clave: "nosotros", href: "/nosotros" },
  { seccion: "compradores", clave: "entrega", href: "/entrega" },
  { seccion: "compradores", clave: "devoluciones", href: "/devoluciones" },
  { seccion: "compradores", clave: "ayuda", href: "/ayuda" },
  { seccion: "comercios", clave: "vender", href: "/vender" },
  { seccion: "comercios", clave: "comisiones", href: "/vender/comisiones" },
  {
    seccion: "desarrolladores",
    clave: "openapi",
    href: "/datos/openapi.json",
    externo: true,
  },
  {
    seccion: "desarrolladores",
    clave: "mcp",
    href: "/.well-known/mcp/server-card.json",
    externo: true,
  },
  {
    seccion: "desarrolladores",
    clave: "skills",
    href: "/.well-known/agent-skills/index.json",
    externo: true,
  },
  {
    seccion: "desarrolladores",
    clave: "authMd",
    href: "/auth.md",
    externo: true,
  },
  {
    seccion: "desarrolladores",
    clave: "llms",
    href: "/llms.txt",
    externo: true,
  },
  { seccion: "legal", clave: "terminos", href: "/terminos" },
  { seccion: "legal", clave: "privacidad", href: "/privacidad" },
];

/** A qué sección va una guía escrita, por sus temas. Lo primero que calce manda. */
export function seccionDeGuia(temas: readonly string[]): IdSeccion {
  const t = temas.map((x) => x.toLowerCase());
  if (
    t.some((x) =>
      ["desarrolladores", "api", "agentes", "mcp", "integraciones"].includes(x),
    )
  )
    return "desarrolladores";
  if (
    t.some((x) =>
      [
        "comercios",
        "panel",
        "cobros",
        "fiscal",
        "crédito",
        "credito",
        "retiros",
      ].includes(x),
    )
  )
    return "comercios";
  if (
    t.some((x) =>
      ["compradores", "entrega", "devoluciones", "pagos"].includes(x),
    )
  )
    return "compradores";
  if (
    t.some((x) => ["legal", "términos", "terminos", "privacidad"].includes(x))
  )
    return "legal";
  return "empezar";
}

export type EntradaDocs = {
  seccion: IdSeccion;
  href: string;
  titulo: string;
  resumen: string;
  /** Para el buscador: palabras extra (temas). */
  temas: string[];
  externo?: boolean;
  esGuia?: boolean;
};

/**
 * Todas las entradas, resueltas con los textos del idioma. `textoDe(clave,
 * campo)` devuelve el nombre/resumen de un enlace fijo; las guías traen el
 * suyo. Puro: recibe las guías y la función de textos, devuelve la lista.
 */
export function entradasDeDocs(
  guias: readonly Articulo[],
  textoDe: (clave: string, campo: "nombre" | "resumen") => string,
): EntradaDocs[] {
  const fijas: EntradaDocs[] = ENLACES_FIJOS.map((e) => ({
    seccion: e.seccion,
    href: e.href,
    titulo: textoDe(e.clave, "nombre"),
    resumen: textoDe(e.clave, "resumen"),
    temas: [],
    externo: e.externo,
  }));
  const escritas: EntradaDocs[] = guias
    .filter((g) => g.tipo === "documentacion" && g.slug !== "modelo-de-negocio")
    .map((g) => ({
      seccion: seccionDeGuia(g.temas),
      href: `/docs/${g.slug}`,
      titulo: g.titulo,
      resumen: g.resumen,
      temas: g.temas,
      esGuia: true,
    }));
  /* Dentro de cada sección: primero las páginas fijas (son la puerta), luego las guías. */
  return [...fijas, ...escritas];
}

export function porSeccion(
  entradas: readonly EntradaDocs[],
): Record<IdSeccion, EntradaDocs[]> {
  const base: Record<IdSeccion, EntradaDocs[]> = {
    empezar: [],
    compradores: [],
    comercios: [],
    desarrolladores: [],
    legal: [],
  };
  for (const e of entradas) base[e.seccion].push(e);
  return base;
}

/** Normaliza para buscar: sin acentos, sin mayúsculas. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** El buscador: todas las palabras escritas tienen que aparecer en título, resumen o temas. */
export function buscarEnDocs(
  entradas: readonly EntradaDocs[],
  consulta: string,
  maximo = 8,
): EntradaDocs[] {
  const palabras = normalizar(consulta)
    .split(/\s+/)
    .filter((p) => p.length >= 2);
  if (palabras.length === 0) return [];
  /* «w8ben» tiene que encontrar «W-8BEN-E»: se compara también sin signos. */
  const sinSignos = (t: string) => t.replace(/[^a-z0-9\s]/g, "");
  const puntuadas = entradas
    .map((e) => {
      const titulo = normalizar(e.titulo);
      const resto = normalizar(`${e.resumen} ${e.temas.join(" ")}`);
      const tituloPlano = sinSignos(titulo);
      const restoPlano = sinSignos(resto);
      const calza = (p: string) => {
        const pp = sinSignos(p);
        return (
          titulo.includes(p) ||
          resto.includes(p) ||
          (pp.length >= 2 &&
            (tituloPlano.includes(pp) || restoPlano.includes(pp)))
        );
      };
      if (!palabras.every(calza)) return null;
      const enTitulo = palabras.filter(
        (p) => titulo.includes(p) || tituloPlano.includes(sinSignos(p)),
      ).length;
      return { e, puntos: enTitulo * 2 + (e.esGuia ? 1 : 0) };
    })
    .filter((x): x is { e: EntradaDocs; puntos: number } => x !== null)
    .sort((a, b) => b.puntos - a.puntos);
  return puntuadas.slice(0, maximo).map((x) => x.e);
}
