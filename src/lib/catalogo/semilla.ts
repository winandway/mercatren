/**
 * La semilla que baraja la portada, una por visita.
 *
 * Vive aparte del componente a propósito. Dentro de un componente de servidor,
 * React marca el azar como impureza —y con razón: un componente que devuelve
 * algo distinto cada vez que se ejecuta rompe el renderizado. Aquí es
 * justamente lo que queremos, así que se pide una sola vez, arriba del todo, y
 * a partir de ahí el número es un dato más que se pasa hacia abajo.
 *
 * Se usa `crypto` y no `Math.random()` porque en el entorno del servidor es lo
 * que hay garantizado, y de paso reparte mejor.
 */
export function nuevaSemilla(): number {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  // Entre 1 y 99999: entra cómodo en el cálculo del orden y nunca es cero
  // (con semilla cero todas las filas empatarían y no se barajaría nada).
  return (bytes[0] % 99999) + 1;
}
