/**
 * LOS AJUSTES SOBRE LA TASA DE LA API — puros, sin `server-only`, para poder
 * probarlos de verdad. El porqué completo vive en `tasa-automatica.ts`.
 *
 * ══ EL ORDEN ES % PRIMERO, FIJO DESPUÉS ══
 *
 * final = api × (1 + %) + fijo. Al revés, el porcentaje también multiplicaría
 * el monto fijo: con 925.25, +2 % y +$5, la diferencia son diez centavos por
 * dólar — multiplicados por el catálogo entero. La prueba fija el orden.
 */
export function aplicarAjustes(
  apiCentesimas: number,
  ajustePb: number,
  ajusteFijoCentesimas: number,
): number {
  const conPorcentaje = Math.round(
    (apiCentesimas * (10_000 + ajustePb)) / 10_000,
  );
  return conPorcentaje + ajusteFijoCentesimas;
}
