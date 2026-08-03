import { cn } from "@/lib/utils";

/**
 * La bandera de Estados Unidos, redonda.
 *
 * Se usa cada vez que se nombra a Estados Unidos: el cobro, la entrega del
 * dinero y toda la operacion ocurren alli, y conviene que se vea de un golpe
 * sin tener que leerlo.
 *
 * Va dibujada a mano en vez de con un emoji porque el emoji de bandera no se
 * ve igual en Windows (sale "US" en letras) y aqui tiene que verse siempre.
 */
export function BanderaEEUU({
  className,
  titulo,
}: {
  className?: string;
  /** Si se pasa, la bandera se anuncia; si no, es decoracion. */
  titulo?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block shrink-0 overflow-hidden rounded-full ring-1 ring-black/10",
        className ?? "h-4 w-4",
      )}
      role={titulo ? "img" : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      <svg viewBox="0 0 24 24" className="h-full w-full">
        {/* Las trece franjas */}
        <rect width="24" height="24" fill="#fff" />
        {[0, 2, 4, 6, 8, 10, 12].map((y) => (
          <rect
            key={y}
            y={y * (24 / 13)}
            width="24"
            height={24 / 13}
            fill="#B22234"
          />
        ))}
        {/* El canton azul */}
        <rect width="11" height={(24 / 13) * 7} fill="#3C3B6E" />
        {/* Las estrellas, sugeridas: a este tamano no se distinguen puntas */}
        {[1.4, 4.2, 7, 9.8].map((y) =>
          [1.4, 3.7, 6, 8.3].map((x) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="0.62" fill="#fff" />
          )),
        )}
      </svg>
    </span>
  );
}
