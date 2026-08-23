import type { Articulo, BloqueArticulo } from "@/contenido/articulos/tipos";

/**
 * MARKDOWN PARA AGENTES: la misma página, sin el ruido del HTML.
 *
 * Un agente que pide `Accept: text/markdown` recibe la ficha, la tienda, el
 * artículo o la portada en Markdown. Para lo que tiene datos (productos,
 * tiendas, artículos) se arma DESDE LOS DATOS, que es exacto y barato; para el
 * resto se convierte el HTML ya dibujado con `htmlAMarkdown`, que no necesita
 * DOM (corre en el borde) y se queda con lo que importa: títulos, párrafos,
 * listas, enlaces e imágenes del `<main>`.
 */

export function tokensAprox(texto: string): number {
  /* Cuatro caracteres por token es la cuenta de siempre para texto en
     español e inglés; sirve para que el agente sepa cuánto va a gastar. */
  return Math.ceil(texto.length / 4);
}

const ENTIDADES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  "&hellip;": "…",
  "&mdash;": "—",
  "&ndash;": "–",
  "&laquo;": "«",
  "&raquo;": "»",
  "&middot;": "·",
};

export function decodificarEntidades(texto: string): string {
  return texto
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) =>
      String.fromCodePoint(parseInt(h, 16)),
    )
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&[a-z]+;/gi, (e) => ENTIDADES[e.toLowerCase()] ?? e);
}

function absoluta(href: string, base: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

/** Convierte el HTML de una página en Markdown legible. Sin DOM, a propósito. */
export function htmlAMarkdown(
  html: string,
  base = "https://mercatren.com",
): string {
  let h = html;
  /* Lo que no es contenido. */
  h = h.replace(/<!--[\s\S]*?-->/g, "");
  h = h.replace(/<head\b[\s\S]*?<\/head>/i, "");
  h = h.replace(
    /<(script|style|noscript|template|svg|iframe|canvas|video|audio|select|textarea|button)\b[\s\S]*?<\/\1>/gi,
    "",
  );
  /* El encabezado, el pie y la navegación se repiten en todas las páginas. */
  h = h.replace(/<(header|footer|nav|aside)\b[\s\S]*?<\/\1>/gi, "");
  /**
   * OJO CON EL STREAMING: React manda el contenido de la página FUERA de
   * `<main>`, en `<div hidden id="S:…">` al final del documento, y deja dentro
   * de `<main>` solo el hueco. Quedarse con `<main>` daba páginas vacías
   * (medido el 23 ago 2026). Se convierten las dos versiones —solo el main y
   * el cuerpo entero sin encabezado ni pie— y gana la más completa.
   */
  const principal = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(h);
  if (principal) {
    const soloMain = bloquesAMarkdown(principal[1]!, base);
    const entero = bloquesAMarkdown(h, base);
    return entero.length > soloMain.length * 1.5 ? entero : soloMain;
  }
  return bloquesAMarkdown(h, base);
}

function bloquesAMarkdown(fragmento: string, base: string): string {
  let h = fragmento;

  /* Bloques. */
  h = h.replace(
    /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi,
    (_, n: string, t: string) =>
      `\n\n${"#".repeat(Number(n))} ${limpiarEnLinea(t, base)}\n\n`,
  );
  h = h.replace(
    /<li\b[^>]*>([\s\S]*?)<\/li>/gi,
    (_, t: string) => `\n- ${limpiarEnLinea(t, base)}`,
  );
  h = h.replace(
    /<(p|div|section|article|ul|ol|dl|dd|dt|tr|blockquote|figure|figcaption|summary|details|table|thead|tbody)\b[^>]*>/gi,
    "\n",
  );
  h = h.replace(
    /<\/(p|div|section|article|ul|ol|dl|dd|dt|tr|blockquote|figure|figcaption|summary|details|table|thead|tbody)>/gi,
    "\n",
  );
  h = h.replace(
    /<(td|th)\b[^>]*>([\s\S]*?)<\/\1>/gi,
    (_, __, t: string) => ` ${limpiarEnLinea(t, base)} |`,
  );
  h = h.replace(/<br\s*\/?>/gi, "\n");
  h = h.replace(/<hr\s*\/?>/gi, "\n\n---\n\n");
  h = limpiarEnLinea(h, base);
  return h
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function limpiarEnLinea(fragmento: string, base: string): string {
  let t = fragmento;
  t = t.replace(/<img\b[^>]*>/gi, (img) => {
    const alt = /\balt="([^"]*)"/i.exec(img)?.[1] ?? "";
    const src = /\bsrc="([^"]*)"/i.exec(img)?.[1] ?? "";
    if (!src || src.startsWith("data:")) return "";
    return `![${decodificarEntidades(alt)}](${absoluta(src, base)})`;
  });
  t = t.replace(
    /<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
    (_, href: string, texto: string) => {
      const limpio = texto
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (!limpio) return "";
      if (href.startsWith("#") || href.startsWith("javascript:")) return limpio;
      return `[${decodificarEntidades(limpio)}](${absoluta(href, base)})`;
    },
  );
  t = t.replace(
    /<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi,
    (_, __, x: string) => `**${x.replace(/<[^>]+>/g, "").trim()}**`,
  );
  t = t.replace(
    /<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi,
    (_, __, x: string) => `*${x.replace(/<[^>]+>/g, "").trim()}*`,
  );
  t = t.replace(
    /<code\b[^>]*>([\s\S]*?)<\/code>/gi,
    (_, x: string) => `\`${x.replace(/<[^>]+>/g, "")}\``,
  );
  t = t.replace(/<[^>]+>/g, "");
  return decodificarEntidades(t);
}

