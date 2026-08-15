import { Star } from "lucide-react";

import { estrellasLlenas } from "@/lib/valoraciones/reglas";

/**
 * LAS ESTRELLAS, DIBUJADAS.
 *
 * ══ UN PRODUCTO SIN OPINIONES NO ENSEÑA CERO ESTRELLAS ══
 *
 * Enseña **nada**. «0 de 5» se lee como un producto malísimo, cuando lo que
 * pasa es que todavía nadie opinó — y eso hundiría la venta de los 1.248
 * productos que acabamos de publicar.
 *
 * ══ LA MEDIA ESTRELLA SE DIBUJA DE VERDAD ══
 *
 * Un 4,3 se enseña con cuatro y media, no con cinco. Redondear hacia arriba
 * infla la nota, y eso es lo que la ley llama engañoso.
 */
export function Estrellas({
  promedio,
  cuantas,
  texto,
  compacto = false,
}: {
  promedio: number | null;
  cuantas: number;
  /** «12 opiniones», ya traducido y en plural correcto. */
  texto?: string;
  compacto?: boolean;
}) {
  if (promedio === null || cuantas === 0) return null;

  const llenas = estrellasLlenas(promedio);
  const tamano = compacto ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((n) => {
          const completa = llenas >= n;
          const media = !completa && llenas >= n - 0.5;
          return (
            <span key={n} className="relative">
              <Star className={`${tamano} text-slate-300`} />
              {completa || media ? (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: completa ? "100%" : "50%" }}
                >
                  <Star className={`${tamano} fill-carga-500 text-carga-500`} />
                </span>
              ) : null}
            </span>
          );
        })}
      </span>

      <span
        className={
          compacto ? "text-[11px] text-tinta-suave" : "text-sm text-tinta-suave"
        }
      >
        <span className="font-semibold text-tinta">{promedio.toFixed(1)}</span>
        {texto ? ` · ${texto}` : null}
      </span>
    </span>
  );
}
