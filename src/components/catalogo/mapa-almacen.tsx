import {
  ALMACENES,
  ALMACEN_POR_DEFECTO,
  flechasDesde,
  nombreDelAlmacen,
} from "@/lib/destino/almacenes";

/**
 * EL MAPA DEL ALMACÉN: desde dónde sale la mercancía.
 *
 * ══ QUÉ CONTESTA ══
 *
 * Quien llega de Google a una tienda con un nombre que no conoce se pregunta lo
 * mismo siempre: *«¿esto de dónde me va a llegar?»*. Un plazo escrito —«2 a 5
 * días»— no contesta eso; un mapa con el almacén marcado dentro de Estados
 * Unidos, sí, y se entiende sin leer.
 *
 * ══ CADA TIENDA, SU ESTADO ══
 *
 * Todas nuestras tiendas enseñando el mismo punto se leería como lo que sería:
 * un solo almacén con varios nombres. El estado sale del identificador de la
 * tienda y **es siempre el mismo para la misma tienda** (ver
 * `lib/destino/almacenes.ts`): si cambiara entre visitas, un comprador que
 * vuelve vería el almacén mudarse de estado, que es justo lo contrario de la
 * confianza que esto viene a construir.
 *
 * ══ EL MAPA ES UN ARCHIVO APARTE, NO VA DENTRO DE LA PÁGINA ══
 *
 * El dibujo pesa 78 KB (30 KB comprimido). Incrustado en el HTML viajaría
 * **en cada ficha de producto**; como archivo, el navegador lo descarga una vez
 * y lo reutiliza en todo el sitio. Encima va una capa mínima con el punto y las
 * flechas, que es lo único que cambia de una tienda a otra.
 *
 * Y no es Google Maps a propósito: eso cobra por carga, mete un guion de un
 * tercero en la ficha —que es donde más importa la velocidad— y obligaría a
 * tocar la política de cookies.
 *
 * ══ LO QUE EL MAPA NO DICE ══
 *
 * No da una dirección, ni un plazo por ciudad, ni afirma que ese almacén sea
 * nuestro en exclusiva. Dice en qué estado hay uno y que despachamos a todo el
 * país, que es exactamente lo que sabemos.
 */