/** Un artículo del blog o de la documentación, bloque por bloque. */
export function articuloAMarkdown(
  a: Articulo,
  base: string,
  locale: string,
): string {
  const partes: string[] = [
    `# ${a.titulo}`,
    "",
    `*${a.fecha}*`,
    "",
    a.resumen,
    "",
  ];
  for (const b of a.cuerpo) partes.push(bloqueAMarkdown(b, base), "");
  if (a.enlaces?.length) {
    partes.push("## Enlaces", "");
    for (const e of a.enlaces)
      partes.push(`- [${e.texto}](${absoluta(e.href, base)})`);
  }
  partes.push(
    "",
    `Fuente: ${base}/${locale}/${a.tipo === "novedad" ? "blog" : "docs"}/${a.slug}`,
  );
  return partes
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function bloqueAMarkdown(b: BloqueArticulo, base: string): string {
  switch (b.tipo) {
    case "parrafo":
      return b.texto;
    case "subtitulo":
      return `## ${b.texto}`;
    case "lista":
      return b.puntos.map((p) => `- ${p}`).join("\n");
    case "pasos":
      return b.pasos
        .map((p, i) => `${i + 1}. **${p.titulo}** — ${p.texto}`)
        .join("\n");
    case "aviso":
      return `> **${b.titulo}** ${b.texto}`;
    case "tabla": {
      const cab = `| ${b.encabezados.join(" | ")} |`;
      const sep = `| ${b.encabezados.map(() => "---").join(" | ")} |`;
      const filas = b.filas.map((f) => `| ${f.join(" | ")} |`);
      return [cab, sep, ...filas, b.nota ? `\n_${b.nota}_` : ""].join("\n");
    }
    case "imagen":
      return `![${b.alt}](${absoluta(b.src, base)})${b.pie ? `\n_${b.pie}_` : ""}`;
    case "boton":
      return `[${b.texto}](${absoluta(b.href, base)})`;
  }
}

export type ProductoEnMarkdown = {
  titulo: string;
  precio: string;
  tienda: string;
  tiendaUrl: string;
  url: string;
  pais: string | null;
  imagen?: string | null;
};

export function listaDeProductosAMarkdown(
  productos: ProductoEnMarkdown[],
): string {
  if (productos.length === 0) return "_No hay productos._";
  return productos
    .map(
      (p) =>
        `- [${p.titulo}](${p.url}) — ${p.precio} · [${p.tienda}](${p.tiendaUrl})${p.pais === "US" ? " · se despacha en Estados Unidos" : ""}`,
    )
    .join("\n");
}
