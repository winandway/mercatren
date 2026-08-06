/**
 * CÓMO SE ESCRIBE UN PUNTO DE RETIRO, sin tocar la base.
 *
 * Va aparte de la consulta a propósito: esto es texto que le llega a una
 * persona a su correo y tiene que poder probarse solo, sin levantar una base
 * de datos. La consulta vive en `retiro.ts`, que sí es del servidor.
 */
export type PuntoDeRetiro = {
  /** El comercio al que se le compró. */
  comercio: string;
  /** Cómo llama el comercio a ese depósito ("DEPÓSITO CENTRO"). */
  deposito: string | null;
  /** La ciudad, ya con su nombre bonito ("El Vigía", no "el-vigia"). */
  ciudad: string | null;
  direccion: string | null;
  comoLlegar: string | null;
  /** Qué se retira ahí, con su cantidad. */
  articulos: string[];
};

/**
 * Los puntos en una línea cada uno, listos para meter en un correo.
 *
 * Se arma aquí y no en la plantilla porque el mismo texto sirve para el correo
 * de la compra y para el de "ya está listo", y duplicarlo garantiza que un día
 * digan cosas distintas.
 *
 * LO QUE FALTA NO DEJA HUECOS. Un comercio que no cargó la dirección de su
 * depósito produce una línea más corta, no una línea con guiones ni con
 * "null": el correo tiene que verse escrito por una persona.
 */
export function lineasDeRetiro(puntos: PuntoDeRetiro[]): string[] {
  return puntos.map((p) => {
    const lugar = [p.deposito, p.ciudad].filter(Boolean).join(" · ");
    const cabeza = lugar ? `${p.comercio} — ${lugar}` : p.comercio;
    const donde = [p.direccion, p.comoLlegar].filter(Boolean).join(". ");
    return [cabeza, donde, p.articulos.join(", ")].filter(Boolean).join("\n");
  });
}
