import type {
  FichaMcp,
  ProductoMcp,
  ServiciosMcp,
  TiendaMcp,
} from "@/lib/agentes/mcp";
import {
  listarComerciosDestacados,
  listarProductos,
  obtenerProductoPorSlug,
  obtenerTiendaPorSlug,
  type ProductoLista,
} from "@/lib/catalogo/consultas";
import { formatearPrecio } from "@/lib/dinero";
import { zonaPorNombre, zonaPorSlug } from "@/lib/entrega/zonas";
import type { Mercado } from "@/lib/mercado/mercados";

/**
 * Los servicios REALES del servidor MCP: las mismas consultas del catálogo
 * (con su mercado, como manda el muro), traducidas a lo que un agente
 * necesita leer. La lógica del protocolo está en `mcp.ts`, pura.
 */
export function serviciosMcp(
  mercado: Mercado,
  base: string,
  idioma: "es" | "en" = "es",
): ServiciosMcp {
  const urlProducto = (slug: string) => `${base}/${idioma}/producto/${slug}`;
  const urlTienda = (slug: string) => `${base}/${idioma}/tienda/${slug}`;

  const aProducto = (p: ProductoLista): ProductoMcp => ({
    slug: p.slug,
    titulo: (idioma === "en" ? p.tituloEn : null) ?? p.tituloEs,
    precio: formatearPrecio(p.precioCentavos, idioma, p.moneda),
    tienda: p.tiendaNombre,
    tiendaSlug: p.tiendaSlug,
    pais: p.tiendaPais ? p.tiendaPais.trim().toUpperCase() : null,
    url: urlProducto(p.slug),
    imagen: p.imagenUrl
      ? p.imagenUrl.startsWith("http")
        ? p.imagenUrl
        : `${base}${p.imagenUrl}`
      : null,
  });

  return {
    async buscarProductos(consulta, pagina) {
      const r = await listarProductos(mercado, {
        busqueda: consulta,
        pagina,
        porPagina: 12,
      });
      return {
        productos: r.productos.map(aProducto),
        pagina: r.pagina,
        paginas: r.paginas,
      };
    },

    async verProducto(slug) {
      const f = await obtenerProductoPorSlug(mercado, slug);
      if (!f || f.producto.estado !== "publicado") return null;
      const p = f.producto;
      const pais = f.tiendaPais ? f.tiendaPais.trim().toUpperCase() : null;
      const zona = f.depositoZona
        ? zonaPorSlug(f.depositoZona)
        : zonaPorNombre(f.tiendaCiudad);
      const ficha: FichaMcp = {
        slug: p.slug,
        titulo: (idioma === "en" ? p.tituloEn : null) ?? p.tituloEs,
        precio: formatearPrecio(p.precioCentavos, idioma, p.moneda),
        tienda: f.tiendaNombre,
        tiendaSlug: f.tiendaSlug,
        pais,
        url: urlProducto(p.slug),
        imagen: f.imagenes[0]
          ? f.imagenes[0].url.startsWith("http")
            ? f.imagenes[0].url
            : `${base}${f.imagenes[0].url}`
          : null,
        descripcion:
          (
            (idioma === "en" ? p.descripcionEn : null) ?? p.descripcionEs
          )?.trim() || null,
        marca: p.marca,
        categoria:
          (idioma === "en" ? f.categoriaNombreEn : null) ??
          f.categoriaNombreEs ??
          null,
        existencias: p.controlaExistencias ? Number(p.existencias) : null,
        seRetiraEn:
          pais === "US"
            ? null
            : (zona?.nombre ?? f.tiendaCiudad?.trim() ?? null),
        direccion:
          pais === "US"
            ? null
            : (f.depositoDireccion ?? f.tiendaDireccion ?? null),
      };
      return ficha;
    },

    async listarTiendas() {
      const tiendas = await listarComerciosDestacados(mercado);
      return tiendas.map((t): TiendaMcp => ({
        slug: t.slug,
        nombre: t.nombre,
        ciudad: t.ciudad ?? null,
        pais: t.paisOrigen ? t.paisOrigen.trim().toUpperCase() : null,
        productos: t.cuantos,
        url: urlTienda(t.slug),
      }));
    },

    async verTienda(slug) {
      const r = await obtenerTiendaPorSlug(mercado, slug);
      if (!r || r.tienda.estado !== "activa") return null;
      const t = r.tienda;
      return {
        tienda: {
          slug: t.slug,
          nombre: t.nombre,
          ciudad: t.ciudad ?? null,
          pais: t.paisOrigen ? t.paisOrigen.trim().toUpperCase() : null,
          productos: r.total,
          url: urlTienda(t.slug),
          descripcion:
            (
              (idioma === "en" ? t.descripcionEn : null) ?? t.descripcionEs
            )?.trim() || null,
          direccion: t.direccion ?? null,
        },
        productos: r.productos.map(aProducto),
      };
    },
  };
}
