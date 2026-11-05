import { API_BASE } from "./api";
import type { Idioma } from "./dinero";

/**
 * «MIS VENTAS» Y EDITAR UN PRODUCTO DESDE LA APP: direcciones, tipos y reglas
 * puras (las prueba el sitio en `tests/unit/app-movil-ventas.test.ts`). Lo de
 * verdad lo hacen las acciones de la web por `/datos/app/mi/…`.
 */
const q = (pais: string, idioma: Idioma) =>
  `pais=${encodeURIComponent(pais)}&idioma=${idioma}`;

export function urlMisVentas(pais: string, idioma: Idioma): string {
  return `${API_BASE}/datos/app/mi/ventas?${q(pais, idioma)}`;
}

export function urlVenta(numero: string, pais: string, idioma: Idioma): string {
  return `${API_BASE}/datos/app/mi/ventas/${encodeURIComponent(numero)}?${q(pais, idioma)}`;
}

export function urlMiProducto(
  id: string,
  pais: string,
  idioma: Idioma,
): string {
  return `${API_BASE}/datos/app/mi/productos/${encodeURIComponent(id)}?${q(pais, idioma)}`;
}

export function urlFotoDeMiProducto(
  id: string,
  foto: string,
  pais: string,
  idioma: Idioma,
): string {
  return `${API_BASE}/datos/app/mi/productos/${encodeURIComponent(id)}/fotos/${encodeURIComponent(foto)}?${q(pais, idioma)}`;
}

export type Venta = {
  numero: string;
  estado: string;
  creadoEn: number;
  cliente: string;
  monto: { centavos: number; moneda: string };
  articulos: number;
};

export type DetalleDeVenta = Venta & {
  renglones: { titulo: string; cantidad: number; subtotalCentavos: number }[];
  entrega: {
    /** La dirección ya en líneas, hecha por el servidor (la misma del panel). */
    lineas: string[];
    telefono: string | null;
    notas: string | null;
  };
  puedeEnviar: boolean;
  puedeEntregar: boolean;
};

export type ProductoParaEditar = {
  id: string;
  slug: string;
  tituloEs: string;
  tituloEn: string;
  descripcionEs: string;
  descripcionEn: string;
  precio: string;
  existencias: string;
  moneda: string;
  estado: string;
  fotos: { id: string; url: string | null }[];
  /** España: si la tienda pide los datos del fabricante, y lo guardado. */
  pideSeguridad?: boolean;
  seguridad?: { [k: string]: string | null } | null;
};

/** ¿Lo que se ve en el formulario es lo mismo que está guardado? */
export function igualQueLoGuardado<T extends Record<string, string>>(
  actual: T,
  guardado: T | null,
): boolean {
  if (!guardado) return true;
  return Object.keys(guardado).every(
    (k) => (actual[k] ?? "").trim() === (guardado[k] ?? "").trim(),
  );
}
