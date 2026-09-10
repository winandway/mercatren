import Image from "next/image";

/**
 * ══ EL LOGO DE BESTWAY, EL ORIGINAL ══
 *
 * BESTWAY GROUP INTL. CORP. opera la bodega de Miami y le da a Mercatren
 * LLC el soporte para recibir en Estados Unidos. Su código va en el
 * casillero de cada cliente (prefijo `BW-`), así que su marca aparece
 * donde se explica de quién es la bodega.
 *
 * **Es su archivo, tal como ellos lo publican** (`public/logos/bestway/`,
 * ver el LEEME de esa carpeta). La primera versión de esta pantalla
 * llevaba un sello dibujado a mano que se le parecía, y Richard lo paró
 * con razón: el logo de otra empresa se usa como ella lo publica o no se
 * usa. Si un día hace falta otra variante, se le pide a Bestway.
 */
export function LogoBestway({
  clase,
  sobreOscuro = false,
}: {
  clase?: string;
  sobreOscuro?: boolean;
}) {
  return (
    <Image
      src={
        sobreOscuro
          ? "/logos/bestway/bestway-group-logo-blanco.svg"
          : "/logos/bestway/bestway-group-logo-azul.svg"
      }
      alt="Bestway Group Intl. Corp."
      width={260}
      height={63}
      className={clase}
      /* Un SVG que ya está en nuestro servidor: optimizarlo no aporta nada
         y Next avisa si se le pide. */
      unoptimized
    />
  );
}

/** Solo el átomo, para cuadrados: tarjetas, listas, avatares. */
export function SimboloBestway({ clase }: { clase?: string }) {
  return (
    <Image
      src="/logos/bestway/bestway-group-simbolo.png"
      alt="Bestway Group Intl. Corp."
      width={96}
      height={96}
      className={clase}
    />
  );
}
