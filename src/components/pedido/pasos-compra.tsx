import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PASOS } from "@/lib/pedidos/pasos";
import { cn } from "@/lib/utils";

/**
 * LOS PASOS DE LA COMPRA, ARRIBA DEL TODO.
 *
 * ══ POR QUÉ (18 ago 2026) ══
 *
 * El dueño pagó y se quedó sin saber si había terminado: la pantalla no le
 * decía en qué punto estaba ni cuánto faltaba. Sus palabras: «yo quedo en el
 * aire, ya pago hecho y todo».
 *
 * Ahora se ve de un golpe: **Paso 2 de 3**, y al llegar al final se ve que se
 * acabó. Es lo mismo que hace cualquier tienda grande, y por la misma razón:
 * quien no sabe cuánto le falta, abandona.
 *
 * ══ EN EL CELULAR TAMBIÉN ══
 *
 * Las bolitas y la línea aguantan cualquier ancho. Debajo va **«Paso 2 de 3»**
 * escrito con letras, que es lo que de verdad se lee en una pantalla chica —
 * en un teléfono, tres bolitas sin texto no dicen en cuál estás.
 */
export async function PasosCompra({
  actual,
  terminado,
}: {
  actual: number;
  /**
   * Cuando el pedido ya está pagado, el ÚLTIMO paso se marca como cumplido,
   * no como «estás aquí».
   *
   * Es la diferencia entre «ya terminaste» y «te falta esto». El dueño pagó y
   * la barra le seguía enseñando el último paso a medias: sus palabras, «yo
   * quedo en el aire, ya pago hecho y todo».
   */
  terminado: boolean;
}) {
  const t = await getTranslations("pedido.pasos");

  return (
    <nav
      aria-label={t("titulo")}
      className="rounded-xl border border-borde bg-white p-4"
    >
      <ol className="flex items-center gap-1">
        {PASOS.map((paso, i) => {
          const hecho =
            paso.numero < actual || (terminado && paso.numero === actual);
          const aqui = !hecho && paso.numero === actual;

          return (
            <li
              key={paso.numero}
              className={cn("flex items-center", i > 0 && "flex-1")}
            >
              {/* La línea que une, ANTES de la bolita. Se pinta llena hasta
                  donde llegó: es lo que hace que se lea como un avance y no
                  como tres círculos sueltos. */}
              {i > 0 ? (
                <span
                  aria-hidden
                  className={cn(
                    "mx-1.5 h-0.5 flex-1 rounded-full",
                    hecho || aqui ? "bg-carga-500" : "bg-borde",
                  )}
                />
              ) : null}

              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    hecho && "bg-carga-500 text-white",
                    aqui && "bg-riel-900 text-white",
                    !hecho && !aqui && "bg-slate-100 text-tinta-suave",
                  )}
                >
                  {hecho ? (
                    <Check className="h-4 w-4" aria-hidden />
                  ) : (
                    paso.numero
                  )}
                </span>
                {/* El nombre del paso solo cabe en pantalla ancha. En el
                    celular manda la línea de abajo, que dice lo mismo con
                    palabras. */}
                <span
                  className={cn(
                    "hidden text-sm sm:inline",
                    aqui ? "font-semibold" : "text-tinta-suave",
                  )}
                >
                  {t(paso.clave)}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      <p className="mt-3 text-sm font-medium sm:hidden">
        {t("deTantos", { actual, total: PASOS.length })} ·{" "}
        <span className="text-tinta-suave">
          {t(PASOS[actual - 1]?.clave ?? "listo")}
        </span>
      </p>
    </nav>
  );
}
