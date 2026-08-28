import { esMercadoPrincipal, type Mercado } from "@/lib/mercado/mercados";

/**
 * LA BANDERITA DEL PAÍS EN EL ENCABEZADO (28 ago 2026).
 *
 * Lo pidió el dueño mirando mercatren.cl: «en algún lado hay que poner una
 * banderita así chiquitita de Chile… al lado de Mercatren podría ser. Igual
 * cuando entre a Colombia». Quien entra a mercatren.cl tiene que ver de un
 * vistazo que está en la plaza de SU país — antes de leer una palabra.
 *
 * ══ SOLO EN LOS DOMINIOS DE PAÍS, Y ES DELIBERADO ══
 *
 * mercatren.com (el principal) va SIN bandera: es lo normal de la casa, y lo
 * normal no se marca — la misma regla de la banderita de las tarjetas del
 * catálogo. Se marca la excepción: el dominio de un país concreto.
 *
 * ══ POR QUÉ NO ES UN EMOJI ══
 *
 * La misma razón de `bandera-destino.tsx`: el emoji de bandera **no se dibuja
 * en Windows** — sale como dos letras en un recuadro. Se dibuja a mano en SVG
 * y se ve igual en todos lados.
 *
 * Al abrir un país nuevo, su bandera se agrega AQUÍ (y su casilla está en
 * ABRIR-UN-PAIS.md). Un país declarado sin bandera dibujada cae en `null` y
 * el encabezado sale limpio — nunca un recuadro roto.
 */

/** Chile: franja blanca y roja, cantón azul con la estrella. */
function BanderaChile({ clase }: { clase?: string }) {
  return (
    <svg viewBox="0 0 19 13" className={clase} aria-hidden focusable="false">
      <rect width="19" height="6.5" fill="#fff" />
      <rect y="6.5" width="19" height="6.5" fill="#D52B1E" />
      <rect width="6.5" height="6.5" fill="#0039A6" />
      <path
        d="M3.25 1.4 3.79 3.05 5.53 3.05 4.12 4.07 4.66 5.72 3.25 4.7 1.84 5.72 2.38 4.07 0.97 3.05 2.71 3.05Z"
        fill="#fff"
      />
    </svg>
  );
}

/** Colombia: amarillo la mitad, azul y rojo el resto. */
function BanderaColombia({ clase }: { clase?: string }) {
  return (
    <svg viewBox="0 0 19 13" className={clase} aria-hidden focusable="false">
      <rect width="19" height="6.5" fill="#FCD116" />
      <rect y="6.5" width="19" height="3.25" fill="#003893" />
      <rect y="9.75" width="19" height="3.25" fill="#CE1126" />
    </svg>
  );
}

const BANDERAS: Record<
  string,
  (props: { clase?: string }) => React.JSX.Element
> = {
  CL: BanderaChile,
  CO: BanderaColombia,
};

/**
 * La bandera del mercado, junto al logo. En el principal no dibuja nada.
 *
 * Lleva el nombre del país al lado — una bandera de 20 px sola se pasa de
 * largo; con la palabra «Chile» ya no hay duda. En celular el nombre se
 * esconde y queda la bandera, que es lo que cabe.
 */
export function BanderaDelMercado({ mercado }: { mercado: Mercado }) {
  if (esMercadoPrincipal(mercado)) return null;
  const Bandera = BANDERAS[mercado.codigo];
  if (!Bandera) return null;
  return (
    <span
      className="flex items-center gap-1.5"
      title={mercado.nombre}
      aria-label={mercado.nombre}
    >
      <Bandera clase="h-3.5 w-auto rounded-[2px] ring-1 ring-white/25" />
      <span className="hidden text-xs font-semibold text-white/85 sm:inline">
        {mercado.nombre}
      </span>
    </span>
  );
}
