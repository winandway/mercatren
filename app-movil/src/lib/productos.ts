import { API_BASE } from "./api";
import { divisorDe, type Idioma } from "./dinero";
import type { ClaveDeTexto } from "./textos";

/**
 * Subir un producto desde la app: reglas puras (las prueba el sitio en
 * `tests/unit/app-movil-productos.test.ts`). El guardado de verdad es el de la
 * web (`guardarProducto`, por `/datos/app/mi/productos`).
 */
export const FOTOS_POR_PRODUCTO = 8;
/** Lado mayor de la foto que se sube: nítida en la ficha y liviana. */
export const LADO_DE_LA_FOTO = 1600;

/**
 * EL PRECIO QUE VE EL COMPRADOR, el mismo cálculo del sitio
 * (`precioConAjusteCentavos` en `src/lib/dinero.ts`): lo que escribe el
 * comercio es SU precio y el publicado lleva sumado el costo del procesador
 * de tarjetas y el margen. Se enseña mientras escribe para que no lo suba él
 * a mano (si lo sube, el comprador lo pagaría dos veces). La prueba compara
 * este número con el del sitio.
 */
const PROCESADOR_FIJO_CENTAVOS = 30;
const PROCESADOR_PORCENTAJE_PB = 290;
const COMISION_TARJETA_PB = 300;

export function precioPublicadoCentavos(baseCentavos: number): number {
  if (baseCentavos <= 0) return 0;
  return Math.ceil(
    ((baseCentavos + PROCESADOR_FIJO_CENTAVOS) * 10_000) /
      (10_000 - PROCESADOR_PORCENTAJE_PB - COMISION_TARJETA_PB),
  );
}

/** De lo que escribe la persona («12.50», «12,50») a la unidad menor. */
export function aCentavos(texto: string, moneda: string): number | null {
  const limpio = texto.trim().replace(",", ".");
  if (!limpio || !/^\d+(\.\d{0,2})?$/.test(limpio)) return null;
  const numero = Number(limpio);
  if (!Number.isFinite(numero) || numero <= 0) return null;
  return Math.round(numero * divisorDe(moneda));
}

export type DatosProducto = {
  tituloEs: string;
  tituloEn: string;
  descripcionEs: string;
  descripcionEn: string;
  precio: string;
  existencias: string;
};

/**
 * Lo primero que falta. Los dos idiomas son obligatorios en el título (regla
 * de la casa: todo lo que ve el público, en español e inglés).
 */
export function faltaEnProducto(
  d: DatosProducto,
  fotos: number,
  moneda: string,
): ClaveDeTexto | null {
  if (fotos < 1) return "faltaFoto";
  if (d.tituloEs.trim().length < 2) return "faltaTituloEs";
  if (d.tituloEn.trim().length < 2) return "faltaTituloEn";
  if (aCentavos(d.precio, moneda) === null) return "faltaPrecio";
  if (d.existencias.trim() && !/^\d+$/.test(d.existencias.trim()))
    return "faltaExistencias";
  return null;
}

/** Los campos de texto que se mandan (las fotos van aparte). */
export function camposDelProducto(d: DatosProducto): Record<string, string> {
  return {
    tituloEs: d.tituloEs.trim(),
    tituloEn: d.tituloEn.trim(),
    descripcionEs: d.descripcionEs.trim(),
    descripcionEn: d.descripcionEn.trim(),
    precio: d.precio.trim().replace(",", "."),
    existencias: d.existencias.trim(),
  };
}

export function urlMisProductos(pais: string, idioma: Idioma): string {
  return `${API_BASE}/datos/app/mi/productos?pais=${encodeURIComponent(pais)}&idioma=${idioma}`;
}

export function urlBorrarCuenta(idioma: Idioma): string {
  return `${API_BASE}/datos/app/mi/borrar-cuenta?idioma=${idioma}`;
}

export type MiProducto = {
  id: string;
  slug: string;
  titulo: string;
  precio: { centavos: number; moneda: string };
  estado: string;
  foto: string | null;
};

/**
 * LA PALABRA PARA BORRAR LA CUENTA: la misma de la web
 * (`src/lib/cuenta/borrar-puro.ts`), en cualquiera de los dos idiomas y sin
 * importar mayúsculas. La prueba compara las dos.
 */
const PALABRA_DE_CONFIRMACION = { es: "BORRAR", en: "DELETE" } as const;

export function palabraDeConfirmacion(idioma: Idioma): string {
  return PALABRA_DE_CONFIRMACION[idioma];
}

export function confirmoElBorrado(escrito: string): boolean {
  const limpio = escrito.trim().toUpperCase();
  return Object.values(PALABRA_DE_CONFIRMACION).some((p) => p === limpio);
}
