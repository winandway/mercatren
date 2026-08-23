import {
  articuloAMarkdown,
  htmlAMarkdown,
  listaDeProductosAMarkdown,
  tokensAprox,
  type ProductoEnMarkdown,
} from "@/lib/agentes/markdown";
import { origenDe } from "@/lib/agentes/origen";
import { recursosDe } from "@/lib/agentes/recursos";
import { serviciosMcp } from "@/lib/agentes/servicios";
import {
  listarDepartamentosDePortada,
  listarProductos,
  parrillaDeProductos,
  type ProductoLista,
} from "@/lib/catalogo/consultas";
import { articulosPorTipo, buscarArticulo } from "@/contenido/articulos";
import { formatearPrecio } from "@/lib/dinero";
import { mercadoDeLaPeticion } from "@/lib/mercado/repositorio";
import { SITIO } from "@/lib/sitio";
import { SOCIEDAD } from "@/lib/sociedad";

export const dynamic = "force-dynamic";

/**
 * MARKDOWN PARA AGENTES.
 *
 * El middleware reescribe aquí cualquier página pública pedida con
 * `Accept: text/markdown`. Para lo que tiene datos (portada, ficha, tienda,
 * catálogo, artículos) el Markdown se arma DESDE LOS DATOS; para el resto se
 * trae el HTML de la propia página y se convierte. Siempre se contesta
 * `text/markdown` con `x-markdown-tokens`, que es lo que un agente mira para
 * saber cuánto va a gastar.
 */
