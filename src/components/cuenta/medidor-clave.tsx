"use client";

import { useTranslations } from "next-intl";

import { medirClave, type NivelClave } from "@/lib/validacion/fortaleza";
import { cn } from "@/lib/utils";

/**
 * LA BARRA QUE DICE QUÉ TAN FUERTE ES LA CONTRASEÑA.
 *
 * No es adorno. La persona que abre una cuenta aquí va a ver el dinero de su
 * comercio y los datos de quienes le pagaron, y casi nadie sabe qué hace fuerte
 * a una contraseña. Sin nada en pantalla, lo normal es poner la de siempre.
 *
 * Se mide con la misma función que usa el servidor
 * (`src/lib/validacion/fortaleza.ts`), así que lo que se ve aquí es exactamente
 * lo que se va a aplicar al guardar. Nunca puede decir «Muy fuerte» y que el
 * servidor la rechace.
 *
 * DOS DECISIONES DE TRATO:
 *
 * - **No aparece hasta que la persona escribe algo.** Una barra en rojo desde
 *   antes de empezar solo regaña.
 * - **Los colores nunca van solos.** Siempre hay texto al lado: quien no
 *   distingue el rojo del verde —uno de cada doce hombres— tiene que poder
 *   leerlo igual.
 */

/** Del más flojo al más fuerte. El fondo del segmento y el color del texto. */
const COLORES: Record<NivelClave, { barra: string; texto: string }> = {
  0: { barra: "bg-red-500", texto: "text-red-600" },
  1: { barra: "bg-red-500", texto: "text-red-600" },
  2: { barra: "bg-amber-500", texto: "text-amber-600" },
  3: { barra: "bg-lime-600", texto: "text-lime-700" },
  4: { barra: "bg-green-600", texto: "text-green-700" },
};

export function MedidorClave({
  clave,
  contexto = [],
}: {
  clave: string;
  /** Su correo y su nombre: una clave que los lleva dentro no se acepta. */
  contexto?: string[];
}) {
  const t = useTranslations("formularios.clave");

  /* Se mide en cada tecla, sin memoizar. Son cuatro comparaciones sobre una
     cadena de veinte caracteres: guardar el resultado costaría más de lo que
     ahorra, y obligaría a comparar el contexto por contenido (llega un array
     nuevo en cada render, así que por referencia nunca coincidiría). */
  const fortaleza = medirClave(clave, contexto);

  // Antes de escribir nada no se dice nada: una barra roja de entrada regaña.
  if (!clave) return null;

  const { nivel, consejos, aceptable } = fortaleza;
  const color = COLORES[nivel];

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-tinta-suave">{t("seguridad")}</span>
        <span className={cn("text-xs font-semibold", color.texto)}>
          {t(`nivel${nivel}`)}
        </span>
      </div>

      {/* Cuatro segmentos: se entiende de un vistazo cuánto falta para lo máximo. */}
      <div className="mt-1 flex gap-1" aria-hidden>
        {[1, 2, 3, 4].map((segmento) => (
          <div
            key={segmento}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              segmento <= nivel ? color.barra : "bg-slate-200",
            )}
          />
        ))}
      </div>

      {/**
       * Para quien navega con lector de pantalla. `polite` y no `assertive`:
       * que lo anuncie cuando termine de escribir, sin cortarle a cada tecla.
       */}
      <p
        aria-live="polite"
        className={cn(
          "mt-1.5 text-xs",
          aceptable ? "text-tinta-suave" : color.texto,
        )}
      >
        {consejos.map((consejo) => t(consejo)).join(" ")}
      </p>

      {/* El truco que de verdad ayuda, solo mientras la clave sea flojita. */}
      {nivel <= 2 ? (
        <p className="mt-1 text-xs text-tinta-suave">{t("consejoFrase")}</p>
      ) : null}
    </div>
  );
}
