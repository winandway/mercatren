import { API_BASE } from "./api";
import { correoBienEscrito } from "./cuentas";
import type { Idioma } from "./dinero";
import type { ClaveDeTexto } from "./textos";

/**
 * «Mi tienda» en la app: la puerta privada del sitio (`/datos/app/mi/tienda`,
 * que usa la MISMA alta de la web) y las reglas del formulario. Puro: lo
 * prueba el sitio. Las reglas de aquí solo evitan mandar algo que de seguro
 * se rechaza; la palabra final la tiene el servidor.
 */
export type MiTienda = {
  slug: string;
  nombre: string;
  estado: string;
  mercado: string;
};

export type RespuestaMiTienda = {
  ok: true;
  tienda: MiTienda | null;
  documento: { nombre: string; ejemplo: string | null };
};

export type DatosTienda = {
  nombre: string;
  razonSocial: string;
  identificacionFiscal: string;
  correoContacto: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  paisOrigen: string;
  descripcionEs: string;
};

export function urlMiTienda(pais: string, idioma: Idioma): string {
  return `${API_BASE}/datos/app/mi/tienda?pais=${encodeURIComponent(pais)}&idioma=${idioma}`;
}

/** Lo primero que falta, en el orden del formulario. */
export function faltaEnTienda(
  d: DatosTienda,
  aceptaTerminos: boolean,
): ClaveDeTexto | null {
  if (d.nombre.trim().length < 2) return "faltaNombreTienda";
  if (d.razonSocial.trim().length < 2) return "faltaRazonSocial";
  if (!d.identificacionFiscal.trim()) return "faltaDocumento";
  if (!correoBienEscrito(d.correoContacto)) return "faltaCorreo";
  if (d.telefono.trim().length < 6) return "faltaTelefono";
  if (d.direccion.trim().length < 4) return "faltaDireccion";
  if (d.ciudad.trim().length < 2) return "faltaCiudad";
  if (!d.paisOrigen) return "faltaPaisOrigen";
  if (!aceptaTerminos) return "faltaTerminos";
  return null;
}

/** El cuerpo que espera el servidor. */
export function cuerpoDelAlta(d: DatosTienda, aceptaTerminos: boolean) {
  return {
    nombre: d.nombre.trim(),
    razonSocial: d.razonSocial.trim(),
    identificacionFiscal: d.identificacionFiscal.trim(),
    correoContacto: d.correoContacto.trim().toLowerCase(),
    telefono: d.telefono.trim(),
    direccion: d.direccion.trim(),
    ciudad: d.ciudad.trim(),
    paisOrigen: d.paisOrigen,
    descripcionEs: d.descripcionEs.trim() || undefined,
    aceptaTerminos,
  };
}
