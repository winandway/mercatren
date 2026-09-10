/**
 * El sello de BESTWAY GROUP INTL. CORP., la empresa que opera la bodega de
 * Miami y le da a Mercatren LLC el soporte físico para recibir allá.
 *
 * Dibujado en SVG y no como imagen: se ve nítido en cualquier pantalla,
 * pesa unos pocos kilobytes y hereda el color del texto, así que funciona
 * sobre el azul de la marca y sobre blanco sin dos archivos distintos.
 */
export function LogoBestway({ clase }: { clase?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={clase}
      role="img"
      aria-label="Bestway Group Intl. Corp."
      fill="none"
      stroke="currentColor"
    >
      <defs>
        <path
          id="bw-arriba"
          d="M 100,100 m -78,0 a 78,78 0 1,1 156,0"
          transform="rotate(-90 100 100)"
        />
        <path id="bw-abajo" d="M 100,100 m -76,0 a 76,76 0 1,0 152,0" />
      </defs>
      <circle cx="100" cy="100" r="94" strokeWidth="3" />
      <circle cx="100" cy="100" r="86" strokeWidth="2" />
      <text
        fontSize="17"
        fontWeight="700"
        letterSpacing="1.5"
        fill="currentColor"
        stroke="none"
      >
        <textPath href="#bw-arriba" startOffset="50%" textAnchor="middle">
          BESTWAY GROUP INTL. CORP.
        </textPath>
      </text>
      <text fontSize="12" letterSpacing="0.8" fill="currentColor" stroke="none">
        <textPath href="#bw-abajo" startOffset="50%" textAnchor="middle">
          www.bestwaygroupusa.com
        </textPath>
      </text>
      <circle cx="14" cy="100" r="4.5" fill="currentColor" stroke="none" />
      <circle cx="186" cy="100" r="4.5" fill="currentColor" stroke="none" />
      {/* Las órbitas del átomo, que es lo que se ve en el centro del sello. */}
      <ellipse cx="100" cy="100" rx="30" ry="58" strokeWidth="2.5" />
      <ellipse
        cx="100"
        cy="100"
        rx="30"
        ry="58"
        strokeWidth="2.5"
        transform="rotate(60 100 100)"
      />
      <ellipse
        cx="100"
        cy="100"
        rx="30"
        ry="58"
        strokeWidth="2.5"
        transform="rotate(-60 100 100)"
      />
      <text
        x="100"
        y="118"
        fontSize="48"
        fontWeight="600"
        textAnchor="middle"
        letterSpacing="1"
        fill="currentColor"
        stroke="none"
      >
        BW
      </text>
    </svg>
  );
}
