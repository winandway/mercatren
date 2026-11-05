/** La marca de Mercatren: azul y naranja. El verde es para lo que salió bien. */
export const COLORES = {
  azul: "#10263A",
  naranja: "#FF6B1A",
  verde: "#15803D",
  rojo: "#B91C1C",
  gris: "#6B7280",
  grisClaro: "#E5E7EB",
  fondo: "#FFFFFF",
  texto: "#111827",
} as const;

/** La bandera de un país, de su código de dos letras. */
export function bandera(codigo: string): string {
  return codigo
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}