export async function GET(peticion: Request) {
  const url = new URL(peticion.url);
  /* La ruta llega en la cabecera que pone el middleware (tras una reescritura
     `request.url` es el original), o en `?ruta=` cuando se llama directo, o
     —si la piden a pelo— del propio camino de la petición. */
  const rutaCruda =
    peticion.headers.get("x-ruta-markdown") ??
    url.searchParams.get("ruta") ??
    (url.pathname.startsWith("/datos/markdown")
      ? "/es"
      : url.pathname + url.search);
  const ruta = rutaCruda.replace(/[^\w\-./?=&%+:,@~]/g, "");
  const base = origenDe(peticion);
  const destino = new URL(ruta, base);
  const partes = destino.pathname.split("/").filter(Boolean);
  const locale: "es" | "en" = partes[0] === "en" ? "en" : "es";
  const resto =
    partes[0] === "es" || partes[0] === "en" ? partes.slice(1) : partes;

  let md: string | null = null;
  try {
    const mercado = await mercadoDeLaPeticion();
    const s = serviciosMcp(mercado, base, locale);
    const lista = (productos: ProductoLista[]): ProductoEnMarkdown[] =>
      productos.map((p) => ({
        titulo: (locale === "en" ? p.tituloEn : null) ?? p.tituloEs,
        precio: formatearPrecio(p.precioCentavos, locale, p.moneda),
        tienda: p.tiendaNombre,
        tiendaUrl: `${base}/${locale}/tienda/${p.tiendaSlug}`,
        url: `${base}/${locale}/producto/${p.slug}`,
        pais: p.tiendaPais,
      }));

    if (resto.length === 0) {
      const [parrilla, departamentos, tiendas] = await Promise.all([
        parrillaDeProductos(mercado, 7919, 1, 24),
        listarDepartamentosDePortada(mercado, locale),
        s.listarTiendas(),
      ]);
      const r = recursosDe(base);
      md = [
        `# ${SITIO.nombre}`,
        "",
        locale === "en"
          ? `Marketplace operated by ${SOCIEDAD.nombre} (Michigan, USA). Buyers pay in US dollars by card (or Zelle from $200); goods are picked up at the selling store in Venezuela or shipped within the United States.`
          : `Marketplace operado por ${SOCIEDAD.nombre} (Michigan, Estados Unidos). Se paga en dólares con tarjeta (o Zelle desde $200); la mercancía se retira en el comercio de Venezuela que la vende o se despacha en Estados Unidos.`,
        "",
        `## ${locale === "en" ? "Departments" : "Departamentos"}`,
        departamentos
          .map(
            (d) =>
              `- [${d.nombre}](${base}/${locale}/catalogo?categoria=${d.slug}) (${d.cuantos})`,
          )
          .join("\n"),
        "",
        `## ${locale === "en" ? "From every store" : "De todas las tiendas"}`,
        listaDeProductosAMarkdown(lista(parrilla.productos)),
        "",
        `## ${locale === "en" ? "Stores" : "Comercios"}`,
        tiendas
          .map(
            (t) =>
              `- [${t.nombre}](${t.url}) — ${t.ciudad ?? ""}${t.pais === "US" ? " (US)" : ""} · ${t.productos}`,
          )
          .join("\n"),
        "",
        `## ${locale === "en" ? "For machines" : "Para máquinas"}`,
        `- MCP: ${r.mcp} · OpenAPI: ${r.openapi} · Skills: ${r.skills} · llms.txt: ${r.llms}`,
      ].join("\n");
    } else if (resto[0] === "producto" && resto[1]) {
      const f = await s.verProducto(resto[1]);
      if (f) {
        md = [
          `# ${f.titulo}`,
          "",
          `**${locale === "en" ? "Price" : "Precio"}:** ${f.precio}`,
          `**${locale === "en" ? "Sold by" : "Vendido por"}:** [${f.tienda}](${base}/${locale}/tienda/${f.tiendaSlug})`,
          f.pais === "US"
            ? `**${locale === "en" ? "Delivery" : "Entrega"}:** ${locale === "en" ? "ships within the United States, shipping included in the price." : "se despacha en Estados Unidos, envío incluido en el precio."}`
            : `**${locale === "en" ? "Pick up at" : "Se retira en"}:** ${f.seRetiraEn ?? "—"}${f.direccion ? ` — ${f.direccion}` : ""}`,
          f.marca
            ? `**${locale === "en" ? "Brand" : "Marca"}:** ${f.marca}`
            : "",
          f.categoria
            ? `**${locale === "en" ? "Category" : "Categoría"}:** ${f.categoria}`
            : "",
          f.existencias !== null
            ? `**${locale === "en" ? "In stock" : "Existencias"}:** ${f.existencias}`
            : "",
          f.imagen ? `\n![${f.titulo}](${f.imagen})` : "",
          f.descripcion ? `\n${f.descripcion}` : "",
          "",
          `${locale === "en" ? "Product page" : "Ficha"}: ${f.url}`,
        ]
          .filter((l) => l !== "")
          .join("\n");
      }
    } else if (resto[0] === "tienda" && resto[1]) {
      const r = await s.verTienda(resto[1]);
      if (r) {
        const t = r.tienda;
        md = [
          `# ${t.nombre}`,
          "",
          t.ciudad
            ? `**${locale === "en" ? "City" : "Ciudad"}:** ${t.ciudad}${t.pais === "US" ? " (US)" : ""}`
            : "",
          t.direccion
            ? `**${locale === "en" ? "Address" : "Dirección"}:** ${t.direccion}`
            : "",
          t.descripcion ? `\n${t.descripcion}` : "",
          "",
          `## ${locale === "en" ? "Products" : "Productos"} (${t.productos})`,
          listaDeProductosAMarkdown(
            r.productos.map((p) => ({
              titulo: p.titulo,
              precio: p.precio,
              tienda: p.tienda,
              tiendaUrl: t.url,
              url: p.url,
              pais: p.pais,
            })),
          ),
          "",
          `${locale === "en" ? "Store page" : "Tienda"}: ${t.url}`,
        ]
          .filter((l) => l !== "")
          .join("\n");
      }
    } else if (resto[0] === "tiendas" && !resto[1]) {
      const tiendas = await s.listarTiendas();
      md = [
        `# ${locale === "en" ? "Stores on Mercatren" : "Comercios en Mercatren"}`,
        "",
        ...tiendas.map(
          (t) =>
            `- [${t.nombre}](${t.url}) — ${t.ciudad ?? ""}${t.pais === "US" ? " (US)" : ""} · ${t.productos}`,
        ),
      ].join("\n");
    } else if (resto[0] === "catalogo" && !resto[1]) {
      const q = destino.searchParams.get("q")?.trim() || undefined;
      const categoria =
        destino.searchParams.get("categoria")?.trim() || undefined;
      const comercio =
        destino.searchParams.get("comercio")?.trim() || undefined;
      const pagina = Math.max(
        1,
        Number(destino.searchParams.get("pagina")) || 1,
      );
      const r = await listarProductos(mercado, {
        busqueda: q,
        categoria,
        comercio,
        pagina,
        porPagina: 24,
      });
      md = [
        `# ${locale === "en" ? "Catalog" : "Catálogo"}${q ? ` · «${q}»` : ""}${categoria ? ` · ${categoria}` : ""}`,
        "",
        `${locale === "en" ? "Page" : "Página"} ${r.pagina} / ${r.paginas}`,
        "",
        listaDeProductosAMarkdown(lista(r.productos)),
      ].join("\n");
    } else if ((resto[0] === "docs" || resto[0] === "blog") && resto[1]) {
      const a = buscarArticulo(locale, resto[1]);
      if (a) md = articuloAMarkdown(a, base, locale);
    } else if ((resto[0] === "docs" || resto[0] === "blog") && !resto[1]) {
      const tipo = resto[0] === "blog" ? "novedad" : "documentacion";
      const lista = articulosPorTipo(locale, tipo);
      md = [
        `# ${resto[0] === "blog" ? "Blog" : locale === "en" ? "Documentation" : "Documentación"}`,
        "",
        ...lista.map(
          (a) =>
            `- [${a.titulo}](${base}/${locale}/${resto[0]}/${a.slug}) — ${a.fecha}. ${a.resumen}`,
        ),
      ].join("\n");
    }
  } catch (e) {
    console.error("[markdown] no se pudo armar desde los datos:", e);
  }

  /* Lo demás: la propia página, convertida. Se pide como HTML para no entrar
     en bucle con el middleware. */
  if (md === null) {
    try {
      const r = await fetch(destino.toString(), {
        headers: {
          accept: "text/html",
          "accept-language": locale,
          "user-agent": "mercatren-markdown/1.0",
        },
        redirect: "follow",
      });
      if (r.ok) {
        const html = await r.text();
        const titulo = /<title>([^<]*)<\/title>/i.exec(html)?.[1]?.trim();
        const cuerpo = htmlAMarkdown(html, base);
        /* El título solo si el cuerpo no arranca ya con su propio h1. */
        const yaTieneTitulo = /^#\s/.test(cuerpo);
        md = `${titulo && !yaTieneTitulo ? `# ${titulo.replace(/\s*\|\s*Mercatren$/, "")}\n\n` : ""}${cuerpo}`;
      }
    } catch (e) {
      console.error("[markdown] no se pudo traer la página:", e);
    }
  }
  if (md === null || md.trim() === "") {
    md = `# ${SITIO.nombre}\n\n${destino.toString()}`;
  }

  return new Response(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
      "x-markdown-tokens": String(tokensAprox(md)),
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300",
    },
  });
}
