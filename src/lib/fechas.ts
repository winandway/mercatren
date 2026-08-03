/**
 * Fechas y horas del panel.
 *
 * La operacion es de Estados Unidos y los comprobantes de Zelle vienen con la
 * hora del este, asi que todo se muestra en esa zona horaria. Si no se fijara,
 * cada persona veria una hora distinta segun donde este su computadora y los
 * cierres de venta no cuadrarian.
 */

export const ZONA = "America/New_York";

type Entrada = Date | number | string | null | undefined;

function aFecha(valor: Entrada): Date | null {
  if (valor === null || valor === undefined) return null;
  const f = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(f.getTime()) ? null : f;
}

function local(idioma: string) {
  return idioma === "en" ? "en-US" : "es-US";
}

/** Ej: 8 abr 2026 */
export function fechaCorta(valor: Entrada, idioma = "es") {
  const f = aFecha(valor);
  if (!f) return null;
  return new Intl.DateTimeFormat(local(idioma), {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: ZONA,
  }).format(f);
}

/** Ej: 8 abr 2026, 5:33 p.m. */
export function fechaHora(valor: Entrada, idioma = "es") {
  const f = aFecha(valor);
  if (!f) return null;
  return new Intl.DateTimeFormat(local(idioma), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: ZONA,
  }).format(f);
}

/** Ej: miércoles, 8 de abril de 2026 */
export function fechaLarga(valor: Entrada, idioma = "es") {
  const f = aFecha(valor);
  if (!f) return null;
  return new Intl.DateTimeFormat(local(idioma), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: ZONA,
  }).format(f);
}

/** Ej: 5:33 p.m. */
export function soloHora(valor: Entrada, idioma = "es") {
  const f = aFecha(valor);
  if (!f) return null;
  return new Intl.DateTimeFormat(local(idioma), {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZone: ZONA,
  }).format(f);
}

/**
 * Convierte la clave que arma SQLite en un titulo legible.
 *   "2026-07"    -> julio 2026
 *   "2026-07-15" -> 15 jul 2026
 *   "2026-S28"   -> Semana 28 de 2026
 */
export function titularPeriodo(clave: string, idioma = "es") {
  const semana = clave.match(/^(\d{4})-S(\d{1,2})$/);
  if (semana) {
    const [, anio, n] = semana;
    return idioma === "en"
      ? `Week ${Number(n)}, ${anio}`
      : `Semana ${Number(n)} de ${anio}`;
  }

  const dia = clave.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dia) {
    const [, a, m, d] = dia;
    return fechaCorta(new Date(Date.UTC(+a, +m - 1, +d, 12)), idioma) ?? clave;
  }

  const mes = clave.match(/^(\d{4})-(\d{2})$/);
  if (mes) {
    const [, a, m] = mes;
    const texto = new Intl.DateTimeFormat(local(idioma), {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(+a, +m - 1, 1, 12)));
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  return clave;
}
