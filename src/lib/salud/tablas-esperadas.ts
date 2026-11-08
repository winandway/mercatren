/** Lo puro de la sonda de tablas (sin base), para probarlo aparte. */
/** Tablas que trajeron las migraciones 0051 a 0054. */
export const TABLAS_ESPERADAS = [
  "solicitudes_cierre", // 0051
  "planes_tienda", // 0052
  "promociones", // 0052
  "gasto_promociones", // 0052
  "clics_promocion", // 0052
  "desistimientos", // 0053
  "seguridad_producto", // 0054
] as const;

/** Lo que se esperaba y no está. Pura, para poder probarla. */
export function tablasQueFaltan(
  esperadas: readonly string[],
  presentes: readonly string[],
): string[] {
  const hay = new Set(presentes);
  return esperadas.filter((t) => !hay.has(t));
}
