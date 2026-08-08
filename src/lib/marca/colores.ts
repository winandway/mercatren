/**
 * EL COLOR DEL BANNER DE CADA COMERCIO.
 *
 * Parte pura: no toca la base ni la sesión, y por eso se puede probar sola.
 *
 * ══ EL PROBLEMA ══
 *
 * Todas las tiendas tenían el mismo fondo azul. Con veinte comercios, el
 * listado entero se ve igual y ninguna ficha parece suya.
 *
 * ══ LA SOLUCIÓN, EN DOS CAPAS ══
 *
 * 1. **Nace con color, sin hacer nada.** Al comercio que nunca configura nada
 *    se le asigna uno a partir de SU PROPIO NOMBRE. Siempre el mismo: hoy y
 *    dentro de un año. Así veinte tiendas nuevas ya se ven distintas entre sí
 *    desde el primer día, sin pedirle nada a nadie.
 * 2. **Si quiere, lo cambia** desde su panel, eligiendo de esta lista.
 *
 * ══ POR QUÉ LA LISTA ES CERRADA Y TODOS SON OSCUROS ══
 *
 * No es capricho técnico. Todo el diseño de la ficha se sostiene sobre texto
 * BLANCO encima del banner: el nombre grande, la identificación fiscal, el
 * correo, la dirección. Si el fondo se aclara, ese texto desaparece.
 *
 * Con un selector libre de colores, tarde o temprano un comercio elige amarillo
 * o rosa claro porque es el color de su marca, su ficha queda con el nombre
 * invisible, y no va a saber por qué no le compran. Con una lista cerrada,
 * **cualquiera que elija se ve bien** — esa es la diferencia entre darle
 * libertad y darle una trampa.
 *
 * Los enlaces dentro del banner van en blanco subrayado, no en naranja: el
 * naranja se ve bien sobre el azul pero se ensucia sobre el vino y el tierra.
 */

export type ColorBanner = {
  /** Lo que se guarda en la base. No se renombra: rompería las tiendas. */
  id: string;
  /** El fondo. Todos oscuros, comprobados con texto blanco encima. */
  hex: string;
};

export const COLORES_BANNER: ColorBanner[] = [
  { id: "azul", hex: "#10263A" },
  { id: "grafito", hex: "#1C1C1E" },
  { id: "vino", hex: "#5B1F2E" },
  { id: "bosque", hex: "#12352A" },
  { id: "indigo", hex: "#241B4A" },
  { id: "petroleo", hex: "#0E3238" },
  { id: "tierra", hex: "#3A2318" },
  { id: "ciruela", hex: "#37173F" },
];

/** El de la marca. Es el que ve quien no tiene nombre todavía. */
export const COLOR_POR_DEFECTO = COLORES_BANNER[0]!;

/**
 * Un número estable a partir de un texto.
 *
 * Es el hash djb2, elegido porque cabe en cinco líneas y reparte bien nombres
 * cortos y parecidos — que es justo lo que hay aquí ("Ferretería Bley",
 * "Ferretería Mora"). No es criptografía y no tiene por qué serlo: lo único
 * que importa es que el MISMO nombre dé SIEMPRE el mismo número.
 *
 * `>>> 0` lo deja positivo: en JavaScript el desplazamiento devuelve enteros
 * con signo y sin eso saldrían índices negativos.
 */
function numeroDeTexto(texto: string): number {
  let n = 5381;
  for (let i = 0; i < texto.length; i++) {
    n = ((n << 5) + n + texto.charCodeAt(i)) >>> 0;
  }
  return n;
}

/**
 * El color que le toca a un comercio que nunca eligió.
 *
 * Sale del nombre, así que es estable: mientras no se cambie el nombre, la
 * tienda conserva su color. Si lo cambia, cambia el color — y está bien, es
 * una tienda distinta a ojos de quien la ve.
 */
export function colorDerivado(nombre: string): ColorBanner {
  const limpio = nombre.trim().toLowerCase();
  if (!limpio) return COLOR_POR_DEFECTO;
  return COLORES_BANNER[numeroDeTexto(limpio) % COLORES_BANNER.length]!;
}

/**
 * El color que de verdad se pinta.
 *
 * Lo que eligió el comercio manda. Si no eligió —o si eligió uno que ya no
 * existe en la lista— se cae al derivado de su nombre, nunca a un hueco.
 */
export function colorDeBanner(
  elegido: string | null | undefined,
  nombre: string,
): ColorBanner {
  if (elegido) {
    const encontrado = COLORES_BANNER.find((c) => c.id === elegido);
    if (encontrado) return encontrado;
  }
  return colorDerivado(nombre);
}