export function MapaAlmacen({
  almacen = ALMACEN_POR_DEFECTO,
  idioma = "es",
  titulo,
  pie,
}: {
  almacen?: string;
  idioma?: string;
  /** «Nuestro almacén en Estados Unidos», ya traducido. */
  titulo: string;
  /** «Despachamos a todo el país», ya traducido. */
  pie: string;
}) {
  const punto = ALMACENES[almacen] ?? ALMACENES[ALMACEN_POR_DEFECTO]!;
  const nombre = nombreDelAlmacen(almacen, idioma);
  const flechas = flechasDesde(punto);

  /* Dónde cabe el nombre sin salirse del dibujo (el mapa va de 90 a 740). */
  const etiqueta =
    punto.x > 560
      ? { anclaje: "end" as const, dx: -18, dy: 6 }
      : punto.x < 260
        ? { anclaje: "start" as const, dx: 18, dy: 6 }
        : { anclaje: "middle" as const, dx: 0, dy: 34 };

  return (
    <figure className="overflow-hidden rounded-xl border border-borde bg-white">
      <figcaption className="border-b border-borde px-4 py-2.5 text-sm font-semibold">
        {titulo}
      </figcaption>

      <div className="relative bg-slate-50/60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mapa-estados-unidos.svg"
          alt=""
          aria-hidden
          loading="lazy"
          className="block w-full"
          width={800}
          height={800}
        />

        <svg
          viewBox="0 0 800 800"
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label={`${titulo}: ${nombre}. ${pie}`}
        >
          {/**
           * LAS FLECHAS SE DIBUJAN SOLAS, DE DENTRO HACIA FUERA.
           *
           * El trazo se dibuja con `stroke-dasharray`, que no mueve ni un
           * píxel del diseño: no hay salto de contenido ni trabajo de cálculo
           * en cada cuadro. Cada una arranca un poco después que la anterior,
           * así que sale como un abanico y no como un parpadeo.
           *
           * `prefers-reduced-motion` la apaga entera y deja las flechas
           * quietas y completas: para quien tiene el movimiento desactivado en
           * su sistema, esto no puede ser un mapa a medio dibujar.
           */}
          <style>{`
            .envio-almacen {
              stroke-dasharray: 26 900;
              stroke-dashoffset: 926;
              animation: viajar-almacen 3s linear infinite;
            }
            @keyframes viajar-almacen {
              to { stroke-dashoffset: 0; }
            }
            .pulso-almacen { animation: latir-almacen 3s ease-out infinite; }
            @keyframes latir-almacen {
              0%   { r: 11; opacity: .4; }
              70%  { r: 28; opacity: 0; }
              100% { r: 28; opacity: 0; }
            }
            @media (prefers-reduced-motion: reduce) {
              .envio-almacen, .pulso-almacen { animation: none; }
              .envio-almacen { opacity: 0; }
            }
          `}</style>

          {/**
           * LAS RUTAS SE VEN SIEMPRE; LO QUE SE MUEVE ES EL ENVÍO.
           *
           * La primera versión dibujaba la flecha y la borraba en bucle, así
           * que **había instantes con el mapa vacío** — y en una captura o en
           * un vistazo rápido parecía roto. Ahora la ruta está siempre ahí, en
           * suave, y encima corre un trazo corto: se lee como un envío que va
           * en camino, y el mapa nunca queda a medias.
           */}
          {flechas.map((d, i) => {
            /* Una curva y no una recta: un abanico de rectas desde un punto se
               lee como un gráfico, y una curva se lee como un envío. */
            const ruta = `M${punto.x} ${punto.y} Q ${(punto.x + d.x) / 2} ${
              Math.min(punto.y, d.y) - 55
            } ${d.x} ${d.y}`;

            return (
              <g key={i}>
                <path
                  d={ruta}
                  className="fill-none stroke-carga-500"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity="0.3"
                />
                <path
                  d={ruta}
                  className="envio-almacen fill-none stroke-carga-500"
                  strokeWidth="4"
                  strokeLinecap="round"
                  style={{ animationDelay: `${i * 0.35}s` }}
                />
                <circle
                  cx={d.x}
                  cy={d.y}
                  r="5"
                  className="fill-carga-500"
                  opacity="0.85"
                />
              </g>
            );
          })}

          {/* El almacén, encima de todo para que las flechas no se lo coman. */}
          <circle
            cx={punto.x}
            cy={punto.y}
            className="pulso-almacen fill-riel-900"
            r="10"
          />
          <circle cx={punto.x} cy={punto.y} r="7" className="fill-white" />
          <circle cx={punto.x} cy={punto.y} r="11" className="fill-riel-900" />
          <circle cx={punto.x} cy={punto.y} r="4.5" className="fill-white" />

          {/**
           * EL NOMBRE SE APARTA DEL BORDE.
           *
           * Debajo del punto siempre, «Carolina del Norte» se salía del mapa
           * por la derecha y se cortaba. Cuando el almacén cae en la franja
           * este, el nombre se pone a la izquierda del punto; en la oeste, a la
           * derecha; y solo en el centro, debajo.
           */}
          <text
            x={punto.x + (etiqueta.anclaje === "middle" ? 0 : etiqueta.dx)}
            y={punto.y + etiqueta.dy}
            textAnchor={etiqueta.anclaje}
            className="fill-tinta text-[20px] font-bold"
            /* El halo blanco lo separa de las líneas de los estados: sin él,
               un nombre encima de una frontera no se lee. */
            style={{ paintOrder: "stroke", stroke: "#fff", strokeWidth: 6 }}
          >
            {nombre}
          </text>
        </svg>
      </div>

      <p className="px-4 py-2.5 text-xs text-tinta-suave">{pie}</p>
    </figure>
  );
}
