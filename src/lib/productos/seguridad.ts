/**
 * LOS DATOS DE SEGURIDAD DEL PRODUCTO PARA ESPAÑA (5 nov 2026).
 *
 * Reglamento (UE) 2023/988, art. 19: la oferta en línea dice quién fabrica el
 * producto (nombre, dirección postal y correo), la persona responsable en la
 * UE si el fabricante está fuera, y las advertencias de seguridad. Puro, para
 * probarlo sin base: lo usan la acción de guardar (web y app) y las pruebas.
 */

/** Las tiendas a las que se les piden (por el mercado donde venden). */
export const MERCADOS_CON_SEGURIDAD_UE = ["ES"] as const;

export function pideSeguridadUe(mercado: string | null | undefined): boolean {
  return (MERCADOS_CON_SEGURIDAD_UE as readonly string[]).includes(
    (mercado ?? "").trim().toUpperCase(),
  );
}

export type DatosSeguridad = {
  fabricanteNombre: string;
  fabricanteDireccion: string;
  fabricanteCorreo: string;
  responsableUe: string;
  advertenciasEs: string;
  advertenciasEn: string;
};

export const CAMPOS_SEGURIDAD = [
  "fabricanteNombre",
  "fabricanteDireccion",
  "fabricanteCorreo",
  "responsableUe",
  "advertenciasEs",
  "advertenciasEn",
] as const;

const TOPE = { corto: 200, largo: 2000 } as const;

/** Lee los campos del formulario (web o app), recortados y con tope. */
export function seguridadDelFormulario(
  f: Record<string, unknown>,
): DatosSeguridad {
  const texto = (k: string, tope: number) =>
    String(f[k] ?? "")
      .trim()
      .slice(0, tope);
  return {
    fabricanteNombre: texto("fabricanteNombre", TOPE.corto),
    fabricanteDireccion: texto("fabricanteDireccion", TOPE.corto),
    fabricanteCorreo: texto("fabricanteCorreo", TOPE.corto),
    responsableUe: texto("responsableUe", TOPE.largo),
    advertenciasEs: texto("advertenciasEs", TOPE.largo),
    advertenciasEn: texto("advertenciasEn", TOPE.largo),
  };
}

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Lo que falta para PUBLICAR en España, o null. Las advertencias y la persona
 * responsable en la UE dependen del producto y del fabricante: no se pueden
 * exigir siempre, pero sí quién fabrica y cómo se le escribe.
 */
export function faltaEnSeguridad(
  d: DatosSeguridad,
): "seguridadFabricante" | "seguridadDireccion" | "seguridadCorreo" | null {
  if (d.fabricanteNombre.length < 2) return "seguridadFabricante";
  if (d.fabricanteDireccion.length < 5) return "seguridadDireccion";
  if (!CORREO.test(d.fabricanteCorreo)) return "seguridadCorreo";
  return null;
}

/** ¿Escribió algo en la sección? (Para guardar un borrador sin publicar.) */
export function hayAlgoDeSeguridad(d: DatosSeguridad): boolean {
  return CAMPOS_SEGURIDAD.some((k) => d[k].length > 0);
}
