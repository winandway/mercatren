import { z } from "zod";

import type { ProductoLista } from "@/lib/catalogo/consultas";
import {
  MERCADOS,
  mercadoPorCodigo,
  nombreDelMercado,
  type Mercado,
} from "@/lib/mercado/mercados";
import { monedaDelMercado } from "@/lib/mercado/moneda";
import { paisesEnLaApp } from "@/lib/mercado/interruptores";
import { ventaPausada } from "@/lib/ventas/pausa";

/**
 * LA PUERTA DE DATOS DE LA APP NATIVA (5 nov 2026, plan PLAN-UNA-SOLA-MERCATREN,
 * sección 10).
 *
 * La web usa acciones del servidor, que una app de teléfono no puede llamar.
 * La app nativa (Expo) lee de `/datos/app/v1/…` (nunca `/api`, que en
 * YaDominios Cloud lo capturan los estáticos). Aquí está lo puro: qué país
 * pide la app, qué se le devuelve de cada producto y con qué cabeceras.
 *
 * NADA INTERNO SALE POR AQUÍ: ni el código ni el id del proveedor, ni el sku,
 * ni el costo, ni el depósito por dentro. La app recibe lo mismo que ve un
 * comprador en la web, y nada más.
 */

/**
 * LOS PAÍSES ENCENDIDOS (Fase 1 del plan): donde la app deja comprar. Un país
 * se enciende solo con su cobro, sus impuestos y su proveedor probados (lista
 * de `ABRIR-UN-PAIS.md`). Hoy, Estados Unidos.
 */
/* Sale del interruptor de cada país (`mercado/interruptores.ts`). */
export const PAISES_ENCENDIDOS: readonly string[] = paisesEnLaApp();

export type IdiomaApp = "es" | "en";

const CODIGOS = MERCADOS.map((m) => m.codigo) as [string, ...string[]];

/** Lo que la app manda en la dirección: el país y el idioma. */
export const esquemaContexto = z.object({
  pais: z.enum(CODIGOS).default("US"),
  idioma: z.enum(["es", "en"]).default("en"),
});

export function contextoDe(
  url: URL,
): { ok: true; mercado: Mercado; idioma: IdiomaApp } | { ok: false } {
  const r = esquemaContexto.safeParse({
    pais: url.searchParams.get("pais")?.toUpperCase() || undefined,
    idioma: url.searchParams.get("idioma")?.toLowerCase() || undefined,
  });
  if (!r.success) return { ok: false };
  return {
    ok: true,
    mercado: mercadoPorCodigo(r.data.pais),
    idioma: r.data.idioma,
  };
}

/** Un país para la pantalla de bienvenida. */
export function paisParaApp(m: Mercado, idioma: IdiomaApp) {
  return {
    codigo: m.codigo,
    nombre: nombreDelMercado(m, idioma),
    moneda: monedaDelMercado(m),
    encendido: PAISES_ENCENDIDOS.includes(m.codigo),
  };
}

export type ProductoApp = {
  id: string;
  slug: string;
  titulo: string;
  precio: { centavos: number; moneda: string };
  precioAntes: { centavos: number; moneda: string } | null;
  foto: string | null;
  fotoAlt: string | null;
  tienda: { nombre: string; slug: string };
  agotado: boolean;
  /** Solo en los promocionados: para contar el clic (ver `lib/ganar`). */
  patrocinado?: { promocionId: string; firma: string };
};

/** El título en el idioma de la app; si falta el inglés, va el español. */
function tituloEn(
  idioma: IdiomaApp,
  es: string,
  en: string | null | undefined,
): string {
  return idioma === "en" && en?.trim() ? en : es;
}

