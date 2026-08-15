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
 * **Y no se miente: el almacén está de verdad en Estados Unidos.** El dibujo
 * dice exactamente eso y nada más. No promete un tiempo por ciudad ni marca un
 * punto falso.
 *
 * ══ POR QUÉ ES UN DIBUJO NUESTRO Y NO UN MAPA DE VERDAD ══
 *
 * Incrustar Google Maps cobra por cada carga de página, mete un guion de un
 * tercero en una ficha de producto —que es donde más importa la velocidad— y
 * obligaría a tocar la política de cookies. Para decir «el almacén está aquí y
 * despachamos a todo el país», un contorno y unas flechas alcanzan.
 */

/** Dónde cae cada almacén dentro del contorno, en coordenadas del dibujo. */
const PUNTOS: Record<string, { x: number; y: number; nombre: string }> = {
  california: { x: 96, y: 176, nombre: "California" },
  texas: { x: 268, y: 262, nombre: "Texas" },
  illinois: { x: 350, y: 148, nombre: "Illinois" },
  florida: { x: 430, y: 272, nombre: "Florida" },
  "nueva-jersey": { x: 470, y: 130, nombre: "Nueva Jersey" },
};

export const ALMACEN_POR_DEFECTO = "california";

/** A dónde apuntan las flechas: el país entero, no una lista de ciudades. */
const DESTINOS = [
  { x: 150, y: 92 },
  { x: 300, y: 74 },
  { x: 452, y: 96 },
  { x: 138, y: 250 },
  { x: 360, y: 300 },
  { x: 492, y: 208 },
];

export function MapaAlmacen({
  almacen = ALMACEN_POR_DEFECTO,
  titulo,
  pie,
}: {
  almacen?: string;
  /** «Nuestro almacén en Estados Unidos», ya traducido. */
  titulo: string;
  /** «Despachamos a todo el país», ya traducido. */
  pie: string;
}) {
  const punto = PUNTOS[almacen] ?? PUNTOS[ALMACEN_POR_DEFECTO]!;

  return (
    <figure className="rounded-xl border border-borde bg-white p-4">
      <figcaption className="mb-2 text-sm font-semibold">{titulo}</figcaption>

      <svg
        viewBox="0 0 560 340"
        className="h-auto w-full"
        role="img"
        aria-label={`${titulo} · ${punto.nombre}. ${pie}`}
      >
        {/**
         * El contorno continental, muy simplificado. No es un mapa de
         * navegación: es una silueta reconocible. Alaska y Hawái no se dibujan
         * porque el envío estándar de nuestro proveedor no siempre llega allá,
         * y dibujarlas sería prometerlo sin haberlo comprobado.
         */}
        <path
          d="M46 118 L112 96 L188 82 L268 70 L352 68 L430 74 L486 88 L512 112
             L506 146 L488 170 L494 196 L470 222 L452 254 L430 286 L398 300
             L352 306 L300 300 L262 282 L226 268 L186 262 L146 258 L112 240
             L84 210 L62 178 L48 148 Z"
          className="fill-slate-100 stroke-slate-300"
          strokeWidth="2"
        />

        {DESTINOS.map((d, i) => (
          <g key={i}>
            <path
              d={`M${punto.x} ${punto.y} Q ${(punto.x + d.x) / 2} ${
                Math.min(punto.y, d.y) - 26
              } ${d.x} ${d.y}`}
              className="fill-none stroke-carga-500"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.55"
            />
            <circle cx={d.x} cy={d.y} r="4" className="fill-carga-500" />
          </g>
        ))}

        {/* El almacén, encima de las flechas para que no se lo coman. */}
        <circle cx={punto.x} cy={punto.y} r="15" className="fill-riel-900/15" />
        <circle cx={punto.x} cy={punto.y} r="8" className="fill-riel-900" />
        <text
          x={punto.x}
          y={punto.y + 30}
          textAnchor="middle"
          className="fill-tinta text-[15px] font-semibold"
        >
          {punto.nombre}
        </text>
      </svg>

      <p className="mt-1 text-xs text-tinta-suave">{pie}</p>
    </figure>
  );
}
