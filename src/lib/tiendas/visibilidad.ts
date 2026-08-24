/**
 * QUIÉN PUEDE VER LA FICHA DE UNA TIENDA QUE TODAVÍA NO ES PÚBLICA.
 *
 * ══ EL FALLO QUE ESTO ARREGLA (14 ago 2026) ══
 *
 * Entonces una tienda nueva nacía en `pendiente` —la revisaba el equipo antes
 * de que saliera al público— y la ficha pública solo enseñaba las `activa`,
 * así que el comercio creaba su tienda, subía su logo y su portada, tocaba
 * «ver mi tienda»… y se encontraba un **404 de su propia tienda**.
 *
 * Desde el 15 ago 2026 las tiendas nacen ACTIVAS y ese caso ya no ocurre al
 * registrarse. Esto sigue haciendo falta para las que se suspenden y para las
 * que quedaron en borrador: el dueño tiene que poder ver la suya y entender
 * por qué no sale.
 *
 * Visto desde su silla, eso no se lee como «está en revisión»: se lee como que
 * el sitio perdió su trabajo. Y lo primero que uno piensa es que la culpa fue
 * de la foto que acaba de subir.
 *
 * ══ LA REGLA ══
 *
 * Una tienda que no está activa la ve **su dueño y el equipo**, y nadie más.
 * A un visitante le sigue dando 404 — que es lo correcto: enseñar tiendas sin
 * revisar al público es justo lo que la revisión viene a evitar, y un 404 no
 * confirma siquiera que ese nombre exista.
 *
 * ══ POR QUÉ ES UNA FUNCIÓN PURA Y NO UN `if` DENTRO DE LA PÁGINA ══
 *
 * Porque decide quién ve qué. Escrita suelta dentro del componente, el día que
 * alguien agregue un estado nuevo —`suspendida`, por ejemplo— nadie se acuerda
 * de venir aquí. Con esto, sus pruebas se ponen rojas.
 */

/** Quién está mirando la ficha. */
export type Mirador =
  | { tipo: "visitante" }
  | { tipo: "equipo" }
  | { tipo: "comercio"; tiendaId: string };

/** Los estados en los que la tienda ya es pública para cualquiera. */
export const ESTADOS_PUBLICOS = ["activa"];

export function esPublica(estado: string | null | undefined): boolean {
  return ESTADOS_PUBLICOS.includes(estado ?? "");
}

/**
 * ¿Se le deja ver esta ficha?
 *
 * `tiendaId` es el de la tienda que se está mirando; se compara con el de quien
 * mira para que un comercio no pueda espiar la tienda sin publicar de otro
 * escribiendo su dirección.
 */
export function puedeVerLaFicha(
  estado: string | null | undefined,
  quienMira: Mirador,
  tiendaId: string,
): boolean {
  if (esPublica(estado)) return true;
  if (quienMira.tipo === "equipo") return true;
  if (quienMira.tipo === "comercio") return quienMira.tiendaId === tiendaId;
  return false;
}

/**
 * Qué se le dice a quien SÍ puede verla pero todavía no es pública.
 *
 * Devuelve la clave del aviso, no la frase: el sitio es bilingüe y la frase la
 * pone la pantalla. `null` cuando no hay nada que avisar.
 */
export function avisoDeFichaNoPublica(
  estado: string | null | undefined,
): "borrador" | "pendiente" | "suspendida" | null {
  if (esPublica(estado)) return null;
  if (estado === "borrador") return "borrador";
  if (estado === "pendiente") return "pendiente";
  /* Cualquier otro estado que no sea público se trata como suspendida: es el
     aviso más prudente. Inventar uno nuevo en silencio sería peor. */
  return "suspendida";
}

/**
 * ¿Los buscadores pueden indexar esta ficha?
 *
 * Nunca una que no sea pública, aunque su dueño la esté mirando. Si Google la
 * guarda mientras está sin publicar, después queda en sus resultados una
 * tienda que a lo mejor se suspendió por algo.
 */
export function seIndexa(estado: string | null | undefined): boolean {
  return esPublica(estado);
}