/** Una tarjeta del catálogo, como la ve un comprador. */
export function productoParaApp(
  p: ProductoLista,
  idioma: IdiomaApp,
): ProductoApp {
  return {
    id: p.id,
    slug: p.slug,
    titulo: tituloEn(idioma, p.tituloEs, p.tituloEn),
    precio: { centavos: p.precioCentavos, moneda: p.moneda },
    precioAntes:
      p.precioAntesCentavos && p.precioAntesCentavos > p.precioCentavos
        ? { centavos: p.precioAntesCentavos, moneda: p.moneda }
        : null,
    foto: p.imagenUrl,
    fotoAlt: p.imagenAlt,
    tienda: { nombre: p.tiendaNombre, slug: p.tiendaSlug },
    agotado: p.controlaExistencias && p.existencias <= 0,
  };
}

/** Lo que la ficha necesita de lo que devuelve `obtenerProductoPorSlug`. */
export type FichaDeLaBase = {
  producto: {
    id: string;
    slug: string;
    marca: string | null;
    tituloEs: string;
    tituloEn: string | null;
    descripcionEs: string | null;
    descripcionEn: string | null;
    precioCentavos: number;
    precioAntesCentavos: number | null;
    moneda: string;
    existencias: number;
    controlaExistencias: boolean;
    unidad: string | null;
  };
  tiendaNombre: string;
  tiendaSlug: string;
  /** El país de donde sale la mercancía: decide si la venta está en pausa. */
  tiendaPais?: string | null;
  /** La tienda: si vende lo de un proveedor, la pausa mira el proveedor. */
  tiendaId?: string | null;
  categoriaNombreEs: string | null;
  categoriaNombreEn: string | null;
  imagenes: Array<{
    url: string;
    altEs: string | null;
    altEn: string | null;
  }>;
};

/** La ficha completa para la app. */
export function fichaParaApp(f: FichaDeLaBase, idioma: IdiomaApp) {
  const p = f.producto;
  return {
    id: p.id,
    slug: p.slug,
    titulo: tituloEn(idioma, p.tituloEs, p.tituloEn),
    descripcion:
      idioma === "en" && p.descripcionEn?.trim()
        ? p.descripcionEn
        : (p.descripcionEs ?? ""),
    marca: p.marca,
    precio: { centavos: p.precioCentavos, moneda: p.moneda },
    precioAntes:
      p.precioAntesCentavos && p.precioAntesCentavos > p.precioCentavos
        ? { centavos: p.precioAntesCentavos, moneda: p.moneda }
        : null,
    unidad: p.unidad,
    agotado: p.controlaExistencias && p.existencias <= 0,
    /* La MISMA pausa de la web (`ventas/pausa.ts`): con la venta de un país
       en pausa la ficha se ve, pero no se compra. */
    seVende: !ventaPausada(f.tiendaPais, { tiendaId: f.tiendaId }),
    categoria:
      idioma === "en"
        ? (f.categoriaNombreEn ?? f.categoriaNombreEs)
        : f.categoriaNombreEs,
    tienda: { nombre: f.tiendaNombre, slug: f.tiendaSlug },
    fotos: f.imagenes.map((i) => ({
      url: i.url,
      alt: (idioma === "en" ? i.altEn : i.altEs) ?? i.altEs ?? null,
    })),
  };
}

/**
 * La respuesta: JSON y SIN cookies. La caché del borde (5 minutos) NO se pone
 * aquí: vive en la lista única de `lib/trafico/cache-del-borde.ts`, que lee
 * `next.config.ts`, para que ninguna ruta suelta pueda marcar «pública» una
 * respuesta con sesión. Así un millón de aperturas de la app no son un millón
 * de consultas a la base.
 */
export function respuestaPublica(cuerpo: unknown, estado = 200): Response {
  return Response.json(cuerpo, { status: estado });
}

/** Un error sin caché: que un fallo de un minuto no se quede guardado. */
export function respuestaDeError(motivo: string, estado: number): Response {
  return Response.json(
    { ok: false, motivo },
    { status: estado, headers: { "Cache-Control": "no-store" } },
  );
}
