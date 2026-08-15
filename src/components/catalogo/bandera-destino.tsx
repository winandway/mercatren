import { destinoDeLaTienda } from "@/lib/destino/reglas";

/**
 * LA BANDERITA QUE DICE DÓNDE SE ENTREGA ESTE PRODUCTO.
 *
 * ══ SOLO LA LLEVA ESTADOS UNIDOS, Y ES DELIBERADO ══
 *
 * Un sello en cada tarjeta convierte una portada en un mar de banderas y deja
 * de significar nada. Aquí la mayoría del catálogo se entrega en Venezuela: eso
 * es lo normal, y lo normal no se marca. Se marca **la excepción**, que es
 * justo lo que el ojo busca.
 *
 * El que no lleva bandera se entrega en Venezuela, y la propia tarjeta ya lo
 * dice debajo del precio con la ciudad donde se retira. La bandera no sustituye
 * ese texto: lo acompaña, para que se vea de un vistazo sin leer.
 *
 * ══ POR QUÉ NO ES UN EMOJI ══
 *
 * Porque el emoji de bandera **no se dibuja en Windows**: sale como dos letras
 * («US») en un recuadro, y quien mira el sitio desde una computadora de
 * escritorio —que es media clientela de Estados Unidos— vería un cuadro roto en
 * cada tarjeta del catálogo nuevo. Se dibuja a mano, y se ve igual en todos
 * lados.
 *
 * ══ Y POR QUÉ NO TOCA NADA DE GOOGLE ══
 *
 * Es una imagen al lado de la tarjeta, con su texto alternativo. **No entra en
 * el título del producto, ni en su descripción, ni en el archivo que se le
 * manda a Google.** Meter una bandera dentro del título sí sería un problema —
 * Merchant Center rechaza los títulos con adornos— y por eso no se hace.
 */

/** La bandera de Estados Unidos, simplificada al tamaño al que se ve. */
function BanderaUsa({ clase }: { clase?: string }) {
  return (
    <svg viewBox="0 0 19 13" className={clase} aria-hidden focusable="false">
      <rect width="19" height="13" fill="#fff" />
      <g fill="#B22234">
        <rect width="19" height="1.85" />
        <rect y="3.7" width="19" height="1.85" />
        <rect y="7.4" width="19" height="1.85" />
        <rect y="11.1" width="19" height="1.85" />
      </g>
      <rect width="8.5" height="7" fill="#3C3B6E" />
    </svg>
  );
}

/**
 * El sello de la esquina de la foto, en el listado.
 *
 * Devuelve `null` para todo lo que se entrega en Venezuela: ver arriba.
 */
export function BanderaDestino({
  paisOrigen,
  etiqueta,
}: {
  paisOrigen: string | null | undefined;
  /** «EE. UU.» ya traducido. Este componente no lee mensajes: vive dentro de
      la tarjeta, que se dibuja cientos de veces por pantalla. */
  etiqueta: string;
}) {
  if (destinoDeLaTienda(paisOrigen) !== "US") return null;

  return (
    /* ABAJO A LA IZQUIERDA, y no arriba como en el croquis: arriba a la
       izquierda vive el sello de descuento y arriba a la derecha el de
       «Nuevo». Un producto rebajado y de Estados Unidos habría quedado con
       dos sellos montados uno encima del otro. Aquí además queda pegada al
       precio, que es lo siguiente que se mira. */
    <span
      className="pointer-events-none absolute bottom-1.5 left-1.5 z-10 inline-flex items-center gap-1 rounded-full bg-white/95 py-0.5 pr-1.5 pl-1 shadow-sm ring-1 ring-black/5"
      title={etiqueta}
    >
      <BanderaUsa clase="h-2.5 w-3.5 rounded-[1px]" />
      <span className="text-[10px] leading-none font-semibold text-tinta">
        {etiqueta}
      </span>
    </span>
  );
}

/**
 * La misma bandera, en la cabecera de la ficha de la tienda.
 *
 * Ahí el nombre del país ya está escrito y en grande; la bandera es el ancla
 * visual que hace que el ojo lo enfoque sin leer.
 */
export function BanderaDeLaTienda({
  paisOrigen,
  className,
}: {
  paisOrigen: string | null | undefined;
  className?: string;
}) {
  if (destinoDeLaTienda(paisOrigen) !== "US") return null;
  return <BanderaUsa clase={className ?? "h-3 w-4 rounded-[1px]"} />;
}
