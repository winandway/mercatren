import { BadgeCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { PreguntaVisible } from "@/lib/preguntas/reglas";

/**
 * Las preguntas y respuestas de la ficha de producto.
 *
 * ══ POR QUÉ ESTO VENDE ══
 *
 * Quien duda no escribe: se va. «¿Sirve para 220?», «¿cuántos metros trae?»,
 * «¿es de cobre puro?» son las preguntas que matan la venta en silencio, y la
 * descripción de dos líneas del catálogo importado no las responde.
 *
 * ══ Y POR QUÉ ADEMÁS AYUDA A QUE NOS ENCUENTREN ══
 *
 * Search Console reporta 28 páginas «rastreada: actualmente sin indexar» —
 * Google entrando a una ficha flaca y decidiendo que no vale la pena. Esto le
 * da sustancia, **y en las palabras que la gente escribe de verdad al buscar**,
 * que casi nunca son las del título del producto.
 *
 * ══ SE ABRE Y SE CIERRA SIN UNA LÍNEA DE JAVASCRIPT ══
 *
 * Es un `<details>` del navegador, igual que «Más de este comercio» en la ficha
 * de la tienda. Tres motivos: funciona con el lector de pantalla, **Google lee
 * el contenido aunque esté cerrado**, y no cuesta ni un kilobyte de guión — que
 * en la conexión de Venezuela importa.
 *
 * La primera va abierta: si todas están cerradas, media pantalla se ve como una
 * lista de títulos y nadie toca ninguna.
 */
export async function PreguntasProducto({
  preguntas,
}: {
  preguntas: PreguntaVisible[];
}) {
  // Sin preguntas no se dibuja el bloque: un titular sobre una lista vacía
  // dice «aquí falta algo», y es peor que no estar.
  if (preguntas.length === 0) return null;

  const t = await getTranslations("catalogo.producto.preguntas");

  return (
    <section className="mt-10 max-w-3xl">
      <h2 className="text-lg font-bold">{t("titulo")}</h2>
      <p className="mt-1 text-sm text-tinta-suave">{t("bajada")}</p>

      <div className="mt-4 divide-y divide-borde rounded-xl border border-borde bg-white">
        {preguntas.map((p, i) => (
          <details key={p.id} open={i === 0} className="group px-4 py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold">
              {p.pregunta}
              {/* El signo cambia solo al abrir, sin JavaScript. */}
              <span
                aria-hidden
                className="shrink-0 text-lg leading-none text-tinta-suave transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>

            <div className="mt-2 text-sm whitespace-pre-line text-tinta-suave">
              {p.respuesta}
            </div>

            {p.delComercio && (
              /* Quién responde importa: no es lo mismo el vendedor que otro
                 comprador, y el comprador tiene derecho a saber cuál lee. */
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-tinta-suave">
                <BadgeCheck
                  className="h-3.5 w-3.5 text-precio-600"
                  aria-hidden
                />
                {t("respondeElComercio")}
              </p>
            )}
          </details>
        ))}
      </div>
    </section>
  );
}
