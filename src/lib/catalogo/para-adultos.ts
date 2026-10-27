/**
 * ══ PRODUCTOS SEXUALES: FUERA DEL CATÁLOGO (27 oct 2026) ══
 *
 * La política de Google Play prohíbe que una app muestre ayudas sexuales
 * («content that depicts or are functionally sexual aids»), aunque sea una
 * tienda general. La app de Mercatren enseña el sitio entero, así que una
 * sola ficha de un juguete sexual basta para que rechacen o suspendan la app.
 * El 27 oct había uno publicado en el catálogo de EE. UU., traído de CJ.
 *
 * El reloj retira del catálogo lo que calce con esta lista (pasa a
 * `borrador`: no se borra nada y se puede volver a publicar a mano). Lo
 * nuevo que traiga la importación cae en la misma red en la siguiente
 * vuelta.
 *
 * ══ POR QUÉ LAS PALABRAS SON TAN PRECISAS ══
 *
 * «vibrator» sola trae sillas de masaje, plataformas vibratorias y teléfonos;
 * «adult» trae ropa de talla adulta. Se buscan frases que solo describen una
 * ayuda sexual. Ante la duda, una palabra NO entra: es preferible que se
 * escape una ficha a esconder sillas de oficina.
 *
 * Puro: decide con texto, sin base. El texto llega ya normalizado
 * (minúsculas, sin acentos), como el de `texto_de_busqueda`.
 */
export const FRASES_PARA_ADULTOS = [
  // inglés
  "sex toy",
  "sex toys",
  "dildo",
  "butt plug",
  "anal plug",
  "anal bead",
  "anal toy",
  "masturbator",
  "masturbation cup",
  "clitoral",
  "clit sucker",
  "clit licking",
  "g-spot",
  "g spot vibrator",
  "nipple clamp",
  "cock ring",
  "penis ring",
  "penis pump",
  "penis extender",
  "strap-on",
  "sex doll",
  "love doll",
  "bdsm",
  "bondage",
  "fetish",
  "erotic",
  "sex machine",
  "prostate massager",
  "adult toy",
  "adult toys",
  "sex furniture",
  // español
  "juguete sexual",
  "juguetes sexuales",
  "consolador",
  "succionador de clitoris",
  "masturbador",
  "tapon anal",
  "plug anal",
  "bolas anales",
  "anillo para el pene",
  "bomba para el pene",
  "muneca sexual",
  "fetiche",
  "erotico",
  "erotica",
] as const;

const PATRON = new RegExp(
  `(^|[^a-z0-9])(${FRASES_PARA_ADULTOS.map((f) =>
    f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  ).join("|")})($|[^a-z0-9])`,
);

/** Quita acentos y pasa a minúsculas, igual que `normalizarTexto`. */
function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** ¿Este producto es una ayuda sexual? Con frase completa, no con trozos. */
export function esProductoParaAdultos(
  texto: string | null | undefined,
): boolean {
  if (!texto) return false;
  return PATRON.test(normalizar(texto));
}
